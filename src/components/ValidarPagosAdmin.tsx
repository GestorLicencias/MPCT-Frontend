"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CheckCircle2, XCircle, FileImage, Loader2, RefreshCw, AlertTriangle } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

export function ValidarPagosAdmin() {
  const [pagos, setPagos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVoucher, setSelectedVoucher] = useState<string | null>(null);
  const [voucherUrl, setVoucherUrl] = useState<string | null>(null);
  
  // Modal for Override
  const [overridePagoId, setOverridePagoId] = useState<string | null>(null);
  const [overrideAprobado, setOverrideAprobado] = useState<boolean>(false);
  const [motivoOverride, setMotivoOverride] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPagos();
  }, []);

  const fetchPagos = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/admin/pagos/pendientes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPagos(res.data);
    } catch (error) {
      toast.error("Error al cargar pagos pendientes");
    } finally {
      setLoading(false);
    }
  };

  const openOverrideModal = (pagoId: string, aprobado: boolean) => {
    setOverridePagoId(pagoId);
    setOverrideAprobado(aprobado);
    setMotivoOverride("");
  };

  const handleValidarOverride = async () => {
    if (!motivoOverride.trim()) {
      toast.error("El motivo del override es obligatorio.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      // admin uses /admin/pagos/{id}/validar
      const res = await axios.post(`${API_URL}/admin/pagos/${overridePagoId}/validar?aprobado=${overrideAprobado}&motivoOverride=${encodeURIComponent(motivoOverride)}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(res.data.message || (overrideAprobado ? "Pago forzado (Aprobado)" : "Pago forzado (Rechazado)"));
      setOverridePagoId(null);
      fetchPagos();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al aplicar el override");
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadVoucher = async (pagoId: string) => {
    setSelectedVoucher(pagoId);
    setVoucherUrl(null);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/admin/pagos/${pagoId}/voucher`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const url = URL.createObjectURL(res.data);
      setVoucherUrl(url);
    } catch (error) {
      toast.error("Error al cargar el voucher");
      setSelectedVoucher(null);
    }
  };

  return (
    <Card className="bg-[#080808] border-orange-500/30 shadow-[0_0_30px_rgba(249,115,22,0.05)] rounded-3xl relative z-10 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-600 via-orange-400 to-orange-600"></div>
      <CardHeader className="p-8 bg-orange-950/20 border-b border-orange-500/20 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-orange-50 text-2xl tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-orange-500" /> Override de Pagos (Auditoría)
          </CardTitle>
          <CardDescription className="text-orange-200/60 text-base mt-2">
            <strong>Atención:</strong> Esta bandeja es para aplicar excepciones ("Overrides") a transferencias. 
            Todas las acciones ejecutadas aquí quedarán registradas a su nombre con el motivo especificado.
          </CardDescription>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchPagos} disabled={loading} className="text-orange-200/50 hover:text-orange-200 hover:bg-orange-500/10">
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="p-8">
        {loading && pagos.length === 0 ? (
          <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-orange-500/50" /></div>
        ) : pagos.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-orange-500/20 rounded-2xl bg-orange-950/10">
            <p className="text-orange-200/50 font-mono text-sm">No hay pagos pendientes de override.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pagos.map(pago => (
              <div key={pago.pagoId} className="flex flex-col xl:flex-row items-start xl:items-center justify-between p-5 bg-black border border-orange-500/20 rounded-2xl gap-4 hover:border-orange-500/40 transition-colors">
                <div className="flex-1 space-y-1">
                  <div className="font-bold text-orange-50 text-lg">RUC: {pago.ruc}</div>
                  <div className="text-orange-200/70">{pago.razonSocial}</div>
                  <div className="flex flex-wrap gap-3 mt-2 text-sm text-orange-200/50">
                    <span className="bg-orange-950/50 px-3 py-1 rounded-full border border-orange-500/20">Monto: <strong className="text-orange-400">S/ {pago.monto}</strong></span>
                    <span className="bg-orange-950/50 px-3 py-1 rounded-full border border-orange-500/20">Método: {pago.metodoPago}</span>
                    {pago.numeroComprobante && (
                      <span className="bg-orange-950/50 px-3 py-1 rounded-full border border-orange-500/20">Ref: {pago.numeroComprobante}</span>
                    )}
                  </div>
                  <div className="text-xs text-orange-500/50 font-mono pt-2">{new Date(pago.fechaPago).toLocaleString()}</div>
                </div>
                <div className="flex flex-wrap gap-2 w-full xl:w-auto">
                  {pago.hasVoucher && (
                    <Button variant="outline" onClick={() => loadVoucher(pago.pagoId)} className="border-orange-500/20 text-orange-200 hover:bg-orange-500/10 hover:text-orange-100 flex-1 xl:flex-none">
                      <FileImage className="w-4 h-4 mr-2" /> Voucher
                    </Button>
                  )}
                  <Button onClick={() => openOverrideModal(pago.pagoId, true)} className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 flex-1 xl:flex-none">
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Forzar Aprobación
                  </Button>
                  <Button onClick={() => openOverrideModal(pago.pagoId, false)} className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 flex-1 xl:flex-none">
                    <XCircle className="w-4 h-4 mr-2" /> Forzar Rechazo
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Modal Voucher */}
      <Dialog open={!!selectedVoucher} onOpenChange={(open) => !open && setSelectedVoucher(null)}>
        <DialogContent className="bg-[#0a0a0a] border-white/10 max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-white">Voucher Adjunto</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center p-4 bg-black/50 rounded-xl min-h-[300px] items-center">
            {voucherUrl ? (
              <img src={voucherUrl} alt="Voucher" className="max-h-[65vh] object-contain rounded-lg shadow-2xl" />
            ) : (
              <Loader2 className="w-8 h-8 animate-spin text-white/50" />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Override */}
      <Dialog open={!!overridePagoId} onOpenChange={(open) => !open && setOverridePagoId(null)}>
        <DialogContent className="bg-[#0a0a0a] border-orange-500/30 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">
              Confirmar Override ({overrideAprobado ? "Aprobar" : "Rechazar"})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-white/60">
              Esta acción requiere una justificación auditable. Por favor, ingrese el motivo del override:
            </p>
            <Input 
              value={motivoOverride}
              onChange={(e) => setMotivoOverride(e.target.value)}
              placeholder="Ej. Validación confirmada telefónicamente por Gerencia..."
              className="bg-black border-white/10 text-white placeholder:text-white/20"
            />
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="ghost" onClick={() => setOverridePagoId(null)} disabled={isSubmitting} className="text-white/50 hover:text-white">
              Cancelar
            </Button>
            <Button 
              onClick={handleValidarOverride} 
              disabled={isSubmitting || !motivoOverride.trim()}
              className={`${overrideAprobado ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'} text-white`}
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar Override"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
