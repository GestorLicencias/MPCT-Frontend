"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, UserPlus, Shield, UserCheck } from "lucide-react";

export default function CrearUsuariosPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("INSPECTOR");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí irá la lógica de creación de usuario
    console.log({ email, password, role });
    alert("Usuario especial creado con éxito (Mock)");
    setEmail("");
    setPassword("");
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-2">
        <Link href="/dashboard/admin" className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Crear Usuario Especial</h1>
          <p className="text-slate-400 text-sm">Añade nuevos Inspectores o Administradores al sistema.</p>
        </div>
      </div>

      <div className="bg-[#0a0f1c] border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] pointer-events-none"></div>

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div className="space-y-2">
            <label className="text-slate-300 font-semibold ml-1">Correo Electrónico Institucional</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@mpct.gob.pe"
              required
              className="w-full h-12 rounded-xl border border-slate-800 bg-[#020617] px-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:bg-[#0f172a] transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-slate-300 font-semibold ml-1">Contraseña de Acceso</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 caracteres"
              required
              className="w-full h-12 rounded-xl border border-slate-800 bg-[#020617] px-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:bg-[#0f172a] transition-all"
            />
          </div>

          <div className="space-y-3">
            <label className="text-slate-300 font-semibold ml-1">Rol en el Sistema</label>
            <div className="grid grid-cols-2 gap-4">
              <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                role === "INSPECTOR" 
                ? "bg-blue-600/10 border-blue-500 text-blue-400 shadow-lg shadow-blue-500/10" 
                : "bg-[#020617] border-white/5 text-slate-400 hover:border-white/20"
              }`}>
                <input 
                  type="radio" 
                  name="role" 
                  value="INSPECTOR" 
                  checked={role === "INSPECTOR"}
                  onChange={() => setRole("INSPECTOR")}
                  className="hidden" 
                />
                <UserCheck className="w-5 h-5" />
                <span className="font-bold">Inspector</span>
              </label>

              <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                role === "ADMIN" 
                ? "bg-purple-600/10 border-purple-500 text-purple-400 shadow-lg shadow-purple-500/10" 
                : "bg-[#020617] border-white/5 text-slate-400 hover:border-white/20"
              }`}>
                <input 
                  type="radio" 
                  name="role" 
                  value="ADMIN" 
                  checked={role === "ADMIN"}
                  onChange={() => setRole("ADMIN")}
                  className="hidden" 
                />
                <Shield className="w-5 h-5" />
                <span className="font-bold">Administrador</span>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5">
            <button 
              type="submit" 
              className="w-full flex justify-center items-center gap-2 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5"
            >
              <UserPlus className="w-5 h-5" />
              Crear Usuario
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
