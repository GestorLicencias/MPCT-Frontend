"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Settings, 
  LogOut, 
  FileText, 
  CheckSquare, 
  Menu,
  X,
  User
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const role = user.role;
  
  const getLinks = () => {
    switch (role) {
      case "ADMIN":
        return [
          { name: "Resumen", href: "/dashboard/admin", icon: LayoutDashboard },
          { name: "Gestión Precios", href: "/dashboard/admin/precios", icon: Settings },
        ];
      case "INSPECTOR":
        return [
          { name: "Bandeja de Entrada", href: "/dashboard/inspector", icon: LayoutDashboard },
          { name: "Inspecciones", href: "/dashboard/inspector/evaluar", icon: CheckSquare },
        ];
      case "SOLICITANTE":
        return [
          { name: "Mis Trámites", href: "/dashboard/solicitante", icon: LayoutDashboard },
          { name: "Nuevo Trámite", href: "/dashboard/solicitante/nuevo", icon: FileText },
        ];
      default:
        return [];
    }
  };

  const links = getLinks();

  return (
    <div className="min-h-screen bg-[#020617] flex overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#0a0f1c] border-r border-white/5 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col">
          <div className="h-20 flex items-center px-8 border-b border-white/5">
            <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
              MPCT Portal
            </span>
          </div>
          
          <div className="p-6">
            <div className="flex items-center gap-4 mb-8 p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                <User className="w-6 h-6 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{user.email}</p>
                <p className="text-xs text-blue-400 font-medium">{role}</p>
              </div>
            </div>

            <nav className="space-y-2">
              {links.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      isActive 
                        ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' 
                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{link.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="mt-auto p-6">
            <button
              onClick={() => logout()}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all font-medium"
            >
              <LogOut className="w-5 h-5" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header (Mobile only) */}
        <header className="h-20 lg:hidden flex items-center justify-between px-6 border-b border-white/5 bg-[#0a0f1c]">
          <span className="text-lg font-black text-white">MPCT</span>
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-slate-400 hover:text-white rounded-lg bg-white/5"
          >
            <Menu className="w-6 h-6" />
          </button>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto bg-[#020617] p-4 lg:p-8">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
