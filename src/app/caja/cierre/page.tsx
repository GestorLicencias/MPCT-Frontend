"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import axios from "axios";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Lock, ArrowLeft, Loader2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

const cierreSchema = z.object({
  montoDeclarado: z.coerce.number().min(0, "El monto declarado no puede ser negativo")
});

export default function CierreCajaPage() {
  const router = useRouter();
  const [cajaId, setCajaId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
      return;
    }
    fetchEstadoCaja();
  }, []);

  const fetchEstadoCaja = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/caja/estado`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.abierta) {
        setCajaId(res.data.cajaId);
      } else {
        toast.info("La caja ya está cerrada.");
        router.push("/caja");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al obtener estado de la caja");
      router.push("/caja");
    } finally {
      setIsLoading(false);
    }
  };

  const form = useForm<z.infer<typeof cierreSchema>>({
    resolver: zodResolver(cierreSchema),
    defaultValues: {
      montoDeclarado: 0,
    },
  });

  const onSubmit = async (values: z.infer<typeof cierreSchema>) => {
    if (!cajaId) return;
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${API_URL}/caja/${cajaId}/cerrar`, values, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(res.data.message || "Caja cerrada exitosamente");
      localStorage.removeItem("token");
      router.push("/auth/login");
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Error al cerrar la caja");
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative z-10">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/5 blur-[150px] rounded-full"></div>
      </div>
      <Card className="bg-[#080808] border-white/5 shadow-xl rounded-3xl w-full max-w-md relative z-10">
        <CardHeader className="p-8 bg-[#0a0a0a] border-b border-white/5 text-center relative">
          <Button variant="ghost" size="icon" onClick={() => router.push("/caja")} className="absolute left-6 top-8 text-white/50 hover:text-white hover:bg-white/5">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Lock className="w-12 h-12 text-white mx-auto mb-4" />
          <CardTitle className="text-white text-2xl tracking-tight">Cierre de Caja</CardTitle>
          <CardDescription className="text-white/50 text-base mt-2">
            Realice el arqueo e ingrese el monto final en efectivo para cerrar su turno.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="montoDeclarado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-mono uppercase tracking-wider text-white/50">Monto Efectivo Declarado (S/)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        {...field} 
                        disabled={isLoading || !cajaId}
                        className="h-14 bg-white/5 border-white/10 text-white focus-visible:ring-1 focus-visible:ring-red-500/50 rounded-xl px-4 text-base disabled:opacity-50" 
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                disabled={isLoading || !cajaId || form.formState.isSubmitting}
                className="w-full h-14 bg-red-500 hover:bg-red-600 text-white font-semibold text-lg rounded-xl transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)] disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Cerrar Caja y Salir"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
