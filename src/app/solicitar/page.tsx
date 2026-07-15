"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import axios from "axios";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, UploadCloud } from "lucide-react";

// API URL configurable en un proyecto real (usualmente desde .env)
const API_URL = `${process.env.NEXT_PUBLIC_API_URL || 'https://mpct-api-264213836001.us-east1.run.app/api/v1'}/tramites`;

const formSchema = z.object({
  ruc: z.string().length(11, { message: "El RUC debe tener 11 dígitos exactos." }),
  dni: z.string().length(8, { message: "El DNI debe tener 8 dígitos exactos." }),
  representanteLegal: z.string().min(5, { message: "El nombre es muy corto." }),
  email: z.string().email({ message: "Ingrese un correo electrónico válido." }).optional().or(z.literal("")),
  rubro: z.string().min(2, { message: "Seleccione el rubro." }),
  area: z.string().optional(),
  tipo: z.enum(["NUEVO", "RENOVACION", "MODIFICACION", "TRASLADO"]),
  plano: z.any().optional(),
  foto: z.any().optional()
}).superRefine((data, ctx) => {
  if (data.tipo !== "RENOVACION") {
    if (!data.area || data.area.length < 1) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Ingrese el área.", path: ["area"] });
    }
    if (!data.plano || data.plano.length !== 1) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Debe adjuntar el plano en formato PDF o Imagen.", path: ["plano"] });
    }
    if (!data.foto || data.foto.length < 1 || data.foto.length > 4) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Debe adjuntar entre 1 y 4 fotografías.", path: ["foto"] });
    }
  } else {
    if (!data.foto || data.foto.length < 1) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Debe adjuntar al menos una foto actualizada de la fachada.", path: ["foto"] });
    }
  }
});

