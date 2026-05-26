"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import axios from "axios";
import { ArrowLeft, Upload, Building, ShieldAlert, CheckCircle2, Loader2, FileIcon } from "lucide-react";

export default function NuevoTramitePage() {
  const router = useRouter();
  const [tipo, setTipo] = useState("");
  const [area, setArea] = useState("");
  const [riesgo, setRiesgo] = useState("");
  const [declaracionSinCambios, setDeclaracionSinCambios] = useState(false);
  
  const [plano, setPlano] = useState<File | null>(null);
  const [foto, setFoto] = useState<File | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const planoInputRef = useRef<HTMLInputElement>(null);
  const fotoInputRef = useRef<HTMLInputElement>(null);

  // Auto-calcular riesgo basado en el área
  useEffect(() => {
    if (!area) {
      setRiesgo("");
      return;
    }
    const areaNum = parseFloat(area);
    if (areaNum < 50) setRiesgo("BAJO");
    else if (areaNum <= 100) setRiesgo("MEDIO");
    else setRiesgo("ALTO");
  }, [area]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tipo) return setError("Seleccione un tipo de trámite");
    if (!plano || !foto) return setError("Debe subir el plano de ubicación y una foto del local");
    
    setError("");
    setLoading(true);
    
    try {
      const formData = new FormData();
      // El backend espera 'NUEVO' o 'RENOVACION'
      formData.append("tipo", tipo === "licencia_renovacion" ? "RENOVACION" : "NUEVO");
      if (tipo === "licencia_renovacion") {
        formData.append("declaracionSinCambios", String(declaracionSinCambios));
      }
      formData.append("area", area);
      formData.append("plano", plano);
      formData.append("foto", foto);
      
      const token = localStorage.getItem("token");
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://mpct-api-264213836001.us-east1.run.app/api/v1";
      await axios.post(`${baseUrl}/tramites`, formData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      router.push("/dashboard/solicitante");
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al crear el trámite. Intente nuevamente.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-2">
        <Link href="/dashboard/solicitante" className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Nuevo Trámite</h1>
          <p className="text-slate-400 text-sm">Registra una nueva solicitud de licencia o certificado.</p>
        </div>
      </div>

      <div className="bg-[#0a0f1c] border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-[80px] pointer-events-none"></div>

        <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
          
          {error && (
            <div className="p-4 text-sm font-medium text-red-400 bg-red-950/50 border border-red-900/50 rounded-xl">
              {error}
            </div>
          )}

          {/* Sección 1: Datos de la Solicitud */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Building className="w-5 h-5 text-emerald-400" /> 1. Datos de la Solicitud
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-slate-300 font-semibold ml-1">Tipo de Trámite</label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  required
                  className="w-full h-12 rounded-xl border border-slate-800 bg-[#020617] px-4 text-white focus:outline-none focus:border-blue-500/50 focus:bg-[#0f172a] transition-all appearance-none"
                >
                  <option value="" disabled>Seleccione un trámite...</option>
                  <option value="licencia_nueva">Licencia de Funcionamiento (Nueva)</option>
                  <option value="licencia_renovacion">Renovación de Licencia</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-slate-300 font-semibold ml-1">Área del Local (m²)</label>
                <input
                  type="number"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="Ej. 120"
                  required
                  min="1"
                  className="w-full h-12 rounded-xl border border-slate-800 bg-[#020617] px-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:bg-[#0f172a] transition-all"
                />
              </div>
            </div>
          </div>

          {/* Sección 2: Riesgo (Automático) */}
          <div className="space-y-4 pt-6 border-t border-white/5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" /> 2. Nivel de Riesgo (Cálculo Automático)
            </h2>
            <p className="text-sm text-slate-400 mb-4">El nivel de riesgo se evalúa automáticamente según el área declarada.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 opacity-80 pointer-events-none">
              <div className={`flex flex-col p-4 rounded-2xl border-2 transition-all ${riesgo === "BAJO" ? "border-emerald-500 bg-emerald-500/10" : "border-white/5 bg-[#020617]"}`}>
                <span className={`font-black text-lg ${riesgo === "BAJO" ? "text-emerald-400" : "text-slate-500"}`}>Riesgo Bajo</span>
                <span className="text-xs text-slate-500 mt-1">Locales menores a 50m²</span>
              </div>
              <div className={`flex flex-col p-4 rounded-2xl border-2 transition-all ${riesgo === "MEDIO" ? "border-amber-500 bg-amber-500/10" : "border-white/5 bg-[#020617]"}`}>
                <span className={`font-black text-lg ${riesgo === "MEDIO" ? "text-amber-400" : "text-slate-500"}`}>Riesgo Medio</span>
                <span className="text-xs text-slate-500 mt-1">Locales de 50m² a 100m²</span>
              </div>
              <div className={`flex flex-col p-4 rounded-2xl border-2 transition-all ${riesgo === "ALTO" ? "border-red-500 bg-red-500/10" : "border-white/5 bg-[#020617]"}`}>
                <span className={`font-black text-lg ${riesgo === "ALTO" ? "text-red-400" : "text-slate-500"}`}>Riesgo Alto</span>
                <span className="text-xs text-slate-500 mt-1">Mayores a 100m²</span>
              </div>
            </div>

            {tipo === "licencia_renovacion" && (
              <div className="mt-4 p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 flex items-start gap-3">
                <input 
                  type="checkbox" 
                  id="declaracion" 
                  checked={declaracionSinCambios}
                  onChange={(e) => setDeclaracionSinCambios(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-slate-700 bg-[#020617] text-blue-500 focus:ring-blue-500/50"
                />
                <label htmlFor="declaracion" className="text-sm text-slate-300">
                  <span className="font-bold text-white block mb-1">Declaración Jurada</span>
                  Declaro bajo juramento que mi local no ha sufrido modificaciones estructurales ni cambios de giro comercial desde la última licencia emitida. (Si hubo cambios, debe tramitar una Licencia Nueva).
                </label>
              </div>
            )}
          </div>

          {/* Sección 3: Documentos (Real Upload) */}
          <div className="space-y-4 pt-6 border-t border-white/5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-400" /> 3. Documentos Adjuntos
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Upload Plano */}
              <input type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" ref={planoInputRef} onChange={(e) => setPlano(e.target.files?.[0] || null)} />
              <div 
                onClick={() => planoInputRef.current?.click()}
                className={`p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${plano ? "border-blue-500 bg-blue-500/10" : "border-slate-700 bg-[#020617] hover:border-blue-500 hover:bg-[#0f172a]"}`}
              >
                {plano ? (
                  <div className="flex flex-col items-center gap-2">
                    <FileIcon className="w-8 h-8 text-blue-400" />
                    <span className="text-blue-400 font-medium text-sm truncate w-full px-4">{plano.name}</span>
                  </div>
                ) : (
                  <>
                    <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-2"><Upload className="w-5 h-5 text-slate-400" /></div>
                    <p className="text-white font-medium text-sm">Plano de Ubicación</p>
                    <p className="text-xs text-slate-500 mt-1">Click para subir (PDF, JPG)</p>
                  </>
                )}
              </div>

              {/* Upload Foto */}
              <input type="file" accept=".png,.jpg,.jpeg" className="hidden" ref={fotoInputRef} onChange={(e) => setFoto(e.target.files?.[0] || null)} />
              <div 
                onClick={() => fotoInputRef.current?.click()}
                className={`p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${foto ? "border-emerald-500 bg-emerald-500/10" : "border-slate-700 bg-[#020617] hover:border-emerald-500 hover:bg-[#0f172a]"}`}
              >
                {foto ? (
                  <div className="flex flex-col items-center gap-2">
                    <FileIcon className="w-8 h-8 text-emerald-400" />
                    <span className="text-emerald-400 font-medium text-sm truncate w-full px-4">{foto.name}</span>
                  </div>
                ) : (
                  <>
                    <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-2"><Upload className="w-5 h-5 text-slate-400" /></div>
                    <p className="text-white font-medium text-sm">Foto del Local</p>
                    <p className="text-xs text-slate-500 mt-1">Click para subir (JPG, PNG)</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="bg-[#020617] border border-white/10 rounded-2xl p-5 w-full md:w-auto shadow-lg">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Costo Estimado del Trámite</p>
              <p className="text-3xl font-black text-white font-mono">
                S/ {tipo === "licencia_renovacion" ? "180.00" : tipo === "licencia_nueva" ? "380.00" : "0.00"}
              </p>
              <p className="text-xs text-slate-500 mt-1">Sujeto a verificación. Podrás pagar online en el siguiente paso.</p>
            </div>

            <button 
              type="submit" 
              disabled={loading || !tipo}
              className="w-full md:w-auto flex justify-center items-center gap-2 px-10 h-16 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-lg font-bold shadow-xl shadow-emerald-500/20 transition-all hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
              {loading ? "Procesando..." : "Enviar Solicitud"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
