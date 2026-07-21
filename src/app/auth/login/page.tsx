"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const API_URL = `${process.env.NEXT_PUBLIC_API_URL || 'https://mpct-backend-343008001984.us-central1.run.app/api/v1'}/auth`;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/login`, { email, password });
      const { token } = res.data;
      
      // En un MVP guardamos en localStorage
      localStorage.setItem("token", token);
      
      // Redireccionar basado en el rol devuelto por la API
      const role = res.data.role;
      if (role === "ADMIN") {
        router.push("/admin");
      } else if (role === "CAJERO") {
        router.push("/caja");
      } else {
        router.push("/inspector");
      }

      toast.success("Bienvenido al sistema.");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Credenciales incorrectas.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center relative z-10 pt-20">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 blur-[120px] rounded-full"></div>
        {/* Subtle grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] opacity-20"></div>
      </div>
      
      <div className="w-full max-w-md relative z-10 px-6">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-white/50 hover:text-white transition-colors mb-8 group">
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Volver al inicio
        </Link>
        <div className="mb-10 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">Acceso Interno</h1>
          <p className="text-white/40 text-sm font-mono uppercase tracking-widest">Portal MPCT</p>
        </div>
        
        <div className="bg-[#030303] border border-white/10 p-8 sm:p-10 rounded-3xl shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider mb-2 text-white/50">Correo Electrónico</label>
              <Input 
                type="email" 
                required 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 bg-white/5 border-white/10 text-white focus-visible:ring-1 focus-visible:ring-cyan-500/50 rounded-xl px-4 text-base"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider mb-2 text-white/50">Contraseña</label>
              <Input 
                type="password" 
                required 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                className="h-14 bg-white/5 border-white/10 text-white focus-visible:ring-1 focus-visible:ring-cyan-500/50 rounded-xl px-4 text-base"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-14 bg-white hover:bg-white/90 text-black font-semibold text-lg rounded-xl transition-all mt-6">
              {loading ? "Verificando..." : "Ingresar al Sistema"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
