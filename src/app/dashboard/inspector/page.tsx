"use client";

import { useAuth } from "@/context/AuthContext";
import { CheckSquare, Clock, MapPin, AlertTriangle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import api from "@/lib/api";

interface Inspeccion {
  id: string;
  numeroInspeccion: number;
  estado: string;
  fechaProgramada: string;
  tramite: {
    id: string;
    tipo: string;
    solicitante: {
      email: string;
    };
  };
}

export default function InspectorDashboardPage() {
  const { user } = useAuth();
  const [inspecciones, setInspecciones] = useState<Inspeccion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInspecciones = async () => {
      try {
        const res = await api.get("/inspecciones/pendientes");
        setInspecciones(res.data);
      } catch (error) {
        console.error("Error obteniendo inspecciones", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInspecciones();
  }, []);

  const stats = [
    { title: "Inspecciones Pendientes", value: inspecciones.length.toString(), icon: Clock, color: "from-amber-500 to-orange-500" },
    { title: "Aprobadas Hoy", value: "0", icon: CheckSquare, color: "from-emerald-500 to-teal-500" },
    { title: "Zonas Asignadas", value: "Todo Chimbote", icon: MapPin, color: "from-blue-500 to-indigo-500" },
    { title: "Rechazadas", value: "0", icon: AlertTriangle, color: "from-red-500 to-rose-500" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">Panel del Inspector</h1>
        <p className="text-slate-400 mt-2">Bandeja de entrada de inspecciones asignadas.</p>
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

      <div className="bg-[#0a0f1c] border border-white/5 rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#050a15]">
          <h2 className="text-xl font-bold text-white">Inspecciones Programadas para Hoy</h2>
        </div>
        
        <div className="divide-y divide-white/5">
          {loading ? (
             <div className="p-8 text-center text-slate-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
          ) : inspecciones.length === 0 ? (
             <div className="p-8 text-center text-slate-400">No hay inspecciones pendientes por el momento.</div>
          ) : (
            inspecciones.map((insp) => (
              <div key={insp.id} className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shrink-0">
                    <Clock className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Expediente #{insp.tramite.id.substring(0, 8)}</h3>
                    <p className="text-sm text-slate-400 mt-1">Trámite: {insp.tramite.tipo} - Usuario: {insp.tramite.solicitante.email}</p>
                    <p className="text-xs font-medium text-blue-400 mt-2">Visita #{insp.numeroInspeccion} • Programado: {new Date(insp.fechaProgramada).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <Link 
                  href={`/dashboard/inspector/evaluar?id=${insp.id}`}
                  className="w-full md:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-center shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5"
                >
                  Ir a Evaluar
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
