"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings, LogOut, Save, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function AdminPage() {
  const router = useRouter();
  const [configuraciones, setConfiguraciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  
  // Register Inspector State
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistering(true);
    try {
      const res = await api.post("/admin/users", { email: registerEmail, password: registerPassword });
      toast.success(res.data.message || "Inspector registrado con éxito.");
      setRegisterEmail("");
      setRegisterPassword("");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al registrar el inspector.");
    } finally {
      setIsRegistering(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/auth/login");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto relative z-10 pb-10">
      <div className="flex justify-between items-center bg-slate-900/50 backdrop-blur-md p-6 rounded-xl shadow-lg border border-slate-800">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="text-cyan-400" /> Panel de Administración
        </h2>
        <Button variant="outline" onClick={handleLogout} className="text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white">
          <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
        </Button>
      </div>

      <Card className="bg-slate-900/40 backdrop-blur-md border-slate-800 shadow-xl">
        <CardHeader>
          <CardTitle className="text-white">Configuraciones del Sistema</CardTitle>
          <CardDescription className="text-slate-400">Modifique las tasas y precios base de los trámites. Los cambios afectarán a las nuevas solicitudes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="text-center text-slate-500 py-10">Cargando configuraciones...</div>
          ) : configuraciones.length === 0 ? (
            <div className="text-center text-slate-500 py-10">No hay configuraciones disponibles.</div>
          ) : (
            <div className="grid gap-6">
              {configuraciones.map((conf) => (
                <div key={conf.clave} className="flex flex-col md:flex-row gap-4 items-end bg-slate-950/50 p-6 rounded-lg border border-slate-800 hover:border-cyan-800/50 transition-colors">
                  <div className="flex-1 space-y-2 w-full">
                    <label className="text-sm font-semibold text-slate-300">{conf.clave.replace("_", " ")}</label>
                    <p className="text-xs text-slate-500">{conf.descripcion}</p>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-slate-500">S/</span>
                      <Input 
                        key={`input-${conf.clave}-${conf.valor}`}
                        type="number" 
                        step="0.01"
                        className="pl-8 bg-slate-900 border-slate-700 h-12 text-lg text-white focus-visible:ring-cyan-500"
                        defaultValue={conf.valor}
                        id={`input-${conf.clave}`}
                      />
                    </div>
                  </div>
                  <Button 
                    className="h-12 px-6 w-full md:w-auto bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_10px_rgba(8,145,178,0.3)] transition-all"
                    disabled={saving === conf.clave}
                    onClick={() => {
                      const input = document.getElementById(`input-${conf.clave}`) as HTMLInputElement;
                      handleUpdate(conf.clave, input.value);
                    }}
                  >
                    {saving === conf.clave ? "Guardando..." : <><Save className="mr-2 h-4 w-4" /> Guardar</>}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-slate-900/40 backdrop-blur-md border-slate-800 shadow-xl mt-6">
        <CardHeader>
          <CardTitle className="text-white">Gestión de Inspectores</CardTitle>
          <CardDescription className="text-slate-400">Crea credenciales de acceso para nuevos inspectores municipales.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-300">Correo Electrónico del Inspector</label>
                <Input 
                  type="email" 
                  required 
                  value={registerEmail} 
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  className="bg-slate-950/50 border-slate-700 text-white focus-visible:ring-cyan-500"
                  placeholder="ej. carlos@mpct.gob.pe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-300">Contraseña Segura</label>
                <Input 
                  type="password" 
                  required 
                  value={registerPassword} 
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  className="bg-slate-950/50 border-slate-700 text-white focus-visible:ring-cyan-500"
                />
              </div>
            </div>
            <Button type="submit" disabled={isRegistering} className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)] w-full md:w-auto">
              {isRegistering ? "Registrando..." : "Crear Cuenta de Inspector"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <ValidacionPagosSection />
    </div>
  );
}

function ValidacionPagosSection() {
  const [pagos, setPagos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVoucher, setSelectedVoucher] = useState<string | null>(null);

  useEffect(() => {
    fetchPagos();
  }, []);

  const fetchPagos = async () => {
    try {
      const res = await api.get("/admin/pagos/pendientes");
      setPagos(res.data);
    } catch (error) {
      console.error("Error fetching pagos", error);
    } finally {
      setLoading(false);
    }
  };

  const validarPago = async (id: string, aprobado: boolean) => {
    try {
      await api.post(`/admin/pagos/${id}/validar?aprobado=${aprobado}`);
      toast.success(`Pago ${aprobado ? 'Aprobado' : 'Rechazado'} correctamente.`);
      fetchPagos();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al procesar el pago.");
    }
  };

  const handleViewVoucher = async (id: string) => {
    try {
      const response = await api.get(`/admin/pagos/${id}/voucher`, { responseType: "blob" });
      const url = URL.createObjectURL(response.data);
      setSelectedVoucher(url);
    } catch (error) {
      console.error("Error fetching voucher image", error);
      toast.error("No se pudo cargar la imagen del voucher.");
    }
  };

  return (
    <>
      <Card className="bg-slate-900/40 backdrop-blur-md border-slate-800 shadow-xl mt-6">
        <CardHeader>
          <CardTitle className="text-white">Validación de Pagos (Banco de la Nación)</CardTitle>
          <CardDescription className="text-slate-400">Apruebe o rechace los vouchers de pago subidos por los solicitantes.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center text-slate-500 py-10">Cargando pagos pendientes...</div>
          ) : pagos.length === 0 ? (
            <div className="text-center text-slate-500 py-10">No hay pagos pendientes de validación.</div>
          ) : (
            <div className="space-y-4">
              {pagos.map((pago) => (
                <div key={pago.id} className="bg-slate-950/50 p-4 rounded-lg border border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 hover:border-cyan-800/50 transition-colors">
                  <div className="flex-1 w-full space-y-1">
                    <h4 className="font-semibold text-slate-200">Trámite RUC: {pago.rucTramite}</h4>
                    <p className="text-sm text-slate-400">{pago.razonSocial}</p>
                    <p className="text-xs text-slate-500 font-mono">Monto a verificar: S/ {pago.monto.toFixed(2)}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <Button 
                      variant="outline" 
                      className="bg-slate-900/50 border-slate-700 text-cyan-400 hover:bg-slate-800 hover:text-cyan-300"
                      onClick={() => handleViewVoucher(pago.id)}
                    >
                      <Eye className="mr-2 h-4 w-4" /> Ver Voucher
                    </Button>
                    <Button 
                      variant="outline" 
                      className="bg-rose-500/10 border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white"
                      onClick={() => validarPago(pago.id, false)}
                    >
                      Rechazar
                    </Button>
                    <Button 
                      className="bg-emerald-600 hover:bg-emerald-500 text-white"
                      onClick={() => validarPago(pago.id, true)}
                    >
                      Aprobar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedVoucher} onOpenChange={(open) => !open && setSelectedVoucher(null)}>
        <DialogContent className="max-w-3xl bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>Visualización del Voucher</DialogTitle>
            <DialogDescription className="text-slate-400">Verifique los datos de la transferencia antes de aprobar o rechazar.</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center bg-slate-950 rounded-xl overflow-hidden min-h-[300px] border border-slate-800">
            {selectedVoucher && (
              <img src={selectedVoucher} alt="Voucher de pago" className="max-h-[70vh] object-contain w-full" />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}


