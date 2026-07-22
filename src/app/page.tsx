"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search, FileText } from "lucide-react";
import { toast } from "sonner";

function FadeInOnScroll({ children }: { children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      });
    }, { threshold: 0.1 });
    
    if (domRef.current) observer.observe(domRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={domRef}
      className={`transition-all duration-[2000ms] ease-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-24"
      }`}
    >
      {children}
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [searchRuc, setSearchRuc] = useState("");
  const [streamActive, setStreamActive] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setStreamActive(true);
      setTimeout(() => setStreamActive(false), 1500);
    }, 3000);

    // Initial trigger
    setStreamActive(true);
    const initialTimeout = setTimeout(() => setStreamActive(false), 1500);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchRuc || searchRuc.length !== 11) {
      toast.error("Por favor, ingrese un RUC válido de 11 dígitos");
      return;
    }
    router.push(`/seguimiento/${searchRuc}`);
  };

  const colors = ['#c597eb', '#9e98fa', '#79cdf9', '#91dcbc'];

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-black selection:bg-cyan-500/30 font-sans">
      {/* HERO SECTION */}
      <section className="relative min-h-screen flex flex-col justify-center items-start overflow-hidden bg-black">
        {/* Background Video */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover object-center opacity-60"
          >
            <source src="/videofront.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80"></div>
        </div>

        {/* Grid lines overlay */}
        <div className="absolute inset-0 z-[2] overflow-hidden pointer-events-none opacity-20">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={`h-${i}`} className="absolute h-px bg-white/10" style={{ top: `${(i + 1) * 12.5}%`, left: 0, right: 0 }}></div>
          ))}
          {Array.from({ length: 11 }).map((_, i) => (
            <div key={`v-${i}`} className="absolute w-px bg-white/10" style={{ left: `${(i + 1) * 8.33}%`, top: 0, bottom: 0 }}></div>
          ))}
        </div>

        <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 lg:px-12 py-32 lg:py-40 flex flex-col items-center justify-center">
          <div className="lg:max-w-5xl flex flex-col items-center w-full">
            <div className="mb-12 w-full">
              <h1 className="text-center text-5xl sm:text-6xl md:text-8xl lg:text-[110px] xl:text-[130px] font-light leading-[1.0] tracking-tight text-white">
                <span className="block whitespace-nowrap">Municipalidad</span>
                <span className="block whitespace-nowrap">Provincial</span>
                <span className="block whitespace-nowrap">
                  de <span className="relative inline-block font-normal">
                    {['T', 'r', 'u', 'x'].map((letter, i) => (
                      <span 
                        key={i} 
                        style={{
                          display: 'inline-block',
                          color: streamActive ? colors[i] : 'white',
                          textShadow: streamActive ? `0 0 20px ${colors[i]}, 0 0 40px ${colors[i]}` : 'none',
                          transition: 'color 0.8s ease-in-out, text-shadow 0.8s ease-in-out',
                          transitionDelay: streamActive ? `${i * 0.15}s` : `${i * 0.1}s`
                        }}
                      >
                        {letter}
                      </span>
                    ))}
                  </span>
                </span>
              </h1>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="absolute bottom-12 left-0 right-0 px-6 lg:px-12">
          <FadeInOnScroll>
            <div className="max-w-[1400px] mx-auto flex items-start gap-10 lg:gap-20">
              <div className="flex flex-col gap-2">
                <span className="text-3xl lg:text-4xl font-bold text-white">100%</span>
                <span className="text-xs text-white/50 leading-tight uppercase tracking-wider font-mono">Gestión Digital</span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-3xl lg:text-4xl font-bold text-white">&lt;48h</span>
                <span className="text-xs text-white/50 leading-tight uppercase tracking-wider font-mono">Tiempo respuesta</span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-3xl lg:text-4xl font-bold text-white">S/ 180</span>
                <span className="text-xs text-white/50 leading-tight uppercase tracking-wider font-mono">Costo fijo</span>
              </div>
            </div>
          </FadeInOnScroll>
        </div>
      </section>

      {/* Servicios Section */}
      <section id="servicios" className="relative py-24 lg:py-32 overflow-hidden bg-black">
        <FadeInOnScroll>
          <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
            <div className="relative mb-24 lg:mb-32">
              <div className="grid lg:grid-cols-12 gap-8 items-end">
                <div className="lg:col-span-7">
                  <span className="inline-flex items-center gap-3 text-sm font-mono text-white/50 mb-6">
                    <span className="w-12 h-px bg-white/20"></span>Servicios
                  </span>
                  <h2 className="text-6xl md:text-7xl lg:text-[110px] font-bold tracking-tight leading-[0.9] text-white">
                    Plataforma<br/>
                    <span className="text-white/30">Inteligente.</span>
                  </h2>
                </div>
                <div className="lg:col-span-5 lg:pb-4">
                  <p className="text-xl text-white/50 leading-relaxed">
                    Realiza tus trámites de licencia de funcionamiento de manera autónoma, rápida y sin salir de casa o la oficina.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-4 lg:gap-6">
              <div className="lg:col-span-12 relative bg-[#050505] border border-white/10 min-h-[500px] overflow-hidden group flex flex-col lg:flex-row hover:border-white/20 transition-colors">
                <div className="relative flex-1 p-8 lg:p-16 z-10 flex flex-col justify-between">
                  <div>
                    <span className="font-mono text-sm text-cyan-400">01</span>
                    <h3 className="text-4xl lg:text-5xl font-bold mt-4 mb-6 group-hover:translate-x-2 transition-transform duration-500 text-white">
                      Solicitud Digital
                    </h3>
                    <p className="text-xl text-white/50 leading-relaxed max-w-lg mb-8">
                      Inicia el proceso para tu nueva licencia adjuntando planos y fotografías desde la comodidad de nuestra plataforma web inteligente.
                    </p>
                  </div>
                  <div>
                    <button onClick={() => router.push('/solicitar')} className="inline-flex items-center justify-center whitespace-nowrap text-base font-medium h-12 gap-2 rounded-full border border-white/20 hover:bg-white/10 text-white px-8 transition-all">
                      Nuevo Trámite <FileText size={18} />
                    </button>
                  </div>
                </div>
                <div className="hidden lg:block relative w-[45%] shrink-0 overflow-hidden bg-slate-900 border-l border-white/5">
                   <div className="absolute inset-0 bg-[url('/kit-digital.jpg')] bg-cover bg-center opacity-80"></div>
                </div>
              </div>
            </div>
          </div>
        </FadeInOnScroll>
      </section>

      {/* Process Section */}
      <section id="proceso" className="relative py-24 lg:py-40 bg-[#07070a] text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-cyan-500/5 blur-[150px] pointer-events-none"></div>
        <FadeInOnScroll>
          <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12">
            <div className="relative mb-20 lg:mb-32 grid lg:grid-cols-2 gap-4 lg:gap-12 items-end">
              <div className="overflow-hidden">
                <span className="inline-flex items-center gap-3 text-sm font-mono text-white/40 mb-8">
                  <span className="w-12 h-px bg-white/20"></span>Proceso
                </span>
                <h2 className="text-6xl md:text-7xl lg:text-[130px] font-bold tracking-tight leading-[0.85]">
                  <span className="block">Solicita.</span>
                  <span className="block text-white/30">Paga.</span>
                  <span className="block text-white/10">Obtén.</span>
                </h2>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="relative text-left p-10 lg:p-14 border bg-[#030303] border-white/10 hover:border-cyan-500/50 transition-all duration-500 group">
                <div className="flex items-center gap-4 mb-10">
                  <span className="text-5xl font-bold text-cyan-400/80 group-hover:text-cyan-400 transition-colors">01</span>
                  <div className="flex-1 h-px bg-white/10 overflow-hidden">
                     <div className="h-full bg-cyan-400/50 w-0 group-hover:w-full transition-all duration-1000"></div>
                  </div>
                </div>
                <h3 className="text-3xl lg:text-4xl font-bold mb-3">Ingresa</h3>
                <span className="text-xl text-white/40 block mb-8 font-mono">tu solicitud</span>
                <p className="text-white/50 leading-relaxed text-lg">
                  Llena el formulario con tus datos y RUC. Adjunta los documentos requeridos de manera rápida.
                </p>
              </div>

              <div className="relative text-left p-10 lg:p-14 border bg-[#030303] border-white/10 hover:border-blue-500/50 transition-all duration-500 group">
                <div className="flex items-center gap-4 mb-10">
                  <span className="text-5xl font-bold text-blue-400/80 group-hover:text-blue-400 transition-colors">02</span>
                  <div className="flex-1 h-px bg-white/10 overflow-hidden">
                     <div className="h-full bg-blue-400/50 w-0 group-hover:w-full transition-all duration-1000"></div>
                  </div>
                </div>
                <h3 className="text-3xl lg:text-4xl font-bold mb-3">Realiza</h3>
                <span className="text-xl text-white/40 block mb-8 font-mono">el pago</span>
                <p className="text-white/50 leading-relaxed text-lg">
                  Paga de forma segura la tasa fija de S/ 180.00 desde la misma plataforma web en minutos.
                </p>
              </div>

              <div className="relative text-left p-10 lg:p-14 border bg-[#030303] border-white/10 hover:border-purple-500/50 transition-all duration-500 group">
                <div className="flex items-center gap-4 mb-10">
                  <span className="text-5xl font-bold text-purple-400/80 group-hover:text-purple-400 transition-colors">03</span>
                  <div className="flex-1 h-px bg-white/10 overflow-hidden">
                     <div className="h-full bg-purple-400/50 w-0 group-hover:w-full transition-all duration-1000"></div>
                  </div>
                </div>
                <h3 className="text-3xl lg:text-4xl font-bold mb-3">Descarga</h3>
                <span className="text-xl text-white/40 block mb-8 font-mono">tu licencia</span>
                <p className="text-white/50 leading-relaxed text-lg">
                  Recibe notificaciones del estado, espera la inspección y obtén tu certificado aprobado digitalmente.
                </p>
              </div>
            </div>
          </div>
        </FadeInOnScroll>
      </section>

      {/* Footer */}
      <footer className="bg-black border-t border-white/10 py-16 text-center relative z-10">
        <div className="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between">
           <a href="/" className="flex items-center gap-2 mb-6 md:mb-0 opacity-50 hover:opacity-100 transition-opacity">
             <span className="font-display tracking-tight text-xl text-white font-bold">MPCT</span>
             <span className="font-mono text-[10px] mt-1 text-white">TM</span>
           </a>
           <p className="text-white/40 text-sm">© 2026 Municipalidad Provincial. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
