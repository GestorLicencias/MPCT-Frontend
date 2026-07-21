"use client";

import { useState, useEffect, Suspense } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSearchParams, useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import Link from "next/link";

const API_URL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'}/auth`;

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const token = searchParams.get("token");
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [invalidToken, setInvalidToken] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) {
      toast.error("Token de recuperación no válido o faltante.");
    }
  }, [token]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error("Token de recuperación no válido.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/reset-password`, { token, newPassword });
      toast.success(res.data.message || "Contraseña actualizada exitosamente.");
      setSuccess(true);
      setTimeout(() => {
        router.push("/auth/login");
      }, 3000);
    } catch (error: any) {
      const msg = error.response?.data?.error || "Error al restablecer la contraseña.";
      if (msg.toLowerCase().includes("token") || msg.toLowerCase().includes("expirado") || msg.toLowerCase().includes("inválido")) {
        setInvalidToken(true);
        setErrorMessage(msg);
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!token || invalidToken) {
    return (
      <div className="text-center space-y-4 py-8">
        <div className="mx-auto w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <Lock className="w-6 h-6 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-white">Enlace no válido</h2>
        <p className="text-white/50 text-sm">{errorMessage || "El enlace de recuperación es inválido, ya fue usado o ha expirado."}</p>
        <div className="pt-4">
          <Link href="/auth/forgot-password" className="inline-block bg-white text-black font-semibold px-6 py-3 rounded-xl hover:bg-white/90 transition-colors text-sm">
            Solicitar un nuevo enlace
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center space-y-4 py-8">
        <Lock className="w-12 h-12 text-emerald-500 mx-auto opacity-80 mb-4" />
        <h2 className="text-xl font-bold text-white">¡Contraseña Actualizada!</h2>
        <p className="text-white/50 text-sm">Serás redirigido al inicio de sesión en breve...</p>
        <Link href="/auth/login" className="block mt-4 text-cyan-500 hover:text-cyan-400 text-sm">
          Ir al inicio de sesión ahora
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleReset} className="space-y-6">
      <div>
        <label className="block text-xs font-mono uppercase tracking-wider mb-2 text-white/50">Nueva Contraseña</label>
        <Input 
          type="password" 
          required 
          value={newPassword} 
          onChange={(e) => setNewPassword(e.target.value)}
          className="h-14 bg-white/5 border-white/10 text-white focus-visible:ring-1 focus-visible:ring-cyan-500/50 rounded-xl px-4 text-base"
        />
      </div>
      <div>
        <label className="block text-xs font-mono uppercase tracking-wider mb-2 text-white/50">Confirmar Contraseña</label>
        <Input 
          type="password" 
          required 
          value={confirmPassword} 
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="h-14 bg-white/5 border-white/10 text-white focus-visible:ring-1 focus-visible:ring-cyan-500/50 rounded-xl px-4 text-base"
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full h-14 bg-white hover:bg-white/90 text-black font-semibold text-lg rounded-xl transition-all mt-6">
        {loading ? "Guardando..." : "Restablecer Contraseña"}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center relative z-10 pt-20">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 blur-[120px] rounded-full"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] opacity-20"></div>
      </div>
      
      <div className="w-full max-w-md relative z-10 px-6">
        <div className="mb-10 text-center">
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4 tracking-tight">Nueva Contraseña</h1>
          <p className="text-white/40 text-sm font-mono uppercase tracking-widest">Portal MPCT</p>
        </div>
        
        <div className="bg-[#030303] border border-white/10 p-8 sm:p-10 rounded-3xl shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
          <Suspense fallback={<div className="text-center text-white/50">Cargando...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
