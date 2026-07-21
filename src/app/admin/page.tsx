"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings, UserPlus, BarChart3, Key, LogOut, AlertTriangle, CheckCircle2 } from "lucide-react";
import { UsuariosAdminSection } from "@/components/UsuariosAdminSection";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

export default function AdminPage() {
  const router = useRouter();
  const [configuraciones, setConfiguraciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState("config");
  useEffect(() => {
    fetchConfiguraciones();
  }, []);

  const fetchConfiguraciones = async () => {
    try {
      const res = await api.get("/admin/configuraciones");
      setConfiguraciones(res.data);
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error("Sesión expirada o sin permisos.");
        router.push("/auth/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (clave: string, nuevoValor: string) => {
    setSaving(clave);
    try {
      await api.put(`/admin/configuraciones/${clave}`, null, { params: { valor: parseFloat(nuevoValor) } });
      toast.success(`Configuración ${clave} actualizada correctamente.`);
      fetchConfiguraciones();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al actualizar configuración.");
    } finally {
      setSaving(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/auth/login");
  };

  return (
    <div className="flex h-screen bg-black overflow-hidden relative z-10 w-full max-w-[100vw]">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/5 blur-[120px] rounded-full pointer-events-none"></div>
      
      {/* Sidebar */}
      <aside className="w-72 bg-[#030303] border-r border-white/5 flex flex-col z-20 shrink-0">
        <div className="p-8 border-b border-white/5">
          <h2 className="text-xl font-bold text-white flex items-center gap-3 tracking-tight">
            <Settings className="text-white w-6 h-6" /> Administrador
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 mt-4">
          <button 
            onClick={() => setActiveTab("config")}
            className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl transition-all font-medium ${activeTab === "config" ? "bg-white text-black" : "text-white/60 hover:bg-white/5 hover:text-white"}`}
          >
            <Settings className="w-5 h-5" /> Configuraciones
          </button>
          <button 
            onClick={() => setActiveTab("usuarios")}
            className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl transition-all font-medium ${activeTab === "usuarios" ? "bg-white text-black" : "text-white/60 hover:bg-white/5 hover:text-white"}`}
          >
            <UserPlus className="w-5 h-5" /> Usuarios
          </button>

          <button 
            onClick={() => setActiveTab("cierres")}
            className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl transition-all font-medium ${activeTab === "cierres" ? "bg-white text-black" : "text-white/60 hover:bg-white/5 hover:text-white"}`}
          >
            <BarChart3 className="w-5 h-5" /> Cierres de Caja
          </button>
          <button 
            onClick={() => setActiveTab("password")}
            className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl transition-all font-medium ${activeTab === "password" ? "bg-white text-black" : "text-white/60 hover:bg-white/5 hover:text-white"}`}
          >
            <Key className="w-5 h-5" /> Contraseña
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
          {activeTab === "config" && (
            <Card className="bg-[#080808] border-white/5 shadow-xl rounded-3xl relative z-10 overflow-hidden">
              <CardHeader className="p-8 bg-[#0a0a0a] border-b border-white/5">
                <CardTitle className="text-white text-2xl tracking-tight">Configuraciones del Sistema</CardTitle>
                <CardDescription className="text-white/50 text-base mt-2">Modifique las tasas y precios base de los trámites. Los cambios afectarán a las nuevas solicitudes.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-8">
                {loading ? (
                  <div className="text-center text-white/40 py-10">Cargando configuraciones...</div>
                ) : configuraciones.length === 0 ? (
                  <div className="text-center text-white/40 py-10">No hay configuraciones disponibles.</div>
                ) : (
                  <div className="grid gap-6">
                    {configuraciones.map((conf) => (
                      <div key={conf.clave} className="flex flex-col md:flex-row gap-6 items-end bg-[#030303] p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                        <div className="flex-1 space-y-3 w-full">
                          <label className="text-xs font-mono uppercase tracking-wider text-white/50">{conf.clave.replace("_", " ")}</label>
                          <p className="text-sm text-white/40 leading-relaxed">{conf.descripcion}</p>
                          <div className="relative">
                            <span className="absolute left-4 top-3.5 text-white/40">S/</span>
                            <Input 
                              key={`input-${conf.clave}-${conf.valor}`}
                              type="number" 
                              step="0.01"
                              className="pl-10 bg-white/5 border-white/10 h-14 text-lg text-white rounded-xl focus-visible:ring-1 focus-visible:ring-white/20"
                              defaultValue={conf.valor}
                              id={`input-${conf.clave}`}
                            />
                          </div>
                        </div>
                        <Button 
                          className="h-14 px-8 w-full md:w-auto bg-white text-black font-semibold hover:bg-white/90 rounded-xl transition-all"
                          disabled={saving === conf.clave}
                          onClick={() => {
                            const input = document.getElementById(`input-${conf.clave}`) as HTMLInputElement;
                            handleUpdate(conf.clave, input.value);
                          }}
                        >
                          {saving === conf.clave ? "Guardando..." : <><LogOut className="mr-2 h-5 w-5" /> Guardar Cambios</>}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "usuarios" && (
            <div className="relative z-10">
              <UsuariosAdminSection />
            </div>
          )}

          {activeTab === "cierres" && (
            <div className="relative z-10">
              <ReporteCierresSection />
            </div>
          )}

          {activeTab === "password" && (
            <div className="relative z-10">
              <CambiarContrasenaSection />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function CambiarContrasenaSection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas nuevas no coinciden.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setLoading(true);
    try {
      await api.put("/admin/change-password", {
        currentPassword,
        newPassword
      });
      toast.success("Contraseña actualizada exitosamente.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al cambiar la contraseña.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-[#080808] border-white/5 shadow-xl rounded-3xl relative overflow-hidden">
      <CardHeader className="p-8 bg-[#0a0a0a] border-b border-white/5">
        <CardTitle className="text-white text-2xl tracking-tight flex items-center gap-2">
          <Key className="text-white w-6 h-6" /> Cambiar Contraseña
        </CardTitle>
        <CardDescription className="text-white/50 text-base mt-2">
          Actualiza tu contraseña de acceso al panel de administración.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-wider text-white/50">Contraseña Actual</label>
            <Input 
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="bg-white/5 border-white/10 h-14 text-white rounded-xl focus-visible:ring-1 focus-visible:ring-white/20"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-wider text-white/50">Nueva Contraseña</label>
            <Input 
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="bg-white/5 border-white/10 h-14 text-white rounded-xl focus-visible:ring-1 focus-visible:ring-white/20"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-wider text-white/50">Confirmar Nueva Contraseña</label>
            <Input 
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-white/5 border-white/10 h-14 text-white rounded-xl focus-visible:ring-1 focus-visible:ring-white/20"
              required
            />
          </div>
          <Button 
            type="submit" 
            disabled={loading}
            className="w-full h-14 bg-white text-black font-semibold hover:bg-white/90 rounded-xl transition-all"
          >
            {loading ? "Actualizando..." : "Actualizar Contraseña"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}


function ReporteCierresSection() {
  const [cierres, setCierres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCierres();
  }, []);

  const fetchCierres = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/caja/cierres");
      setCierres(res.data);
    } catch (error) {
      toast.error("Error al obtener el reporte de cierres de caja");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-[#080808] border-white/5 shadow-xl rounded-3xl relative overflow-hidden">
      <CardHeader className="p-8 bg-[#0a0a0a] border-b border-white/5 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-white text-2xl tracking-tight flex items-center gap-2">
            Reporte de Cierres de Caja
          </CardTitle>
          <CardDescription className="text-white/50 text-base mt-2">
            Auditoría de los cierres realizados por los cajeros y detección de descuadres (sobrantes/faltantes).
          </CardDescription>
        </div>
        <Button onClick={fetchCierres} variant="outline" className="border-white/10 text-white hover:bg-white/5 h-10 px-4 rounded-xl">
          Actualizar Reporte
        </Button>
      </CardHeader>
      <CardContent className="p-8">
        {loading ? (
          <div className="flex justify-center py-10 text-cyan-400 animate-pulse">Cargando reporte...</div>
        ) : cierres.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/5">
            <BarChart3 className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">No hay Cierres Registrados</h3>
            <p className="text-white/50">Aún no se ha cerrado ninguna caja en el sistema.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cierres.map((cierre, idx) => {
              const dif = parseFloat(cierre.diferencia);
              const descuadre = dif !== 0;
              const bgColor = descuadre ? (dif > 0 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-red-500/10 border-red-500/30') : 'bg-emerald-500/10 border-emerald-500/30';
              const iconColor = descuadre ? (dif > 0 ? 'text-amber-500/50' : 'text-red-500/50') : 'text-emerald-500/50';

              return (
                <div key={idx} className={`p-5 rounded-2xl border flex items-center justify-between ${bgColor}`}>
                  <div className="space-y-1 w-full max-w-xl">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm ${descuadre ? (dif > 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400') : 'bg-emerald-500/20 text-emerald-400'}`}>
                        {descuadre ? (dif > 0 ? 'SOBRANTE' : 'FALTANTE') : 'CUADRADA PERFECTO'}
                      </span>
                      <span className="text-white font-semibold">{cierre.usuario}</span>
                    </div>
                    <p className="text-sm text-white/60">
                      Fecha Cierre: <span className="text-white">{new Date(cierre.fechaCierre).toLocaleString()}</span>
                    </p>
                    <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-white/5">
                      <div>
                        <p className="text-xs text-white/40 uppercase">Apertura</p>
                        <p className="text-sm text-white">S/ {parseFloat(cierre.montoInicial).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-white/40 uppercase">Monto Físico</p>
                        <p className="text-sm text-white font-semibold">S/ {parseFloat(cierre.montoDeclarado).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-white/40 uppercase">Sistema (Esperado)</p>
                        <p className="text-sm text-white">S/ {parseFloat(cierre.montoEsperado).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 text-right">
                    {descuadre ? <AlertTriangle className={`w-8 h-8 ${iconColor}`} /> : <CheckCircle2 className={`w-8 h-8 ${iconColor}`} />}
                    {descuadre && (
                      <p className={`text-xl font-bold mt-2 ${dif > 0 ? 'text-amber-400' : 'text-red-400'}`}>
                        {dif > 0 ? '+' : '-'} S/ {Math.abs(dif).toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "La contraseña actual es requerida"),
  newPassword: z.string().min(8, "La nueva contraseña debe tener al menos 8 caracteres"),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

function ChangePasswordSection() {
  const [isChanging, setIsChanging] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema)
  });

  const onSubmit = async (data: ChangePasswordFormValues) => {
    setIsChanging(true);
    try {
      await api.put("/admin/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      toast.success("Contraseña actualizada exitosamente.");
      reset();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al cambiar la contraseña.");
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <Card className="bg-[#080808] border-white/5 shadow-xl rounded-3xl overflow-hidden">
      <CardHeader className="p-8 bg-[#0a0a0a] border-b border-white/5">
        <CardTitle className="text-white text-2xl tracking-tight">Cambiar Contraseña</CardTitle>
        <CardDescription className="text-white/50">Actualiza tu contraseña de administrador (mínimo 8 caracteres).</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-white/50 mb-2">Contraseña Actual</label>
              <Input 
                type="password" 
                {...register("currentPassword")}
                className="bg-black border-white/10 text-white rounded-xl focus-visible:ring-1 focus-visible:ring-white/20"
              />
              {errors.currentPassword && <span className="text-xs text-red-500 mt-1 block">{errors.currentPassword.message}</span>}
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-white/50 mb-2">Nueva Contraseña</label>
              <Input 
                type="password" 
                {...register("newPassword")}
                className="bg-black border-white/10 text-white rounded-xl focus-visible:ring-1 focus-visible:ring-white/20"
              />
              {errors.newPassword && <span className="text-xs text-red-500 mt-1 block">{errors.newPassword.message}</span>}
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-white/50 mb-2">Confirmar Contraseña</label>
              <Input 
                type="password" 
                {...register("confirmPassword")}
                className="bg-black border-white/10 text-white rounded-xl focus-visible:ring-1 focus-visible:ring-white/20"
              />
              {errors.confirmPassword && <span className="text-xs text-red-500 mt-1 block">{errors.confirmPassword.message}</span>}
            </div>
          </div>
          <Button type="submit" disabled={isChanging} className="bg-white text-black font-semibold hover:bg-white/90 rounded-xl w-full md:w-auto">
            {isChanging ? "Actualizando..." : "Cambiar Contraseña"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

