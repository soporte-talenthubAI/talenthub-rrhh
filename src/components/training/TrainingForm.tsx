import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { GraduationCap, Save, ArrowLeft, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTrainings } from "@/hooks/useTrainings";
import html2pdf from "html2pdf.js";
import { clientConfig } from "@/config/client";
import { formatDateLocal } from "@/utils/dateUtils";

interface TrainingFormProps {
  onBack: () => void;
  training?: any;
  employees: any[];
}

const TrainingForm = ({ onBack, training, employees }: TrainingFormProps) => {
  const { toast } = useToast();
  const { addTraining } = useTrainings();
  
  console.log('TrainingForm - employees:', employees); // Debug log
  
  const [formData, setFormData] = useState({
    titulo: training?.titulo || "",
    empleadoId: training?.empleadoId || "",
    fecha: training?.fecha || "",
    duracion: training?.duracion || "",
    tipo: training?.tipo || "",
    instructor: training?.instructor || "",
    modalidad: training?.modalidad || "",
    descripcion: training?.descripcion || "",
    certificacion: training?.certificacion || false,
    observaciones: training?.observaciones || ""
  });

  // Use real employees from database

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.titulo || !formData.empleadoId || !formData.fecha || !formData.tipo) {
      toast({
        title: "Error",
        description: "Por favor complete título, empleado, fecha y tipo",
        variant: "destructive"
      });
      return;
    }

    try {
      await addTraining({
        employee_id: formData.empleadoId,
        titulo: formData.titulo,
        descripcion: formData.descripcion || null,
        tipo: formData.tipo,
        estado: 'pendiente',
        fecha_inicio: formData.fecha,
        fecha_fin: null,
        fecha_vencimiento: null,
        instructor: formData.instructor || null,
        modalidad: formData.modalidad as any || null,
        duracion_horas: parseInt(formData.duracion) || null,
        calificacion: null,
        certificado_url: null,
        observaciones: formData.observaciones || null,
        created_at: '' as any,
        updated_at: '' as any,
        id: '' as any,
      } as any);

      toast({
        title: "Capacitación guardada",
        description: "La capacitación ha sido registrada exitosamente",
      });

      onBack();
    } catch (error) {
      // El hook ya muestra el toast de error
    }
  };

  const generateCertificate = async () => {
    if (!formData.titulo || !formData.empleadoId || !formData.fecha) {
      toast({
        title: "Faltan datos",
        description: "Complete título, empleado y fecha para generar el certificado",
        variant: "destructive"
      });
      return;
    }

    try {
      const empleadoNombre = employees.find(e => e.id.toString() === formData.empleadoId) 
        ? `${employees.find(e => e.id.toString() === formData.empleadoId)?.nombres} ${employees.find(e => e.id.toString() === formData.empleadoId)?.apellidos}` 
        : "Empleado";
      const titulo = formData.titulo;
      const fecha = formatDateLocal(formData.fecha);
      const horas = formData.duracion || "";
      const instructor = formData.instructor || "";
      const filename = `Certificado_${empleadoNombre.replace(/\s+/g, '_')}_${titulo.replace(/\s+/g, '_')}.pdf`;

      const content = `
        <div style="font-family: Arial, sans-serif; padding: 32px; color: #111827; background: #ffffff;">
          <div style="text-align:center; border-bottom: 2px solid #e5e7eb; padding-bottom: 12px; margin-bottom: 24px;">
            <h1 style=\"margin: 0; font-size: 22px;\">CERTIFICADO DE CAPACITACIÓN</h1>
            <p style=\"margin: 6px 0 0 0; color: #6b7280;\">${clientConfig.nombre}</p>
          </div>

          <p style="font-size: 14px; line-height: 1.6;">
            Se certifica que <strong>${empleadoNombre}</strong> ha realizado la capacitación
            <strong>"${titulo}"</strong> el día <strong>${fecha}</strong>
            ${horas ? `, con una duración de <strong>${horas} horas</strong>` : ''}
            ${instructor ? `, dictada por <strong>${instructor}</strong>` : ''}.
          </p>

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
              {training ? "Editar Capacitación" : "Nueva Capacitación"}
            </h2>
            <p className="text-foreground/70">
              Registra los datos de la capacitación o entrenamiento
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={generateCertificate}>
            <Download className="h-4 w-4 mr-2" />
            Generar Certificado
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Guardar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Datos de la Capacitación */}
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Datos de la Capacitación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="titulo" className="text-foreground">Título de la Capacitación *</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => handleInputChange("titulo", e.target.value)}
                placeholder="Ej: Bioseguridad en Granjas Avícolas"
              />
            </div>

            <div>
              <Label htmlFor="empleado" className="text-foreground">Empleado *</Label>
              <Select onValueChange={(value) => handleInputChange("empleadoId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar empleado" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id.toString()}>
                      {emp.nombres} {emp.apellidos}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fecha" className="text-foreground">Fecha *</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => handleInputChange("fecha", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="duracion" className="text-foreground">Duración (horas)</Label>
                <Input
                  id="duracion"
                  type="number"
                  value={formData.duracion}
                  onChange={(e) => handleInputChange("duracion", e.target.value)}
                  placeholder="8"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="tipo" className="text-foreground">Tipo de Capacitación</Label>
              <Select onValueChange={(value) => handleInputChange("tipo", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="seguridad">Seguridad e Higiene</SelectItem>
                  <SelectItem value="tecnica">Técnico - Operativo</SelectItem>
                  <SelectItem value="administrativa">Administrativo</SelectItem>
                  <SelectItem value="calidad">Control de Calidad</SelectItem>
                  <SelectItem value="liderazgo">Liderazgo</SelectItem>
                  <SelectItem value="otro">Otros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="instructor" className="text-foreground">Instructor/Entidad</Label>
              <Input
                id="instructor"
                value={formData.instructor}
                onChange={(e) => handleInputChange("instructor", e.target.value)}
                placeholder="Ej: Dr. Carlos Pérez - Instituto Avícola"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="certificacion"
                checked={formData.certificacion}
                onCheckedChange={(checked) => handleInputChange("certificacion", !!checked)}
              />
              <Label htmlFor="certificacion" className="text-foreground">
                Otorga certificación oficial
              </Label>
            </div>

            <div>
              <Label htmlFor="observaciones" className="text-foreground">Observaciones</Label>
              <Textarea
                id="observaciones"
                value={formData.observaciones}
                onChange={(e) => handleInputChange("observaciones", e.target.value)}
                placeholder="Notas adicionales sobre la capacitación..."
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
            {formData.empleadoId ? (
              <>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h3 className="font-semibold text-foreground mb-2">
                    {employees.find(e => e.id.toString() === formData.empleadoId) 
                      ? `${employees.find(e => e.id.toString() === formData.empleadoId)?.nombres} ${employees.find(e => e.id.toString() === formData.empleadoId)?.apellidos}`
                      : "Empleado"}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-foreground/70">Cargo</p>
                      <p className="text-foreground">Supervisora</p>
                    </div>
                    <div>
                      <p className="text-foreground/70">Sector</p>
                      <p className="text-foreground">Granja</p>
                    </div>
                    <div>
                      <p className="text-foreground/70">Antigüedad</p>
                      <p className="text-foreground">4 años</p>
                    </div>
                    <div>
                      <p className="text-foreground/70">Estado</p>
                      <p className="text-foreground">Activo</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-foreground">Historial de Capacitaciones</h4>
                  
                  <div className="space-y-2">
                    <div className="p-3 bg-success/10 rounded-lg border-l-4 border-success">
                      <p className="font-medium text-foreground">Primeros Auxilios</p>
                      <p className="text-sm text-foreground/70">Completado - 15/09/2024</p>
                    </div>
                    
                    <div className="p-3 bg-success/10 rounded-lg border-l-4 border-success">
                      <p className="font-medium text-foreground">Manejo de Aves</p>
                      <p className="text-sm text-foreground/70">Completado - 20/08/2024</p>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-primary/10 rounded-lg">
                  <h4 className="font-medium text-foreground mb-2">Próximas Capacitaciones Requeridas</h4>
                  <ul className="text-sm text-foreground/70 space-y-1">
                    <li>• Actualización en Bioseguridad (Vence: Dic 2024)</li>
                    <li>• Capacitación en Equipos Nuevos</li>
                  </ul>
                </div>
              </>
            ) : (
              <div className="p-8 text-center">
                <GraduationCap className="h-12 w-12 text-foreground/40 mx-auto mb-4" />
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

export default TrainingForm;