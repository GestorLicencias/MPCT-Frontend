"use client";

import { useAuth } from "@/context/AuthContext";
import { Users, FileText, CheckCircle, Clock, Eye } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import api from "@/lib/axios";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

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

export default function AdminDashboardPage() {
  const { user } = useAuth();

  const stats = [
    { title: "Trámites Totales", value: "156", icon: FileText, color: "from-blue-500 to-indigo-500" },
    { title: "Inspecciones Pendientes", value: "24", icon: Clock, color: "from-amber-500 to-orange-500" },
    { title: "Aprobados", value: "89", icon: CheckCircle, color: "from-emerald-500 to-teal-500" },
    { title: "Usuarios Activos", value: "45", icon: Users, color: "from-purple-500 to-pink-500" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">Panel de Administrador</h1>
        <p className="text-slate-400 mt-2">Visión general del sistema de trámites y licencias.</p>
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

      <ValidacionPagosSection />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#0a0f1c] border border-white/5 rounded-3xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Actividad Reciente</h2>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-[#020617] border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                    <FileText className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Trámite #00{i}-2026</p>
                    <p className="text-xs text-slate-400">Hace {i * 2} horas</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Completado
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#0a0f1c] border border-white/5 rounded-3xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Accesos Directos</h2>
          <div className="space-y-3">
            <Link href="/dashboard/admin/precios" className="block w-full text-left px-5 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg shadow-blue-500/20">
              Gestionar Precios de Trámites
            </Link>
            <Link href="/dashboard/admin/usuarios" className="block w-full text-left px-5 py-4 rounded-2xl bg-[#020617] border border-white/5 text-slate-300 font-medium hover:bg-white/5 transition-all">
              Crear Usuarios Especiales
            </Link>
            <button className="w-full text-left px-5 py-4 rounded-2xl bg-[#020617] border border-white/5 text-slate-300 font-medium hover:bg-white/5 transition-all">
              Configurar Accesos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
