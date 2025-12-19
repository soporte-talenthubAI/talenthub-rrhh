import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Edit, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import html2pdf from "html2pdf.js";
import { clientConfig } from "@/config/client";
import { formatDateLocal, getCurrentDateString } from "@/utils/dateUtils";

interface TrainingDetailProps {
  training: any;
  onBack: () => void;
}

const TrainingDetail = ({ training, onBack }: TrainingDetailProps) => {
  const { toast } = useToast();

  const generateCertificate = async () => {
    try {
      const empleado = training.empleadoNombre || "Empleado";
      const titulo = training.titulo || "Capacitación";
      const fecha = training.fecha ? formatDateLocal(training.fecha) : formatDateLocal(getCurrentDateString());
      const horas = training.duracion || 0;
      const instructor = training.instructor || "Instructor";
      const filename = `Certificado_${empleado.replace(/\s+/g, '_')}_${titulo.replace(/\s+/g, '_')}.pdf`;

      const content = `
        <div style="font-family: Arial, sans-serif; padding: 32px; color: #111827; background: #ffffff;">
          <div style="text-align:center; border-bottom: 2px solid #e5e7eb; padding-bottom: 12px; margin-bottom: 24px;">
            <h1 style="margin: 0; font-size: 22px;">CERTIFICADO OFICIAL DE CAPACITACIÓN</h1>
            <p style="margin: 6px 0 0 0; color: #6b7280;">${clientConfig.nombre}</p>
          </div>

          <p style="font-size: 14px; line-height: 1.6;">
            Por medio de la presente, certificamos que <strong>${empleado}</strong> ha completado la capacitación
            <strong>"${titulo}"</strong>, realizada el día <strong>${fecha}</strong>, con una duración total de
            <strong>${horas} horas</strong>, dictada por <strong>${instructor}</strong>.
          </p>

          <div style="margin-top: 16px; font-size: 13px; color: #374151;">
            <p style="margin: 4px 0;">• Estado: ${training.estado === 'completado' ? 'Completado' : 'En Progreso'}</p>
            <p style="margin: 4px 0;">• Tipo: ${training.tipo || 'General'}</p>
            ${training.certificacion ? '<p style="margin: 4px 0;">• Otorga certificación oficial (validez 2 años)</p>' : ''}
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-top: 64px;">
            <div style="text-align:center;">
              <div style="margin-top: 64px; padding-top: 6px; border-top: 1px solid #4b5563;"></div>
              <p style="font-size: 12px; font-weight: 600; margin: 4px 0 0 0;">FIRMA DEL EMPLEADO</p>
            </div>
            <div style="text-align:center;">
              <div style="margin-top: 64px; padding-top: 6px; border-top: 1px solid #4b5563;"></div>
              <p style="font-size: 12px; font-weight: 600; margin: 4px 0 0 0;">FIRMA Y SELLO</p>
            </div>
          </div>

          <div style="text-align:center; font-size: 11px; color:#6b7280; margin-top: 24px; border-top: 1px solid #e5e7eb; padding-top: 12px;">
            Generado el ${new Date().toLocaleDateString()} - Sistema RRHH ${clientConfig.nombre}
          </div>
        </div>
      `;

      const container = document.createElement('div');
      container.innerHTML = content;
      document.body.appendChild(container);

      const opt = {
        margin: 10,
        filename,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      } as const;

      const worker = (html2pdf as any)().from(container).set(opt).toPdf();
      const pdf = await worker.get('pdf');
      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      container.remove();

      toast({
        title: "Descarga iniciada",
        description: "El certificado se está descargando.",
      });
    } catch (error) {
      toast({
        title: "Error al generar certificado",
        description: "Intenta nuevamente.",
        variant: "destructive",
      });
    }
  };

  const generateAttendance = async () => {
    try {
      const empleado = training.empleadoNombre || "Empleado";
      const titulo = training.titulo || "Capacitación";
      const fecha = training.fecha ? formatDateLocal(training.fecha) : formatDateLocal(getCurrentDateString());
      const horas = training.duracion || 0;
      const filename = `Constancia_Asistencia_${empleado.replace(/\s+/g, '_')}_${titulo.replace(/\s+/g, '_')}.pdf`;

      const content = `
        <div style="font-family: Arial, sans-serif; padding: 32px; color: #111827; background: #ffffff;">
          <div style="text-align:center; border-bottom: 2px solid #e5e7eb; padding-bottom: 12px; margin-bottom: 24px;">
            <h1 style="margin: 0; font-size: 22px;">CONSTANCIA DE ASISTENCIA</h1>
            <p style="margin: 6px 0 0 0; color: #6b7280;">${clientConfig.nombre}</p>
          </div>

          <p style="font-size: 14px; line-height: 1.6;">
            Se deja constancia de que <strong>${empleado}</strong> asistió a la capacitación
            <strong>"${titulo}"</strong>, realizada el día <strong>${fecha}</strong>, con una duración de
            <strong>${horas} horas</strong>.
          </p>

          ${training.instructor ? `<p style="font-size: 13px; color: #374151; margin-top: 8px;">Dictada por: <strong>${training.instructor}</strong></p>` : ''}

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-top: 64px;">
            <div style="text-align:center;">
              <div style="margin-top: 64px; padding-top: 6px; border-top: 1px solid #4b5563;"></div>
              <p style="font-size: 12px; font-weight: 600; margin: 4px 0 0 0;">FIRMA DEL EMPLEADO</p>
            </div>
            <div style="text-align:center;">
              <div style="margin-top: 64px; padding-top: 6px; border-top: 1px solid #4b5563;"></div>
              <p style="font-size: 12px; font-weight: 600; margin: 4px 0 0 0;">RESPONSABLE DEL ÁREA</p>
            </div>
          </div>

          <div style="text-align:center; font-size: 11px; color:#6b7280; margin-top: 24px; border-top: 1px solid #e5e7eb; padding-top: 12px;">
            Generado el ${new Date().toLocaleDateString()} - Sistema RRHH ${clientConfig.nombre}
          </div>
        </div>
      `;

      const container = document.createElement('div');
      container.innerHTML = content;
      document.body.appendChild(container);

      const opt = {
        margin: 10,
        filename,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      } as const;

      const worker = (html2pdf as any)().from(container).set(opt).toPdf();
      const pdf = await worker.get('pdf');
      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      container.remove();

      toast({
        title: "Descarga iniciada",
        description: "La constancia se está descargando.",
      });
    } catch (error) {
      toast({
        title: "Error al generar constancia",
        description: "Intenta nuevamente.",
        variant: "destructive",
      });
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Detalle de Capacitación</h2>
            <p className="text-foreground/70">Información completa de la capacitación</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={generateAttendance}>
            <Download className="h-4 w-4 mr-2" />
            Constancia Asistencia
          </Button>
          {training.certificacion && (
            <Button variant="outline" onClick={generateCertificate}>
              <Award className="h-4 w-4 mr-2" />
              Certificado Oficial
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información de la Capacitación */}
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Información de la Capacitación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-foreground/70">Título</p>
              <p className="text-foreground font-semibold">{training.titulo}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-foreground/70">Tipo</p>
              <Badge variant="outline">
                {training.tipo === "seguridad" ? "Seguridad e Higiene" : 
                 training.tipo === "tecnico" ? "Técnico - Operativo" : 
                 training.tipo === "administrativo" ? "Administrativo" : "Calidad"}
              </Badge>
            </div>
            
            <div>
              <p className="text-sm font-medium text-foreground/70">Fecha</p>
              <p className="text-foreground">{formatDateLocal(training.fecha)}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-foreground/70">Duración</p>
              <p className="text-foreground font-semibold">{training.duracion} horas</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-foreground/70">Instructor/Entidad</p>
              <p className="text-foreground">{training.instructor}</p>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground/70">Estado</p>
              <Badge variant={training.estado === "completado" ? "success" : "warning"}>
                {training.estado === "completado" ? "Completado" : "En Progreso"}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground/70">Certificación Oficial</p>
              {training.certificacion ? (
                <Badge variant="success">Sí</Badge>
              ) : (
                <Badge variant="outline">No</Badge>
              )}
            </div>

            {training.observaciones && (
              <div>
                <p className="text-sm font-medium text-foreground/70">Observaciones</p>
                <p className="text-foreground text-sm">{training.observaciones}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Información del Empleado */}
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Información del Empleado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-foreground/70">Nombre Completo</p>
              <p className="text-foreground font-semibold">{training.empleadoNombre}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-foreground/70">Cargo</p>
              <p className="text-foreground">Encargado</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-foreground/70">Sector</p>
              <p className="text-foreground">Incubación</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-foreground/70">Fecha de Ingreso</p>
              <p className="text-foreground">12/05/2018</p>
            </div>

            <div>
              <p className="text-sm font-medium text-foreground/70">Antigüedad</p>
              <p className="text-foreground">6 años, 6 meses</p>
            </div>

            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium text-foreground/70 mb-2">Capacitaciones Completadas</p>
              <p className="text-2xl font-bold text-primary">12</p>
              <p className="text-xs text-foreground/60">en los últimos 2 años</p>
            </div>
          </CardContent>
        </Card>

        {/* Historial y Seguimiento */}
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Historial y Seguimiento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h4 className="font-medium text-foreground">Capacitaciones Relacionadas</h4>
              
              <div className="space-y-2">
                <div className="p-3 bg-success/10 rounded-lg border-l-4 border-success">
                  <p className="font-medium text-foreground text-sm">Bioseguridad Básica</p>
                  <p className="text-xs text-foreground/70">Completado - 15/01/2024</p>
                </div>
                
                <div className="p-3 bg-success/10 rounded-lg border-l-4 border-success">
                  <p className="font-medium text-foreground text-sm">Manejo de Incubadoras</p>
                  <p className="text-xs text-foreground/70">Completado - 20/08/2023</p>
                </div>
                
                <div className="p-3 bg-warning/10 rounded-lg border-l-4 border-warning">
                  <p className="font-medium text-foreground text-sm">Actualización Equipos</p>
                  <p className="text-xs text-foreground/70">Programado - 15/12/2024</p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-primary/10 rounded-lg">
              <h4 className="font-medium text-foreground mb-2">Evaluación de Desempeño</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground/70">Comprensión</span>
                  <span className="text-foreground font-medium">Excelente</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-foreground/70">Aplicación Práctica</span>
                  <span className="text-foreground font-medium">Muy Bueno</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-foreground/70">Participación</span>
                  <span className="text-foreground font-medium">Excelente</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-muted/30 rounded-lg">
              <h4 className="font-medium text-foreground mb-2">Próximas Acciones</h4>
              <ul className="text-sm text-foreground/70 space-y-1">
                <li>• Evaluación post-capacitación (30 días)</li>
                <li>• Seguimiento aplicación práctica</li>
                <li>• Programar capacitación avanzada</li>
              </ul>
            </div>

            {training.certificacion && (
              <div className="p-3 bg-success/10 rounded-lg border border-success/20">
                <div className="flex items-center space-x-2 mb-2">
                  <Award className="h-4 w-4 text-success" />
                  <p className="font-medium text-foreground">Certificación Oficial</p>
                </div>
                <p className="text-sm text-foreground/70">
                  Esta capacitación otorga certificación oficial válida por 2 años.
                </p>
                <p className="text-xs text-foreground/60 mt-1">
                  Vencimiento: {new Date(new Date(training.fecha).getTime() + 2 * 365 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TrainingDetail;