export default function SolicitarPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ruc: "",
      dni: "",
      email: "",
      representanteLegal: "",
      rubro: "",
      area: "",
      tipo: "NUEVO",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const isRenovacion = values.tipo === "RENOVACION";
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("ruc", values.ruc);
      formData.append("dni", values.dni);
      if (values.email) formData.append("email", values.email);
      formData.append("representanteLegal", values.representanteLegal);
      formData.append("rubro", values.rubro);
      formData.append("area", values.area || "0");
      formData.append("tipo", values.tipo);
      if (!isRenovacion) {
        formData.append("plano", values.plano[0]);
      }
      for (let i = 0; i < values.foto.length; i++) {
        formData.append("fotos", values.foto[i]);
      }

      const response = await axios.post(API_URL, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      toast.success("Solicitud creada con éxito. Redirigiendo al seguimiento...");
      router.push(`/seguimiento/${response.data.ruc}`);
      
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || "Ocurrió un error al enviar la solicitud.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black pt-28 pb-24 relative z-10">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/5 blur-[150px] rounded-full"></div>
      </div>
      
      <div className="max-w-3xl mx-auto px-6 relative z-10">
        <Button variant="ghost" onClick={() => router.back()} className="mb-10 -ml-4 text-white/50 hover:text-white hover:bg-white/5 font-mono uppercase tracking-wider text-xs">
          <ArrowLeft className="mr-2 h-4 w-4" /> Regresar
        </Button>

        <div className="mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">Nueva Solicitud</h1>
          <p className="text-white/40 text-lg">
            Completa los datos para iniciar tu trámite de Licencia de Funcionamiento. Tus datos de empresa se validarán automáticamente con SUNAT.
          </p>
        </div>

        <div className="bg-[#030303] border border-white/10 p-8 sm:p-12 rounded-3xl shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              <div className="grid md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="ruc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-mono uppercase tracking-wider text-white/50">Número de RUC</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ej. 20123456789" 
                          {...field} 
                          onChange={(e) => field.onChange(e.target.value.replace(/\D/g, '').slice(0, 11))}
                          className="h-14 bg-white/5 border-white/10 text-white focus-visible:ring-1 focus-visible:ring-cyan-500/50 rounded-xl px-4 text-base placeholder:text-white/20"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-mono uppercase tracking-wider text-white/50">Tipo de Trámite</FormLabel>
                      <FormControl>
                        <select 
                          className="flex h-14 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-base text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                          {...field}
                        >
                          <option value="NUEVO" className="bg-black">Nueva Licencia</option>
                          <option value="RENOVACION" className="bg-black">Renovación</option>
                          <option value="MODIFICACION" className="bg-black">Modificación de Solicitud</option>
                        </select>
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                  <FormField
                    control={form.control}
                    name="dni"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-mono uppercase tracking-wider text-white/50">DNI del Representante</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ej. 76543210" 
                            {...field} 
                            onChange={(e) => field.onChange(e.target.value.replace(/\D/g, '').slice(0, 8))}
                            className="h-14 bg-white/5 border-white/10 text-white focus-visible:ring-1 focus-visible:ring-cyan-500/50 rounded-xl px-4 text-base placeholder:text-white/20"
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-mono uppercase tracking-wider text-white/50">Correo Electrónico (Opcional)</FormLabel>
                        <FormControl>
                          <Input 
                            type="email"
                            placeholder="ejemplo@correo.com" 
                            {...field} 
                            className="h-14 bg-white/5 border-white/10 text-white focus-visible:ring-1 focus-visible:ring-cyan-500/50 rounded-xl px-4 text-base placeholder:text-white/20"
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                <FormField
                  control={form.control}
                  name="representanteLegal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-mono uppercase tracking-wider text-white/50">Nombres y Apellidos del Titular</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej. Juan Pérez" {...field} className="h-14 bg-white/5 border-white/10 text-white focus-visible:ring-1 focus-visible:ring-cyan-500/50 rounded-xl px-4 text-base placeholder:text-white/20" />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="rubro"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-mono uppercase tracking-wider text-white/50">Rubro del Negocio</FormLabel>
                      <FormControl>
                        <select 
                          className="flex h-14 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-base text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/50"
                          {...field}
                        >
                          <option value="" disabled className="bg-black">Seleccione un rubro</option>
                          <option value="Bodega / Bazar" className="bg-black">Bodega / Bazar</option>
                          <option value="Restaurante / Fuente de Soda" className="bg-black">Restaurante / Fuente de Soda</option>
                          <option value="Farmacia / Botica" className="bg-black">Farmacia / Botica</option>
                          <option value="Ferretería" className="bg-black">Ferretería</option>
                          <option value="Peluquería / Barbería" className="bg-black">Peluquería / Barbería</option>
                          <option value="Librería / Útiles" className="bg-black">Librería / Útiles</option>
                          <option value="Panadería / Pastelería" className="bg-black">Panadería / Pastelería</option>
                          <option value="Oficina Administrativa" className="bg-black">Oficina Administrativa</option>
                          <option value="Otros" className="bg-black">Otros / Actividad Comercial Múltiple</option>
                        </select>
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="area"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-mono uppercase tracking-wider text-white/50">Área del Local (m²)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ej. 120.50" 
                          maxLength={7}
                          {...field} 
                          onChange={(e) => field.onChange(e.target.value.replace(/[^0-9.]/g, ''))}
                          disabled={form.watch("tipo") === "RENOVACION"}
                          onClick={() => {
                            if (form.watch("tipo") === "RENOVACION") {
                              toast.error("Para cambiar el área o los planos, debe solicitar una Modificación.");
                            }
                          }}
                          className={`h-14 border-white/10 text-white focus-visible:ring-1 focus-visible:ring-cyan-500/50 rounded-xl px-4 text-base placeholder:text-white/20 ${form.watch("tipo") === "RENOVACION" ? "bg-white/5 cursor-not-allowed opacity-50" : "bg-white/5"}`}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="bg-[#080808] p-8 rounded-2xl space-y-8 border border-white/5 mt-8">
                <h3 className="font-semibold text-white mb-2 flex items-center gap-3">
                  <UploadCloud size={20} className="text-white/50" /> Documentos Adjuntos
                </h3>
                
                <FormField
                  control={form.control}
                  name="plano"
                  render={({ field: { value, onChange, ...field } }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-mono uppercase tracking-wider text-white/50">Plano de Distribución y Riesgos (PDF/Imagen)</FormLabel>
                      <FormControl>
                        <Input 
                          type="file" 
                          accept="application/pdf, image/*"
                          onChange={(e) => onChange(e.target.files)}
                          disabled={form.watch("tipo") === "RENOVACION"}
                          onClick={(e) => {
                            if (form.watch("tipo") === "RENOVACION") {
                              e.preventDefault();
                              toast.error("Para cambiar el área o los planos, debe solicitar una Modificación o Traslado.");
                            }
                          }}
                          className={`border-white/10 text-white/70 h-auto py-3 file:text-black file:font-medium file:border-0 file:rounded-full file:px-4 file:py-2 file:mr-4 ${form.watch("tipo") === "RENOVACION" ? "bg-white/5 cursor-not-allowed opacity-50" : "bg-white/5 file:bg-white hover:file:bg-white/90 cursor-pointer"}`}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="foto"
                  render={({ field: { value, onChange, ...field } }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-mono uppercase tracking-wider text-white/50">Fotografía de la Fachada (Máx. 4 imágenes)</FormLabel>
                      <FormControl>
                        <Input 
                          type="file" 
                          accept="image/*"
                          multiple
                          onChange={(e) => onChange(e.target.files)}
                          className="border-white/10 text-white/70 h-auto py-3 file:text-black file:font-medium file:border-0 file:rounded-full file:px-4 file:py-2 file:mr-4 bg-white/5 file:bg-white hover:file:bg-white/90 cursor-pointer"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-16 text-lg bg-white hover:bg-white/90 text-black font-bold rounded-2xl transition-all mt-8"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Procesando Solicitud..." : "Enviar Solicitud Oficial"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
