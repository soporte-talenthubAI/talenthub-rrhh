import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, FileText, Calendar, User, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAbsences } from "@/hooks/useAbsences";
import AbsencePDF from "./AbsencePDF";
import { formatDateLocal } from "@/utils/dateUtils";

interface AbsenceDetailProps {
  absence: any;
  onBack: () => void;
}

const AbsenceDetail = ({ absence, onBack }: AbsenceDetailProps) => {
  const { toast } = useToast();
  const { updateAbsence } = useAbsences();

  const downloadCertificate = () => {
    toast({
      title: "Descargando archivo",
      description: "El certificado se está descargando...",
    });
  };

  const approveAbsence = async () => {
    try {
      await updateAbsence(absence.id, { estado: 'aprobado' });
      toast({
        title: "Ausencia aprobada",
        description: "La ausencia ha sido aprobada exitosamente",
      });
      // Actualizar el estado local inmediatamente
      absence.estado = 'aprobado';
      // Volver a la lista para mostrar los cambios
      setTimeout(() => onBack(), 1000);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo aprobar la ausencia",
        variant: "destructive"
      });
    }
  };

  const rejectAbsence = async () => {
    try {
      await updateAbsence(absence.id, { estado: 'rechazado' });
      toast({
        title: "Ausencia rechazada",
        description: "La ausencia ha sido rechazada",
        variant: "destructive"
      });
      // Actualizar el estado local inmediatamente
      absence.estado = 'rechazado';
      // Volver a la lista para mostrar los cambios
      setTimeout(() => onBack(), 1000);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo rechazar la ausencia",
        variant: "destructive"
      });
    }
  };

  const calculateDuration = () => {
    const start = new Date(absence.fechaInicio);
    const end = new Date(absence.fechaFin);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a la Lista
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Detalle de Ausencia</h2>
            <p className="text-foreground/70">{absence.empleadoNombre}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          {/* Botón PDF - siempre visible para testing */}
          <AbsencePDF 
            absenceData={absence}
            trigger={
              <Button variant="outline" className="bg-blue-50 hover:bg-blue-100 border-blue-200">
                <Download className="h-4 w-4 mr-2" />
                Certificado PDF
              </Button>
            }
          />
          {(absence.certificadoMedico || absence.archivo) && (
            <Button variant="outline" onClick={downloadCertificate}>
              <Download className="h-4 w-4 mr-2" />
              Descargar Archivo
            </Button>
          )}
          {absence.estado === "pendiente" && (
            <>
              <Button variant="outline" onClick={rejectAbsence}>
                Rechazar
              </Button>
              <Button onClick={approveAbsence}>
                Aprobar
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información Principal */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Información de la Ausencia</span>
              </CardTitle>
              <Badge variant={absence.estado === "aprobado" ? "default" : absence.estado === "pendiente" ? "secondary" : "destructive"}>
                {absence.estado === "aprobado" ? "Aprobado" : absence.estado === "pendiente" ? "Pendiente" : "Rechazado"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Empleado</h4>
                  <p className="text-foreground">{absence.empleadoNombre}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Tipo de Ausencia</h4>
                  <Badge variant="outline" className="capitalize">{absence.tipo}</Badge>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-2">Duración</h4>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-foreground/60" />
                    <span className="text-foreground">{calculateDuration()} día(s)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Fecha de Inicio</h4>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-foreground/60" />
                    <span className="text-foreground">{formatDateLocal(absence.fechaInicio)}</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-2">Fecha de Fin</h4>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-foreground/60" />
                    <span className="text-foreground">{formatDateLocal(absence.fechaFin)}</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-2">Fecha de Solicitud</h4>
                  <p className="text-foreground/70">{formatDateLocal(absence.fechaSolicitud)}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">Motivo</h4>
              <p className="text-foreground bg-muted/30 p-3 rounded-lg">{absence.motivo}</p>
            </div>

            {absence.observaciones && (
              <div>
                <h4 className="font-semibold text-foreground mb-2">Observaciones</h4>
                <p className="text-foreground bg-muted/30 p-3 rounded-lg">{absence.observaciones}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Panel Lateral */}
        <div className="space-y-6">
          {/* Documentación */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Documentación</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-foreground mb-2">Certificado Médico</h4>
                <Badge variant={absence.certificadoMedico ? "default" : "secondary"}>
                  {absence.certificadoMedico ? "Requerido" : "No requerido"}
                </Badge>
              </div>

              {absence.archivo && (
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Archivo Adjunto</h4>
                  <div className="flex items-center space-x-2 p-3 bg-muted/30 rounded-lg">
                    <FileText className="h-4 w-4 text-foreground/60" />
                    <span className="text-sm text-foreground">{absence.archivo}</span>
                  </div>
                  <Button variant="outline" size="sm" className="mt-2" onClick={downloadCertificate}>
                    <Download className="h-4 w-4 mr-1" />
                    Descargar
                  </Button>
                </div>
              )}

              {!absence.archivo && absence.certificadoMedico && (
                <div className="p-3 bg-warning/10 rounded-lg border border-warning/20">
                  <p className="text-sm text-warning">
                    Se requiere certificado médico pero no se ha adjuntado archivo
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Acciones Rápidas */}
          {absence.estado === "pendiente" && (
            <Card>
              <CardHeader>
                <CardTitle>Acciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" onClick={approveAbsence}>
                  Aprobar Ausencia
                </Button>
                <Button variant="outline" className="w-full" onClick={rejectAbsence}>
                  Rechazar Ausencia
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Información del Estado */}
          <Card>
            <CardHeader>
              <CardTitle>Estado de la Solicitud</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <Badge 
                  variant={absence.estado === "aprobado" ? "default" : absence.estado === "pendiente" ? "secondary" : "destructive"}
                  className="text-lg px-4 py-2"
                >
                  {absence.estado === "aprobado" ? "Aprobado" : absence.estado === "pendiente" ? "Pendiente" : "Rechazado"}
                </Badge>
                <p className="text-sm text-foreground/60 mt-2">
                  {absence.estado === "aprobado" 
                    ? "La ausencia ha sido aprobada" 
                    : absence.estado === "pendiente" 
                    ? "Esperando revisión" 
                    : "La ausencia fue rechazada"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AbsenceDetail;