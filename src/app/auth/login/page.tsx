"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const API_URL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'}/auth`;

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
    <div className="min-h-[70vh] flex items-center justify-center relative z-10">
      <div className="absolute w-96 h-96 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none -z-10"></div>
      <Card className="w-full max-w-md bg-slate-900/40 backdrop-blur-xl border-t-4 border-t-cyan-500 border-slate-800 shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl text-white">Acceso Interno</CardTitle>
          <CardDescription className="text-slate-400">Portal para Inspectores y Administradores</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-300">Correo Electrónico</label>
              <Input 
                type="email" 
                required 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 bg-slate-950/50 border-slate-700 text-white focus-visible:ring-cyan-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-300">Contraseña</label>
              <Input 
                type="password" 
                required 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 bg-slate-950/50 border-slate-700 text-white focus-visible:ring-cyan-500"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-12 bg-cyan-600 hover:bg-cyan-500 text-white text-lg mt-4 shadow-[0_0_15px_rgba(8,145,178,0.3)] transition-all">
              {loading ? "Verificando..." : "Ingresar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
