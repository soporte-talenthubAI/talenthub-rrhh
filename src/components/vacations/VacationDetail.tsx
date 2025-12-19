import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Edit, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDateLocal } from "@/utils/dateUtils";

interface VacationDetailProps {
  vacation: any;
  onBack: () => void;
  onApprove: () => void;
  onReject: () => void;
  onGeneratePDF: () => void;
}

const VacationDetail = ({ vacation, onBack, onApprove, onReject, onGeneratePDF }: VacationDetailProps) => {
  const { toast } = useToast();

  const handleApprove = () => {
    onApprove();
  };

  const handleReject = () => {
    onReject();
  };

  const generatePDF = () => {
    onGeneratePDF();
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
            <h2 className="text-2xl font-bold text-foreground">Detalle de Solicitud</h2>
            <p className="text-foreground/70">Información completa de la solicitud de vacaciones</p>
          </div>
        </div>
        <div className="flex space-x-2">
          {vacation.estado === "pendiente" && (
            <>
              <Button variant="outline" onClick={handleReject}>
                <X className="h-4 w-4 mr-2" />
                Rechazar
              </Button>
              <Button variant="success" onClick={handleApprove}>
                <Check className="h-4 w-4 mr-2" />
                Aprobar
              </Button>
            </>
          )}
          <Button variant="outline" onClick={generatePDF}>
            <Download className="h-4 w-4 mr-2" />
            Descargar PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información del Empleado */}
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Información del Empleado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-foreground/70">Nombre Completo</p>
              <p className="text-foreground font-semibold">{vacation.empleadoNombre}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-foreground/70">Cargo</p>
              <p className="text-foreground">Supervisora</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-foreground/70">Sector</p>
              <p className="text-foreground">Granja</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-foreground/70">Fecha de Ingreso</p>
              <p className="text-foreground">15/03/2020</p>
            </div>

            <div>
              <p className="text-sm font-medium text-foreground/70">Antigüedad</p>
              <p className="text-foreground">4 años, 8 meses</p>
            </div>
          </CardContent>
        </Card>

        {/* Detalles de la Solicitud */}
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Detalles de la Solicitud</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground/70">Estado</p>
              <Badge variant={vacation.estado === "aprobado" ? "success" : vacation.estado === "pendiente" ? "warning" : "destructive"}>
                {vacation.estado === "aprobado" ? "Aprobado" : vacation.estado === "pendiente" ? "Pendiente" : "Rechazado"}
              </Badge>
            </div>

            <div>
              <p className="text-sm font-medium text-foreground/70">Fecha de Solicitud</p>
              <p className="text-foreground">{formatDateLocal(vacation.fechaSolicitud)}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-foreground/70">Fecha de Inicio</p>
              <p className="text-foreground font-semibold">{formatDateLocal(vacation.fechaInicio)}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-foreground/70">Fecha de Fin</p>
              <p className="text-foreground font-semibold">{formatDateLocal(vacation.fechaFin)}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-foreground/70">Días Solicitados</p>
              <p className="text-2xl font-bold text-primary">{vacation.diasSolicitados}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-foreground/70">Motivo</p>
              <p className="text-foreground">{vacation.motivo}</p>
            </div>

            {vacation.observaciones && (
              <div>
                <p className="text-sm font-medium text-foreground/70">Observaciones</p>
                <p className="text-foreground text-sm">{vacation.observaciones}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Balance de Vacaciones */}
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Balance de Vacaciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-success/10 rounded-lg">
              <p className="text-sm font-medium text-foreground/70">Días Correspondientes</p>
              <p className="text-3xl font-bold text-success">21</p>
              <p className="text-xs text-foreground/60">según antigüedad</p>
            </div>
            
            <div className="p-4 bg-warning/10 rounded-lg">
              <p className="text-sm font-medium text-foreground/70">Días Utilizados</p>
              <p className="text-3xl font-bold text-warning">8</p>
              <p className="text-xs text-foreground/60">incluye esta solicitud</p>
            </div>
            
            <div className="p-4 bg-primary/10 rounded-lg">
              <p className="text-sm font-medium text-foreground/70">Días Disponibles</p>
              <p className="text-3xl font-bold text-primary">{vacation.diasDisponibles}</p>
              <p className="text-xs text-foreground/60">restantes</p>
            </div>

            <div className="p-3 border rounded-lg">
              <h4 className="font-medium text-foreground mb-2">Historial Reciente</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-foreground/70">Enero 2024</span>
                  <span className="text-foreground">3 días</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/70">Marzo 2024</span>
                  <span className="text-foreground">5 días</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-foreground/70">
                <strong>Nota:</strong> Según la Ley de Contrato de Trabajo, corresponden 14 días por año hasta 5 años de antigüedad, 21 días entre 5 y 10 años, y 28 días con más de 10 años.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VacationDetail;