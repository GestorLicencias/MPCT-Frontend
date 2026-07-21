"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CheckCircle2, XCircle, FileImage, Loader2, RefreshCw, Lock, Unlock } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

export function ValidarPagosCajero() {
  const [pagos, setPagos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [selectedVoucher, setSelectedVoucher] = useState<string | null>(null);
  const [voucherUrl, setVoucherUrl] = useState<string | null>(null);
  const [rejectingPago, setRejectingPago] = useState<string | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserEmail(payload.sub);
      } catch (e) {}
    }
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

  const toggleLock = async (pagoId: string, isLockedByMe: boolean) => {
    try {
      const token = localStorage.getItem("token");
      const endpoint = isLockedByMe ? "unlock" : "lock";
      await axios.post(`${API_URL}/admin/tasks/${pagoId}/${endpoint}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchPagos();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al procesar la tarea");
      fetchPagos();
    }
  };

  const handleValidar = async (pagoId: string, aprobado: boolean, motivo?: string) => {
    try {
      const token = localStorage.getItem("token");
      let url = `${API_URL}/caja/pagos/${pagoId}/validar?aprobado=${aprobado}`;
      if (motivo) {
        url += `&motivo=${encodeURIComponent(motivo)}`;
      }
      const res = await axios.post(url, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(res.data.message || (aprobado ? "Pago validado" : "Pago rechazado"));
      fetchPagos();
      setRejectingPago(null);
      setMotivoRechazo("");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Error al validar el pago");
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
    <Card className="bg-[#080808] border-white/5 shadow-xl rounded-3xl relative z-10 overflow-hidden">
      <CardHeader className="p-8 bg-[#0a0a0a] border-b border-white/5 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-white text-2xl tracking-tight">Bandeja de Transferencias</CardTitle>
          <CardDescription className="text-white/50 text-base mt-2">
            Revise los vouchers y verifique en la cuenta bancaria antes de aprobar.
          </CardDescription>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchPagos} disabled={loading} className="text-white/50 hover:text-white">
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="p-8">
        {loading && pagos.length === 0 ? (
          <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-white/50" /></div>
        ) : pagos.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl">
            <p className="text-white/50 font-mono text-sm">No hay pagos pendientes de validación.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pagos.map(pago => (
              <div key={pago.pagoId} className="flex flex-col xl:flex-row items-start xl:items-center justify-between p-5 bg-white/5 border border-white/10 rounded-2xl gap-4 hover:bg-white/10 transition-colors">
                <div className="flex-1 space-y-1">
                  <div className="font-bold text-white text-lg">RUC: {pago.ruc}</div>
                  <div className="text-white/70">{pago.razonSocial}</div>
                  <div className="flex flex-wrap gap-3 mt-2 text-sm text-white/50">
                    <span className="bg-black/50 px-3 py-1 rounded-full border border-white/10">Monto: <strong className="text-white">S/ {pago.monto}</strong></span>
                    <span className="bg-black/50 px-3 py-1 rounded-full border border-white/10">Método: {pago.metodoPago}</span>
                    {pago.numeroComprobante && (
                      <span className="bg-black/50 px-3 py-1 rounded-full border border-white/10">Ref: {pago.numeroComprobante}</span>
                    )}
                  </div>
                  <div className="text-xs text-white/30 font-mono pt-2">{new Date(pago.fechaPago).toLocaleString()}</div>
                </div>
                <div className="flex flex-wrap gap-2 w-full xl:w-auto">
                  {pago.lockedBy ? (
                    pago.lockedBy === currentUserEmail ? (
                      <>
                        {pago.hasVoucher && (
                          <Button variant="outline" onClick={() => loadVoucher(pago.pagoId)} className="border-white/10 hover:bg-white/20 text-white flex-1 xl:flex-none">
                            <FileImage className="w-4 h-4 mr-2" /> Voucher
                          </Button>
                        )}
                        <Button onClick={() => handleValidar(pago.pagoId, true)} className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 flex-1 xl:flex-none">
                          <CheckCircle2 className="w-4 h-4 mr-2" /> Aprobar
                        </Button>
                        <Button onClick={() => setRejectingPago(pago.pagoId)} className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 flex-1 xl:flex-none">
                          <XCircle className="w-4 h-4 mr-2" /> Rechazar
                        </Button>
                        <Button onClick={() => toggleLock(pago.pagoId, true)} variant="ghost" className="text-white/50 hover:text-white">
                          <Unlock className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <div className="flex items-center px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                        <Lock className="w-4 h-4 mr-2" /> En proceso por {pago.lockedBy}
                      </div>
                    )
                  ) : (
                    <Button onClick={() => toggleLock(pago.pagoId, false)} className="bg-blue-500 hover:bg-blue-600 text-white w-full xl:w-auto">
                      Tomar Tarea
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

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

      <Dialog open={!!rejectingPago} onOpenChange={(open) => !open && setRejectingPago(null)}>
        <DialogContent className="bg-[#0a0a0a] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-400 flex items-center gap-2"><XCircle className="w-5 h-5" /> Rechazar Pago</DialogTitle>
            <DialogDescription className="text-white/50">
              Por favor indique el motivo del rechazo. Este mensaje será enviado al usuario.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70">Motivo de Rechazo</label>
              <div className="flex gap-2 mb-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-white/10 hover:bg-white/10 text-white text-xs h-7"
                  onClick={() => setMotivoRechazo("Este voucher ya fue usado o es inválido.")}
                >
                  Voucher Usado
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-white/10 hover:bg-white/10 text-white text-xs h-7"
                  onClick={() => setMotivoRechazo("El monto del voucher no coincide con el trámite.")}
                >
                  Monto Incorrecto
                </Button>
              </div>
              <textarea 
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.target.value)}
                placeholder="Ej. Este voucher ya fue usado en otro trámite..."
                className="w-full min-h-[100px] bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-red-500/50 resize-none"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setRejectingPago(null)} className="border-white/10 text-white hover:bg-white/10">
                Cancelar
              </Button>
              <Button 
                onClick={() => handleValidar(rejectingPago!, false, motivoRechazo)} 
                disabled={!motivoRechazo.trim()}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Confirmar Rechazo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
