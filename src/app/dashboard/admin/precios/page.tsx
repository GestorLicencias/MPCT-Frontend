"use client";

import { useState, useEffect } from "react";
import { Edit2, Save, X, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";

interface Configuracion {
  id?: string;
  clave: string;
  valor: number;
  descripcion: string;
}

export default function GestionPreciosPage() {
  const [precios, setPrecios] = useState<Configuracion[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingClave, setEditingClave] = useState<string | null>(null);
  const [editValor, setEditValor] = useState<number>(0);

  useEffect(() => {
    fetchConfiguraciones();
  }, []);

  const fetchConfiguraciones = async () => {
    try {
      const res = await api.get("/admin/configuraciones");
      setPrecios(res.data);
    } catch (error) {
      console.error("Error obteniendo configuraciones", error);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (precio: Configuracion) => {
    setEditingClave(precio.clave);
    setEditValor(precio.valor);
  };

  const saveEdit = async (clave: string) => {
    try {
      await api.put(`/admin/configuraciones/${clave}`, null, {
        params: { valor: editValor }
      });
      setPrecios(precios.map(p => p.clave === clave ? { ...p, valor: editValor } : p));
      setEditingClave(null);
    } catch (error) {
      console.error("Error guardando precio", error);
      alert("Hubo un error al guardar el precio.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-2">
        <Link href="/dashboard/admin" className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Gestión de Precios</h1>
          <p className="text-slate-400 text-sm">Configura los costos de trámites según el nivel de riesgo.</p>
        </div>
      </div>

      <div className="bg-[#0a0f1c] border border-white/5 rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#050a15]">
          <h2 className="text-lg font-bold text-white">Tarifario Actual</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#020617] border-b border-white/5 text-slate-400 text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold">Categoría (Clave)</th>
                <th className="p-4 font-semibold">Descripción</th>
                <th className="p-4 font-semibold text-right">Costo (S/)</th>
                <th className="p-4 font-semibold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : precios.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400">No hay precios configurados.</td>
                </tr>
              ) : (
                precios.map((precio) => (
                  <tr key={precio.clave} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="p-4">
                      <span className="font-bold text-white">{precio.clave.replace("PRECIO_", "")}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-slate-300 text-sm">{precio.descripcion}</span>
                    </td>
                    <td className="p-4 text-right">
                      {editingClave === precio.clave ? (
                        <input 
                          type="number" 
                          value={editValor} 
                          onChange={e => setEditValor(parseFloat(e.target.value))}
                          className="w-24 bg-[#020617] border border-blue-500/30 rounded-lg px-3 py-1.5 text-white text-sm text-right focus:outline-none focus:border-blue-500"
                        />
                      ) : (
                        <span className="font-mono text-emerald-400 font-medium">
                          S/ {precio.valor.toFixed(2)}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        {editingClave === precio.clave ? (
                          <>
                            <button onClick={() => saveEdit(precio.clave)} className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors">
                              <Save className="w-4 h-4" />
                            </button>
                            <button onClick={() => setEditingClave(null)} className="p-2 text-slate-400 hover:bg-slate-800 rounded-lg transition-colors">
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <button onClick={() => startEditing(precio)} className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
