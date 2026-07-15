"use client";

import { useEffect, useState, use } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldAlert, Loader2, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const API_URL = `${process.env.NEXT_PUBLIC_API_URL || 'https://mpct-api-264213836001.us-east1.run.app/api/v1'}/tramites/validar`;

interface ValidacionResult {
  valida: boolean;
  estado: string;
  razonSocial?: string;
  ruc?: string;
  direccion?: string;
  rubro?: string;
  fechaEmision?: string;
  fechaVencimiento?: string;
  mensaje?: string;
}

export default function ValidarLicenciaPage({ params }: { params: Promise<{ numero: string }> }) {
  const { numero } = use(params);
  const [result, setResult] = useState<ValidacionResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const validate = async () => {
      try {
        const response = await axios.get(`${API_URL}/${numero}`);
        setResult(response.data);
      } catch (error: any) {
        if (error.response && error.response.status === 404) {
          setResult({ valida: false, estado: "NO_ENCONTRADA", mensaje: "La licencia no existe o el número es incorrecto." });
        } else {
          setResult({ valida: false, estado: "ERROR", mensaje: "Error al conectar con el servidor de validación." });
        }
      } finally {
        setLoading(false);
      }
    };
    validate();
  }, [numero]);

  return (
    <div className="min-h-screen bg-[#030303] flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[60%] rounded-full bg-blue-500/10 blur-[150px]" />
        <div className="absolute inset-0 bg-[url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/noise-QXZOqJ4x9fHj8mP7L8w1O2wH9mP7L8.png')] opacity-[0.03] mix-blend-overlay" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {loading ? (
          <Card className="bg-slate-900/40 backdrop-blur-xl border-slate-800 shadow-2xl">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
              <Loader2 size={48} className="mb-4 text-cyan-500 animate-spin" />
              <h3 className="text-xl font-medium text-slate-200">Validando Certificado...</h3>
              <p>Por favor espere mientras consultamos la base de datos municipal.</p>
            </CardContent>
          </Card>
        ) : result?.valida ? (
          <Card className="bg-slate-900/40 backdrop-blur-xl border-t-4 border-t-green-500 border-slate-800 shadow-2xl overflow-hidden">
            <div className="bg-green-500/10 w-full p-6 flex flex-col items-center border-b border-green-500/20">
              <ShieldCheck className="h-20 w-20 text-green-500 mb-4" />
              <h1 className="text-3xl font-bold text-green-400 mb-2">LICENCIA VÁLIDA</h1>
              <Badge className="bg-green-600 hover:bg-green-500 text-white border-0 px-4 py-1 text-sm">
                VIGENTE
              </Badge>
            </div>
            <CardContent className="pt-8 px-6 pb-8 space-y-6">
              <div>
                <p className="text-sm text-slate-500 font-mono mb-1">Razón Social / Titular</p>
                <p className="text-lg font-semibold text-slate-200">{result.razonSocial}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500 font-mono mb-1">RUC</p>
                  <p className="font-medium text-slate-300">{result.ruc}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-mono mb-1">Rubro</p>
                  <p className="font-medium text-slate-300">{result.rubro}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-500 font-mono mb-1">Dirección del Local</p>
                <p className="font-medium text-slate-300">{result.direccion}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                <div>
                  <p className="text-xs text-slate-500 font-mono mb-1">Fecha Emisión</p>
                  <p className="text-sm text-slate-400">{result.fechaEmision ? new Date(result.fechaEmision).toLocaleDateString() : '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-mono mb-1">Fecha Vencimiento</p>
                  <p className="text-sm font-semibold text-green-400">{result.fechaVencimiento ? new Date(result.fechaVencimiento).toLocaleDateString() : '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-slate-900/40 backdrop-blur-xl border-t-4 border-t-red-500 border-slate-800 shadow-2xl overflow-hidden">
            <div className="bg-red-500/10 w-full p-6 flex flex-col items-center border-b border-red-500/20">
              <ShieldAlert className="h-20 w-20 text-red-500 mb-4" />
              <h1 className="text-3xl font-bold text-red-500 mb-2 text-center">LICENCIA VENCIDA<br/>NO VÁLIDA</h1>
              <Badge className="bg-red-900 text-red-200 border border-red-700 px-4 py-1 text-sm">
                {result?.estado === "VENCIDA" ? "VENCIDA" : "NO ENCONTRADA / INVÁLIDA"}
              </Badge>
            </div>
            <CardContent className="pt-8 px-6 pb-8 space-y-6">
              {result?.estado === "VENCIDA" && (
                <>
                  <div>
                    <p className="text-sm text-slate-500 font-mono mb-1">Razón Social / Titular</p>
                    <p className="text-lg font-semibold text-slate-200">{result.razonSocial}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 font-mono mb-1">Dirección del Local</p>
                    <p className="font-medium text-slate-300">{result.direccion}</p>
                  </div>
                  <div className="bg-red-950/30 p-4 rounded-lg border border-red-900/50 mt-6">
                    <p className="text-red-400 text-sm">Esta licencia expiró el <strong>{result.fechaVencimiento ? new Date(result.fechaVencimiento).toLocaleDateString() : '-'}</strong>. El titular debe realizar el trámite de renovación inmediatamente para evitar sanciones o clausura.</p>
                  </div>
                </>
              )}
              {result?.estado !== "VENCIDA" && (
                <div className="text-center pt-4">
                  <p className="text-slate-400">{result?.mensaje}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="mt-8 text-center">
          <Link href="/">
            <Button variant="ghost" className="text-slate-400 hover:text-white">
              <Home className="w-4 h-4 mr-2" />
              Volver al Portal Principal
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
