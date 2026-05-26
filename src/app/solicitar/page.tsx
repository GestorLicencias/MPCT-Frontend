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
      formData.append("representanteLegal", values.representanteLegal);
      formData.append("rubro", values.rubro);
      formData.append("area", values.area || "0");
      formData.append("tipo", values.tipo);
      if (!isRenovacion) {
        formData.append("plano", values.plano[0]);
        for (let i = 0; i < values.foto.length; i++) {
          formData.append("fotos", values.foto[i]);
        }
      } else {
        // Send a dummy file to avoid multipart errors if backend expects a file part, 
        // though our updated backend will ignore it. Just to be safe we don't append it, 
        // we will fix backend to handle nulls.
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
    <div className="max-w-2xl mx-auto pt-6 relative z-10">
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none -z-10"></div>
      
      <Button variant="ghost" onClick={() => router.back()} className="mb-6 -ml-4 text-slate-400 hover:text-white hover:bg-slate-800">
        <ArrowLeft className="mr-2 h-4 w-4" /> Volver
      </Button>

      <Card className="bg-slate-900/40 backdrop-blur-xl border-t-4 border-t-cyan-500 border-slate-800 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-3xl text-white">Nueva Solicitud</CardTitle>
          <CardDescription className="text-base text-slate-400">
            Completa los datos para iniciar tu trámite de Licencia de Funcionamiento. Tus datos de empresa se validarán automáticamente con SUNAT.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="ruc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-slate-300">Número de RUC</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ej. 20123456789" 
                          {...field} 
                          onChange={(e) => field.onChange(e.target.value.replace(/\D/g, '').slice(0, 11))}
                          className="h-12 bg-slate-950/50 border-slate-700 text-white focus-visible:ring-cyan-500 placeholder:text-slate-600"
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
                      <FormLabel className="font-semibold text-slate-300">Tipo de Trámite</FormLabel>
                      <FormControl>
                        <select 
                          className="flex h-12 w-full rounded-md border border-slate-700 bg-slate-950/50 px-3 py-2 text-sm text-white ring-offset-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                        >
                          <option value="NUEVO" className="bg-slate-900">Nueva Licencia</option>
                          <option value="RENOVACION" className="bg-slate-900">Renovación</option>
                          <option value="MODIFICACION" className="bg-slate-900">Modificación / Ampliación de Área</option>
                          <option value="TRASLADO" className="bg-slate-900">Traslado de Local</option>
                        </select>
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="dni"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-slate-300">DNI del Representante</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ej. 76543210" 
                          {...field} 
                          onChange={(e) => field.onChange(e.target.value.replace(/\D/g, '').slice(0, 8))}
                          className="h-12 bg-slate-950/50 border-slate-700 text-white focus-visible:ring-cyan-500 placeholder:text-slate-600"
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
                      <FormLabel className="font-semibold text-slate-300">Nombres y Apellidos del Titular</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej. Juan Pérez" {...field} className="h-12 bg-slate-950/50 border-slate-700 text-white focus-visible:ring-cyan-500 placeholder:text-slate-600" />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="rubro"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-slate-300">Rubro del Negocio</FormLabel>
                      <FormControl>
                        <select 
                          className="flex h-12 w-full rounded-md border border-slate-700 bg-slate-950/50 px-3 py-2 text-sm text-white ring-offset-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                          {...field}
                        >
                          <option value="" disabled className="bg-slate-900">Seleccione un rubro</option>
                          <option value="Bodega / Bazar" className="bg-slate-900">Bodega / Bazar</option>
                          <option value="Restaurante / Fuente de Soda" className="bg-slate-900">Restaurante / Fuente de Soda</option>
                          <option value="Farmacia / Botica" className="bg-slate-900">Farmacia / Botica</option>
                          <option value="Ferretería" className="bg-slate-900">Ferretería</option>
                          <option value="Peluquería / Barbería" className="bg-slate-900">Peluquería / Barbería</option>
                          <option value="Librería / Útiles" className="bg-slate-900">Librería / Útiles</option>
                          <option value="Panadería / Pastelería" className="bg-slate-900">Panadería / Pastelería</option>
                          <option value="Oficina Administrativa" className="bg-slate-900">Oficina Administrativa</option>
                          <option value="Otros" className="bg-slate-900">Otros / Actividad Comercial Múltiple</option>
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
                      <FormLabel className="font-semibold text-slate-300">Área del Local (m²)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ej. 120.50" 
                          maxLength={7}
                          {...field} 
                          onChange={(e) => field.onChange(e.target.value.replace(/[^0-9.]/g, ''))}
                          disabled={form.watch("tipo") === "RENOVACION"}
                          onClick={() => {
                            if (form.watch("tipo") === "RENOVACION") {
                              toast.error("Para cambiar el área o los planos, debe solicitar una Modificación o Traslado.");
                            }
                          }}
                          className={`h-12 border-slate-700 text-white focus-visible:ring-cyan-500 placeholder:text-slate-600 ${form.watch("tipo") === "RENOVACION" ? "bg-slate-800/50 cursor-not-allowed text-slate-500" : "bg-slate-950/50"}`}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="bg-slate-800/30 p-6 rounded-lg space-y-6 border border-slate-800">
                <h3 className="font-medium text-slate-200 mb-2 flex items-center gap-2">
                  <UploadCloud size={20} className="text-cyan-400" /> Documentos Adjuntos
                </h3>
                
                <FormField
                  control={form.control}
                  name="plano"
                  render={({ field: { value, onChange, ...field } }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Plano de Distribución y Riesgos (PDF/Imagen)</FormLabel>
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
                          className={`border-slate-700 text-slate-300 file:text-white file:border-0 file:rounded file:px-3 file:py-1 file:mr-3 ${form.watch("tipo") === "RENOVACION" ? "bg-slate-800/50 cursor-not-allowed opacity-50" : "bg-slate-950/50 file:bg-slate-800 hover:file:bg-slate-700 cursor-pointer"}`}
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
                      <FormLabel className="text-slate-300">Fotografía de la Fachada (Máx. 4 imágenes)</FormLabel>
                      <FormControl>
                        <Input 
                          type="file" 
                          accept="image/*"
                          multiple
                          onChange={(e) => onChange(e.target.files)}
                          disabled={form.watch("tipo") === "RENOVACION"}
                          onClick={(e) => {
                            if (form.watch("tipo") === "RENOVACION") {
                              e.preventDefault();
                              toast.error("Para cambiar el área o los planos, debe solicitar una Modificación o Traslado.");
                            }
                          }}
                          className={`border-slate-700 text-slate-300 file:text-white file:border-0 file:rounded file:px-3 file:py-1 file:mr-3 ${form.watch("tipo") === "RENOVACION" ? "bg-slate-800/50 cursor-not-allowed opacity-50" : "bg-slate-950/50 file:bg-slate-800 hover:file:bg-slate-700 cursor-pointer"}`}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 text-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_15px_rgba(8,145,178,0.3)] transition-all"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Enviando Solicitud..." : "Enviar Solicitud"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
