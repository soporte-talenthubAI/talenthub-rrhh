import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Download, FileText, User, MapPin, Phone, Mail, GraduationCap, Heart, Briefcase } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDateLocal, calculateDetailedAntiquity, getCurrentDateString } from "@/utils/dateUtils";
import { clientConfig } from "@/config/client";

interface LegajoPDFProps {
  employeeData: any;
  trigger?: React.ReactNode;
}

const LegajoPDF = ({ employeeData, trigger }: LegajoPDFProps) => {
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);
const downloadPDF = async () => {
  const element = printRef.current;
  if (!element) return;
  try {
    const module: any = await import('html2pdf.js');
    const html2pdf = module.default || module;
    const filename = `Legajo_${(employeeData.apellidos || 'Empleado')}_${employeeData.nombres || ''}.pdf`.replace(/\s+/g, '_');
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
      description: "El legajo se descargó correctamente.",
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
    return formatDateLocal(dateString);
  };


  const calculateVacationDays = (fechaIngreso: string) => {
    if (!fechaIngreso) return 0;
    
    const fechaCorte = new Date(new Date().getFullYear(), 11, 31); // 31 de diciembre del año actual
    const ingreso = new Date(fechaIngreso);
    const antiguedadAnios = Math.floor((fechaCorte.getTime() - ingreso.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    
    // Si ingresó este año, verificar casos especiales
    if (ingreso.getFullYear() === new Date().getFullYear()) {
      // Calcular días trabajados desde ingreso hasta 31 de diciembre (días calendario)
      const diasTrabajados = Math.floor((fechaCorte.getTime() - ingreso.getTime()) / (24 * 60 * 60 * 1000)) + 1;
      
      // Calcular meses trabajados
      const mesesTrabajados = (fechaCorte.getTime() - ingreso.getTime()) / (30.44 * 24 * 60 * 60 * 1000);
      
      // Si trabajó menos de 6 meses: 1 día de vacaciones por cada 20 días de trabajo efectivo
      if (mesesTrabajados < 6) {
        return Math.floor(diasTrabajados / 20);
      } else {
        // Si trabajó 6 meses o más en el año, le corresponden 14 días
        return 14;
      }
    }
    
    // Antigüedad por años completos según Ley de Contrato de Trabajo N° 20.744
    if (antiguedadAnios < 0) return 0;
    if (antiguedadAnios <= 5) return 14;    // Hasta 5 años: 14 días corridos
    if (antiguedadAnios <= 10) return 21;   // Más de 5 hasta 10 años: 21 días corridos
    if (antiguedadAnios <= 20) return 28;   // Más de 10 hasta 20 años: 28 días corridos
    return 35;                              // Más de 20 años: 35 días corridos
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Ver Legajo PDF
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Legajo Digital - {employeeData.nombres} {employeeData.apellidos}</span>
          </DialogTitle>
        </DialogHeader>

        <div ref={printRef} className="bg-white p-8 space-y-6 text-black" style={{ fontFamily: 'serif', backgroundColor: '#ffffff', color: '#000000' }}>
          {/* Header del Legajo */}
          <div className="text-center border-b-2 pb-4" style={{ borderColor: '#e5e7eb' }}>
            <h1 className="text-2xl font-bold mb-2" style={{ color: '#1f2937' }}>LEGAJO DIGITAL DE EMPLEADO</h1>
            <h2 className="text-lg font-semibold" style={{ color: '#4b5563' }}>{clientConfig.nombre.toUpperCase()}</h2>
            <p className="text-sm mt-2" style={{ color: '#6b7280' }}>
              Fecha de Generación: {formatDateLocal(getCurrentDateString())}
            </p>
          </div>

          {/* Datos Personales */}
          <Card style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg" style={{ color: '#1f2937' }}>
                <User className="h-5 w-5 mr-2" />
                DATOS PERSONALES
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong style={{ color: '#1f2937' }}>Nombre y Apellido:</strong>
                <p className="border-b border-dotted pb-1" style={{ borderColor: '#9ca3af', color: '#1f2937' }}>
                  {employeeData.nombres} {employeeData.apellidos}
                </p>
              </div>
              <div>
                <strong style={{ color: '#1f2937' }}>DNI:</strong>
                <p className="border-b border-dotted pb-1" style={{ borderColor: '#9ca3af', color: '#1f2937' }}>
                  {employeeData.dni || "_______________"}
                </p>
              </div>
              <div>
                <strong style={{ color: '#1f2937' }}>CUIL:</strong>
                <p className="border-b border-dotted pb-1" style={{ borderColor: '#9ca3af', color: '#1f2937' }}>
                  {employeeData.cuil || "_______________"}
                </p>
              </div>
              {employeeData.idHuella && (
                <div>
                  <strong style={{ color: '#1f2937' }}>ID de Huella:</strong>
                  <p className="border-b border-dotted pb-1" style={{ borderColor: '#9ca3af', color: '#1f2937' }}>
                    {employeeData.idHuella}
                  </p>
                </div>
              )}
              <div>
                <strong style={{ color: '#1f2937' }}>Fecha de Nacimiento:</strong>
                <p className="border-b border-dotted pb-1" style={{ borderColor: '#9ca3af', color: '#1f2937' }}>
                  {formatDate(employeeData.fechaNacimiento)}
                </p>
              </div>
              <div>
                <strong style={{ color: '#1f2937' }}>Estado Civil:</strong>
                <p className="border-b border-dotted pb-1" style={{ borderColor: '#9ca3af', color: '#1f2937' }}>
                  {employeeData.estadoCivil || "_______________"}
                </p>
              </div>
              <div className="col-span-2">
                <strong style={{ color: '#1f2937' }}>Domicilio:</strong>
                <p className="border-b border-dotted pb-1" style={{ borderColor: '#9ca3af', color: '#1f2937' }}>
                  {employeeData.direccion || "_______________"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Datos de Contacto */}
          <Card style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg" style={{ color: '#1f2937' }}>
                <Phone className="h-5 w-5 mr-2" />
                INFORMACIÓN DE CONTACTO
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong style={{ color: '#1f2937' }}>Teléfono:</strong>
                <p className="border-b border-dotted pb-1" style={{ borderColor: '#9ca3af', color: '#1f2937' }}>
                  {employeeData.telefono || "_______________"}
                </p>
              </div>
              <div>
                <strong style={{ color: '#1f2937' }}>Email:</strong>
                <p className="border-b border-dotted pb-1" style={{ borderColor: '#9ca3af', color: '#1f2937' }}>
                  {employeeData.email || "_______________"}
                </p>
              </div>
              <div>
                <strong style={{ color: '#1f2937' }}>Contacto de Emergencia:</strong>
                <p className="border-b border-dotted pb-1" style={{ borderColor: '#9ca3af', color: '#1f2937' }}>
                  {employeeData.contactoEmergencia || "_______________"}
                </p>
              </div>
              <div>
                <strong style={{ color: '#1f2937' }}>Parentesco:</strong>
                <p className="border-b border-dotted pb-1" style={{ borderColor: '#9ca3af', color: '#1f2937' }}>
                  {employeeData.parentescoEmergencia || "_______________"}
                </p>
              </div>
              <div className="col-span-2">
                <strong style={{ color: '#1f2937' }}>Teléfono de Emergencia:</strong>
                <p className="border-b border-dotted pb-1" style={{ borderColor: '#9ca3af', color: '#1f2937' }}>
                  {employeeData.telefonoEmergencia || "_______________"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Datos Laborales */}
          <Card style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg" style={{ color: '#1f2937' }}>
                <Briefcase className="h-5 w-5 mr-2" />
                INFORMACIÓN LABORAL
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong style={{ color: '#1f2937' }}>Puesto/Cargo:</strong>
                <p className="border-b border-dotted pb-1" style={{ borderColor: '#9ca3af', color: '#1f2937' }}>
                  {employeeData.cargo || "_______________"}
                </p>
              </div>
              <div>
                <strong style={{ color: '#1f2937' }}>Sector:</strong>
                <p className="border-b border-dotted pb-1" style={{ borderColor: '#9ca3af', color: '#1f2937' }}>
                  {employeeData.sector || "_______________"}
                </p>
              </div>
              <div>
                <strong style={{ color: '#1f2937' }}>Fecha de Ingreso:</strong>
                <p className="border-b border-dotted pb-1" style={{ borderColor: '#9ca3af', color: '#1f2937' }}>
                  {formatDate(employeeData.fechaIngreso)}
                </p>
              </div>
              <div>
                <strong style={{ color: '#1f2937' }}>Estado:</strong>
                <p className="border-b border-dotted pb-1" style={{ borderColor: '#9ca3af', color: '#1f2937' }}>
                  {employeeData.estado || "Activo"}
                </p>
              </div>
                <div>
                  <strong style={{ color: '#1f2937' }}>Antigüedad:</strong>
                  <p className="border-b border-dotted pb-1" style={{ borderColor: '#9ca3af', color: '#1f2937' }}>
                    {(() => {
                      const antiquity = calculateDetailedAntiquity(employeeData.fechaIngreso);
                      return `${antiquity.years} años, ${antiquity.months} meses, ${antiquity.days} días`;
                    })()}
                  </p>
                </div>
                <div>
                  <strong style={{ color: '#1f2937' }}>Días de Vacaciones Anuales:</strong>
                  <p className="border-b border-dotted pb-1" style={{ borderColor: '#9ca3af', color: '#1f2937' }}>
                    {calculateVacationDays(employeeData.fechaIngreso)} días
                  </p>
                </div>
            </CardContent>
          </Card>

          {/* Información Académica */}
          <Card style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg" style={{ color: '#1f2937' }}>
                <GraduationCap className="h-5 w-5 mr-2" />
                INFORMACIÓN ACADÉMICA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <strong style={{ color: '#1f2937' }}>Nivel Educativo:</strong>
                <p className="border-b border-dotted pb-1" style={{ borderColor: '#9ca3af', color: '#1f2937' }}>
                  {employeeData.nivelEducativo || "_______________"}
                </p>
              </div>
              <div>
                <strong style={{ color: '#1f2937' }}>Título:</strong>
                <p className="border-b border-dotted pb-1" style={{ borderColor: '#9ca3af', color: '#1f2937' }}>
                  {employeeData.titulo || "_______________"}
                </p>
              </div>
              <div>
                <strong style={{ color: '#1f2937' }}>Otros Conocimientos:</strong>
                <div className="border p-2 min-h-[60px]" style={{ borderColor: '#d1d5db', backgroundColor: '#f9fafb', color: '#1f2937' }}>
                  {employeeData.otrosConocimientos || ""}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información Médica */}
          <Card style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg" style={{ color: '#1f2937' }}>
                <Heart className="h-5 w-5 mr-2" />
                INFORMACIÓN MÉDICA
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong style={{ color: '#1f2937' }}>Grupo Sanguíneo:</strong>
                <p className="border-b border-dotted pb-1" style={{ borderColor: '#9ca3af', color: '#1f2937' }}>
                  {employeeData.grupoSanguineo || "_______________"}
                </p>
              </div>
              <div>
                <strong style={{ color: '#1f2937' }}>Obra Social:</strong>
                <p className="border-b border-dotted pb-1" style={{ borderColor: '#9ca3af', color: '#1f2937' }}>
                  {employeeData.obraSocial || "_______________"}
                </p>
              </div>
              <div className="col-span-2">
                <strong style={{ color: '#1f2937' }}>Alergias:</strong>
                <div className="border p-2 min-h-[40px]" style={{ borderColor: '#d1d5db', backgroundColor: '#f9fafb', color: '#1f2937' }}>
                  {employeeData.alergias || ""}
                </div>
              </div>
              <div className="col-span-2">
                <strong style={{ color: '#1f2937' }}>Medicación Habitual:</strong>
                <div className="border p-2 min-h-[40px]" style={{ borderColor: '#d1d5db', backgroundColor: '#f9fafb', color: '#1f2937' }}>
                  {employeeData.medicacionHabitual || ""}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Observaciones */}
          <Card style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg" style={{ color: '#1f2937' }}>OBSERVACIONES ADICIONALES</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border p-2 min-h-[60px] text-sm" style={{ borderColor: '#d1d5db', backgroundColor: '#f9fafb', color: '#1f2937' }}>
                {employeeData.observaciones || ""}
              </div>
            </CardContent>
          </Card>

          {/* Firmas */}
          <div className="grid grid-cols-2 gap-8 mt-8 pt-6" style={{ borderTop: '2px solid #d1d5db' }}>
            <div className="text-center">
              <div className="mt-16 pt-2" style={{ borderTop: '1px solid #4b5563' }}>
                <p className="text-sm font-semibold" style={{ color: '#1f2937' }}>FIRMA DEL EMPLEADO</p>
              </div>
            </div>
            <div className="text-center">
              <div className="mt-16 pt-2" style={{ borderTop: '1px solid #4b5563' }}>
                <p className="text-sm font-semibold" style={{ color: '#1f2937' }}>ACLARACIÓN</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs mt-8 pt-4" style={{ borderTop: '1px solid #e5e7eb', color: '#6b7280' }}>
            <p>
              Este documento constituye el legajo digital del empleado según normativas laborales vigentes.
            </p>
            <p className="mt-1">
              Generado el {formatDateLocal(getCurrentDateString())} - Sistema RRHH {clientConfig.nombre}
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

export default LegajoPDF;