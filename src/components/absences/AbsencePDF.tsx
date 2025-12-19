import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Download, FileText, User, Calendar, Clock, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { clientConfig } from "@/config/client";
import { formatDateLocal } from "@/utils/dateUtils";

interface AbsencePDFProps {
  absenceData: any;
  trigger?: React.ReactNode;
}

const AbsencePDF = ({ absenceData, trigger }: AbsencePDFProps) => {
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);

  const downloadPDF = async () => {
    const element = printRef.current;
    if (!element) return;
    try {
      const module: any = await import('html2pdf.js');
      const html2pdf = module.default || module;
      const filename = `Ausencia_${(absenceData.empleadoNombre || 'Empleado')}_${new Date().toISOString().slice(0, 10)}.pdf`.replace(/\s+/g, '_');
      await html2pdf()
        .set({
          margin: 10,
          filename,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(element)
        .save();

      toast({
        title: "PDF descargado",
        description: "El certificado de ausencia se descargó correctamente.",
      });
    } catch (error) {
      console.error('Error generando PDF', error);
      toast({
        title: "Error al generar PDF",
        description: "Intenta nuevamente.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "No especificado";
    return formatDateLocal(dateString) || "No especificado";
  };

  const calculateDuration = () => {
    const start = new Date(absenceData.fechaInicio);
    const end = new Date(absenceData.fechaFin);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'aprobado': return '#22c55e';
      case 'rechazado': return '#ef4444';
      default: return '#f59e0b';
    }
  };

  const getStatusText = (estado: string) => {
    switch (estado) {
      case 'aprobado': return 'APROBADA';
      case 'rechazado': return 'RECHAZADA';
      default: return 'PENDIENTE';
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Descargar PDF
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Certificado de Ausencia - {absenceData.empleadoNombre}</span>
          </DialogTitle>
        </DialogHeader>

        <div ref={printRef} className="bg-white p-8 space-y-6 text-black" style={{ fontFamily: 'serif', backgroundColor: '#ffffff', color: '#000000' }}>
          {/* Header del Certificado */}
          <div className="text-center border-b-2 pb-4" style={{ borderColor: '#e5e7eb' }}>
            <h1 className="text-2xl font-bold mb-2" style={{ color: '#1f2937' }}>CERTIFICADO DE AUSENCIA</h1>
            <h2 className="text-lg font-semibold" style={{ color: '#4b5563' }}>{clientConfig.nombre.toUpperCase()}</h2>
            <p className="text-sm mt-2" style={{ color: '#6b7280' }}>
              Fecha de Generación: {new Date().toLocaleDateString()}
            </p>
          </div>

          {/* Estado de la Ausencia */}
          <div className="text-center p-4 border-2 rounded-lg" style={{ borderColor: getStatusColor(absenceData.estado), backgroundColor: `${getStatusColor(absenceData.estado)}15` }}>
            <h3 className="text-xl font-bold" style={{ color: getStatusColor(absenceData.estado) }}>
              AUSENCIA {getStatusText(absenceData.estado)}
            </h3>
          </div>

          {/* Datos del Empleado */}
          <Card style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg" style={{ color: '#1f2937' }}>
                <User className="h-5 w-5 mr-2" />
                DATOS DEL EMPLEADO
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong style={{ color: '#1f2937' }}>Nombre y Apellido:</strong>
                <p className="border-b border-dotted pb-1" style={{ borderColor: '#9ca3af', color: '#1f2937' }}>
                  {absenceData.empleadoNombre || "_______________"}
                </p>
              </div>
              <div>
                <strong style={{ color: '#1f2937' }}>DNI:</strong>
                <p className="border-b border-dotted pb-1" style={{ borderColor: '#9ca3af', color: '#1f2937' }}>
                  {absenceData.empleadoDni || "_______________"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Información de la Ausencia */}
          <Card style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg" style={{ color: '#1f2937' }}>
                <Calendar className="h-5 w-5 mr-2" />
                DETALLES DE LA AUSENCIA
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong style={{ color: '#1f2937' }}>Tipo de Ausencia:</strong>
                <p className="border-b border-dotted pb-1 capitalize" style={{ borderColor: '#9ca3af', color: '#1f2937' }}>
                  {absenceData.tipo || "_______________"}
                </p>
              </div>
              <div>
                <strong style={{ color: '#1f2937' }}>Estado:</strong>
                <p className="border-b border-dotted pb-1 uppercase font-semibold" style={{ borderColor: '#9ca3af', color: getStatusColor(absenceData.estado) }}>
                  {getStatusText(absenceData.estado)}
                </p>
              </div>
              <div>
                <strong style={{ color: '#1f2937' }}>Fecha de Inicio:</strong>
                <p className="border-b border-dotted pb-1" style={{ borderColor: '#9ca3af', color: '#1f2937' }}>
                  {formatDate(absenceData.fechaInicio)}
                </p>
              </div>
              <div>
                <strong style={{ color: '#1f2937' }}>Fecha de Fin:</strong>
                <p className="border-b border-dotted pb-1" style={{ borderColor: '#9ca3af', color: '#1f2937' }}>
                  {formatDate(absenceData.fechaFin)}
                </p>
              </div>
              <div>
                <strong style={{ color: '#1f2937' }}>Duración:</strong>
                <p className="border-b border-dotted pb-1" style={{ borderColor: '#9ca3af', color: '#1f2937' }}>
                  {calculateDuration()} día(s)
                </p>
              </div>
              <div>
                <strong style={{ color: '#1f2937' }}>Fecha de Solicitud:</strong>
                <p className="border-b border-dotted pb-1" style={{ borderColor: '#9ca3af', color: '#1f2937' }}>
                  {formatDate(absenceData.created_at || new Date().toISOString())}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Motivo */}
          <Card style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg" style={{ color: '#1f2937' }}>MOTIVO DE LA AUSENCIA</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border p-4 min-h-[80px] text-sm" style={{ borderColor: '#d1d5db', backgroundColor: '#f9fafb', color: '#1f2937' }}>
                {absenceData.motivo || "No se especificó motivo"}
              </div>
            </CardContent>
          </Card>

          {/* Certificación Médica */}
          <Card style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg" style={{ color: '#1f2937' }}>
                <FileText className="h-5 w-5 mr-2" />
                CERTIFICACIÓN MÉDICA
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong style={{ color: '#1f2937' }}>Certificado Médico Requerido:</strong>
                  <p className="border-b border-dotted pb-1" style={{ borderColor: '#9ca3af', color: '#1f2937' }}>
                    {absenceData.certificadoMedico ? "SÍ" : "NO"}
                  </p>
                </div>
                <div>
                  <strong style={{ color: '#1f2937' }}>Archivo Adjunto:</strong>
                  <p className="border-b border-dotted pb-1" style={{ borderColor: '#9ca3af', color: '#1f2937' }}>
                    {absenceData.archivo ? "SÍ" : "NO"}
                  </p>
                </div>
              </div>
              
              {absenceData.certificadoMedico && !absenceData.archivo && (
                <div className="mt-4 p-3 border border-orange-300 bg-orange-50 rounded">
                  <div className="flex items-center">
                    <AlertTriangle className="h-4 w-4 text-orange-600 mr-2" />
                    <p className="text-sm text-orange-800">
                      Se requiere certificado médico pero no se ha adjuntado archivo
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Observaciones */}
          {absenceData.observaciones && (
            <Card style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg" style={{ color: '#1f2937' }}>OBSERVACIONES</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border p-4 min-h-[60px] text-sm" style={{ borderColor: '#d1d5db', backgroundColor: '#f9fafb', color: '#1f2937' }}>
                  {absenceData.observaciones}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Firmas */}
          <div className="grid grid-cols-2 gap-8 mt-8 pt-6" style={{ borderTop: '2px solid #d1d5db' }}>
            <div className="text-center">
              <div className="mt-16 pt-2" style={{ borderTop: '1px solid #4b5563' }}>
                <p className="text-sm font-semibold" style={{ color: '#1f2937' }}>FIRMA DEL EMPLEADO</p>
              </div>
            </div>
            <div className="text-center">
              <div className="mt-16 pt-2" style={{ borderTop: '1px solid #4b5563' }}>
                <p className="text-sm font-semibold" style={{ color: '#1f2937' }}>FIRMA SUPERVISOR</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs mt-8 pt-4" style={{ borderTop: '1px solid #e5e7eb', color: '#6b7280' }}>
            <p>
              Este documento constituye el certificado oficial de ausencia según normativas laborales vigentes.
            </p>
            <p className="mt-1">
              Generado el {new Date().toLocaleDateString()} - Sistema RRHH {clientConfig.nombre}
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-4">
          <Button onClick={downloadPDF} className="flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Descargar PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AbsencePDF;