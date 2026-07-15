"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { toast } from "sonner";

export default function SeguimientoPage() {
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
    <div className="relative min-h-screen bg-black flex flex-col items-center justify-center pt-20">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/10 blur-[150px] rounded-full pointer-events-none"></div>
      </div>
      
      <div className="relative z-10 w-full max-w-2xl px-6">
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Seguimiento de <span className="text-cyan-400">Trámite</span>
          </h1>
          <p className="text-white/50 text-lg">
            Ingrese el número de RUC de la empresa para consultar el estado actual de su licencia de funcionamiento.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-4 bg-white/5 border border-white/10 p-2 rounded-3xl sm:rounded-full focus-within:border-cyan-500/50 transition-colors backdrop-blur-xl">
          <div className="flex items-center flex-1 w-full pl-6">
            <Search size={24} className="text-white/40" />
            <input 
              type="text" 
              placeholder="Ingrese su RUC (11 dígitos)" 
              className="bg-transparent border-none text-white px-4 py-4 w-full focus:outline-none placeholder:text-white/30 text-xl"
              value={searchRuc}
              onChange={(e) => setSearchRuc(e.target.value.replace(/\D/g, '').slice(0, 11))}
            />
          </div>
          <button type="submit" className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-400 text-black font-bold h-14 px-10 rounded-2xl sm:rounded-full transition-colors text-lg">
            Consultar
          </button>
        </form>
      </div>
    </div>
  );
}
