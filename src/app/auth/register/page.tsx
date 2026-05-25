"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Loader2, Building2, ArrowLeft } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ruc, setRuc] = useState("");
  const [representanteLegal, setRepresentanteLegal] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (ruc.length !== 11) {
      setError("El RUC debe tener exactamente 11 dígitos");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.post("/auth/register", { email, password, ruc, representanteLegal });
      setSuccess(true);
      setTimeout(() => {
        router.push("/auth/login");
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al registrar. Verifica tu RUC e intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617] p-4 relative overflow-hidden text-slate-50">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-600/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="bg-[#0a0f1c]/80 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl p-10 text-center max-w-sm w-full z-10">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">¡Validación Exitosa!</h1>
          <p className="text-slate-400 mt-4 text-sm leading-relaxed">
            Hemos cruzado tu RUC con SUNAT y extraído la razón social.
          </p>
          <div className="mt-8 flex justify-center">
            <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
          </div>
          <p className="mt-2 text-xs text-slate-500 font-medium">Llevándote al acceso seguro...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] relative overflow-hidden py-12 text-slate-50">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>

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
            <h1 className="text-2xl font-black text-white tracking-tight">Crea tu Perfil Legal</h1>
            <p className="text-slate-400 mt-2 text-sm">Empieza tu trámite con RUC activo</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            {error && (
              <div className="p-4 text-sm font-medium text-red-400 bg-red-950/50 border border-red-900/50 rounded-xl">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="ruc" className="text-slate-300 font-semibold ml-1">RUC (11 dígitos)</Label>
              <div className="relative">
                <Input
                  id="ruc"
                  type="text"
                  maxLength={11}
                  placeholder="20123456789"
                  value={ruc}
                  onChange={(e) => setRuc(e.target.value.replace(/\D/g, ''))}
                  required
                  className="h-12 rounded-xl border-slate-800 bg-[#020617] focus:bg-[#0f172a] focus:border-blue-500/50 text-white placeholder:text-slate-600 font-mono text-lg tracking-wider transition-all"
                />
              </div>
              <p className="text-[11px] text-slate-500 ml-1 font-medium">Tus datos fiscales serán validados automáticamente.</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300 font-semibold ml-1">Correo de Contacto</Label>
              <Input
                id="email"
                type="email"
                placeholder="contacto@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 rounded-xl border-slate-800 bg-[#020617] focus:bg-[#0f172a] focus:border-blue-500/50 text-white placeholder:text-slate-600 transition-all"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="representante" className="text-slate-300 font-semibold ml-1">Representante Legal</Label>
              <Input
                id="representante"
                type="text"
                placeholder="Nombre Completo"
                value={representanteLegal}
                onChange={(e) => setRepresentanteLegal(e.target.value)}
                required
                className="h-12 rounded-xl border-slate-800 bg-[#020617] focus:bg-[#0f172a] focus:border-blue-500/50 text-white placeholder:text-slate-600 transition-all"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300 font-semibold ml-1">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-12 rounded-xl border-slate-800 bg-[#020617] focus:bg-[#0f172a] focus:border-blue-500/50 text-white placeholder:text-slate-600 transition-all"
              />
            </div>

            <Button type="submit" className="w-full h-12 mt-6 rounded-xl bg-white text-slate-900 hover:bg-slate-200 shadow-xl shadow-white/10 text-md font-bold transition-all hover:-translate-y-0.5" disabled={loading || ruc.length !== 11}>
              {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
              {loading ? "Consultando SUNAT..." : "Validar y Registrar"}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-400">
            ¿Ya tienes una cuenta?{" "}
            <Link href="/auth/login" className="text-blue-400 font-bold hover:underline hover:text-blue-300">
              Inicia sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
