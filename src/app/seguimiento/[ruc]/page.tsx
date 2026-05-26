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

const API_URL = "https://mpct-api-264213836001.us-east1.run.app/api/v1/tramites";

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
}

function SeguimientoContent({ params }: { params: Promise<{ ruc: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tramite, setTramite] = useState<Tramite | null>(null);
  const [loading, setLoading] = useState(true);
  
  // States para Subsanción
  const [plano, setPlano] = useState<File | null>(null);
  const [foto, setFoto] = useState<File | null>(null);
  const [foto2, setFoto2] = useState<File | null>(null);
  const [foto3, setFoto3] = useState<File | null>(null);
  const [foto4, setFoto4] = useState<File | null>(null);
  const [subsanando, setSubsanando] = useState(false);

  // States para Pago
  const [voucher, setVoucher] = useState<File | null>(null);
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
    if (!plano && !foto && !foto2 && !foto3 && !foto4) {
      toast.error("Debe adjuntar al menos un archivo corregido para subsanar.");
      return;
    }
    setSubsanando(true);
    try {
      const formData = new FormData();
      if (plano) formData.append("plano", plano);
      if (foto) formData.append("foto", foto);
      if (foto2) formData.append("foto2", foto2);
      if (foto3) formData.append("foto3", foto3);
      if (foto4) formData.append("foto4", foto4);

      await axios.patch(`${API_URL}/${tramite?.ruc}/archivos`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success("Archivos actualizados correctamente. El trámite volverá a ser evaluado.");
      setPlano(null); setFoto(null); setFoto2(null); setFoto3(null); setFoto4(null);
      fetchTramite();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al subir archivos.");
    } finally {
      setSubsanando(false);
    }
  };

  const handlePagoBanco = async () => {
    if (!voucher) {
      toast.error("Adjunte el voucher de pago del Banco de la Nación.");
      return;
    }
    setPagando(true);
    try {
      const formData = new FormData();
      formData.append("metodoPago", "BANCO_NACION");
      formData.append("voucher", voucher);

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
    <div className="max-w-4xl mx-auto space-y-8 pt-6 relative z-10">
      <div className="flex justify-between items-center bg-slate-900/50 backdrop-blur-md p-6 rounded-xl shadow-lg border border-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-white">Trámite RUC: {tramite.ruc}</h2>
          <p className="text-slate-400">{tramite.razonSocial}</p>
        </div>
        <Badge variant="outline" className={`text-base px-4 py-2 border ${
          tramite.estado === 'APROBADO' ? 'bg-green-500/10 text-green-400 border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.2)]' :
          tramite.estado === 'OBSERVADO' ? 'bg-red-500/10 text-red-400 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]' :
          tramite.estado === 'VALIDANDO_PAGO' ? 'bg-amber-500/10 text-amber-400 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]' :
          'bg-cyan-500/10 text-cyan-400 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
        }`}>
          {tramite.estado.replace("_", " ")}
        </Badge>
      </div>

      {/* SECCIÓN DINÁMICA DEPENDIENDO DEL ESTADO */}
      
      {tramite.estado === "VALIDANDO_PAGO" && (
        <Card className="bg-slate-900/40 backdrop-blur-md border-amber-900/50 shadow-xl mt-6">
          <CardHeader className="bg-amber-950/30 border-b border-slate-800">
            <CardTitle className="text-amber-400 flex items-center gap-2">
              <Clock className="h-5 w-5" /> Validando Pago
            </CardTitle>
            <CardDescription className="text-slate-400">
              Su voucher de pago ha sido recibido y está pendiente de validación manual.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-10 space-y-4 text-center">
              <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center">
                <Clock className="h-8 w-8 text-amber-400 animate-pulse" />
              </div>
              <h3 className="text-xl font-medium text-slate-200">Verificando comprobante</h3>
              <p className="text-slate-400 max-w-md">
                Un administrador está revisando su pago del Banco de la Nación. Este proceso puede demorar hasta 24 horas hábiles. Por favor, regrese más tarde.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {tramite.estado === "PENDIENTE_PAGO" && (
        <Card className="bg-slate-900/40 backdrop-blur-md border-cyan-900/50 shadow-xl">
          <CardHeader className="bg-cyan-950/30 border-b border-slate-800">
            <CardTitle className="text-cyan-400 flex items-center gap-2">
              <CreditCard /> Realizar Pago
            </CardTitle>
            <CardDescription className="text-slate-400">
              El costo fijo del trámite es de S/ {(tramite.montoCobrado || 180).toFixed(2)}. Seleccione su método de pago.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 grid md:grid-cols-2 gap-8">
            
            <div className="space-y-4 border border-slate-800 rounded-xl p-4 bg-slate-950/50 hover:border-cyan-800/50 transition-colors">
              <div className="bg-emerald-500/10 border border-emerald-500/50 p-3 rounded-lg flex gap-3 items-start">
                <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-200/90 leading-relaxed">
                  <strong>Recomendado:</strong> El pago con MercadoPago se valida <strong>automáticamente y al instante</strong>, permitiéndole continuar su trámite sin demoras.
                </p>
              </div>
              <h3 className="font-semibold text-slate-200">MercadoPago (Instantáneo)</h3>
              <p className="text-sm text-slate-500">Pague de forma segura con Tarjeta de Crédito, Débito o Yape/Plin.</p>
              <Button onClick={handlePagoMercadoPago} disabled={pagando} className="w-full bg-[#009EE3] hover:bg-[#008ACA] text-white">
                Pagar con MercadoPago
              </Button>
            </div>

            <div className="space-y-4 border border-slate-800 rounded-xl p-4 bg-slate-950/50 hover:border-cyan-800/50 transition-colors">
              <div className="bg-amber-500/10 border border-amber-500/50 p-3 rounded-lg flex gap-3 items-start">
                <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-200/90 leading-relaxed">
                  <strong>Atención:</strong> El pago por Banco de la Nación requiere validación manual, el proceso puede demorar hasta 24 horas.
                </p>
              </div>
              <h3 className="font-semibold text-slate-200">Banco de la Nación</h3>
              <p className="text-sm text-slate-500">Si pagó en ventanilla, adjunte la foto del voucher (JPG/PNG).</p>
              <Input type="file" accept="image/*" onChange={(e) => setVoucher(e.target.files?.[0] || null)} className="bg-slate-900 border-slate-700 text-slate-300" />
              <Button onClick={handlePagoBanco} disabled={pagando || !voucher} variant="secondary" className="w-full bg-slate-800 hover:bg-slate-700 text-white border border-slate-700">
                Subir Voucher
              </Button>
            </div>

          </CardContent>
        </Card>
      )}

      {tramite.estado === "OBSERVADO" && (
        <Card className="bg-slate-900/40 backdrop-blur-md border-red-900/50 shadow-xl">
          <CardHeader className="bg-red-950/30 border-b border-slate-800">
            <CardTitle className="text-red-400 flex items-center gap-2">
              <AlertCircle /> Observaciones del Inspector
            </CardTitle>
            <CardDescription className="text-slate-400">
              Su trámite requiere correcciones. Lea atentamente los detalles y vuelva a subir los archivos indicados.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            
            {tramite.observacionesGenerales && (
              <div className="bg-red-500/10 border-l-4 border-red-500 p-4 rounded-r-lg">
                <h4 className="text-red-400 font-semibold mb-1">Motivo de Rechazo:</h4>
                <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{tramite.observacionesGenerales}</p>
              </div>
            )}

            <div className="space-y-4 border border-slate-800 p-5 rounded-lg bg-slate-950/30">
              <h4 className="font-semibold text-slate-200">Archivos que requieren corrección:</h4>
              <div className="grid md:grid-cols-2 gap-4">
                {obsArray.includes('PLANO') && (
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-300">Reemplazar Plano</label>
                    <Input type="file" accept="application/pdf, image/*" onChange={(e) => setPlano(e.target.files?.[0] || null)} className="bg-slate-900 border-slate-700 text-slate-300 file:bg-slate-800 file:text-white file:border-0 file:rounded file:px-3 file:py-1 file:mr-3 hover:file:bg-slate-700 cursor-pointer" />
                  </div>
                )}
                {obsArray.includes('FOTO1') && (
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-300">Reemplazar Foto 1</label>
                    <Input type="file" accept="image/*" onChange={(e) => setFoto(e.target.files?.[0] || null)} className="bg-slate-900 border-slate-700 text-slate-300 file:bg-slate-800 file:text-white file:border-0 file:rounded file:px-3 file:py-1 file:mr-3 hover:file:bg-slate-700 cursor-pointer" />
                  </div>
                )}
                {obsArray.includes('FOTO2') && (
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-300">Reemplazar Foto 2</label>
                    <Input type="file" accept="image/*" onChange={(e) => setFoto2(e.target.files?.[0] || null)} className="bg-slate-900 border-slate-700 text-slate-300 file:bg-slate-800 file:text-white file:border-0 file:rounded file:px-3 file:py-1 file:mr-3 hover:file:bg-slate-700 cursor-pointer" />
                  </div>
                )}
                {obsArray.includes('FOTO3') && (
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-300">Reemplazar Foto 3</label>
                    <Input type="file" accept="image/*" onChange={(e) => setFoto3(e.target.files?.[0] || null)} className="bg-slate-900 border-slate-700 text-slate-300 file:bg-slate-800 file:text-white file:border-0 file:rounded file:px-3 file:py-1 file:mr-3 hover:file:bg-slate-700 cursor-pointer" />
                  </div>
                )}
                {obsArray.includes('FOTO4') && (
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-300">Reemplazar Foto 4</label>
                    <Input type="file" accept="image/*" onChange={(e) => setFoto4(e.target.files?.[0] || null)} className="bg-slate-900 border-slate-700 text-slate-300 file:bg-slate-800 file:text-white file:border-0 file:rounded file:px-3 file:py-1 file:mr-3 hover:file:bg-slate-700 cursor-pointer" />
                  </div>
                )}
                {obsArray.length === 0 && (
                  <p className="text-slate-500 text-sm">No se especificaron archivos. Por favor, reenvíe la documentación según las observaciones.</p>
                )}
              </div>
            </div>

            <Button onClick={handleSubsanar} disabled={subsanando} className="w-full h-12 bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_15px_rgba(8,145,178,0.3)]">
              <UploadCloud className="mr-2 h-4 w-4" /> Enviar Correcciones al Inspector
            </Button>
          </CardContent>
        </Card>
      )}

      {tramite.estado === "APROBADO" && (
        <Card className="bg-slate-900/40 backdrop-blur-md border-green-900/50 shadow-[0_0_20px_rgba(34,197,94,0.1)]">
          <CardHeader className="bg-green-950/20 border-b border-slate-800">
            <CardTitle className="text-green-400 flex items-center gap-2">
              <CheckCircle2 /> ¡Licencia Aprobada!
            </CardTitle>
            <CardDescription className="text-slate-400">
              Su trámite ha concluido exitosamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Button 
              className="w-full md:w-auto h-14 px-8 text-lg bg-green-600 hover:bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-all"
              onClick={() => window.open(`https://mpct-api-264213836001.us-east1.run.app/api/v1/tramites/${tramite.ruc}/certificado`, "_blank")}
            >
              <Download className="mr-2" /> Descargar Certificado
            </Button>
          </CardContent>
        </Card>
      )}
      
      {(tramite.estado === "PAGADO" || tramite.estado === "SUBSANADO") && (
        <Card className="bg-slate-900/40 backdrop-blur-md border-slate-800 shadow-xl">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
            <Clock size={48} className="mb-4 text-cyan-500/50" />
            <h3 className="text-xl font-medium text-slate-200 mb-2">Trámite en Revisión</h3>
            <p>Su trámite está siendo evaluado por un inspector. Por favor, revise este panel más adelante.</p>
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
