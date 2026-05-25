"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Loader2, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/login", { email, password });
      const { token, email: userEmail, role } = response.data;
      
      // Construir el objeto user esperado por el AuthContext
      const user = { email: userEmail, role };
      login(token, user);
      
      if (role === "ADMIN") {
        router.push("/dashboard/admin");
      } else if (role === "INSPECTOR") {
        router.push("/dashboard/inspector");
      } else {
        router.push("/dashboard/solicitante");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Credenciales inválidas. Por favor, intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] relative overflow-hidden text-slate-50">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="absolute top-6 left-6 z-20">
        <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-medium">
          <ArrowLeft className="h-4 w-4" /> Volver
        </Link>
      </div>

      <div className="w-full max-w-md relative z-10 px-6">
        <div className="flex justify-center mb-8">
          <div className="p-3 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-2xl shadow-xl shadow-blue-500/20">
            <ShieldCheck className="h-8 w-8 text-white" />
          </div>
        </div>

        <div className="bg-[#0a0f1c]/80 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-white tracking-tight">Bienvenido de vuelta</h1>
            <p className="text-slate-400 mt-2 text-sm">Ingresa al portal de trámites municipales</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="p-4 text-sm font-medium text-red-400 bg-red-950/50 border border-red-900/50 rounded-xl">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300 font-semibold ml-1">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="ejemplo@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 rounded-xl border-slate-800 bg-[#020617] focus:bg-[#0f172a] focus:border-blue-500/50 text-white placeholder:text-slate-600 transition-all"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <Label htmlFor="password" className="text-slate-300 font-semibold">Contraseña</Label>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 rounded-xl border-slate-800 bg-[#020617] focus:bg-[#0f172a] focus:border-blue-500/50 text-white placeholder:text-slate-600 transition-all"
              />
            </div>

            <Button type="submit" className="w-full h-12 mt-4 rounded-xl bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20 text-md font-bold text-white transition-all hover:-translate-y-0.5" disabled={loading}>
              {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
              {loading ? "Iniciando..." : "Ingresar"}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-400">
            ¿No tienes una cuenta?{" "}
            <Link href="/auth/register" className="text-blue-400 font-bold hover:underline hover:text-blue-300">
              Regístrate aquí
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
