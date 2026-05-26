import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Portal de Trámites - MPCT",
  description: "Trámites de Licencia de Funcionamiento",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className={`${inter.className} bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-200 min-h-screen flex flex-col antialiased selection:bg-cyan-500/30`}>
        <header className="bg-slate-900/50 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400">🏛️</span>
              MPCT
            </h1>
            <nav className="flex items-center gap-6">
              <a href="/" className="hover:text-cyan-400 text-slate-300 transition-colors font-medium">Inicio</a>
              <a href="/auth/login" className="px-4 py-2 bg-cyan-900/30 text-cyan-400 border border-cyan-800/50 rounded-lg hover:bg-cyan-800/50 transition-colors text-sm font-semibold shadow-[0_0_10px_rgba(6,182,212,0.1)]">
                Acceso Interno
              </a>
            </nav>
          </div>
        </header>
        <main className="flex-grow container mx-auto px-4 py-8 relative z-10">
          {children}
        </main>
        <footer className="bg-slate-950/80 border-t border-slate-900 text-slate-500 py-6 text-center text-sm">
          <p>© 2026 Municipalidad Provincial. Todos los derechos reservados.</p>
        </footer>
        <Toaster theme="dark" richColors position="top-right" />
      </body>
    </html>
  );
}
