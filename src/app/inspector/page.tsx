"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
      const resInsp = await api.get("/inspecciones/pendientes");
      
      const mappedInsp = resInsp.data.map((insp: any) => ({
        ...insp,
        isInspeccion: true,
        sortDate: new Date(insp.createdAt).getTime(),
        displayDate: insp.createdAt,
        displayRuc: insp.tramite.ruc,
        displayRazon: insp.tramite.razonSocial,
        displayRubro: insp.tramite.rubro,
        displayTipo: insp.tramite.tipo,
        tramiteObj: insp.tramite
      }));

      const combined = mappedInsp.sort((a: any, b: any) => b.sortDate - a.sortDate);
      setInspecciones(combined);
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
    if (!selected || !selected.tramiteObj) return [];
    const images = [];
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://mpct-api-264213836001.us-east1.run.app/api/v1";
    const tr = selected.tramiteObj;
    if (tr.archivoFotoUrl) images.push({ url: `${baseUrl}/tramites/${tr.ruc}/archivos/foto`, title: "Foto 1" });
    if (tr.archivoFoto2Url) images.push({ url: `${baseUrl}/tramites/${tr.ruc}/archivos/foto2`, title: "Foto 2" });
    if (tr.archivoFoto3Url) images.push({ url: `${baseUrl}/tramites/${tr.ruc}/archivos/foto3`, title: "Foto 3" });
    if (tr.archivoFoto4Url) images.push({ url: `${baseUrl}/tramites/${tr.ruc}/archivos/foto4`, title: "Foto 4" });
    
    if (images.length === 0) {
      images.push({ url: `${baseUrl}/tramites/${tr.ruc}/archivos/foto`, title: "Foto" });
    }
    return images;
  };

  const openLightbox = (index: number) => {
    setLightboxImages(getAvailableImages());
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <div className="space-y-6 relative z-10 min-h-screen">
      {/* Background Ambience */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="flex justify-between items-center bg-[#030303] border border-white/10 p-6 rounded-3xl shadow-2xl relative z-10">
        <h2 className="text-2xl font-bold text-white tracking-tight">Bandeja de Inspector</h2>
        <Button variant="outline" onClick={handleLogout} className="text-white/70 border-white/10 hover:bg-white/10 hover:text-white rounded-xl">
          <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
        </Button>
      </div>

      <Card className="bg-[#030303] border-white/10 shadow-2xl rounded-3xl relative z-10">
        <CardHeader>
          <CardTitle className="text-white text-xl tracking-tight">Inspecciones y Revisiones Pendientes</CardTitle>
          <CardDescription className="text-white/50 text-sm">
            Trámites de Licencia Nueva, Renovación y Modificación asignados o pendientes de revisión.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl border border-white/10 overflow-hidden bg-black/50">
            <Table>
              <TableHeader className="bg-black border-b border-white/10">
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-xs font-mono uppercase tracking-wider text-white/50">Fecha</TableHead>
                  <TableHead className="text-xs font-mono uppercase tracking-wider text-white/50">RUC</TableHead>
                  <TableHead className="text-xs font-mono uppercase tracking-wider text-white/50">Razón Social</TableHead>
                  <TableHead className="text-xs font-mono uppercase tracking-wider text-white/50">Tipo / Rubro</TableHead>
                  <TableHead className="text-right text-xs font-mono uppercase tracking-wider text-white/50">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inspecciones.length === 0 ? (
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableCell colSpan={5} className="text-center py-8 text-white/40">
                      No hay trámites pendientes de evaluación.
                    </TableCell>
                  </TableRow>
                ) : (
                  inspecciones.map((item) => (
                    <TableRow key={`insp-${item.id}`} className="border-white/10 hover:bg-white/5 transition-colors">
                      <TableCell className="text-white/70">{new Date(item.displayDate).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium text-white">{item.displayRuc}</TableCell>
                      <TableCell className="text-white/70">{item.displayRazon}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`mr-2 rounded-lg font-mono text-[10px] uppercase tracking-wider ${item.displayTipo === 'MODIFICACION' ? 'text-amber-400 border-amber-400/30' : 'text-blue-400 border-blue-400/30'}`}>
                          {item.displayTipo}
                        </Badge>
                        <Badge variant="secondary" className="bg-white/5 text-white/70 border-white/10 rounded-lg font-mono text-[10px] uppercase tracking-wider">{item.displayRubro}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button onClick={() => setSelected(item)} className="bg-white text-black hover:bg-white/90 rounded-xl font-semibold shadow-[0_0_15px_rgba(255,255,255,0.1)]">
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

      <Dialog open={!!selected} onOpenChange={(open) => {
          if (!open) {
              setSelected(null);
              setObservaciones("");
              setArchivosObservados([]);
          }
      }}>
        {selected && (
          <DialogContent className="sm:max-w-[650px] md:max-w-[750px] bg-[#080808] border-white/10 text-white rounded-3xl shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-white tracking-tight">Evaluación - {selected.displayTipo}</DialogTitle>
              <DialogDescription className="text-white/50">RUC: {selected.displayRuc} - {selected.displayRazon}</DialogDescription>
            </DialogHeader>
            <div className="py-4 max-h-[70vh] overflow-y-auto pr-2 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1">
                  <p className="text-xs font-mono uppercase tracking-wider text-white/50">Área del Local</p>
                  <p className="text-xl font-bold text-white">{selected.tramiteObj.area} m²</p>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1">
                  <p className="text-xs font-mono uppercase tracking-wider text-white/50">Estado de Evaluación</p>
                  <Badge variant="outline" className="text-amber-400 border-amber-400/30 rounded-lg font-mono text-[10px] uppercase tracking-wider mt-1">Pendiente</Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
                <div className="space-y-1">
                  <p className="text-xs font-mono uppercase tracking-wider text-white/50">Dirección Fiscal</p>
                  <p className="font-semibold text-white/90">{selected.tramiteObj.domicilioFiscal}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-mono uppercase tracking-wider text-white/50">Representante Legal</p>
                  <p className="font-semibold text-white/90">{selected.tramiteObj.representanteLegal}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-mono uppercase tracking-wider text-white/50">DNI Representante</p>
                  <p className="font-semibold text-white/90 font-mono">{selected.tramiteObj.dni}</p>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <p className="text-xs font-mono uppercase tracking-wider text-white/50">Rubro / Giro</p>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                    <p className="text-sm text-white/70 font-medium whitespace-pre-wrap leading-relaxed">
                      {selected.tramiteObj.rubro}
                    </p>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-white/10 space-y-4 md:col-span-2">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-white/50">Documentos Técnicos</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" className="w-full justify-start bg-white/5 border-white/10 hover:bg-white/10 text-white rounded-xl" onClick={async () => {
                      try {
                        const res = await api.get(`/tramites/${selected.tramiteObj.ruc}/archivos/plano`, { responseType: 'blob' });
                        const contentType = res.headers['content-type'] || '';
                        let ext = 'pdf';
                        if (contentType.includes('image/jpeg')) ext = 'jpg';
                        else if (contentType.includes('image/png')) ext = 'png';
                        else if (contentType.includes('image/')) ext = contentType.split('/')[1];
                        
                        const url = window.URL.createObjectURL(new Blob([res.data], { type: contentType }));
                        const link = document.createElement('a');
                        link.href = url;
                        link.setAttribute('download', `Plano_${selected.tramiteObj.ruc}.${ext}`);
                        document.body.appendChild(link);
                        link.click();
                        link.parentNode?.removeChild(link);
                      } catch (e) {
                        toast.error("Error al descargar el plano.");
                      }
                    }}>
                      <FileText className="mr-2 h-4 w-4 text-white/70" /> Plano
                    </Button>
                    <Button variant="outline" className="w-full justify-start bg-white/5 border-white/10 hover:bg-white/10 text-white rounded-xl" onClick={() => openLightbox(0)}>
                      <ImageIcon className="mr-2 h-4 w-4 text-white/70" /> Imágenes
                    </Button>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-white/10 space-y-3 md:col-span-2">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-white/50">Evaluación</h4>
                  
                  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-3">
                    <p className="text-sm text-white/50 mb-2">Seleccione los documentos incorrectos (Obligatorio al Observar):</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {['PLANO', 'FOTO1', 'FOTO2', 'FOTO3', 'FOTO4'].map((doc) => (
                        <label key={doc} className="flex items-center space-x-2 cursor-pointer group">
                          <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${archivosObservados.includes(doc) ? 'bg-white border-white' : 'border-white/20 bg-black group-hover:border-white/50'}`}>
                            {archivosObservados.includes(doc) && <CheckCircle className="w-3.5 h-3.5 text-black" />}
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
                          <span className="text-sm text-white/70 group-hover:text-white transition-colors">
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
                    className="bg-black border-white/10 text-white placeholder:text-white/40 min-h-[100px] w-full rounded-xl border px-3 py-2 text-sm focus:ring-white/30 focus-visible:outline-none focus-visible:ring-2 resize-none mt-2"
                  />
                </div>
              </div>
            </div>
              <DialogFooter className="flex gap-3 sm:justify-end pt-4 border-t border-white/10">
                <Button 
                  variant="outline" 
                  onClick={() => handleEvaluar(false)}
                  disabled={evaluando}
                  className="bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 rounded-xl"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Observar
                </Button>
                <Button 
                  onClick={() => handleEvaluar(true)}
                  disabled={evaluando || archivosObservados.length > 0 || observaciones.trim().length > 0}
                  className="bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
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
        <DialogContent className="max-w-5xl w-[95vw] h-[90vh] bg-[#030303]/95 backdrop-blur-xl border-white/10 p-0 flex flex-col items-center justify-center shadow-2xl rounded-3xl">
          {lightboxImages.length === 0 ? (
            <div className="flex items-center justify-center h-full w-full">
              <p className="text-white/70 text-lg">No hay imágenes disponibles para esta inspección</p>
            </div>
          ) : (
            <div className="relative w-full h-full flex flex-col items-center justify-center p-6">
              
              <button 
                onClick={() => setLightboxIndex(prev => prev - 1)}
                disabled={lightboxIndex === 0}
                className="absolute left-4 md:left-8 p-3 bg-white/10 border border-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white/10"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>

              <div className="w-full h-[75vh] flex items-center justify-center">
                <img 
                  src={lightboxImages[lightboxIndex].url} 
                  alt={lightboxImages[lightboxIndex].title}
                  className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl transition-opacity duration-300"
                />
              </div>
              
              <div className="absolute bottom-6 bg-black/60 backdrop-blur-md px-6 py-2 rounded-full border border-white/10">
                <p className="text-white/70 font-mono tracking-widest text-sm">{lightboxIndex + 1} / {lightboxImages.length}</p>
              </div>

              <button 
                onClick={() => setLightboxIndex(prev => prev + 1)}
                disabled={lightboxIndex === lightboxImages.length - 1}
                className="absolute right-4 md:right-8 p-3 bg-white/10 border border-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white/10"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
