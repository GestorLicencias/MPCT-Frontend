import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, ShieldCheck, Clock, CheckCircle, ArrowRight, Activity, Zap } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#020617] font-sans selection:bg-blue-500 selection:text-white text-slate-50">
      {/* Navbar Glassmorphism Dark */}
      <header className="fixed top-0 w-full z-50 px-6 lg:px-12 h-20 flex items-center justify-between border-b border-white/5 bg-[#020617]/50 backdrop-blur-2xl transition-all duration-300">
        <div className="flex items-center gap-3 text-2xl font-black tracking-tight text-white">
          <div className="p-2 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-xl shadow-lg shadow-blue-500/20">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <span>Muni<span className="text-blue-500">Licencias</span></span>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/auth/login" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">
            Iniciar Sesión
          </Link>
          <Link href="/auth/register">
            <Button className="rounded-full px-6 font-semibold bg-blue-600 text-white hover:bg-blue-500 shadow-xl shadow-blue-600/20 transition-all hover:-translate-y-0.5">
              Solicitar Trámite <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1 pt-20">
        <section className="relative px-6 py-24 md:py-40 flex flex-col items-center justify-center text-center overflow-hidden">
          {/* Gradients Modernos de Fondo Oscuro */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-tr from-blue-600/20 to-purple-600/20 blur-[120px] rounded-full -z-10 pointer-events-none"></div>
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-tl from-emerald-500/10 to-teal-500/10 blur-[100px] rounded-full -z-10 pointer-events-none"></div>
          
          <div className="relative z-10 max-w-4xl mx-auto space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-semibold mb-4 shadow-sm backdrop-blur-md">
              <Zap className="h-4 w-4 text-blue-400" />
              <span>Plataforma Oficial 100% Digital</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-[1.1]">
              Tu Licencia Municipal <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                En Tiempo Récord
              </span>
            </h1>
            
            <p className="text-lg md:text-2xl text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
              Dile adiós a las colas. Gestiona, paga y obtén el certificado de funcionamiento de tu negocio desde cualquier lugar.
            </p>
            
            <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/register">
                <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg rounded-full bg-white text-slate-900 hover:bg-slate-200 shadow-xl shadow-white/10 transition-all hover:-translate-y-1 font-bold">
                  Comenzar Trámite
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg rounded-full border-2 border-slate-700 bg-slate-900/50 hover:bg-slate-800 hover:border-slate-600 text-white transition-all backdrop-blur-md">
                  Consultar Estado
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Bento Grid / Features Oscuro */}
        <section className="px-6 py-24 bg-[#0a0f1c] text-white relative z-20 overflow-hidden border-t border-white/5">
          <div className="max-w-6xl mx-auto relative z-10">
            <div className="mb-16 md:text-center space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Experiencia <span className="text-blue-400">Premium</span></h2>
              <p className="text-slate-400 text-lg max-w-2xl mx-auto">Un flujo diseñado para ser intuitivo, transparente y ridículamente rápido.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {/* Tarjeta 1 */}
              <div className="group relative bg-slate-900/50 backdrop-blur-md border border-white/10 p-8 rounded-3xl hover:bg-slate-800/80 transition-colors duration-300">
                <div className="absolute -right-4 -top-4 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-colors pointer-events-none"></div>
                <div className="h-14 w-14 bg-blue-500/20 border border-blue-500/30 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <FileText className="h-7 w-7 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold mb-3">Registro Inteligente</h3>
                <p className="text-slate-400 leading-relaxed">
                  Solo ingresa tu RUC. Nosotros nos conectamos con SUNAT para rellenar toda tu información legal al instante.
                </p>
              </div>

              {/* Tarjeta 2 */}
              <div className="group relative bg-slate-900/50 backdrop-blur-md border border-white/10 p-8 rounded-3xl hover:bg-slate-800/80 transition-colors duration-300">
                <div className="absolute -right-4 -top-4 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-colors pointer-events-none"></div>
                <div className="h-14 w-14 bg-purple-500/20 border border-purple-500/30 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <Activity className="h-7 w-7 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold mb-3">Trazabilidad Total</h3>
                <p className="text-slate-400 leading-relaxed">
                  Observa en tiempo real en qué área se encuentra tu expediente. Recibe notificaciones sobre inspecciones.
                </p>
              </div>

              {/* Tarjeta 3 */}
              <div className="group relative bg-slate-900/50 backdrop-blur-md border border-white/10 p-8 rounded-3xl hover:bg-slate-800/80 transition-colors duration-300">
                <div className="absolute -right-4 -top-4 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-colors pointer-events-none"></div>
                <div className="h-14 w-14 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <CheckCircle className="h-7 w-7 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold mb-3">Aprobación Digital</h3>
                <p className="text-slate-400 leading-relaxed">
                  Descarga tu licencia en PDF con código QR infalsificable. Válido para cualquier supervisión municipal.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
