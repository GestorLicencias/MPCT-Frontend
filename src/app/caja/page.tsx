"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import api from "@/lib/axios";

import { FileCheck } from "lucide-react";
import { ValidarPagosCajero } from "@/components/ValidarPagosCajero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Briefcase, CreditCard, DollarSign, LogOut, Receipt, ExternalLink, Search, Bell, AlertTriangle, Send, Plus, Trash2, Smartphone, Banknote } from "lucide-react";

interface CajaEstado {
  cajaId: string | null;
  abierta: boolean;
  montoInicial: number;
  ingresos: number;
  egresos: number;
  montoActual: number;
}

const abrirCajaSchema = z.object({
  montoInicial: z.coerce.number()
    .int({ message: "Debe ser un monto entero (sin céntimos)" })
    .min(100, { message: "El fondo inicial debe ser de 3 dígitos (mín 100)" })
    .max(999, { message: "El fondo inicial debe ser de 3 dígitos (máx 999)" })
});

const pagoSchema = z.object({
  ruc: z.string().length(11, { message: "El RUC debe tener 11 dígitos" })
});

type MetodoPago = "EFECTIVO" | "YAPE" | "TARJETA" | "TRANSFERENCIA";

interface PagoDetalle {
  id: string;
  metodo: MetodoPago;
  monto: string;
  montoEntregado: string;
  referencia: string;
}

