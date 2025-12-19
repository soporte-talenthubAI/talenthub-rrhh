import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Save, ArrowLeft, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useVacations } from "@/hooks/useVacations";
import html2pdf from "html2pdf.js";
import { formatDateLocal } from "@/utils/dateUtils";

interface VacationFormProps {
  onBack: () => void;
  vacation?: any;
  employees: any[];
  onSave?: (requestData: any) => void;
}

const VacationForm = ({ onBack, vacation, employees, onSave }: VacationFormProps) => {
  const { toast } = useToast();
  const { getEmployeeVacationBalance } = useVacations();
  
  const [formData, setFormData] = useState({
    employee_id: vacation?.employee_id || "",
    fecha_inicio: vacation?.fecha_inicio || "",
    fecha_fin: vacation?.fecha_fin || "",
    motivo: vacation?.motivo || "",
    periodo: vacation?.periodo || "",
    observaciones: vacation?.observaciones || ""
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateDays = () => {
    if (formData.fecha_inicio && formData.fecha_fin) {
      const start = new Date(formData.fecha_inicio);
      const end = new Date(formData.fecha_fin);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    }
    return 0;
  };

  const handleSave = () => {
    if (!formData.employee_id || !formData.fecha_inicio || !formData.fecha_fin || !formData.periodo) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos obligatorios (empleado, fechas y período)",
        variant: "destructive"
      });
      return;
    }

    const diasSolicitados = calculateDays();
    const diasDisponibles = vacationDaysInfo?.availableDays || 0;

    // Validar que los días solicitados no excedan los disponibles
    if (diasSolicitados > diasDisponibles) {
      toast({
        title: "Error - Días insuficientes",
        description: `No puedes solicitar ${diasSolicitados} días. Solo tienes ${diasDisponibles} días disponibles.`,
        variant: "destructive"
      });
      return;
    }

    // Validar que no se soliciten días negativos o cero
    if (diasSolicitados <= 0) {
      toast({
        title: "Error - Fechas inválidas",
        description: "La fecha de fin debe ser posterior a la fecha de inicio.",
        variant: "destructive"
      });
      return;
    }

    const requestData = {
      ...formData,
      dias_solicitados: diasSolicitados,
      estado: "pendiente"
    };

    if (onSave) {
      onSave(requestData);
    }

    setTimeout(() => onBack(), 1500);
  };

  const generateConstancia = async () => {
    if (!formData.employee_id) {
      toast({
        title: "Error",
        description: "Seleccione un empleado antes de generar la constancia",
        variant: "destructive",
      });
      return;
    }

    // Solo permitir descarga si la solicitud está aprobada (cuando aplica)
    if (vacation && vacation.estado && vacation.estado.toLowerCase() !== "aprobado") {
      toast({
        title: "No disponible",
        description: "Solo puedes descargar la constancia de solicitudes aprobadas.",
        variant: "destructive",
      });
      return;
    }

    try {
      const emp = employees.find(
        (e) => e.id === formData.employee_id
      );
      const employeeName = emp ? `${emp.nombres} ${emp.apellidos}` : "Empleado";
      const dni = emp?.dni ?? "";
      const days = calculateDays();
      const motivoMap: Record<string, string> = {
        "vacaciones-anuales": "Vacaciones Anuales",
        "asuntos-personales": "Asuntos Personales",
        "motivos-familiares": "Motivos Familiares",
        "licencia-medica": "Licencia Médica",
        otros: "Otros",
      };
      const motivoLabel = motivoMap[formData.motivo] ?? "Vacaciones";
      const inicio = formData.fecha_inicio
        ? formatDateLocal(formData.fecha_inicio)
        : "";
      const fin = formData.fecha_fin
        ? formatDateLocal(formData.fecha_fin)
        : "";
      const emitido = new Date().toLocaleDateString("es-AR");

      const safeName = employeeName.replace(/\s+/g, "_");
      const fileName = `Constancia_Vacaciones_${safeName}_${formData.periodo}_${formData.fecha_inicio}_${formData.fecha_fin}.pdf`;

      const container = document.createElement("div");
      container.style.padding = "24px";
      container.style.fontFamily = "Inter, Arial, sans-serif";
      container.style.color = "#0f1115";
      container.innerHTML = `
        <div style="text-align:center; margin-bottom:16px;">
          <h1 style="margin:0; font-size:22px;">Constancia de Vacaciones</h1>
          <p style="margin:4px 0; font-size:12px;">Período ${formData.periodo || "-"}</p>
        </div>
        <p style="line-height:1.6; font-size:14px;">
          Se deja constancia de que <strong>${employeeName}</strong> ${dni ? "(DNI " + dni + ")" : ""} gozará de su período de vacaciones desde el <strong>${inicio}</strong> hasta el <strong>${fin}</strong>, totalizando <strong>${days}</strong> días corridos.
        </p>
        ${formData.motivo ? `<p style="font-size:13px;"><strong>Motivo:</strong> ${motivoLabel}</p>` : ""}
        ${formData.observaciones ? `<p style=\"font-size:13px;\"><strong>Observaciones:</strong> ${formData.observaciones}</p>` : ""}
        <p style="margin-top:24px; font-size:13px;">Emitido el ${emitido}.</p>
        <div style="display:flex; justify-content:space-between; margin-top:48px;">
          <div style="text-align:center;">
            <div style="border-top:1px solid #777; width:220px; margin:0 auto 6px;"></div>
            <span style="font-size:12px;">Firma del Empleado</span>
          </div>
          <div style="text-align:center;">
            <div style="border-top:1px solid #777; width:220px; margin:0 auto 6px;"></div>
            <span style="font-size:12px;">Firma de la Empresa</span>
          </div>
        </div>
      `;

      const opt = {
        margin: 10,
        filename: fileName,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      } as const;

      // Generate PDF and force download via anchor (works better inside iframes)
      const worker = html2pdf().from(container).set(opt).toPdf();
      const pdf = await worker.get('pdf');
      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);

      toast({
        title: "Descarga iniciada",
        description: "La constancia se está descargando.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error al generar PDF",
        description: "Intente nuevamente o contacte al soporte.",
        variant: "destructive",
      });
    }
  };

  // Information for selected employee with vacation days - calculate if no balance exists
  const selectedEmployeeInfo = employees.find(emp => emp.id === formData.employee_id);
  const currentYear = new Date().getFullYear();
  const vacationBalance = selectedEmployeeInfo ? getEmployeeVacationBalance(selectedEmployeeInfo.id, currentYear) : null;
  
  // Helper: calculate vacation days for current year using calendar days and decimals
  const calcVacationDaysCurrentYear = (fechaIngreso?: string) => {
    if (!fechaIngreso) return 0;
    const ingreso = new Date(fechaIngreso);
    const now = new Date();
    const fechaCorte = new Date(now.getFullYear(), 11, 31);

    // If joined this year, use proportional rule
    if (ingreso.getFullYear() === now.getFullYear()) {
      const diasTrabajados = Math.floor((fechaCorte.getTime() - ingreso.getTime()) / (24 * 60 * 60 * 1000)) + 1;
      const mesesTrabajados = (fechaCorte.getTime() - ingreso.getTime()) / (30.44 * 24 * 60 * 60 * 1000);
      if (mesesTrabajados < 6) {
        return Math.round((diasTrabajados / 20) * 100) / 100; // 2 decimales
      }
      return 14;
    }

    // Full years per law
    const antiguedadAnios = Math.floor((fechaCorte.getTime() - ingreso.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    if (antiguedadAnios <= 5) return 14;
    if (antiguedadAnios <= 10) return 21;
    if (antiguedadAnios <= 20) return 28;
    return 35;
  };
  
  const vacationDaysInfo = selectedEmployeeInfo ? {
    totalDays: vacationBalance && vacationBalance.dias_totales > 0 
      ? vacationBalance.dias_totales 
      : calcVacationDaysCurrentYear(selectedEmployeeInfo.fecha_ingreso || selectedEmployeeInfo.fechaIngreso),
    usedDays: vacationBalance?.dias_usados || 0,
    availableDays: 0 // Will be calculated below
  } : null;
  
  if (vacationDaysInfo) {
    vacationDaysInfo.availableDays = Math.round(((vacationDaysInfo.totalDays - vacationDaysInfo.usedDays) + Number.EPSILON) * 100) / 100;
  }

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
              {vacation ? "Editar Solicitud" : "Nueva Solicitud de Vacaciones"}
            </h2>
            <p className="text-foreground/70">
              Completa los datos para la solicitud de vacaciones
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={generateConstancia}>
            <Download className="h-4 w-4 mr-2" />
            Generar Constancia
          </Button>
          <Button 
            onClick={handleSave}
            disabled={
              vacationDaysInfo && calculateDays() > vacationDaysInfo.availableDays
            }
          >
            <Save className="h-4 w-4 mr-2" />
            Guardar Solicitud
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Datos de la Solicitud */}
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Datos de la Solicitud</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="empleado" className="text-foreground">Empleado *</Label>
              <Select onValueChange={(value) => handleInputChange("employee_id", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar empleado" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.nombres} {employee.apellidos} - DNI: {employee.dni}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fechaInicio" className="text-foreground">Fecha de Inicio *</Label>
                <Input
                  id="fechaInicio"
                  type="date"
                  value={formData.fecha_inicio}
                  onChange={(e) => handleInputChange("fecha_inicio", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="fechaFin" className="text-foreground">Fecha de Fin *</Label>
                <Input
                  id="fechaFin"
                  type="date"
                  value={formData.fecha_fin}
                  onChange={(e) => handleInputChange("fecha_fin", e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label className="text-foreground">Días Solicitados</Label>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-foreground">{calculateDays()}</p>
                <p className="text-sm text-foreground/70">días laborables</p>
                {vacationDaysInfo && calculateDays() > 0 && (
                  <div className="mt-2">
                    {calculateDays() > vacationDaysInfo.availableDays ? (
                      <div className="flex items-center text-red-600 text-xs">
                        <span className="w-2 h-2 bg-red-600 rounded-full mr-2"></span>
                        Excede días disponibles ({vacationDaysInfo.availableDays})
                      </div>
                    ) : (
                      <div className="flex items-center text-green-600 text-xs">
                        <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                        Dentro del límite disponible
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="periodo" className="text-foreground">Período de Vacaciones *</Label>
              <Select onValueChange={(value) => handleInputChange("periodo", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2022">2022</SelectItem>
                  <SelectItem value="2021">2021</SelectItem>
                  <SelectItem value="2020">2020</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="motivo" className="text-foreground">Motivo</Label>
              <Select onValueChange={(value) => handleInputChange("motivo", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar motivo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vacaciones-anuales">Vacaciones Anuales</SelectItem>
                  <SelectItem value="asuntos-personales">Asuntos Personales</SelectItem>
                  <SelectItem value="motivos-familiares">Motivos Familiares</SelectItem>
                  <SelectItem value="licencia-medica">Licencia Médica</SelectItem>
                  <SelectItem value="otros">Otros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="observaciones" className="text-foreground">Observaciones</Label>
              <Textarea
                id="observaciones"
                value={formData.observaciones}
                onChange={(e) => handleInputChange("observaciones", e.target.value)}
                placeholder="Observaciones adicionales..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Información del Empleado */}
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Información del Empleado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.employee_id && selectedEmployeeInfo ? (
              <>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h3 className="font-semibold text-foreground mb-2">
                    {selectedEmployeeInfo.nombres} {selectedEmployeeInfo.apellidos}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Cargo</p>
                      <p className="text-foreground font-medium">{selectedEmployeeInfo.puesto || selectedEmployeeInfo.cargo || 'No especificado'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Sector</p>
                      <p className="text-foreground font-medium">{selectedEmployeeInfo.departamento || selectedEmployeeInfo.sector || 'No especificado'}</p>
                    </div>
                  </div>
                </div>

                {vacationDaysInfo && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-foreground">Balance de Vacaciones</h4>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="space-y-1">
                        <span className="text-muted-foreground block">Días correspondientes:</span>
                        <p className="font-medium text-foreground">{vacationDaysInfo.totalDays}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground block">Días usados:</span>
                        <p className="font-medium text-foreground">{vacationDaysInfo.usedDays}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground block">Días disponibles:</span>
                        <p className="font-medium text-green-600">{vacationDaysInfo.availableDays}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-sm text-foreground/70 mb-1">Cálculo según legislación argentina</p>
                  <p className="text-xs text-foreground/60">
                    Los días disponibles se calculan como: días correspondientes - días usados.
                    Al aprobar una solicitud, los días se descuentan automáticamente del saldo.
                  </p>
                </div>
              </>
            ) : (
              <div className="p-8 text-center">
                <Calendar className="h-12 w-12 text-foreground/40 mx-auto mb-4" />
                <p className="text-foreground/70">
                  Selecciona un empleado para ver su información
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VacationForm;