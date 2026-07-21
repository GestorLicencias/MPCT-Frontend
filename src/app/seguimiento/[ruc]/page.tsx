"use client";

import { useEffect, useState, use, Suspense } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CheckCircle2, CheckCircle, Clock, AlertCircle, FileX, CreditCard, UploadCloud, Download, Loader2 } from "lucide-react";

const API_URL = `${process.env.NEXT_PUBLIC_API_URL || 'https://mpct-backend-343008001984.us-central1.run.app/api/v1'}/tramites`;

interface Tramite {
  id: string;
  ruc: string;
  razonSocial: string;
  estado: string;
  certUrl: string | null;
  createdAt: string;
  observacionesGenerales?: string;
  archivosObservados?: string;
  montoCobrado?: number;
  estadoLicencia?: string;
  fechaVencimientoLicencia?: string;
}

function SeguimientoContent({ params }: { params: Promise<{ ruc: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tramite, setTramite] = useState<Tramite | null>(null);
  const [loading, setLoading] = useState(true);
  
  // States para Subsanción
  const [plano, setPlano] = useState<File | null>(null);
  const [subsanando, setSubsanando] = useState(false);

  // States para Pago
  const [voucher, setVoucher] = useState<File | null>(null);
  const [numeroComprobante, setNumeroComprobante] = useState("");
  const [pagando, setPagando] = useState(false);

  useEffect(() => {
    fetchTramite();
  }, [resolvedParams.ruc]);

  useEffect(() => {
    // Detectar si venimos de MercadoPago (retorno automático o manual)
    const status = searchParams.get("status");
    
    if (status === "success" || status === "approved") {
      toast.success("¡Pago procesado con MercadoPago! Estamos validando la confirmación.");
      // Limpiamos la URL para evitar que el toast salga cada vez que se recarga
      router.replace(`/seguimiento/${resolvedParams.ruc}`);
    } else if (status === "failure" || status === "rejected") {
      toast.error("El pago no se pudo completar. Intente nuevamente.");
      router.replace(`/seguimiento/${resolvedParams.ruc}`);
    } else if (status === "pending") {
      toast.info("Su pago está pendiente de procesamiento por MercadoPago.");
      router.replace(`/seguimiento/${resolvedParams.ruc}`);
    }
  }, [searchParams, resolvedParams.ruc, router]);

  const fetchTramite = async () => {
    try {
      const res = await axios.get(`${API_URL}/${resolvedParams.ruc}`);
      setTramite(res.data);
    } catch (error) {
      toast.error("No se encontró el trámite o ocurrió un error.");
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  const handleSubsanar = async () => {
    if (!plano) {
      toast.error("Debe adjuntar el archivo corregido del plano para subsanar.");
      return;
    }
    setSubsanando(true);
    try {
      const formData = new FormData();
      formData.append("plano", plano);

      await axios.patch(`${API_URL}/${tramite?.ruc}/archivos`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success("Plano corregido recibido correctamente. El trámite está en espera de la segunda inspección.");
      setPlano(null);
      fetchTramite();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al subir archivos.");
    } finally {
      setSubsanando(false);
    }
  };

  const handlePagoBanco = async () => {
    if (!numeroComprobante.trim()) {
      toast.error("Ingrese el número de comprobante (operación) del voucher.");
      return;
    }
    if (!voucher) {
      toast.error("Adjunte el voucher de pago del Banco de la Nación.");
      return;
    }
    setPagando(true);
    try {
      const formData = new FormData();
      formData.append("metodoPago", "BANCO_NACION");
      formData.append("voucher", voucher);
      formData.append("numeroComprobante", numeroComprobante.trim());

      await axios.post(`${API_URL}/${tramite?.ruc}/pagar`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success("Pago registrado correctamente.");
      fetchTramite();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al registrar pago.");
    } finally {
      setPagando(false);
    }
  };

  const handlePagoMercadoPago = async () => {
    setPagando(true);
    try {
      const res = await axios.post(`${API_URL}/${tramite?.ruc}/mercadopago`);
      if (res.data.initPoint) {
        window.location.href = res.data.initPoint;
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al conectar con MercadoPago.");
      setPagando(false);
    }
  };

  if (loading) return <div className="text-center py-20">Cargando información del trámite...</div>;
  if (!tramite) return null;
  
  const obsArray = tramite.archivosObservados ? tramite.archivosObservados.split(",") : [];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pt-20 pb-24 relative z-10 px-6">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-cyan-500/5 blur-[150px] rounded-full"></div>
      </div>

      <div className="flex flex-col md:flex-row md:justify-between md:items-center bg-[#030303] p-8 rounded-3xl shadow-2xl border border-white/10 relative overflow-hidden group gap-4">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight mb-2">Trámite RUC: {tramite.ruc}</h2>
          <p className="text-white/50 font-mono text-sm uppercase tracking-wider">{tramite.razonSocial}</p>
        </div>
        <Badge variant="outline" className={`text-xs px-4 py-2 border font-mono tracking-widest uppercase rounded-full ${
          tramite.estado === 'APROBADO' ? 'bg-green-500/10 text-green-400 border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.1)]' :
          tramite.estado === 'OBSERVADO' ? 'bg-red-500/10 text-red-400 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]' :
          tramite.estado === 'VALIDANDO_PAGO' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]' :
          'bg-white/5 text-white border-white/20'
        }`}>
          {tramite.estado.replace("_", " ")}
        </Badge>
      </div>

      {/* SECCIÓN DINÁMICA DEPENDIENDO DEL ESTADO */}
      
      {tramite.estado === "VALIDANDO_PAGO" && (
        <Card className="bg-[#030303] border-white/10 shadow-2xl mt-6 rounded-3xl overflow-hidden">
          <CardHeader className="bg-amber-500/5 border-b border-white/5 p-8">
            <CardTitle className="text-amber-400 flex items-center gap-3 text-xl">
              <Clock className="h-6 w-6" /> Validando Pago
            </CardTitle>
            <CardDescription className="text-white/40 text-base mt-2">
              Su voucher de pago ha sido recibido y está pendiente de validación manual.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-10">
            <div className="flex flex-col items-center justify-center py-8 space-y-6 text-center">
              <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.1)]">
                <Clock className="h-10 w-10 text-amber-400 animate-pulse" />
              </div>
              <h3 className="text-2xl font-medium text-white tracking-tight">Verificando comprobante</h3>
              <p className="text-white/50 max-w-md leading-relaxed text-lg">
                Un administrador está revisando su pago del Banco de la Nación. Este proceso puede demorar hasta 24 horas hábiles. Por favor, regrese más tarde.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {tramite.estado === "PENDIENTE_PAGO" && (
        <Card className="bg-[#030303] border-white/10 shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-white/5 border-b border-white/5 p-8">
            <CardTitle className="text-white flex items-center gap-3 text-xl tracking-tight">
              <CreditCard className="text-white/50" /> Realizar Pago
            </CardTitle>
            <CardDescription className="text-white/40 text-base mt-2">
              El costo fijo del trámite es de S/ {(tramite.montoCobrado || 180).toFixed(2)}. Seleccione su método de pago.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 grid md:grid-cols-2 gap-8">
            
            {tramite.pagoRechazado && (
              <div className="md:col-span-2 bg-red-500/10 border-l-2 border-red-500 p-6 rounded-r-2xl flex items-start gap-4">
                <AlertCircle className="text-red-500 h-6 w-6 shrink-0 mt-0.5" />
                <p className="text-red-400/90 leading-relaxed text-sm">Su pago por voucher anterior fue rechazado. Verifique su comprobante o comuníquese con su banco antes de volver a enviarlo.</p>
              </div>
            )}

            <div className="space-y-6 border border-white/10 rounded-2xl p-6 bg-[#050505] hover:border-white/20 transition-all">
              <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex gap-3 items-start">
                <CheckCircle className="h-5 w-5 text-white/50 shrink-0 mt-0.5" />
                <p className="text-xs text-white/50 leading-relaxed font-mono uppercase tracking-wider">
                  Pago automatizado e instantáneo
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-white text-lg tracking-tight mb-2">MercadoPago</h3>
                <p className="text-sm text-white/40 leading-relaxed">Pague de forma segura con Tarjeta de Crédito, Débito o Yape/Plin. Recomendado para evitar demoras.</p>
              </div>
              <Button onClick={handlePagoMercadoPago} disabled={pagando} className="w-full h-14 bg-white hover:bg-white/90 text-black font-semibold rounded-xl text-base">
                Pagar de inmediato
              </Button>
            </div>

            <div className="space-y-6 border border-white/10 rounded-2xl p-6 bg-[#050505] hover:border-white/20 transition-all">
              <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl flex gap-3 items-start">
                <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-500/70 leading-relaxed font-mono uppercase tracking-wider">
                  Validación manual en 24h
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-white text-lg tracking-tight mb-2">Banco de la Nación</h3>
                <p className="text-sm text-white/40 leading-relaxed">Si pagó en ventanilla, ingrese el Nº de Operación y adjunte la foto del voucher.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider mb-2 text-white/50">Nº de Operación</label>
                  <Input 
                    type="text" 
                    value={numeroComprobante} 
                    onChange={(e) => setNumeroComprobante(e.target.value)} 
                    className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-1 focus-visible:ring-cyan-500/50 rounded-lg"
                    placeholder="Ej. 0451234"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider mb-2 text-white/50">Voucher (JPG/PNG)</label>
                  <Input type="file" accept="image/*" onChange={(e) => setVoucher(e.target.files?.[0] || null)} className="border-white/10 text-white/70 bg-white/5 file:bg-white/10 file:text-white file:border-0 hover:file:bg-white/20 rounded-lg py-2" />
                </div>
              </div>
              <Button onClick={handlePagoBanco} disabled={pagando || !voucher || !numeroComprobante.trim()} className="w-full h-14 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-semibold">
                Subir Voucher y Validar
              </Button>
            </div>

          </CardContent>
        </Card>
      )}

      {tramite.estado === "OBSERVADO" && (
        <Card className="bg-[#030303] border-red-500/20 shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-red-500/5 border-b border-red-500/10 p-8">
            <CardTitle className="text-red-400 flex items-center gap-3 text-xl">
              <AlertCircle /> Observaciones del Inspector
            </CardTitle>
            <CardDescription className="text-red-400/50 mt-2 text-base">
              Su trámite requiere correcciones. Lea atentamente los detalles y vuelva a subir los archivos indicados.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            
            {tramite.observacionesGenerales && (
              <div className="bg-red-500/10 border-l-2 border-red-500 p-6 rounded-r-2xl">
                <h4 className="text-red-400 font-mono uppercase tracking-wider text-xs mb-3">Motivo de Rechazo</h4>
                <p className="text-red-100/70 whitespace-pre-wrap leading-relaxed">{tramite.observacionesGenerales}</p>
              </div>
            )}

            <div className="space-y-6 border border-white/5 p-8 rounded-2xl bg-[#050505]">
              <h4 className="font-semibold text-white tracking-tight">Archivo que requiere corrección</h4>
              <div className="grid gap-6">
                {obsArray.includes('PLANO') ? (
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider mb-2 text-white/50">Reemplazar Plano</label>
                    <Input type="file" accept="application/pdf, image/*" onChange={(e) => setPlano(e.target.files?.[0] || null)} className="border-white/10 text-white/70 bg-white/5 file:bg-white file:text-black file:font-semibold file:border-0 hover:file:bg-white/90 rounded-lg py-2" />
                  </div>
                ) : (
                  <p className="text-white/40 text-sm">No se especificaron archivos. Por favor, reenvíe la documentación según las observaciones.</p>
                )}
              </div>
            </div>

            <Button onClick={handleSubsanar} disabled={subsanando} className="w-full h-14 bg-white hover:bg-white/90 text-black font-bold rounded-xl mt-4">
              <UploadCloud className="mr-2 h-5 w-5" /> Enviar Correcciones al Inspector
            </Button>
          </CardContent>
        </Card>
      )}

      {tramite.estado === "APROBADO" && (
        <Card className="bg-[#030303] border-green-500/20 shadow-[0_0_40px_rgba(34,197,94,0.05)] rounded-3xl overflow-hidden">
          <CardHeader className="bg-green-500/5 border-b border-green-500/10 p-8 flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div>
              <CardTitle className="text-green-400 flex items-center gap-3 text-2xl tracking-tight">
                <CheckCircle2 className="h-8 w-8" /> ¡Licencia Aprobada!
              </CardTitle>
              <CardDescription className="text-green-400/50 text-base mt-2">
                Su trámite ha concluido exitosamente y su certificado oficial ha sido emitido.
              </CardDescription>
            </div>
            
            {tramite.estadoLicencia && tramite.fechaVencimientoLicencia && (
              <div className="shrink-0 flex flex-col items-end gap-2">
                <Badge 
                  className={`px-4 py-1.5 text-sm font-semibold tracking-wider uppercase ${
                    tramite.estadoLicencia === 'VIGENTE' 
                      ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' 
                      : tramite.estadoLicencia === 'VENCIDA'
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                      : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                  }`}
                >
                  {tramite.estadoLicencia}
                </Badge>
                <p className="text-xs text-white/40 font-mono">
                  {tramite.estadoLicencia === 'VENCIDA' ? 'Venció el:' : 'Vence el:'} {
                    // Parse as local to avoid timezone shifts since backend sends LocalDateTime (e.g. "2026-08-15T00:00:00")
                    (() => {
                      const [year, month, day] = tramite.fechaVencimientoLicencia.split('T')[0].split('-');
                      return `${day}/${month}/${year}`;
                    })()
                  }
                </p>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-8">
            <Button 
              className="w-full h-16 text-lg bg-green-500 hover:bg-green-400 text-black font-bold shadow-[0_0_20px_rgba(34,197,94,0.2)] transition-all rounded-2xl"
              onClick={async () => {
                try {
                  const res = await axios.get(`${API_URL}/${tramite.ruc}/certificado`, {
                    responseType: 'blob'
                  });
                  const url = window.URL.createObjectURL(new Blob([res.data]));
                  const link = document.createElement('a');
                  link.href = url;
                  link.setAttribute('download', `Licencia_${tramite.ruc}.pdf`);
                  document.body.appendChild(link);
                  link.click();
                  link.parentNode?.removeChild(link);
                } catch (e) {
                  toast.error("Error al descargar el certificado. Intente de nuevo.");
                }
              }}
            >
              <Download className="mr-3 h-6 w-6" /> Descargar Certificado Digital
            </Button>
          </CardContent>
        </Card>
      )}
      
      {["PAGADO", "SUBSANADO", "EN_SUBSANACION", "PROGRAMADO", "EN_INSPECCION"].includes(tramite.estado) && (
        <Card className="bg-[#030303] border-white/10 shadow-2xl rounded-3xl overflow-hidden">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(255,255,255,0.02)] border border-white/5">
              <Clock className="h-10 w-10 text-white/40" />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-3 tracking-tight">Trámite en Revisión</h3>
            <p className="text-white/40 max-w-lg leading-relaxed">Su trámite está siendo evaluado o tiene una inspección programada. Por favor, revise este panel más adelante o manténgase atento a su correo electrónico.</p>
          </CardContent>
        </Card>
      )}

      {tramite.estado === "TERMINADO" && (
        <Card className="bg-[#030303] border-red-900/50 shadow-2xl mt-6 rounded-3xl overflow-hidden">
          <CardHeader className="bg-red-500/5 border-b border-red-500/10 p-8">
            <CardTitle className="text-red-500 flex items-center gap-3 text-2xl tracking-tight">
              <AlertCircle className="h-8 w-8" /> Trámite Terminado
            </CardTitle>
            <CardDescription className="text-red-400/50 mt-2 text-base leading-relaxed">
              Lamentablemente, su trámite ha sido terminado. Esto puede deberse a que no se subsanaron las observaciones a tiempo o que las subsanaciones no fueron conformes.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 text-white/40">
            <p>Por favor, inicie un nuevo trámite desde la página de inicio si desea volver a intentarlo y asegúrese de cumplir con todos los requisitos solicitados.</p>
          </CardContent>
        </Card>
      )}

    </div>
  );
}

export default function SeguimientoPage({ params }: { params: Promise<{ ruc: string }> }) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin w-8 h-8 text-cyan-500" /></div>}>
      <SeguimientoContent params={params} />
    </Suspense>
  );
}
