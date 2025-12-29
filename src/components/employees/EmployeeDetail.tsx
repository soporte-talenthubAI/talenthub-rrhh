import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDateLocal, calculateYearsOfService } from "@/utils/dateUtils";
import { calculateVacationDays } from "@/utils/vacationUtils";
import { 
  ArrowLeft, 
  Edit, 
  FileText, 
  Download, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  Building2,
  User,
  AlertTriangle,
  Clock
 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import LegajoPDF from "./LegajoPDF";

interface EmployeeDetailProps {
  employee: any;
  onBack: () => void;
  onEdit: () => void;
}

const EmployeeDetail = ({ employee, onBack, onEdit }: EmployeeDetailProps) => {
  const { toast } = useToast();

  const generatePDF = (type: string) => {
    toast({
      title: "PDF Generado",
      description: `${type} generado exitosamente y listo para descargar`,
    });
  };


  // Usar función centralizada de vacationUtils.ts

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {employee.nombres} {employee.apellidos}
            </h2>
            <p className="text-foreground/70">
              {employee.cargo} - {employee.sector}
            </p>
          </div>
          <Badge variant={employee.estado === "activo" ? "success" : "destructive"}>
            {employee.estado === "activo" ? "Activo" : "Inactivo"}
          </Badge>
        </div>
        
        <div className="flex space-x-2">
          <LegajoPDF 
            employeeData={employee}
            trigger={
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Ver Legajo Completo
              </Button>
            }
          />
          <Button onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información Personal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <User className="h-5 w-5" />
              Información Personal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-foreground">DNI</p>
                <p className="text-foreground/70">{employee.dni}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">CUIL</p>
                <p className="text-foreground/70">{employee.cuil}</p>
              </div>
              {employee.idHuella && (
                <div>
                  <p className="text-sm font-medium text-foreground">ID de Huella</p>
                  <p className="text-foreground/70">{employee.idHuella}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-foreground">Fecha de Nacimiento</p>
                <p className="text-foreground/70">{formatDateLocal(employee.fechaNacimiento)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Estado Civil</p>
                <p className="text-foreground/70">{employee.estadoCivil}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">Teléfono</p>
                  <p className="text-foreground/70">{employee.telefono}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">Email</p>
                  <p className="text-foreground/70">{employee.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-primary mt-1" />
                <div>
                  <p className="text-sm font-medium text-foreground">Dirección</p>
                  <p className="text-foreground/70">{employee.direccion}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información Laboral */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Building2 className="h-5 w-5" />
              Información Laboral
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-foreground">Cargo</p>
                <p className="text-foreground/70">{employee.cargo}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Sector</p>
                <p className="text-foreground/70">{employee.sector}</p>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">Fecha de Ingreso</p>
                  <p className="text-foreground/70">{formatDateLocal(employee.fechaIngreso)}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Antigüedad</p>
                <p className="text-foreground/70">{calculateYearsOfService(employee.fechaIngreso)} años</p>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Salario Básico</p>
                <p className="text-foreground/70">${employee.salario?.toLocaleString()}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-foreground">Contacto de Emergencia</p>
                <p className="text-foreground/70">{employee.contactoEmergencia}</p>
                <p className="text-sm text-foreground/70">{employee.telefonoEmergencia}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumen de Actividad */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Clock className="h-5 w-5" />
              Resumen de Actividad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-primary/10 rounded-lg">
                <p className="text-2xl font-bold text-primary">0</p>
                <p className="text-xs text-foreground/70">Días de vacaciones usados</p>
              </div>
              <div className="text-center p-3 bg-secondary/10 rounded-lg">
                <p className="text-2xl font-bold text-secondary">{calculateVacationDays(employee.fecha_ingreso || employee.fechaIngreso)}</p>
                <p className="text-xs text-foreground/70">Días de vacaciones disponibles</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-warning/10 rounded-lg">
                <p className="text-2xl font-bold text-warning">0</p>
                <p className="text-xs text-foreground/70">Llegadas tarde este mes</p>
              </div>
              <div className="text-center p-3 bg-success/10 rounded-lg">
                <p className="text-2xl font-bold text-success">0</p>
                <p className="text-xs text-foreground/70">Capacitaciones completadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Observaciones */}
      {employee.observaciones && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <AlertTriangle className="h-5 w-5" />
              Observaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground/70">{employee.observaciones}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EmployeeDetail;