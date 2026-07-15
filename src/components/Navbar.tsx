"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function Navbar() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [user, setUser] = useState<{ role: string, email: string } | null>(null);

  useEffect(() => {
    // Check authentication token
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const payload = JSON.parse(jsonPayload);
        setUser({ role: payload.role || "ADMIN", email: payload.sub || "Usuario" });
      } catch (e) {
        setUser(null);
      }
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      // Desaparecer navbar al bajar, aparecer al subir
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // Ocultar Navbar completamente en rutas internas o de autenticación
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/inspector") || pathname?.startsWith("/caja") || pathname?.startsWith("/auth")) {
    return null;
  }

  return (
    <header 
      className={`fixed z-50 top-6 left-1/2 -translate-x-1/2 transition-all duration-700 ${
        isVisible ? "translate-y-0 opacity-100" : "-translate-y-10 opacity-0 pointer-events-none"
      }`}
    >
      <nav className="flex items-center justify-between px-6 h-14 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl gap-8">
        <a href="/" className="flex items-center gap-1.5 group">
          <span className="font-display tracking-tight text-lg text-white font-bold">MPCT</span>
          <span className="font-mono text-[10px] mt-0.5 text-white/50 uppercase tracking-widest border border-white/10 px-1 rounded">TM</span>
        </a>
        
        <div className="hidden md:flex items-center gap-8">
          <a href="/#servicios" className="text-sm font-medium transition-colors duration-300 text-white/60 hover:text-white">Servicios</a>
          <a href="/#proceso" className="text-sm font-medium transition-colors duration-300 text-white/60 hover:text-white">Proceso</a>
          <a href="/seguimiento" className="text-sm font-medium transition-colors duration-300 text-white/60 hover:text-white">Seguimiento</a>
        </div>
        
        <div className="hidden md:flex items-center gap-3 border-l border-white/10 pl-6">
          {user ? (
            <a href={user.role === "ADMIN" ? "/admin" : user.role === "CAJERO" ? "/caja" : "/inspector"} className="inline-flex items-center justify-center text-xs font-bold uppercase tracking-wider h-9 rounded-full transition-all duration-300 bg-white/10 hover:bg-white/20 text-white px-5 border border-white/10">
              Mi Panel ({user.role})
            </a>
          ) : (
            <>
              <a href="/auth/login" className="text-sm font-medium transition-colors duration-300 text-white/60 hover:text-white">Ingresar</a>
              <a href="/solicitar" className="inline-flex items-center justify-center text-xs font-bold uppercase tracking-wider h-9 rounded-full transition-all duration-300 bg-white hover:bg-white/90 text-black px-5 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]">
                Nuevo Trámite
              </a>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
