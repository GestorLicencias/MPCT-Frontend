"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { Badge } from "@/components/ui/badge";
import { FileText, Image as ImageIcon, CheckCircle, XCircle, LogOut, ChevronLeft, ChevronRight, Eye } from "lucide-react";

export default function InspectorPage() {
  const router = useRouter();
  const [inspecciones, setInspecciones] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [observaciones, setObservaciones] = useState("");
  const [archivosObservados, setArchivosObservados] = useState<string[]>([]);
  const [evaluando, setEvaluando] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<{url: string, title: string}[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    fetchPendientes();
  }, []);

  const fetchPendientes = async () => {
    try {
      const res = await api.get("/inspecciones/pendientes");
      setInspecciones(res.data);
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error("Sesión expirada o sin permisos.");
        router.push("/auth/login");
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/auth/login");
  };

  const handleEvaluar = async (conforme: boolean) => {
    if (!conforme && !observaciones.trim()) {
      toast.error("Debe ingresar observaciones para rechazar el trámite.");
      return;
    }
    if (!conforme && archivosObservados.length === 0) {
      toast.error("Debe seleccionar al menos un documento incorrecto.");
      return;
    }
    setEvaluando(true);
    try {
      const formData = new FormData();
      formData.append("conforme", String(conforme));
      if (observaciones) formData.append("observaciones", observaciones);
      if (!conforme && archivosObservados.length > 0) {
        formData.append("archivosObservados", archivosObservados.join(","));
      }

      await api.post(`/inspecciones/${selected.id}/evaluar`, formData);
      toast.success(`Trámite ${conforme ? 'Aprobado' : 'Observado'} correctamente.`);
      setSelected(null);
      setObservaciones("");
      setArchivosObservados([]);
      fetchPendientes();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al evaluar.");
    } finally {
      setEvaluando(false);
    }
  };

  const getAvailableImages = () => {
    if (!selected || !selected.tramite) return [];
    const images = [];
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://mpct-api-264213836001.us-east1.run.app/api/v1";
    if (selected.tramite.archivoFotoUrl) images.push({ url: `${baseUrl}/tramites/${selected.tramite.ruc}/archivos/foto`, title: "Foto 1" });
    if (selected.tramite.archivoFoto2Url) images.push({ url: `${baseUrl}/tramites/${selected.tramite.ruc}/archivos/foto2`, title: "Foto 2" });
    if (selected.tramite.archivoFoto3Url) images.push({ url: `${baseUrl}/tramites/${selected.tramite.ruc}/archivos/foto3`, title: "Foto 3" });
    if (selected.tramite.archivoFoto4Url) images.push({ url: `${baseUrl}/tramites/${selected.tramite.ruc}/archivos/foto4`, title: "Foto 4" });
    return images;
  };

  const openLightbox = (index: number) => {
    setLightboxImages(getAvailableImages());
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <div className="space-y-6 relative z-10">
      <div className="flex justify-between items-center bg-slate-900/50 backdrop-blur-md p-6 rounded-xl shadow-lg border border-slate-800">
        <h2 className="text-2xl font-bold text-white">Bandeja de Inspector</h2>
        <Button variant="outline" onClick={handleLogout} className="text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white">
          <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
        </Button>
      </div>

      <Card className="bg-slate-900/40 backdrop-blur-md border-slate-800 shadow-xl">
        <CardHeader>
          <CardTitle className="text-white">Inspecciones Pendientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-slate-800 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-950/80 border-b border-slate-800">
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-400">Fecha Asignación</TableHead>
                  <TableHead className="text-slate-400">RUC (Trámite)</TableHead>
                  <TableHead className="text-slate-400">Razón Social</TableHead>
                  <TableHead className="text-slate-400">Rubro</TableHead>
                  <TableHead className="text-right text-slate-400">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inspecciones.length === 0 ? (
                  <TableRow className="border-slate-800 hover:bg-transparent">
                    <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                      No hay trámites pendientes de evaluación.
                    </TableCell>
                  </TableRow>
                ) : (
                  inspecciones.map((insp) => (
                    <TableRow key={insp.id} className="border-slate-800 hover:bg-slate-800/50 transition-colors">
                      <TableCell className="text-slate-300">{new Date(insp.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium text-white">{insp.tramite.ruc}</TableCell>
                      <TableCell className="text-slate-300">{insp.tramite.razonSocial}</TableCell>
                      <TableCell><Badge variant="secondary" className="bg-slate-800 text-slate-300 border-slate-700">{insp.tramite.rubro}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button onClick={() => setSelected(insp)} className="bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_10px_rgba(8,145,178,0.3)]">
                          Evaluar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        {selected && (
          <DialogContent className="sm:max-w-[650px] md:max-w-[750px] bg-slate-950/80 backdrop-blur-xl border-slate-800 text-slate-200">
            <DialogHeader className="flex flex-row items-start justify-between pr-8">
              <div>
                <DialogTitle className="text-2xl font-bold flex items-center gap-2 bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                  <CheckCircle className="text-cyan-500 h-6 w-6" />
                  Evaluar Trámite
                </DialogTitle>
                <DialogDescription className="text-slate-400 mt-1">
                  Revisión técnica de establecimiento
                </DialogDescription>
              </div>
              <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 px-3 py-1 mt-1 text-sm whitespace-nowrap">
                Inspección #{selected.numeroInspeccion}
              </Badge>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 py-4 max-h-[75vh] overflow-y-auto custom-scrollbar pr-2">
              <div className="space-y-1 md:col-span-2">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Razón Social</p>
                <p className="font-semibold text-slate-200">{selected.tramite.razonSocial}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">RUC</p>
                <p className="font-semibold text-slate-200 font-mono">{selected.tramite.ruc}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Área</p>
                <p className="font-semibold text-slate-200">{selected.tramite.area} m²</p>
              </div>
              <div className="space-y-1 md:col-span-2">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Domicilio Fiscal</p>
                <p className="font-semibold text-slate-200">{selected.tramite.domicilioFiscal}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Representante Legal</p>
                <p className="font-semibold text-slate-200">{selected.tramite.representanteLegal}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">DNI Representante</p>
                <p className="font-semibold text-slate-200 font-mono">{selected.tramite.dni}</p>
              </div>
              <div className="space-y-2 md:col-span-2">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Rubro / Giro</p>
                <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-800">
                  <p className="text-sm text-slate-300 font-medium whitespace-pre-wrap leading-relaxed">
                    {selected.tramite.rubro}
                  </p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-800 space-y-4 md:col-span-2">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Documentos Técnicos</h4>
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="w-full justify-start bg-slate-900/50 border-slate-700" onClick={() => {
                    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://mpct-api-264213836001.us-east1.run.app/api/v1";
                    window.open(`${baseUrl}/tramites/${selected.tramite.ruc}/archivos/plano?download=true`, "_blank");
                  }}>
                    <FileText className="mr-2 h-4 w-4 text-cyan-500" /> Plano
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-slate-900/50 border-slate-700" onClick={() => openLightbox(0)}>
                    <ImageIcon className="mr-2 h-4 w-4 text-indigo-400" /> Imágenes
                  </Button>
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-800 space-y-3 md:col-span-2">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Evaluación</h4>
                
                <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-lg space-y-3">
                  <p className="text-sm text-slate-400 mb-2">Seleccione los documentos incorrectos (Obligatorio al Observar):</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {['PLANO', 'FOTO1', 'FOTO2', 'FOTO3', 'FOTO4'].map((doc) => (
                      <label key={doc} className="flex items-center space-x-2 cursor-pointer group">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${archivosObservados.includes(doc) ? 'bg-cyan-500 border-cyan-500' : 'border-slate-600 bg-slate-800 group-hover:border-cyan-500'}`}>
                          {archivosObservados.includes(doc) && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={archivosObservados.includes(doc)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setArchivosObservados([...archivosObservados, doc]);
                            } else {
                              setArchivosObservados(archivosObservados.filter(item => item !== doc));
                            }
                          }}
                        />
                        <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                          {doc === 'PLANO' ? 'Plano' : doc.replace('FOTO', 'Foto ')}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <textarea 
                  placeholder="Observaciones o sustento (obligatorio si se observa el trámite)..." 
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="bg-slate-900/50 border-slate-700 text-slate-200 placeholder:text-slate-500 min-h-[100px] w-full rounded-md border px-3 py-2 text-sm focus:ring-cyan-500/50 focus-visible:outline-none focus-visible:ring-2 resize-none mt-2"
                />
              </div>
            </div>
            <DialogFooter className="flex gap-3 sm:justify-end pt-4 border-t border-slate-800">
              <Button 
                variant="outline" 
                onClick={() => handleEvaluar(false)}
                disabled={evaluando}
                className="bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500 hover:text-white"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Observar
              </Button>
              <Button 
                onClick={() => handleEvaluar(true)}
                disabled={evaluando || archivosObservados.length > 0 || observaciones.trim().length > 0}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Aprobar
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Lightbox / Carrusel de Imágenes */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-5xl w-[95vw] h-[90vh] bg-slate-950/95 backdrop-blur-xl border-slate-800 p-0 flex flex-col items-center justify-center shadow-2xl">
          {lightboxImages.length === 0 ? (
            <div className="flex items-center justify-center h-full w-full">
              <p className="text-slate-300 text-lg">No hay imágenes disponibles para esta inspección</p>
            </div>
          ) : (
            <div className="relative w-full h-full flex flex-col items-center justify-center p-6">
              
              {/* Navegación Anterior */}
              <button 
                onClick={() => setLightboxIndex(prev => prev - 1)}
                disabled={lightboxIndex === 0}
                className="absolute left-4 md:left-8 p-3 bg-slate-800/80 hover:bg-cyan-600 rounded-full text-white transition-colors z-10 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-slate-800/80"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>

              {/* Contenido Principal */}
              <div className="w-full h-[75vh] flex items-center justify-center">
                <img 
                  src={lightboxImages[lightboxIndex].url} 
                  alt={lightboxImages[lightboxIndex].title}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-opacity duration-300"
                />
              </div>
              
              {/* Indicador */}
              <div className="absolute bottom-6 bg-slate-900/60 backdrop-blur-md px-4 py-2 rounded-full border border-slate-700">
                <p className="text-slate-300 font-medium tracking-widest">{lightboxIndex + 1} / {lightboxImages.length}</p>
              </div>

              {/* Navegación Siguiente */}
              <button 
                onClick={() => setLightboxIndex(prev => prev + 1)}
                disabled={lightboxIndex === lightboxImages.length - 1}
                className="absolute right-4 md:right-8 p-3 bg-slate-800/80 hover:bg-cyan-600 rounded-full text-white transition-colors z-10 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-slate-800/80"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      <RevisionTramitesSection />
    </div>
  );
}

function RevisionTramitesSection() {
  const [tramites, setTramites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [aprobarLoading, setAprobarLoading] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<{url: string, title: string}[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    fetchTramites();
  }, []);

  const fetchTramites = async () => {
    try {
      const res = await api.get("/admin/tramites/revision");
      setTramites(res.data);
    } catch (error) {
      console.error("Error fetching tramites", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAprobar = async (ruc: string) => {
    setAprobarLoading(true);
    try {
      await api.post(`/admin/tramites/${ruc}/aprobar-revision`);
      toast.success("Trámite aprobado y licencia generada con éxito.");
      setSelected(null);
      fetchTramites();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al aprobar el trámite.");
    } finally {
      setAprobarLoading(false);
    }
  };

  const openLightbox = (tramite: any, index: number) => {
    const images = [];
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://mpct-api-264213836001.us-east1.run.app/api/v1";
    if (tramite.archivoFotoUrl) images.push({ url: `${baseUrl}/tramites/${tramite.ruc}/archivos/foto`, title: "Foto 1" });
    if (tramite.archivoFoto2Url) images.push({ url: `${baseUrl}/tramites/${tramite.ruc}/archivos/foto2`, title: "Foto 2" });
    if (tramite.archivoFoto3Url) images.push({ url: `${baseUrl}/tramites/${tramite.ruc}/archivos/foto3`, title: "Foto 3" });
    if (tramite.archivoFoto4Url) images.push({ url: `${baseUrl}/tramites/${tramite.ruc}/archivos/foto4`, title: "Foto 4" });
    
    if (images.length === 0) {
      images.push({ url: `${baseUrl}/tramites/${tramite.ruc}/archivos/foto`, title: "Foto" });
    }

    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <>
      <Card className="bg-slate-900/40 backdrop-blur-md border-slate-800 shadow-xl mt-6">
        <CardHeader>
          <CardTitle className="text-white">Revisión de Modificaciones / Traslados</CardTitle>
          <CardDescription className="text-slate-400">Apruebe las solicitudes que requieren revisión manual.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center text-slate-500 py-10">Cargando trámites...</div>
          ) : tramites.length === 0 ? (
            <div className="text-center text-slate-500 py-10">No hay trámites pendientes de revisión.</div>
          ) : (
            <div className="space-y-4">
              {tramites.map((tramite) => (
                <div key={tramite.id} className="bg-slate-950/50 p-4 rounded-lg border border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 hover:border-cyan-800/50 transition-colors">
                  <div className="flex-1 w-full space-y-1">
                    <h4 className="font-semibold text-slate-200">Trámite RUC: {tramite.ruc} <span className="ml-2 text-xs bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded">{tramite.tipo}</span></h4>
                    <p className="text-sm text-slate-400">{tramite.razonSocial}</p>
                    <p className="text-xs text-slate-500 font-mono">Área: {tramite.area} m²</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <Button 
                      className="bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_10px_rgba(8,145,178,0.3)]"
                      onClick={() => setSelected(tramite)}
                    >
                       Evaluar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        {selected && (
          <DialogContent className="sm:max-w-[600px] bg-slate-950/80 backdrop-blur-xl border-slate-800 text-slate-200">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-white">Revisión Técnica - {selected.tipo}</DialogTitle>
              <DialogDescription className="text-slate-400">RUC: {selected.ruc} - {selected.razonSocial}</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400">Área Solicitada</p>
                  <p className="font-semibold">{selected.area} m²</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Dirección</p>
                  <p className="font-semibold text-sm">{selected.domicilioFiscal}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-800">
                <h4 className="text-xs font-semibold text-slate-300 uppercase mb-3">Documentos</h4>
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="w-full justify-start bg-slate-900/50 border-slate-700" onClick={() => {
                    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://mpct-api-264213836001.us-east1.run.app/api/v1";
                    window.open(`${baseUrl}/tramites/${selected.ruc}/archivos/plano?download=true`, "_blank");
                  }}>
                    Descargar Plano PDF
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-slate-900/50 border-slate-700" onClick={() => openLightbox(selected, 0)}>
                    <Eye className="mr-2 h-4 w-4 text-indigo-400" /> Ver Fotografías
                  </Button>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t border-slate-800">
                <Button 
                  variant="outline" 
                  onClick={() => setSelected(null)}
                  className="border-slate-700 hover:bg-slate-800 text-slate-300"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={() => handleAprobar(selected.ruc)}
                  disabled={aprobarLoading}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  {aprobarLoading ? "Aprobando..." : "Aprobar y Emitir Licencia"}
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-5xl w-[95vw] h-[90vh] bg-slate-950/95 backdrop-blur-xl border-slate-800 p-0 flex flex-col items-center justify-center shadow-2xl">
          {lightboxImages.length === 0 ? (
            <div className="flex items-center justify-center h-full w-full">
              <p className="text-slate-300 text-lg">No hay imágenes disponibles</p>
            </div>
          ) : (
            <div className="relative w-full h-full flex flex-col items-center justify-center p-6">
              <button 
                onClick={() => setLightboxIndex(prev => prev - 1)}
                disabled={lightboxIndex === 0}
                className="absolute left-4 md:left-8 p-3 bg-slate-800/80 hover:bg-cyan-600 rounded-full text-white transition-colors z-10 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                &larr;
              </button>
              <div className="w-full h-[75vh] flex items-center justify-center">
                <img 
                  src={lightboxImages[lightboxIndex].url} 
                  alt={lightboxImages[lightboxIndex].title}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-opacity duration-300"
                />
              </div>
              <div className="absolute bottom-6 bg-slate-900/60 backdrop-blur-md px-4 py-2 rounded-full border border-slate-700">
                <p className="text-slate-300 font-medium tracking-widest">{lightboxIndex + 1} / {lightboxImages.length}</p>
                <Button variant="ghost" size="sm" className="ml-4 text-cyan-400 hover:text-cyan-300" onClick={() => window.open(lightboxImages[lightboxIndex].url + "?download=true", "_blank")}>Descargar esta foto</Button>
              </div>
              <button 
                onClick={() => setLightboxIndex(prev => prev + 1)}
                disabled={lightboxIndex === lightboxImages.length - 1}
                className="absolute right-4 md:right-8 p-3 bg-slate-800/80 hover:bg-cyan-600 rounded-full text-white transition-colors z-10 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                &rarr;
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
