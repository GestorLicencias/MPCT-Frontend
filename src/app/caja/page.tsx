"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import api from "@/lib/axios";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Briefcase, CreditCard, DollarSign, LogOut, Receipt, ExternalLink, Search, Bell, AlertTriangle, Send } from "lucide-react";

interface CajaEstado {
  cajaId: string | null;
  abierta: boolean;
  montoInicial: number;
  ingresos: number;
  egresos: number;
  montoActual: number;
}

const abrirCajaSchema = z.object({
  montoInicial: z.coerce.number().min(100, { message: "El fondo inicial debe ser al menos S/ 100.00" })
});

const pagoSchema = z.object({
  ruc: z.string().length(11, { message: "El RUC debe tener 11 dígitos" }),
  metodoPago: z.enum(["EFECTIVO", "TARJETA"], { required_error: "Seleccione un método de pago" })
});

export default function CajaPage() {
  const router = useRouter();
  const [estadoCaja, setEstadoCaja] = useState<CajaEstado | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("estado");

  const [tramite, setTramite] = useState<any>(null);
  const [buscando, setBuscando] = useState(false);
  const [montoEntregado, setMontoEntregado] = useState<string>("");
  const [montoFisico, setMontoFisico] = useState<string>("");

  const [alertas, setAlertas] = useState<any[]>([]);
  const [cargandoAlertas, setCargandoAlertas] = useState(false);
  const [enviandoRecordatorio, setEnviandoRecordatorio] = useState<string | null>(null);

  const formAbrir = useForm<z.infer<typeof abrirCajaSchema>>({
    resolver: zodResolver(abrirCajaSchema),
    defaultValues: { montoInicial: 0 }
  });

  const formPago = useForm<z.infer<typeof pagoSchema>>({
    resolver: zodResolver(pagoSchema),
    defaultValues: { ruc: "", metodoPago: "EFECTIVO" }
  });

  const rucValue = formPago.watch("ruc");
  const metodoPago = formPago.watch("metodoPago");

  useEffect(() => {
    fetchEstadoCaja();
  }, []);

  useEffect(() => {
    if (rucValue?.length === 11) {
      buscarTramite(rucValue);
    } else {
      setTramite(null);
      setMontoEntregado("");
    }
  }, [rucValue]);

  const buscarTramite = async (ruc: string) => {
    setBuscando(true);
    try {
      const res = await api.get(`/tramites/${ruc}`);
      setTramite(res.data);
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
      const res = await api.get("/caja/licencias-alertas");
      setAlertas(res.data);
    } catch (error) {
      toast.error("Error al cargar alertas de licencias");
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
    if (values.metodoPago === 'EFECTIVO' && parseFloat(montoEntregado || "0") < tramite.montoCobrado) {
      toast.error("El monto entregado por el cliente es insuficiente");
      return;
    }

    try {
      await api.post("/caja/pago-presencial", values);
      toast.success("Pago registrado correctamente");
      formPago.reset();
      setTramite(null);
      setMontoEntregado("");
      fetchEstadoCaja();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al registrar el pago");
    }
  };

  const handleLogout = () => {
    if (estadoCaja?.abierta) {
      toast.error("No puedes cerrar sesión. Primero debes hacer el arqueo y cerrar la caja.");
      return;
    }
    localStorage.removeItem("token");
    router.push("/auth/login");
  };

  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-white/50">Cargando panel...</div>;
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
                        <p className="text-xs font-mono uppercase tracking-wider text-white/50">Ventas del Día</p>
                        <p className="text-xl font-semibold text-white mt-2">S/ {estadoCaja.ingresos.toFixed(2)}</p>
                      </div>
                      <div className="bg-[#030303] p-6 rounded-2xl border border-cyan-500/30 relative overflow-hidden col-span-2">
                        <div className="absolute inset-0 bg-cyan-500/5"></div>
                        <p className="text-xs font-mono uppercase tracking-wider text-cyan-400 relative z-10">Monto Esperado en Caja</p>
                        <p className="text-3xl font-bold text-cyan-300 mt-2 relative z-10">S/ {estadoCaja.montoActual.toFixed(2)}</p>
                        <p className="text-xs text-cyan-500/60 mt-1 relative z-10">Fondo inicial + Ventas. (Los vueltos no restan ganancia)</p>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-white/10 space-y-5">
                      <div>
                        <h4 className="text-lg font-medium text-white flex items-center gap-2 mb-1"><Briefcase className="w-5 h-5"/> Arqueo y Cierre</h4>
                        <p className="text-sm text-white/50">Ingresa el dinero físico que acabas de contar para verificar si la caja cuadra.</p>
                      </div>
                      
                      <div className="flex gap-4 items-end">
                        <div className="flex-1">
                          <label className="text-xs font-mono uppercase tracking-wider text-white/50 mb-2 block">Dinero Físico Contado (S/)</label>
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
                  <CardTitle className="text-white text-2xl tracking-tight flex items-center gap-2">
                    <Receipt className="text-white w-6 h-6" /> Registrar Venta (Cobro Presencial)
                  </CardTitle>
                  <CardDescription className="text-white/50 text-base mt-2">
                    Cobra trámites en ventanilla y calcula el vuelto automáticamente.
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
                          <div className="pt-2 border-t border-white/10 mt-2">
                            <p className="text-2xl font-bold text-cyan-400">Total a Pagar: S/ {tramite.montoCobrado.toFixed(2)}</p>
                          </div>
                        </div>
                      )}
                      
                      <FormField
                        control={formPago.control}
                        name="metodoPago"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel className="text-xs font-mono uppercase tracking-wider text-white/50">Método de Pago</FormLabel>
                            <FormControl>
                              <div className="grid grid-cols-2 gap-4">
                                <label className={`flex flex-col items-center justify-center p-6 rounded-2xl border cursor-pointer transition-all ${field.value === 'EFECTIVO' ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400' : 'border-white/5 bg-[#030303] text-white/50 hover:border-white/10'}`}>
                                  <input type="radio" value="EFECTIVO" checked={field.value === 'EFECTIVO'} onChange={field.onChange} className="sr-only" />
                                  <DollarSign className="mb-3 h-8 w-8" />
                                  <span className="font-semibold tracking-wide">EFECTIVO</span>
                                </label>
                                <label className={`flex flex-col items-center justify-center p-6 rounded-2xl border cursor-pointer transition-all ${field.value === 'TARJETA' ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400' : 'border-white/5 bg-[#030303] text-white/50 hover:border-white/10'}`}>
                                  <input type="radio" value="TARJETA" checked={field.value === 'TARJETA'} onChange={field.onChange} className="sr-only" />
                                  <CreditCard className="mb-3 h-8 w-8" />
                                  <span className="font-semibold tracking-wide">TARJETA / POS</span>
                                </label>
                              </div>
                            </FormControl>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />

                      {tramite && metodoPago === "EFECTIVO" && (
                        <div className="space-y-5 pt-4 border-t border-white/10">
                           <div>
                             <label className="text-xs font-mono uppercase tracking-wider text-cyan-400 mb-2 block">Monto Entregado por el Cliente (S/)</label>
                             <Input 
                               type="number" step="0.01" 
                               value={montoEntregado} 
                               onChange={e => setMontoEntregado(e.target.value)} 
                               className="h-14 bg-cyan-500/5 border-cyan-500/30 text-white text-xl rounded-xl focus-visible:ring-cyan-500/50 font-semibold"
                               placeholder="0.00"
                             />
                           </div>
                           
                           {parseFloat(montoEntregado || "0") >= tramite.montoCobrado && (
                             <div className="bg-emerald-500/10 border border-emerald-500/30 p-5 rounded-2xl flex justify-between items-center">
                               <p className="text-base text-emerald-500 font-medium">Vuelto a entregar:</p>
                               <p className="text-4xl font-black text-emerald-400">
                                 S/ {(parseFloat(montoEntregado) - tramite.montoCobrado).toFixed(2)}
                               </p>
                             </div>
                           )}
                           
                           {parseFloat(montoEntregado || "0") > 0 && parseFloat(montoEntregado) < tramite.montoCobrado && (
                             <p className="text-sm text-red-400">El monto entregado es menor al costo del trámite.</p>
                           )}
                        </div>
                      )}

                      <Button 
                        type="submit" 
                        disabled={tramite && metodoPago === "EFECTIVO" && parseFloat(montoEntregado || "0") < tramite.montoCobrado}
                        className="w-full h-14 bg-white hover:bg-white/90 disabled:bg-white/20 text-black disabled:text-white/40 font-bold text-lg rounded-xl transition-all shadow-[0_0_15px_rgba(255,255,255,0.3)] mt-6"
                      >
                        Confirmar Venta y Procesar
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              <Card className={`bg-[#080808] border-white/5 shadow-xl rounded-3xl relative z-10 overflow-hidden transition-opacity ${!estadoCaja?.abierta ? 'opacity-50 pointer-events-none' : ''}`}>
                <CardHeader className="p-8 bg-[#0a0a0a] border-b border-white/5">
                  <CardTitle className="text-white text-xl tracking-tight flex items-center gap-2">
                    Iniciar Trámite Rápido
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <p className="text-sm text-white/50 mb-6">Abre el formulario público para registrar un nuevo trámite en nombre del ciudadano que está en ventanilla.</p>
                  <Button onClick={() => window.open('/solicitar', '_blank')} variant="outline" className="w-full h-14 border-white/10 text-white hover:bg-white/5 hover:text-white rounded-xl">
                    Ir a Formulario de Solicitud <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>
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
                ) : alertas.length === 0 ? (
                  <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/5">
                    <Bell className="w-12 h-12 text-white/20 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-white mb-2">Sin Alertas Activas</h3>
                    <p className="text-white/50">Todas las licencias se encuentran vigentes y sin riesgo de expiración cercano.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
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
