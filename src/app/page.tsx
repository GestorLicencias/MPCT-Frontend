"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, FileText, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function Home() {
  const router = useRouter();
  const [searchRuc, setSearchRuc] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchRuc || searchRuc.length !== 11) {
      toast.error("Por favor, ingrese un RUC válido de 11 dígitos");
      return;
    }
    router.push(`/seguimiento/${searchRuc}`);
  };

  return (
    <div className="flex flex-col items-center gap-12 max-w-5xl mx-auto">
      {/* Hero Section */}
      <section className="text-center space-y-6 pt-16 pb-8 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/20 blur-[100px] rounded-full pointer-events-none"></div>
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-white relative z-10">
          Licencia de <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Funcionamiento</span>
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto relative z-10">
          Gestiona tu licencia de manera 100% digital, rápida y segura. Un proceso simplificado con costo fijo de S/ 180.00.
        </p>
      </section>

      {/* Acciones Principales */}
      <div className="grid md:grid-cols-2 gap-8 w-full relative z-10">
        {/* Nuevo Trámite */}
        <Card className="bg-slate-900/40 backdrop-blur-md border-slate-800 shadow-xl hover:shadow-cyan-900/20 hover:border-cyan-800/50 transition-all duration-300">
          <CardHeader>
            <div className="w-14 h-14 bg-cyan-500/10 text-cyan-400 rounded-xl flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              <FileText size={28} />
            </div>
            <CardTitle className="text-2xl text-white">Nuevo Trámite</CardTitle>
            <CardDescription className="text-slate-400 text-base">
              Inicia la solicitud para una nueva licencia o una renovación. Necesitarás tu RUC y los documentos técnicos (Plano y Foto).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white h-12 text-lg shadow-[0_0_20px_rgba(8,145,178,0.4)] hover:shadow-[0_0_25px_rgba(8,145,178,0.6)] transition-all"
              onClick={() => router.push("/solicitar")}
            >
              Iniciar Solicitud <ArrowRight className="ml-2" size={20} />
            </Button>
          </CardContent>
        </Card>

        {/* Seguimiento */}
        <Card className="bg-slate-900/40 backdrop-blur-md border-slate-800 shadow-xl">
          <CardHeader>
            <div className="w-14 h-14 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center mb-4">
              <Search size={28} />
            </div>
            <CardTitle className="text-2xl text-white">Seguimiento</CardTitle>
            <CardDescription className="text-slate-400 text-base">
              Consulta el estado actual de tu trámite, realiza el pago o descarga tu certificado aprobado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
              <Input 
                placeholder="Ingresa tu número de RUC" 
                value={searchRuc}
                onChange={(e) => setSearchRuc(e.target.value.replace(/\D/g, '').slice(0, 11))}
                className="h-12 text-lg bg-slate-950/50 border-slate-700 text-white focus-visible:ring-blue-500"
              />
              <Button type="submit" className="h-12 px-8 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700">
                Buscar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Info Rápida */}
      <section className="bg-slate-900/30 backdrop-blur-sm border border-slate-800 w-full p-8 rounded-2xl mt-8 text-center relative z-10">
        <h3 className="font-semibold text-xl text-white mb-2">¿Cómo funciona?</h3>
        <p className="text-slate-400 mb-8">El proceso consta de 4 simples pasos para brindarte agilidad.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-medium">
          <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-xl text-slate-300">1. Ingresa Solicitud</div>
          <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-xl text-slate-300">2. Realiza el Pago</div>
          <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-xl text-slate-300">3. Espera la Inspección</div>
          <div className="bg-cyan-950/30 border border-cyan-800/50 p-4 rounded-xl text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.1)]">4. ¡Obtén tu Certificado!</div>
        </div>
      </section>
    </div>
  );
}
