"use client";

import { useAuth } from "@/context/AuthContext";
import { FileText, Plus, CreditCard, Clock, CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/api";

interface TramiteResponse {
  id: string;
  ruc: string;
  tipo: string;
  estado: string;
  montoCobrado: number;
  fecha: string;
}

export default function SolicitanteDashboardPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [tramites, setTramites] = useState<TramiteResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);

  useEffect(() => {
    fetchTramites();
    handleMercadoPagoReturn();
  }, [searchParams]);

  const fetchTramites = async () => {
    try {
      const res = await api.get("/tramites");
      setTramites(res.data);
    } catch (error) {
      console.error("Error fetching tramites", error);
    } finally {
      setLoading(false);
    }
  };

  const processedPaymentRef = useRef(false);

  const handleMercadoPagoReturn = async () => {
    const status = searchParams.get("status");
    
    if (!processedPaymentRef.current) {
      if (status === "success" || status === "approved") {
        processedPaymentRef.current = true;
        alert("¡Pago procesado con MercadoPago! El sistema está verificando la confirmación.");
        router.replace("/dashboard/solicitante");
      } else if (status === "failure" || status === "rejected") {
        processedPaymentRef.current = true;
        alert("El pago no se pudo completar. Intente nuevamente.");
        router.replace("/dashboard/solicitante");
      }
    }
  };

  const handlePagar = async (tramiteId: string, ruc: string) => {
    try {
      setPayingId(tramiteId);
      const res = await api.post(`/tramites/${ruc}/mercadopago`);
      if (res.data && res.data.initPoint) {
        window.location.href = res.data.initPoint;
      }
    } catch (error: any) {
      console.error("Error al generar preferencia", error);
      const msg = error.response?.data?.message || "Hubo un error al conectar con Mercado Pago.";
      alert(msg);
      setPayingId(null);
    }
  };

  const handleDescargarLicencia = async (ruc: string) => {
    try {
      const response = await api.get(`/tramites/${ruc}/certificado`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Licencia_MPCT.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error descargando licencia", error);
      alert("Hubo un error al descargar la licencia. Es posible que aún no se haya generado correctamente.");
    }
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case "PAGADO":
      case "APROBADO":
        return <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold rounded-full">{estado}</span>;
      case "RECHAZADO":
      case "OBSERVADO":
        return <span className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold rounded-full">{estado}</span>;
      case "PENDIENTE":
      case "PENDIENTE_PAGO":
        return <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold rounded-full">PENDIENTE DE PAGO</span>;
      default:
        return <span className="px-3 py-1 bg-slate-500/10 text-slate-400 border border-slate-500/20 text-xs font-bold rounded-full">{estado}</span>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Mis Trámites</h1>
          <p className="text-slate-400 mt-2">Gestiona tus licencias y certificados registrados.</p>
        </div>
        <Link 
          href="/dashboard/solicitante/nuevo"
          className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" /> Nuevo Trámite
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#0a0f1c] border border-white/5 rounded-3xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0">
            <FileText className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <p className="text-slate-400 text-sm font-medium">Trámites Totales</p>
            <h3 className="text-2xl font-black text-white">{tramites.length}</h3>
          </div>
        </div>
        <div className="bg-[#0a0f1c] border border-white/5 rounded-3xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shrink-0">
            <Clock className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <p className="text-slate-400 text-sm font-medium">Pendientes de Pago</p>
            <h3 className="text-2xl font-black text-white">{tramites.filter(t => t.estado === "PENDIENTE").length}</h3>
          </div>
        </div>
        <div className="bg-[#0a0f1c] border border-white/5 rounded-3xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
            <CheckCircle className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-slate-400 text-sm font-medium">Pagados / En Proceso</p>
            <h3 className="text-2xl font-black text-white">{tramites.filter(t => t.estado !== "PENDIENTE" && t.estado !== "RECHAZADO").length}</h3>
          </div>
        </div>
      </div>

      <div className="bg-[#0a0f1c] border border-white/5 rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-white/5 bg-[#050a15]">
          <h2 className="text-lg font-bold text-white">Historial de Solicitudes</h2>
        </div>

        <div className="divide-y divide-white/5">
          {loading ? (
            <div className="p-8 text-center text-slate-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
          ) : tramites.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No tienes trámites registrados aún.</div>
          ) : (
            tramites.map((tramite) => (
              <div key={tramite.id} className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:bg-white/[0.02] transition-colors">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-white">Trámite {tramite.tipo}</h3>
                    {getStatusBadge(tramite.estado)}
                  </div>
                  <p className="text-sm text-slate-400">Expediente: <span className="font-mono text-slate-300">#{tramite.id.substring(0, 8)}</span></p>
                </div>
                
                <div className="flex flex-col items-end gap-3 shrink-0 w-full md:w-auto border-t border-white/5 md:border-t-0 pt-4 md:pt-0">
                  <div className="text-right">
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Costo a Pagar</p>
                    <p className="text-lg font-mono font-medium text-emerald-400">S/ {tramite.montoCobrado.toFixed(2)}</p>
                  </div>
                  
                  {tramite.estado === "PENDIENTE" ? (
                    <button 
                      onClick={() => handlePagar(tramite.id, tramite.ruc)}
                      disabled={payingId === tramite.id}
                      className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {payingId === tramite.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />} 
                      {payingId === tramite.id ? "Conectando..." : "Pagar con Mercado Pago"}
                    </button>
                  ) : tramite.estado === "APROBADO" ? (
                    <button 
                      onClick={() => handleDescargarLicencia(tramite.ruc)}
                      className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-lg shadow-emerald-500/20 transition-all"
                    >
                      <FileText className="w-4 h-4" />
                      Descargar Licencia
                    </button>
                  ) : (
                    <button className="w-full md:w-auto px-4 py-2 bg-[#020617] border border-white/10 hover:border-white/20 text-slate-300 font-bold rounded-lg transition-all">
                      Ver Detalles
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