export default function CajaPage() {
  const router = useRouter();
  const [estadoCaja, setEstadoCaja] = useState<CajaEstado | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"estado" | "cobro" | "validar" | "alertas">("estado");
  const [mostrarFormAbrir, setMostrarFormAbrir] = useState(false);

  const [tramite, setTramite] = useState<any>(null);
  const [buscando, setBuscando] = useState(false);
  const [montoFisico, setMontoFisico] = useState<string>("");

  const [alertas, setAlertas] = useState<any[]>([]);
  const [alertasPagos, setAlertasPagos] = useState<any[]>([]);
  const [cargandoAlertas, setCargandoAlertas] = useState(false);
  const [enviandoRecordatorio, setEnviandoRecordatorio] = useState<string | null>(null);

  const [modoPago, setModoPago] = useState<"UNICO" | "HIBRIDO">("UNICO");
  const [metodoUnico, setMetodoUnico] = useState<MetodoPago>("EFECTIVO");
  const [metodoHibrido, setMetodoHibrido] = useState<"EFECTIVO_YAPE" | "EFECTIVO_TARJETA">("EFECTIVO_YAPE");
  
  const [montoEfectivo, setMontoEfectivo] = useState("");
  const [montoEntregadoEfectivo, setMontoEntregadoEfectivo] = useState("");
  const [referenciaUnico, setReferenciaUnico] = useState("");
  const [referenciaHibrido, setReferenciaHibrido] = useState("");

  const formAbrir = useForm<z.infer<typeof abrirCajaSchema>>({
    resolver: zodResolver(abrirCajaSchema),
    defaultValues: { montoInicial: 0 }
  });

  const formPago = useForm<z.infer<typeof pagoSchema>>({
    resolver: zodResolver(pagoSchema),
    defaultValues: { ruc: "" }
  });

  const rucValue = formPago.watch("ruc");

  useEffect(() => {
    fetchEstadoCaja();
  }, []);

  useEffect(() => {
    if (rucValue?.length === 11) {
      buscarTramite(rucValue);
    } else {
      setTramite(null);
    }
  }, [rucValue]);

  const buscarTramite = async (ruc: string) => {
    setBuscando(true);
    try {
      const res = await api.get(`/tramites/${ruc}`);
      setTramite(res.data);
      // Auto-inicializar con 1 pago de efectivo por el total
        setModoPago("UNICO");
        setMetodoUnico("EFECTIVO");
        setMontoEfectivo("");
        setMontoEntregadoEfectivo("");
        setReferenciaUnico("");
        setReferenciaHibrido("");
    } catch (error) {
      setTramite(null);
    } finally {
      setBuscando(false);
    }
  };

  const fetchEstadoCaja = async () => {
    try {
      setLoading(true);
      const res = await api.get("/caja/estado");
      setEstadoCaja(res.data);
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error("Sesión expirada o sin permisos.");
        router.push("/auth/login");
      } else {
        toast.error("Error al obtener estado de caja");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAlertas = async () => {
    setCargandoAlertas(true);
    try {
      const [resLic, resPagos] = await Promise.all([
        api.get("/caja/licencias-alertas"),
        api.get("/admin/pagos/pendientes")
      ]);
      setAlertas(resLic.data);
      setAlertasPagos(resPagos.data);
    } catch (error) {
      toast.error("Error al cargar alertas");
    } finally {
      setCargandoAlertas(false);
    }
  };

  const handleEnviarRecordatorio = async (ruc: string) => {
    setEnviandoRecordatorio(ruc);
    try {
      await api.post(`/caja/licencias-alertas/${ruc}/recordatorio`);
      toast.success("Correo de recordatorio enviado exitosamente");
    } catch (error) {
      toast.error("Error al enviar el recordatorio");
    } finally {
      setEnviandoRecordatorio(null);
    }
  };

  const handleAbrirCaja = async (values: z.infer<typeof abrirCajaSchema>) => {
    try {
      await api.post("/caja/abrir", { montoInicial: values.montoInicial });
      toast.success("Caja abierta exitosamente");
      fetchEstadoCaja();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al abrir caja");
    }
  };

  const handleCerrarCaja = async () => {
    if (!montoFisico) {
      toast.error("Por favor, ingrese el dinero físico contado en la caja.");
      return;
    }
    
    const diferencia = parseFloat(montoFisico) - (estadoCaja?.montoActual || 0);
    const mensajeConfirmacion = diferencia === 0 
      ? "¿La caja está cuadrada perfectamente. Desea cerrar la caja?" 
      : `ATENCIÓN: Hay un ${diferencia > 0 ? 'SOBRANTE' : 'FALTANTE'} de S/ ${Math.abs(diferencia).toFixed(2)}. ¿Desea cerrar la caja de todos modos?`;

    if (!confirm(mensajeConfirmacion)) return;
    
    try {
      await api.post("/caja/cerrar", { montoFisico: parseFloat(montoFisico) });
      toast.success("Caja cerrada exitosamente");
      setMontoFisico("");
      fetchEstadoCaja();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al cerrar caja");
    }
  };

  const handlePago = async (values: z.infer<typeof pagoSchema>) => {
    if (!tramite) {
      toast.error("Por favor espere a que se cargue el trámite");
      return;
    }
    if (tramite.estado !== 'PENDIENTE_PAGO') {
      toast.error("Este trámite no está en estado PENDIENTE_PAGO");
      return;
    }

    const payloadDetalles: any[] = [];

    if (modoPago === "UNICO") {
      if (metodoUnico === "EFECTIVO") {
        if (!montoEntregadoEfectivo || parseFloat(montoEntregadoEfectivo) < tramite.montoCobrado) {
          toast.error("El monto entregado en efectivo debe ser mayor o igual al monto a pagar");
          return;
        }
        payloadDetalles.push({
          metodo: "EFECTIVO",
          monto: tramite.montoCobrado,
          montoEntregado: parseFloat(montoEntregadoEfectivo),
          referencia: null
        });
      } else {
        if (!referenciaUnico || referenciaUnico.trim() === "") {
          toast.error("Requiere un código de referencia o número de operación");
          return;
        }
        payloadDetalles.push({
          metodo: metodoUnico,
          monto: tramite.montoCobrado,
          montoEntregado: null,
          referencia: referenciaUnico.trim()
        });
      }
    } else {
      // HIBRIDO
      const mEfectivo = parseFloat(montoEfectivo);
      if (isNaN(mEfectivo) || mEfectivo <= 0 || mEfectivo >= tramite.montoCobrado) {
        toast.error("Monto en efectivo inválido para pago dividido");
        return;
      }
      
      const mSecundario = tramite.montoCobrado - mEfectivo;
      
      if (!montoEntregadoEfectivo || parseFloat(montoEntregadoEfectivo) < mEfectivo) {
        toast.error("El monto entregado en efectivo debe ser mayor o igual a la parte en efectivo");
        return;
      }
      if (!referenciaHibrido || referenciaHibrido.trim() === "") {
        toast.error("Requiere un código de referencia para el pago digital");
        return;
      }

      payloadDetalles.push({
        metodo: "EFECTIVO",
        monto: mEfectivo,
        montoEntregado: parseFloat(montoEntregadoEfectivo),
        referencia: null
      });

      payloadDetalles.push({
        metodo: metodoHibrido === "EFECTIVO_YAPE" ? "YAPE" : "TARJETA",
        monto: mSecundario,
        montoEntregado: null,
        referencia: referenciaHibrido.trim()
      });
    }

    try {
      await api.post("/caja/pago-presencial", {
        ruc: values.ruc,
        detalles: payloadDetalles
      });
      toast.success("Pago registrado correctamente");
      formPago.reset();
      setTramite(null);
      setMontoEfectivo("");
      setMontoEntregadoEfectivo("");
      setReferenciaUnico("");
      setReferenciaHibrido("");
      fetchEstadoCaja();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al registrar el pago");
    }
  };

  const handleLogout = () => {
    if (estadoCaja?.abierta) {
      toast.error("Debes hacer el arqueo y cerrar la caja antes de salir.");
      setActiveTab("estado");
      return;
    }
    localStorage.removeItem("token");
    router.push("/auth/login");
  };

  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-white/50">Cargando panel...</div>;
  }

  if (estadoCaja && !estadoCaja.abierta) {
    return (
      <div className="flex h-screen bg-black items-center justify-center relative z-10 w-full max-w-[100vw]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/5 blur-[120px] rounded-full pointer-events-none"></div>
        <Card className="bg-[#080808] border-white/5 shadow-xl rounded-3xl w-full max-w-md relative z-10">
          <CardHeader className="p-8 bg-[#0a0a0a] border-b border-white/5 text-center">
            <Briefcase className="w-12 h-12 text-white mx-auto mb-4" />
            <CardTitle className="text-white text-2xl tracking-tight">Iniciar Turno de Caja</CardTitle>
            <CardDescription className="text-white/50 text-base mt-2">
              Para interactuar con el sistema, primero debes abrir la caja con el fondo inicial (vueltos).
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            {!mostrarFormAbrir ? (
              <div className="space-y-4">
                <Button onClick={() => setMostrarFormAbrir(true)} className="w-full h-14 bg-white hover:bg-white/90 text-black font-semibold text-lg rounded-xl transition-all shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                  Abrir Caja
                </Button>
                <Button type="button" variant="ghost" onClick={() => { localStorage.removeItem("token"); router.push("/auth/login"); }} className="w-full text-white/50 hover:text-white mt-2">
                  <LogOut className="w-4 h-4 mr-2"/> Cancelar y Salir
                </Button>
              </div>
            ) : (
              <Form {...formAbrir}>
                <form onSubmit={formAbrir.handleSubmit(handleAbrirCaja)} className="space-y-6 text-left">
                  <FormField
                    control={formAbrir.control}
                    name="montoInicial"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-mono uppercase tracking-wider text-white/50">Fondo Inicial (S/)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} className="h-14 bg-white/5 border-white/10 text-white focus-visible:ring-1 focus-visible:ring-cyan-500/50 rounded-xl px-4 text-base" />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                  <div className="space-y-4">
                    <Button type="submit" className="w-full h-14 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-lg rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                      Abrir Caja Ahora
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => setMostrarFormAbrir(false)} className="w-full text-white/50 hover:text-white">
                      Atrás
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-black overflow-hidden relative z-10 w-full max-w-[100vw]">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/5 blur-[120px] rounded-full pointer-events-none"></div>
      
      {/* Sidebar */}
      <aside className="w-72 bg-[#030303] border-r border-white/5 flex flex-col z-20 shrink-0">
        <div className="p-8 border-b border-white/5">
          <h2 className="text-xl font-bold text-white flex items-center gap-3 tracking-tight">
            <Briefcase className="text-white w-6 h-6" /> Cajero
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 mt-4">
          <button 
            onClick={() => setActiveTab("estado")}
            className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl transition-all font-medium ${activeTab === "estado" ? "bg-white text-black" : "text-white/60 hover:bg-white/5 hover:text-white"}`}
          >
            <DollarSign className="w-5 h-5" /> Estado de Caja
          </button>
          <button 
            onClick={() => setActiveTab("cobro")}
            className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl transition-all font-medium ${activeTab === "cobro" ? "bg-white text-black" : "text-white/60 hover:bg-white/5 hover:text-white"}`}
          >
            <Receipt className="w-5 h-5" /> Cobro Presencial
          </button>
          <button 
            onClick={() => setActiveTab("validar")}
            className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl transition-all font-medium ${activeTab === "validar" ? "bg-white text-black" : "text-white/60 hover:bg-white/5 hover:text-white"}`}
          >
            <FileCheck className="w-5 h-5" /> Validar Pagos
          </button>
          <button 
            onClick={() => { setActiveTab("alertas"); fetchAlertas(); }}
            className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl transition-all font-medium ${activeTab === "alertas" ? "bg-white text-black" : "text-white/60 hover:bg-white/5 hover:text-white"}`}
          >
            <Bell className="w-5 h-5" /> Alertas de Licencias
          </button>
        </div>
        <div className="p-6 border-t border-white/5">
          <Button variant="outline" onClick={handleLogout} className="w-full text-white/70 border-white/10 hover:bg-white/5 hover:text-white rounded-xl h-12">
            <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-10 z-20">
        <div className="max-w-4xl mx-auto space-y-6 pt-4 pb-20">
          
          {activeTab === "estado" && (
            <Card className="bg-[#080808] border-white/5 shadow-xl rounded-3xl relative z-10 overflow-hidden">
              <CardHeader className="p-8 bg-[#0a0a0a] border-b border-white/5">
                <CardTitle className="text-white text-2xl tracking-tight flex items-center gap-2">
                  <DollarSign className="text-white w-6 h-6" /> Estado de Caja
                </CardTitle>
                <CardDescription className="text-white/50 text-base mt-2">
                  Administra tu turno actual y revisa los montos.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-8">
                {estadoCaja?.abierta ? (
                  <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[#030303] p-6 rounded-2xl border border-white/5">
                        <p className="text-xs font-mono uppercase tracking-wider text-white/50">Fondo Inicial</p>
                        <p className="text-2xl font-bold text-white mt-2">S/ {estadoCaja.montoInicial.toFixed(2)}</p>
                      </div>
                      <div className="bg-[#030303] p-6 rounded-2xl border border-white/5">
                        <p className="text-xs font-mono uppercase tracking-wider text-white/50">Ingresos del Día</p>
                        <p className="text-xl font-semibold text-white mt-2">S/ {estadoCaja.ingresos.toFixed(2)}</p>
                      </div>
                      <div className="bg-[#030303] p-6 rounded-2xl border border-cyan-500/30 relative overflow-hidden col-span-2">
                        <div className="absolute inset-0 bg-cyan-500/5"></div>
                        <p className="text-xs font-mono uppercase tracking-wider text-cyan-400 relative z-10">Total Acumulado en Caja</p>
                        <p className="text-3xl font-bold text-cyan-300 mt-2 relative z-10">S/ {estadoCaja.montoActual.toFixed(2)}</p>
                        <p className="text-xs text-cyan-500/60 mt-1 relative z-10">Incluye Efectivo y transferencias electrónicas</p>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-white/10 space-y-5">
                      <div>
                        <h4 className="text-lg font-medium text-white flex items-center gap-2 mb-1"><Briefcase className="w-5 h-5"/> Arqueo y Cierre</h4>
                        <p className="text-sm text-white/50">Ingresa todo el dinero (efectivo + reportes POS/Yape) para cuadrar la caja.</p>
                      </div>
                      
                      <div className="flex gap-4 items-end">
                        <div className="flex-1">
                          <label className="text-xs font-mono uppercase tracking-wider text-white/50 mb-2 block">Suma Física y Reportes (S/)</label>
                          <Input 
                            type="number" step="0.01" 
                            value={montoFisico} 
                            onChange={e => setMontoFisico(e.target.value)} 
                            className="h-14 bg-white/5 border-white/10 text-white text-lg rounded-xl focus-visible:ring-cyan-500/50"
                            placeholder="0.00"
                          />
                        </div>
                        <Button 
                          onClick={handleCerrarCaja}
                          disabled={!montoFisico}
                          className="h-14 px-8 bg-red-600 hover:bg-red-700 disabled:bg-red-900/40 text-white disabled:text-white/40 font-semibold text-lg rounded-xl transition-all shadow-[0_0_15px_rgba(220,38,38,0.3)] disabled:shadow-none"
                        >
                          Cerrar Caja
                        </Button>
                      </div>

                      {montoFisico && (
                        <div className={`p-5 rounded-xl border mt-4 ${parseFloat(montoFisico) === estadoCaja.montoActual ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : parseFloat(montoFisico) > estadoCaja.montoActual ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                          <p className="text-base font-semibold">
                            {parseFloat(montoFisico) === estadoCaja.montoActual && "✓ La caja está perfectamente cuadrada (Diferencia: S/ 0.00)"}
                            {parseFloat(montoFisico) > estadoCaja.montoActual && `⚠️ Hay un SOBRANTE de S/ ${(parseFloat(montoFisico) - estadoCaja.montoActual).toFixed(2)}`}
                            {parseFloat(montoFisico) < estadoCaja.montoActual && `⚠️ Hay un FALTANTE de S/ ${(estadoCaja.montoActual - parseFloat(montoFisico)).toFixed(2)}`}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="p-8 bg-[#030303] rounded-2xl border border-white/5 text-center">
                      <h3 className="text-xl font-medium text-white mb-2">La caja está cerrada</h3>
                      <p className="text-sm text-white/50 mb-8">Para empezar a registrar pagos, necesitas abrir la caja con un fondo inicial para vueltos.</p>
                      <Form {...formAbrir}>
                        <form onSubmit={formAbrir.handleSubmit(handleAbrirCaja)} className="space-y-6 text-left max-w-sm mx-auto">
                          <FormField
                            control={formAbrir.control}
                            name="montoInicial"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-mono uppercase tracking-wider text-white/50">Fondo Inicial (S/)</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" {...field} className="h-14 bg-white/5 border-white/10 text-white focus-visible:ring-1 focus-visible:ring-cyan-500/50 rounded-xl px-4 text-base" />
                                </FormControl>
                                <FormMessage className="text-red-400" />
                              </FormItem>
                            )}
                          />
                          <Button type="submit" className="w-full h-14 bg-white hover:bg-white/90 text-black font-semibold text-lg rounded-xl transition-all shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                            Abrir Caja Ahora
                          </Button>
                        </form>
                      </Form>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "cobro" && (
            <div className="space-y-6">
              <Card className={`bg-[#080808] border-white/5 shadow-xl rounded-3xl relative z-10 overflow-hidden transition-opacity ${!estadoCaja?.abierta ? 'opacity-50 pointer-events-none' : ''}`}>
                <CardHeader className="p-8 bg-[#0a0a0a] border-b border-white/5">
                  <CardTitle className="text-white text-xl tracking-tight flex items-center gap-2">
                    Iniciar Trámite Rápido
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <p className="text-sm text-white/50 mb-6">Abre el formulario público para registrar un nuevo trámite en nombre del ciudadano que está en ventanilla.</p>
                  <Link href="/solicitar" target="_blank" rel="noopener noreferrer" className="block w-full">
                    <Button variant="outline" className="w-full h-14 border-white/10 text-white hover:bg-white/5 hover:text-white rounded-xl">
                      Ir a Formulario de Solicitud <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className={`bg-[#080808] border-white/5 shadow-xl rounded-3xl relative z-10 overflow-hidden transition-opacity ${!estadoCaja?.abierta ? 'opacity-50 pointer-events-none' : ''}`}>
                <CardHeader className="p-8 bg-[#0a0a0a] border-b border-white/5">
                  <CardTitle className="text-white text-2xl tracking-tight flex items-center gap-2">
                    <Receipt className="text-white w-6 h-6" /> Registrar Venta (Cobro Presencial)
                  </CardTitle>
                  <CardDescription className="text-white/50 text-base mt-2">
                    Puedes dividir el pago combinando múltiples métodos (Ej: Efectivo + Yape).
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                  <Form {...formPago}>
                    <form onSubmit={formPago.handleSubmit(handlePago)} className="space-y-6">
                      <FormField
                        control={formPago.control}
                        name="ruc"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-mono uppercase tracking-wider text-white/50 flex justify-between">
                              <span>RUC del Trámite</span>
                              {buscando && <span className="text-cyan-400 animate-pulse flex items-center gap-1"><Search className="w-3 h-3"/> Buscando...</span>}
                            </FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Ej. 20123456789" 
                                {...field} 
                                onChange={(e) => field.onChange(e.target.value.replace(/\D/g, '').slice(0, 11))}
                                className="h-14 bg-white/5 border-white/10 text-white focus-visible:ring-1 focus-visible:ring-cyan-500/50 rounded-xl px-4 text-base" 
                              />
                            </FormControl>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />

                      {tramite && (
                        <div className="bg-white/5 p-5 rounded-2xl border border-cyan-500/20 space-y-2">
                          <p className="text-sm text-white/70"><span className="font-semibold text-white">Contribuyente:</span> {tramite.razonSocial}</p>
                          <p className="text-sm text-white/70"><span className="font-semibold text-white">Estado:</span> <span className={tramite.estado === 'PENDIENTE_PAGO' ? 'text-amber-400 font-bold' : 'text-red-400 font-bold'}>{tramite.estado}</span></p>
                          <div className="pt-2 border-t border-white/10 mt-2 flex justify-between items-end">
                            <p className="text-2xl font-bold text-cyan-400">Total a Pagar: S/ {tramite.montoCobrado.toFixed(2)}</p>
                            
                            {/* Sumatorio */}
                            <div className="text-right">
                              <p className="text-sm text-white/50">Monto Distribuido</p>
                              <p className="text-xl font-bold text-emerald-400">
                                S/ {tramite.montoCobrado.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {tramite && tramite.estado === 'PENDIENTE_PAGO' && (
                        <div className="space-y-6 pt-4 border-t border-white/10">
                          
                          <div className="flex gap-4 p-1 bg-white/5 rounded-xl">
                            <button
                              type="button"
                              className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-colors ${modoPago === 'UNICO' ? 'bg-white text-black' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                              onClick={() => setModoPago("UNICO")}
                            >
                              Pago Único
                            </button>
                            <button
                              type="button"
                              className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-colors ${modoPago === 'HIBRIDO' ? 'bg-white text-black' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                              onClick={() => setModoPago("HIBRIDO")}
                            >
                              Pago Híbrido (Dividido)
                            </button>
                          </div>

                          {modoPago === "UNICO" ? (
                            <div className="p-6 bg-[#030303] rounded-2xl border border-white/10 space-y-6">
                              <div>
                                <label className="text-xs text-white/50 mb-3 block uppercase tracking-wider font-mono">Seleccione Método de Pago</label>
                                <div className="grid grid-cols-2 gap-3">
                                  {["EFECTIVO", "YAPE", "TARJETA", "TRANSFERENCIA"].map(met => (
                                    <label key={met} className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer transition-colors ${metodoUnico === met ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400' : 'border-white/10 text-white/60 hover:border-white/30 hover:bg-white/5'}`}>
                                      <input type="radio" className="hidden" checked={metodoUnico === met} onChange={() => setMetodoUnico(met as any)} />
                                      {met === 'EFECTIVO' ? <Banknote className="w-4 h-4"/> : met === 'YAPE' ? <Smartphone className="w-4 h-4"/> : met === 'TARJETA' ? <CreditCard className="w-4 h-4"/> : <DollarSign className="w-4 h-4"/>}
                                      <span className="text-sm font-medium">{met === 'YAPE' ? 'Yape/Plin' : met === 'TARJETA' ? 'Tarjeta/POS' : met === 'TRANSFERENCIA' ? 'Transferencia' : 'Efectivo'}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>

                              {metodoUnico === "EFECTIVO" ? (
                                <div>
                                  <label className="text-xs text-cyan-400 mb-2 block font-mono uppercase tracking-wider">Monto Entregado por Cliente (S/)</label>
                                  <Input 
                                    type="number" step="0.01" 
                                    value={montoEntregadoEfectivo} 
                                    onChange={e => setMontoEntregadoEfectivo(e.target.value)} 
                                    className="h-14 bg-cyan-500/5 border-cyan-500/30 text-white text-lg rounded-xl focus-visible:ring-cyan-500/50"
                                    placeholder="0.00"
                                  />
                                  {parseFloat(montoEntregadoEfectivo) >= tramite.montoCobrado && (
                                    <p className="text-sm text-emerald-400 mt-2 font-semibold">
                                      Vuelto: S/ {(parseFloat(montoEntregadoEfectivo) - tramite.montoCobrado).toFixed(2)}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <div>
                                  <label className="text-xs text-amber-400 mb-2 block font-mono uppercase tracking-wider">Código de Referencia / Nro Operación</label>
                                  <Input 
                                    type="text" 
                                    value={referenciaUnico} 
                                    onChange={e => setReferenciaUnico(e.target.value)} 
                                    className="h-14 bg-amber-500/5 border-amber-500/30 text-white rounded-xl focus-visible:ring-amber-500/50"
                                    placeholder="Ej. 123456789"
                                  />
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="p-6 bg-[#030303] rounded-2xl border border-white/10 space-y-6">
                              <div>
                                <label className="text-xs text-white/50 mb-3 block uppercase tracking-wider font-mono">Seleccione Combinación</label>
                                <div className="grid grid-cols-2 gap-3">
                                  <label className={`flex items-center justify-center gap-2 p-4 border rounded-xl cursor-pointer transition-colors ${metodoHibrido === 'EFECTIVO_YAPE' ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400' : 'border-white/10 text-white/60 hover:border-white/30 hover:bg-white/5'}`}>
                                    <input type="radio" className="hidden" checked={metodoHibrido === 'EFECTIVO_YAPE'} onChange={() => setMetodoHibrido('EFECTIVO_YAPE')} />
                                    <span className="text-sm font-semibold">Efectivo + Yape</span>
                                  </label>
                                  <label className={`flex items-center justify-center gap-2 p-4 border rounded-xl cursor-pointer transition-colors ${metodoHibrido === 'EFECTIVO_TARJETA' ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400' : 'border-white/10 text-white/60 hover:border-white/30 hover:bg-white/5'}`}>
                                    <input type="radio" className="hidden" checked={metodoHibrido === 'EFECTIVO_TARJETA'} onChange={() => setMetodoHibrido('EFECTIVO_TARJETA')} />
                                    <span className="text-sm font-semibold">Efectivo + Tarjeta</span>
                                  </label>
                                </div>
                              </div>

                              <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                  <div>
                                    <label className="text-xs text-white/50 mb-2 block font-mono uppercase tracking-wider">Parte en Efectivo (S/)</label>
                                    <Input 
                                      type="number" step="0.01" 
                                      value={montoEfectivo} 
                                      onChange={e => setMontoEfectivo(e.target.value)} 
                                      className="h-12 bg-white/5 border-white/10 text-white rounded-xl focus-visible:ring-cyan-500/50"
                                      placeholder="0.00"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs text-cyan-400 mb-2 block font-mono uppercase tracking-wider">Monto Entregado Cliente (S/)</label>
                                    <Input 
                                      type="number" step="0.01" 
                                      value={montoEntregadoEfectivo} 
                                      onChange={e => setMontoEntregadoEfectivo(e.target.value)} 
                                      className="h-12 bg-cyan-500/5 border-cyan-500/30 text-white rounded-xl focus-visible:ring-cyan-500/50"
                                      placeholder="0.00"
                                    />
                                    {parseFloat(montoEfectivo) > 0 && parseFloat(montoEntregadoEfectivo) >= parseFloat(montoEfectivo) && (
                                      <p className="text-sm text-emerald-400 mt-2 font-semibold">
                                        Vuelto: S/ {(parseFloat(montoEntregadoEfectivo) - parseFloat(montoEfectivo)).toFixed(2)}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  <div>
                                    <label className="text-xs text-white/50 mb-2 block font-mono uppercase tracking-wider">Parte en {metodoHibrido === 'EFECTIVO_YAPE' ? 'Yape' : 'Tarjeta'} (S/)</label>
                                    <div className="h-12 bg-white/5 border border-white/10 text-white/70 rounded-xl px-4 flex items-center cursor-not-allowed">
                                      {parseFloat(montoEfectivo) > 0 && parseFloat(montoEfectivo) < tramite.montoCobrado 
                                        ? (tramite.montoCobrado - parseFloat(montoEfectivo)).toFixed(2) 
                                        : "0.00"}
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-xs text-amber-400 mb-2 block font-mono uppercase tracking-wider">Ref / Operación {metodoHibrido === 'EFECTIVO_YAPE' ? 'Yape' : 'Tarjeta'}</label>
                                    <Input 
                                      type="text" 
                                      value={referenciaHibrido} 
                                      onChange={e => setReferenciaHibrido(e.target.value)} 
                                      className="h-12 bg-amber-500/5 border-amber-500/30 text-white rounded-xl focus-visible:ring-amber-500/50"
                                      placeholder="Ej. 123456789"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <Button 
                        type="submit" 
                        disabled={!tramite || tramite.estado !== 'PENDIENTE_PAGO'}
                        className="w-full h-14 bg-white hover:bg-white/90 disabled:bg-white/20 text-black disabled:text-white/40 font-bold text-lg rounded-xl transition-all shadow-[0_0_15px_rgba(255,255,255,0.3)] mt-6"
                      >
                        Confirmar Venta y Procesar
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "validar" && (
            <ValidarPagosCajero />
          )}

          {activeTab === "alertas" && (
            <Card className="bg-[#080808] border-white/5 shadow-xl rounded-3xl relative z-10 overflow-hidden">
              <CardHeader className="p-8 bg-[#0a0a0a] border-b border-white/5 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-white text-2xl tracking-tight flex items-center gap-2">
                    <Bell className="text-white w-6 h-6" /> Alertas de Licencias
                  </CardTitle>
                  <CardDescription className="text-white/50 text-base mt-2">
                    Licencias vencidas y próximas a vencer. Contacte a los ciudadanos.
                  </CardDescription>
                </div>
                <Button onClick={fetchAlertas} variant="outline" className="border-white/10 text-white hover:bg-white/5 h-10 px-4 rounded-xl">
                  Actualizar
                </Button>
              </CardHeader>
              <CardContent className="p-8">
                  {cargandoAlertas ? (
                    <div className="flex justify-center py-10 text-cyan-400 animate-pulse">Cargando alertas...</div>
                  ) : alertas.length === 0 && alertasPagos.length === 0 ? (
                    <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/5">
                      <Bell className="w-12 h-12 text-white/20 mx-auto mb-4" />
                      <h3 className="text-xl font-medium text-white mb-2">Sin Alertas Activas</h3>
                      <p className="text-white/50">Todas las licencias se encuentran vigentes y no hay pagos pendientes de validar.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {alertasPagos.map((pago, idx) => (
                        <div key={`pago-${idx}`} className="p-5 rounded-2xl border flex items-center justify-between bg-blue-500/10 border-blue-500/30">
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm bg-blue-500/20 text-blue-400">
                                PAGO PENDIENTE
                              </span>
                              <span className="text-white font-semibold">{pago.razonSocial}</span>
                            </div>
                            <p className="text-sm text-white/60">
                              RUC: <span className="text-white">{pago.ruc}</span> | Monto: <span className="text-white">S/ {pago.monto}</span>
                            </p>
                            <p className="text-xs text-white/40 mt-1">
                              Fecha de Pago: {new Date(pago.fechaPago).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-3">
                            <Button 
                              onClick={() => setActiveTab("validar")}
                              variant="outline" 
                              size="sm"
                              className="border-white/10 hover:bg-blue-500/20 text-blue-300 h-8 px-3 rounded-lg"
                            >
                              <span className="flex items-center gap-2"><FileCheck className="w-3 h-3" /> Ir a Validar</span>
                            </Button>
                          </div>
                        </div>
                      ))}
                      {alertas.map((alerta, idx) => (
                      <div key={idx} className={`p-5 rounded-2xl border flex items-center justify-between ${alerta.estado === 'VENCIDA' ? 'bg-red-500/10 border-red-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <span className={`text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm ${alerta.estado === 'VENCIDA' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                              {alerta.estado === 'VENCIDA' ? 'VENCIDA' : 'VENCE PRONTO'}
                            </span>
                            <span className="text-white font-semibold">{alerta.razonSocial}</span>
                          </div>
                          <p className="text-sm text-white/60">
                            Licencia Nro: <span className="text-white">{alerta.numeroLicencia}</span> | RUC: <span className="text-white">{alerta.ruc}</span>
                          </p>
                          <p className="text-xs text-white/40 mt-1">
                            {alerta.estado === 'VENCIDA' ? 'Venció el:' : 'Vence el:'} {new Date(alerta.fechaVencimiento).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-3">
                          <AlertTriangle className={`w-8 h-8 ${alerta.estado === 'VENCIDA' ? 'text-red-500/50' : 'text-amber-500/50'}`} />
                          <Button 
                            onClick={() => handleEnviarRecordatorio(alerta.ruc)}
                            disabled={enviandoRecordatorio === alerta.ruc}
                            variant="outline" 
                            size="sm"
                            className={`border-white/10 ${alerta.estado === 'VENCIDA' ? 'hover:bg-red-500/20 text-red-300' : 'hover:bg-amber-500/20 text-amber-300'} h-8 px-3 rounded-lg`}
                          >
                            {enviandoRecordatorio === alerta.ruc ? (
                              <span className="flex items-center gap-2"><Send className="w-3 h-3 animate-pulse" /> Enviando...</span>
                            ) : (
                              <span className="flex items-center gap-2"><Send className="w-3 h-3" /> Mandar Recordatorio</span>
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

        </div>
      </main>
    </div>
  );
}
