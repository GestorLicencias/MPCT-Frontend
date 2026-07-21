"use client";

import React, { useState, useEffect } from "react";
import api from "@/lib/axios";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Key, CreditCard } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export function UsuariosAdminSection() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Registration state
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerRole, setRegisterRole] = useState("INSPECTOR");
  const [isRegistering, setIsRegistering] = useState(false);

  // Suspension Modal State
  const [suspensionModalOpen, setSuspensionModalOpen] = useState(false);
  const [selectedUserForSuspension, setSelectedUserForSuspension] = useState<any>(null);
  const [motivoSuspension, setMotivoSuspension] = useState("");
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/usuarios");
      setUsers(res.data);
    } catch (error) {
      toast.error("Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistering(true);
    try {
      const res = await api.post("/admin/users", { email: registerEmail, password: registerPassword, role: registerRole });
      toast.success(res.data.message || "Usuario registrado con éxito.");
      setRegisterEmail("");
      setRegisterPassword("");
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al registrar el usuario.");
    } finally {
      setIsRegistering(false);
    }
  };

  const toggleStatus = async (user: any) => {
    if (user.isActive) {
      // Abre el modal para solicitar el motivo de la suspensión
      setSelectedUserForSuspension(user);
      setMotivoSuspension("");
      setSuspensionModalOpen(true);
    } else {
      // Reactivación no requiere motivo
      ejecutarCambioEstado(user, true, "");
    }
  };

  const confirmarSuspension = async () => {
    if (!motivoSuspension.trim()) {
      toast.error("El motivo de suspensión es obligatorio.");
      return;
    }
    await ejecutarCambioEstado(selectedUserForSuspension, false, motivoSuspension.trim());
    setSuspensionModalOpen(false);
  };

  const ejecutarCambioEstado = async (user: any, newStatus: boolean, motivo: string) => {
    setIsSubmittingStatus(true);
    try {
      await api.patch(`/admin/usuarios/${user.id}/estado`, { 
        isActive: newStatus,
        motivoSuspension: motivo
      });
      toast.success(`Usuario ${!newStatus ? 'suspendido' : 'reactivado'} exitosamente.`);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al cambiar el estado del usuario.");
    } finally {
      setIsSubmittingStatus(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-[#080808] border-white/5 shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="p-8 bg-[#0a0a0a] border-b border-white/5">
          <CardTitle className="text-white text-2xl tracking-tight">Gestión de Usuarios</CardTitle>
          <CardDescription className="text-white/50 text-base mt-2">Crea credenciales de acceso para nuevos inspectores o cajeros municipales.</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleRegister} className="space-y-6">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-white/50 mb-3">Cargo / Rol</label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setRegisterRole("INSPECTOR")}
                  className={`flex-1 h-14 rounded-xl border flex items-center justify-center font-medium transition-all ${registerRole === "INSPECTOR" ? "bg-white text-black border-white" : "bg-white/5 text-white/50 border-white/10 hover:bg-white/10 hover:text-white"}`}
                >
                  Inspector
                </button>
                <button
                  type="button"
                  onClick={() => setRegisterRole("CAJERO")}
                  className={`flex-1 h-14 rounded-xl border flex items-center justify-center font-medium transition-all ${registerRole === "CAJERO" ? "bg-white text-black border-white" : "bg-white/5 text-white/50 border-white/10 hover:bg-white/10 hover:text-white"}`}
                >
                  Cajero
                </button>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-white/50 mb-3">Correo Electrónico</label>
                <Input 
                  type="email" 
                  required 
                  value={registerEmail} 
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  className="h-14 bg-white/5 border-white/10 text-white rounded-xl focus-visible:ring-1 focus-visible:ring-white/20"
                  placeholder="ej. carlos@mpct.gob.pe"
                />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-white/50 mb-3">Contraseña Segura</label>
                <Input 
                  type="password" 
                  required 
                  value={registerPassword} 
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  className="h-14 bg-white/5 border-white/10 text-white rounded-xl focus-visible:ring-1 focus-visible:ring-white/20"
                />
              </div>
            </div>
            <Button type="submit" disabled={isRegistering} className="h-14 px-8 bg-white text-black font-semibold hover:bg-white/90 rounded-xl w-full md:w-auto">
              {isRegistering ? "Registrando..." : "Crear Cuenta de Usuario"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-[#080808] border-white/5 shadow-xl rounded-3xl overflow-hidden mt-6">
        <CardHeader className="p-8 bg-[#0a0a0a] border-b border-white/5 flex flex-row items-center justify-between">
          <CardTitle className="text-white text-2xl tracking-tight">Usuarios Registrados</CardTitle>
          <Button type="button" onClick={fetchUsers} variant="outline" className="border-white/10 text-white hover:bg-white/5 h-10 px-4 rounded-xl">
            Actualizar
          </Button>
        </CardHeader>
        <CardContent className="p-8">
          {loading ? (
            <div className="text-center py-10 text-cyan-400 animate-pulse">Cargando usuarios...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-10 text-white/40">No hay usuarios registrados.</div>
          ) : (
            <div className="space-y-4">
              {users.map((u) => (
                <div key={u.id} className="p-5 rounded-2xl border bg-white/5 border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-white/20 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${u.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-400' : u.role === 'CAJERO' ? 'bg-amber-500/20 text-amber-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
                      {u.role === 'ADMIN' ? <Key className="w-6 h-6"/> : u.role === 'CAJERO' ? <CreditCard className="w-6 h-6"/> : <UserPlus className="w-6 h-6"/>}
                    </div>
                    <div>
                      <p className="text-white font-semibold text-lg">{u.email}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <Badge className={`px-2 py-0.5 text-xs bg-white/10 text-white hover:bg-white/20`}>{u.role}</Badge>
                        <Badge className={`px-2 py-0.5 text-xs ${u.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                          {u.isActive ? 'ACTIVO' : 'SUSPENDIDO'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  {u.role !== 'ADMIN' && (
                    <Button 
                      type="button"
                      variant="outline" 
                      onClick={() => toggleStatus(u)}
                      className={`h-12 px-6 rounded-xl border ${u.isActive ? 'border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300' : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300'}`}
                    >
                      {u.isActive ? "Suspender Usuario" : "Reactivar Usuario"}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Suspension Modal */}
      <Dialog open={suspensionModalOpen} onOpenChange={setSuspensionModalOpen}>
        <DialogContent className="bg-[#0a0a0a] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-red-400">Suspender Usuario</DialogTitle>
            <DialogDescription className="text-white/50">
              Por favor, ingrese el motivo obligatorio de la suspensión. Esta acción quedará registrada en auditoría.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {selectedUserForSuspension && (
              <div className="bg-white/5 p-3 rounded-lg border border-white/10 text-sm">
                <span className="text-white/50">Usuario a suspender: </span>
                <strong className="text-white">{selectedUserForSuspension.email}</strong>
              </div>
            )}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-white/50 mb-2">Motivo</label>
              <Input 
                value={motivoSuspension}
                onChange={(e) => setMotivoSuspension(e.target.value)}
                placeholder="Ej: Abandono de funciones..."
                className="bg-black border-white/10 text-white rounded-xl focus-visible:ring-1 focus-visible:ring-red-500/50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspensionModalOpen(false)} className="border-white/10 text-white hover:bg-white/5 rounded-xl">
              Cancelar
            </Button>
            <Button onClick={confirmarSuspension} disabled={!motivoSuspension.trim() || isSubmittingStatus} className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/20 rounded-xl">
              {isSubmittingStatus ? "Guardando..." : "Confirmar Suspensión"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
