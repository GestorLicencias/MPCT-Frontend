"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, XCircle, FileSignature, AlertCircle, Loader2 } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/api";

interface Inspeccion {
  id: string;
  numeroInspeccion: number;
  estado: string;
  tramite: {
    id: string;
    tipo: string;
    solicitante: {
      email: string;
      profile: {
        razonSocial: string;
        domicilioFiscal: string;
      };
    };
  };
}

export default function EvaluarInspeccionPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");

  const [inspeccion, setInspeccion] = useState<Inspeccion | null>(null);
  const [loading, setLoading] = useState(true);
  const [comentarios, setComentarios] = useState("");
  const [estado, setEstado] = useState<"APROBADO" | "RECHAZADO" | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchInspeccion();
    } else {
      setLoading(false);
    }
  }, [id]);

  const fetchInspeccion = async () => {
    try {
      const res = await api.get(`/inspecciones/${id}`);
      setInspeccion(res.data);
    } catch (error) {
      console.error("Error obteniendo inspección", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!estado) return alert("Debe seleccionar un estado (Aprobar o Rechazar)");
    if (!id) return;
    
    setSubmitting(true);
    try {
      await api.post(`/inspecciones/${id}/evaluar`, null, {
        params: {
          conforme: estado === "APROBADO",
          observaciones: comentarios
        }
      });
      alert("Evaluación registrada con éxito.");
      router.push("/dashboard/inspector");
    } catch (error: any) {
      console.error("Error evaluando inspección", error);
      alert(error.response?.data?.message || "Hubo un error al registrar la evaluación.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-white"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  if (!inspeccion) {
    return (
      <div className="flex flex-col justify-center items-center h-64 text-white gap-4">
        <p>Inspección no encontrada o no proporcionada.</p>
        <Link href="/dashboard/inspector" className="text-blue-400 hover:text-blue-300">Volver</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-2">
        <Link href="/dashboard/inspector" className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Evaluar Inspección</h1>
          <p className="text-slate-400 text-sm">Registra los resultados de la visita al local.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Detalles del Trámite */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#0a0f1c] border border-white/5 rounded-3xl p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <FileSignature className="w-5 h-5 text-blue-400" /> Datos del Local
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Trámite</p>
                <p className="text-white font-medium mt-1">#{inspeccion.tramite.id.substring(0, 8)} ({inspeccion.tramite.tipo})</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Razón Social</p>
                <p className="text-white font-medium mt-1">{inspeccion.tramite.solicitante.profile?.razonSocial || "No especificada"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Dirección</p>
                <p className="text-white font-medium mt-1 text-sm">{inspeccion.tramite.solicitante.profile?.domicilioFiscal || "No especificada"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Visita N°</p>
                <span className="inline-block mt-1 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold rounded-full">
                  VISITA {inspeccion.numeroInspeccion}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-blue-900/10 border border-blue-500/20 rounded-3xl p-6">
            <div className="flex gap-3 text-blue-400">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">Recuerda verificar las salidas de emergencia y extintores según la normativa de Defensa Civil.</p>
            </div>
          </div>
        </div>

        {/* Formulario de Evaluación */}
        <div className="lg:col-span-2 bg-[#0a0f1c] border border-white/5 rounded-3xl p-6 lg:p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white">Dictamen Final</h2>
              <div className="grid grid-cols-2 gap-4">
                <label className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                  estado === "APROBADO" 
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-lg shadow-emerald-500/20" 
                  : "border-white/5 bg-[#020617] text-slate-400 hover:border-white/20"
                }`}>
                  <input 
                    type="radio" 
                    name="estado" 
                    value="APROBADO" 
                    className="hidden"
                    onChange={() => setEstado("APROBADO")}
                  />
                  <CheckCircle className="w-10 h-10 mb-3" />
                  <span className="font-black text-lg">APROBAR</span>
                  <span className="text-xs opacity-70 mt-1 text-center">Cumple con los requisitos</span>
                </label>

                <label className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                  estado === "RECHAZADO" 
                  ? "border-red-500 bg-red-500/10 text-red-400 shadow-lg shadow-red-500/20" 
                  : "border-white/5 bg-[#020617] text-slate-400 hover:border-white/20"
                }`}>
                  <input 
                    type="radio" 
                    name="estado" 
                    value="RECHAZADO" 
                    className="hidden"
                    onChange={() => setEstado("RECHAZADO")}
                  />
                  <XCircle className="w-10 h-10 mb-3" />
                  <span className="font-black text-lg">RECHAZAR</span>
                  <span className="text-xs opacity-70 mt-1 text-center">Presenta observaciones</span>
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-slate-300 font-semibold ml-1">
                Observaciones y Comentarios {estado === "RECHAZADO" && <span className="text-red-400">*</span>}
              </label>
              <textarea
                value={comentarios}
                onChange={(e) => setComentarios(e.target.value)}
                placeholder="Detalla aquí los resultados de la inspección..."
                required={estado === "RECHAZADO"}
                className="w-full h-32 rounded-xl border border-slate-800 bg-[#020617] p-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:bg-[#0f172a] transition-all resize-none"
              />
            </div>

            <div className="pt-4 border-t border-white/5 flex justify-end">
              <button 
                type="submit"
                disabled={submitting}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? "Registrando..." : "Registrar Evaluación"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
