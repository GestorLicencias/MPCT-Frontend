"use client";

import { useAuth } from "@/context/AuthContext";
import { Users, FileText, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const { user } = useAuth();

  const stats = [
    { title: "Trámites Totales", value: "156", icon: FileText, color: "from-blue-500 to-indigo-500" },
    { title: "Inspecciones Pendientes", value: "24", icon: Clock, color: "from-amber-500 to-orange-500" },
    { title: "Aprobados", value: "89", icon: CheckCircle, color: "from-emerald-500 to-teal-500" },
    { title: "Usuarios Activos", value: "45", icon: Users, color: "from-purple-500 to-pink-500" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">Panel de Administrador</h1>
        <p className="text-slate-400 mt-2">Visión general del sistema de trámites y licencias.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-[#0a0f1c] border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 font-medium text-sm">{stat.title}</p>
                <h3 className="text-3xl font-black text-white mt-2">{stat.value}</h3>
              </div>
              <div className={`p-3 rounded-2xl bg-gradient-to-br ${stat.color} bg-opacity-10 shadow-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#0a0f1c] border border-white/5 rounded-3xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Actividad Reciente</h2>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-[#020617] border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                    <FileText className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Trámite #00{i}-2026</p>
                    <p className="text-xs text-slate-400">Hace {i * 2} horas</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Completado
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#0a0f1c] border border-white/5 rounded-3xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Accesos Directos</h2>
          <div className="space-y-3">
            <Link href="/dashboard/admin/precios" className="block w-full text-left px-5 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg shadow-blue-500/20">
              Gestionar Precios de Trámites
            </Link>
            <Link href="/dashboard/admin/usuarios" className="block w-full text-left px-5 py-4 rounded-2xl bg-[#020617] border border-white/5 text-slate-300 font-medium hover:bg-white/5 transition-all">
              Crear Usuarios Especiales
            </Link>
            <button className="w-full text-left px-5 py-4 rounded-2xl bg-[#020617] border border-white/5 text-slate-300 font-medium hover:bg-white/5 transition-all">
              Configurar Accesos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
