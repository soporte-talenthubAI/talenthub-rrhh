import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Save, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import LegajoPDF from "./LegajoPDF";
import { calculateDetailedAntiquity } from "@/utils/dateUtils";

// Constantes para validaciones de edad
const EDAD_MINIMA_LEGAL = 18;
const EDAD_MAXIMA_RAZONABLE = 110;

interface EmployeeFormProps {
  onBack: () => void;
  onSave?: (employee: any) => void;
  employee?: any;
  isEditing?: boolean;
}

const licenseTypes = [
  // Clase A (Motos y Ciclomotores)
  { id: "A.1.1", label: "A.1.1: Ciclomotores" },
  { id: "A.1.2", label: "A.1.2: Motocicletas de hasta 150 cc" },
  { id: "A.1.3", label: "A.1.3: Motocicletas de más de 150 cc hasta 300 cc" },
  { id: "A.1.4", label: "A.1.4: Motocicletas de más de 300 cc" },
  { id: "A.2.1", label: "A.2.1: Motocicletas, triciclos y cuatriciclos" },
  { id: "A.2.2", label: "A.2.2: Triciclos y cuatriciclos de más de 300 kg" },
  
  // Clase B (Automóviles y Camionetas)
  { id: "B.1", label: "B.1: Automóviles, utilitarios, camionetas y casas rodantes hasta 3.500 kg" },
  { id: "B.2", label: "B.2: Automóviles, utilitarios, camionetas y casas rodantes de más de 3.500 kg" },
  
  // Clase C (Vehículos de Carga)
  { id: "C.1", label: "C.1: Camiones hasta 12.000 kg" },
  { id: "C.2", label: "C.2: Camiones de más de 12.000 kg" },
  { id: "C.3", label: "C.3: Vehículos de carga pesada" },
  
  // Clase D (Transporte de Pasajeros)
  { id: "D.1", label: "D.1: Transporte de hasta 8 pasajeros" },
  { id: "D.2", label: "D.2: Transporte de más de 8 pasajeros" },
  { id: "D.3", label: "D.3: Vehículos de emergencia y seguridad" },
  
  // Clase E (Vehículos Articulados)
  { id: "E.1", label: "E.1: Vehículos de carga con remolque o semirremolque" },
  { id: "E.2", label: "E.2: Vehículos de pasajeros con remolque o articulados" },
  
  // Clase G (Maquinaria Especial)
  { id: "G.1", label: "G.1: Tractores" },
  { id: "G.2", label: "G.2: Maquinaria agrícola, de construcción y vial" },
];

const EmployeeForm = ({ onBack, onSave, employee, isEditing = false }: EmployeeFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    // Datos Personales
    nombres: employee?.nombres || "",
    apellidos: employee?.apellidos || "",
    dni: employee?.dni || "",
    cuil: employee?.cuil || "",
    idHuella: employee?.idHuella || "",
    fechaNacimiento: employee?.fechaNacimiento || "",
    direccion: employee?.direccion || "",
    
    // Documentos
    fotoDni: employee?.fotoDni || null,
    fotoCarnet: employee?.fotoCarnet || null,
    
    // Datos de Contacto
    telefono: employee?.telefono || "",
    email: employee?.email || "",
    contactoEmergencia: employee?.contactoEmergencia || "",
    telefonoEmergencia: employee?.telefonoEmergencia || "",
    parentescoEmergencia: employee?.parentescoEmergencia || "",
    
    // Datos Laborales
    cargo: employee?.cargo || "",
    sector: employee?.sector || "",
    tipoContrato: employee?.tipoContrato || "",
    fechaIngreso: employee?.fechaIngreso || "",
    salario: employee?.salario || "",
    estadoCivil: employee?.estadoCivil || "",
    estado: employee?.estado || "activo",
    
    // Información Académica
    nivelEducativo: employee?.nivelEducativo || "",
    titulo: employee?.titulo || "",
    otrosConocimientos: employee?.otrosConocimientos || "",
    
    // Información Médica
    grupoSanguineo: employee?.grupoSanguineo || "",
    alergias: employee?.alergias || "",
    obraSocial: employee?.obraSocial || "",
    medicacionHabitual: employee?.medicacionHabitual || "",
    
    // Información Familiar y Licencias
    tieneHijos: employee?.tieneHijos || "",
    nombresHijos: employee?.nombresHijos || "",
    tieneLicencia: employee?.tieneLicencia || "",
    tipoLicencia: employee?.tipoLicencia || [],
    
    // Observaciones
    observaciones: employee?.observaciones || ""
  });

  const handleInputChange = (field: string, value: string | File | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (field: string, file: File | null) => {
    setFormData(prev => ({ ...prev, [field]: file }));
  };

  const handleLicenseChange = (licenseType: string, checked: boolean) => {
    setFormData(prev => {
      const currentLicenses = Array.isArray(prev.tipoLicencia) ? prev.tipoLicencia : [];
      let newLicenses;
      
      if (checked) {
        // Agregar licencia si no existe
        newLicenses = currentLicenses.includes(licenseType) 
          ? currentLicenses 
          : [...currentLicenses, licenseType];
      } else {
        // Remover licencia
        newLicenses = currentLicenses.filter(license => license !== licenseType);
      }
      
      return { ...prev, tipoLicencia: newLicenses };
    });
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
        return Math.round((diasTrabajados / 20) * 100) / 100; // Redondear a 2 decimales
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

  const handleSave = () => {
    // Validación: Nombres
    if (!formData.nombres?.trim()) {
      toast({
        title: "Falta completar el nombre",
        description: "Por favor ingrese el nombre del empleado antes de guardar.",
        variant: "destructive"
      });
      return;
    }

    // Validación: Apellidos
    if (!formData.apellidos?.trim()) {
      toast({
        title: "Falta completar el apellido",
        description: "Por favor ingrese el apellido del empleado antes de guardar.",
        variant: "destructive"
      });
      return;
    }

    // Validación: DNI
    if (!formData.dni?.trim()) {
      toast({
        title: "Falta completar el DNI",
        description: "Por favor ingrese el número de documento del empleado.",
        variant: "destructive"
      });
      return;
    } else if (!/^\d+$/.test(formData.dni)) {
      toast({
        title: "DNI inválido",
        description: "El DNI solo debe contener números (sin puntos ni letras).",
        variant: "destructive"
      });
      return;
    }

    // Validación: Fecha de ingreso
    if (!formData.fechaIngreso) {
      toast({
        title: "Falta seleccionar la fecha de ingreso",
        description: "Por favor elija la fecha en la que el empleado ingresó a la empresa.",
        variant: "destructive"
      });
      return;
    }

    // Validación: Fecha de ingreso no puede ser futura
    if (formData.fechaIngreso) {
      const fechaIngreso = new Date(formData.fechaIngreso);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      if (fechaIngreso > hoy) {
        toast({
          title: "Fecha inválida",
          description: "La fecha de ingreso no puede ser una fecha futura.",
          variant: "destructive"
        });
        return;
      }
    }

    // Validación de Fecha de Nacimiento y Edad
    if (formData.fechaNacimiento) {
      const fechaNac = new Date(formData.fechaNacimiento);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      // Calcular edad exacta
      let edad = hoy.getFullYear() - fechaNac.getFullYear();
      const diferenciaMeses = hoy.getMonth() - fechaNac.getMonth();
      if (diferenciaMeses < 0 || (diferenciaMeses === 0 && hoy.getDate() < fechaNac.getDate())) {
        edad--;
      }

      if (edad < EDAD_MINIMA_LEGAL) {
        toast({
          title: "Error: Edad insuficiente",
          description: `El empleado debe tener al menos ${EDAD_MINIMA_LEGAL} años. Edad actual: ${edad} años`,
          variant: "destructive"
        });
        return;
      }

      if (edad > EDAD_MAXIMA_RAZONABLE) {
        toast({
          title: "Error en Fecha de Nacimiento",
          description: "La fecha de nacimiento ingresada no es válida. Por favor verifique los datos",
          variant: "destructive"
        });
        return;
      }
    }

    // Guardar en lista (padre)
    const payload = { ...formData, id: employee?.id };
    onSave?.(payload);

    toast({
      title: isEditing ? "Empleado actualizado" : "Empleado creado",
      description: `${formData.nombres} ${formData.apellidos} ha sido ${isEditing ? 'actualizado' : 'registrado'} exitosamente`,
    });

    setTimeout(() => onBack(), 800);
  };

  const generateLegajo = () => {
    if (!formData.nombres || !formData.apellidos) {
      toast({
        title: "Error",
        description: "Complete los datos básicos antes de generar el legajo",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Legajo digital generado",
      description: "El legajo completo con todos los datos se ha generado exitosamente y está listo para descarga y firma",
    });
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
              {isEditing ? "Editar Empleado" : "Nuevo Empleado"}
            </h2>
            <p className="text-foreground/70">
              {isEditing ? "Modifica la información del empleado" : "Completa los datos para crear el legajo digital"}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <LegajoPDF 
            employeeData={formData}
            trigger={
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Previsualizar Legajo
              </Button>
            }
          />
          <Button variant="outline" onClick={generateLegajo}>
            <Download className="h-4 w-4 mr-2" />
            Generar PDF
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            {isEditing ? "Actualizar" : "Guardar"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Datos Personales */}
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Datos Personales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nombres" className="text-foreground">Nombres *</Label>
                <Input
                  id="nombres"
                  value={formData.nombres}
                  onChange={(e) => handleInputChange("nombres", e.target.value)}
                  placeholder="Nombres completos"
                  required
                />
              </div>
              <div>
                <Label htmlFor="apellidos" className="text-foreground">Apellidos *</Label>
                <Input
                  id="apellidos"
                  value={formData.apellidos}
                  onChange={(e) => handleInputChange("apellidos", e.target.value)}
                  placeholder="Apellidos completos"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dni" className="text-foreground">DNI *</Label>
                <Input
                  id="dni"
                  value={formData.dni}
                  onChange={(e) => handleInputChange("dni", e.target.value)}
                  placeholder="12345678"
                  required
                />
              </div>
              <div>
                <Label htmlFor="cuil" className="text-foreground">CUIL</Label>
                <Input
                  id="cuil"
                  value={formData.cuil}
                  onChange={(e) => handleInputChange("cuil", e.target.value)}
                  placeholder="20-12345678-9"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="idHuella" className="text-foreground">ID de Huella</Label>
              <Input
                id="idHuella"
                value={formData.idHuella}
                onChange={(e) => handleInputChange("idHuella", e.target.value)}
                placeholder="Identificador del sistema biométrico"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fechaNacimiento" className="text-foreground">Fecha de Nacimiento</Label>
                <Input
                  id="fechaNacimiento"
                  type="date"
                  value={formData.fechaNacimiento}
                  onChange={(e) => handleInputChange("fechaNacimiento", e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <Label htmlFor="estadoCivil" className="text-foreground">Estado Civil</Label>
                <Select value={formData.estadoCivil} onValueChange={(value) => handleInputChange("estadoCivil", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado civil" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="soltero">Soltero/a</SelectItem>
                    <SelectItem value="casado">Casado/a</SelectItem>
                    <SelectItem value="divorciado">Divorciado/a</SelectItem>
                    <SelectItem value="viudo">Viudo/a</SelectItem>
                    <SelectItem value="union-convivencial">Unión Convivencial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="direccion" className="text-foreground">Domicilio Completo</Label>
              <Textarea
                id="direccion"
                value={formData.direccion}
                onChange={(e) => handleInputChange("direccion", e.target.value)}
                placeholder="Dirección completa con ciudad y código postal"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Documentos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Documentos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="fotoDni" className="text-foreground">Foto del DNI (Opcional)</Label>
              <Input
                id="fotoDni"
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange("fotoDni", e.target.files?.[0] || null)}
                className="mt-1"
              />
              {formData.fotoDni && (
                <p className="text-sm text-foreground/60 mt-1">
                  Archivo seleccionado: {formData.fotoDni.name}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="fotoCarnet" className="text-foreground">Foto Carnet (Opcional)</Label>
              <Input
                id="fotoCarnet"
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange("fotoCarnet", e.target.files?.[0] || null)}
                className="mt-1"
              />
              {formData.fotoCarnet && (
                <p className="text-sm text-foreground/60 mt-1">
                  Archivo seleccionado: {formData.fotoCarnet.name}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Datos de Contacto */}
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Información de Contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="telefono" className="text-foreground">Teléfono del Empleado</Label>
              <Input
                id="telefono"
                value={formData.telefono}
                onChange={(e) => handleInputChange("telefono", e.target.value)}
                placeholder="+54 9 11 1234-5678"
              />
            </div>
            
            <div>
              <Label htmlFor="email" className="text-foreground">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="empleado@empresa.com"
              />
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-foreground">Contacto de Emergencia</h4>
              
              <div>
                <Label htmlFor="contactoEmergencia" className="text-foreground">Nombre Completo</Label>
                <Input
                  id="contactoEmergencia"
                  value={formData.contactoEmergencia}
                  onChange={(e) => handleInputChange("contactoEmergencia", e.target.value)}
                  placeholder="Nombre y apellido del contacto"
                />
              </div>

              <div>
                <Label htmlFor="parentescoEmergencia" className="text-foreground">Parentesco</Label>
                <Select value={formData.parentescoEmergencia} onValueChange={(value) => handleInputChange("parentescoEmergencia", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar parentesco" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="padre">Padre</SelectItem>
                    <SelectItem value="madre">Madre</SelectItem>
                    <SelectItem value="conyuge">Cónyuge</SelectItem>
                    <SelectItem value="hijo">Hijo/a</SelectItem>
                    <SelectItem value="hermano">Hermano/a</SelectItem>
                    <SelectItem value="abuelo">Abuelo/a</SelectItem>
                    <SelectItem value="tio">Tío/a</SelectItem>
                    <SelectItem value="amigo">Amigo/a</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="telefonoEmergencia" className="text-foreground">Teléfono de Emergencia</Label>
                <Input
                  id="telefonoEmergencia"
                  value={formData.telefonoEmergencia}
                  onChange={(e) => handleInputChange("telefonoEmergencia", e.target.value)}
                  placeholder="+54 9 11 1234-5678"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Datos Laborales */}
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Información Laboral</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="cargo" className="text-foreground">Puesto/Cargo</Label>
              <Select value={formData.cargo} onValueChange={(value) => handleInputChange("cargo", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar puesto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operario-mantenimiento">Operario Mantenimiento</SelectItem>
                  <SelectItem value="operario-produccion">Operario Producción</SelectItem>
                  <SelectItem value="recursos-humanos">Recursos Humanos</SelectItem>
                  <SelectItem value="administracion">Administración</SelectItem>
                  <SelectItem value="chofer">Chofer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="sector" className="text-foreground">Sector</Label>
              <Select value={formData.sector} onValueChange={(value) => handleInputChange("sector", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar sector" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="administracion">Administración</SelectItem>
                  <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                  <SelectItem value="produccion">Producción</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="tipoContrato" className="text-foreground">Tipo de Contrato</Label>
              <Select value={formData.tipoContrato} onValueChange={(value) => handleInputChange("tipoContrato", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo de contrato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="indefinido">Contrato por tiempo indeterminado</SelectItem>
                  <SelectItem value="temporal">Contrato temporal</SelectItem>
                  <SelectItem value="obra">Contrato por obra o servicio</SelectItem>
                  <SelectItem value="pasantia">Pasantía</SelectItem>
                  <SelectItem value="eventual">Trabajo eventual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="fechaIngreso" className="text-foreground">Fecha de Ingreso *</Label>
              <Input
                id="fechaIngreso"
                type="date"
                value={formData.fechaIngreso}
                onChange={(e) => handleInputChange("fechaIngreso", e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                required
              />
            </div>

            <div>
              <Label htmlFor="salario" className="text-foreground">Salario Básico</Label>
              <Input
                id="salario"
                type="number"
                value={formData.salario}
                onChange={(e) => handleInputChange("salario", e.target.value)}
                placeholder="450000"
              />
            </div>

            <div>
              <Label htmlFor="estado" className="text-foreground">Estado del Empleado</Label>
              <Select onValueChange={(value) => handleInputChange("estado", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="inactivo">Inactivo</SelectItem>
                  <SelectItem value="licencia">En Licencia</SelectItem>
                  <SelectItem value="suspension">Suspendido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Información calculada automáticamente */}
            {formData.fechaIngreso && (
              <div className="space-y-2 p-4 bg-secondary/10 rounded-lg border border-secondary/20">
                <h4 className="font-semibold text-foreground">Información Calculada</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-foreground">Antigüedad:</Label>
                    <p className="text-foreground/80">
                      {(() => {
                        const antiquity = calculateDetailedAntiquity(formData.fechaIngreso);
                        return `${antiquity.years} años, ${antiquity.months} meses, ${antiquity.days} días`;
                      })()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-foreground">Días de Vacaciones Anuales:</Label>
                    <p className="text-foreground/80">
                      {calculateVacationDays(formData.fechaIngreso)} días
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Información Académica */}
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Información Académica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="nivelEducativo" className="text-foreground">Nivel Educativo Alcanzado</Label>
              <Select onValueChange={(value) => handleInputChange("nivelEducativo", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar nivel educativo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primario-incompleto">Primario Incompleto</SelectItem>
                  <SelectItem value="primario-completo">Primario Completo</SelectItem>
                  <SelectItem value="secundario-incompleto">Secundario Incompleto</SelectItem>
                  <SelectItem value="secundario-completo">Secundario Completo</SelectItem>
                  <SelectItem value="terciario-incompleto">Terciario Incompleto</SelectItem>
                  <SelectItem value="terciario-completo">Terciario Completo</SelectItem>
                  <SelectItem value="universitario-incompleto">Universitario Incompleto</SelectItem>
                  <SelectItem value="universitario-completo">Universitario Completo</SelectItem>
                  <SelectItem value="posgrado">Posgrado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="titulo" className="text-foreground">Título Obtenido</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => handleInputChange("titulo", e.target.value)}
                placeholder="Ej: Bachiller en Ciencias Naturales, Técnico en..."
              />
            </div>

            <div>
              <Label htmlFor="otrosConocimientos" className="text-foreground">Otros Conocimientos</Label>
              <Textarea
                id="otrosConocimientos"
                value={formData.otrosConocimientos}
                onChange={(e) => handleInputChange("otrosConocimientos", e.target.value)}
                placeholder="Cursos, capacitaciones, idiomas, habilidades técnicas, etc."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Información Médica */}
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Información Médica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="grupoSanguineo" className="text-foreground">Grupo Sanguíneo</Label>
              <Select onValueChange={(value) => handleInputChange("grupoSanguineo", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar grupo sanguíneo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A+">A+</SelectItem>
                  <SelectItem value="A-">A-</SelectItem>
                  <SelectItem value="B+">B+</SelectItem>
                  <SelectItem value="B-">B-</SelectItem>
                  <SelectItem value="AB+">AB+</SelectItem>
                  <SelectItem value="AB-">AB-</SelectItem>
                  <SelectItem value="O+">O+</SelectItem>
                  <SelectItem value="O-">O-</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="obraSocial" className="text-foreground">Obra Social</Label>
              <Input
                id="obraSocial"
                value={formData.obraSocial}
                onChange={(e) => handleInputChange("obraSocial", e.target.value)}
                placeholder="Nombre de la obra social y número de afiliado"
              />
            </div>

            <div>
              <Label htmlFor="alergias" className="text-foreground">Alergias</Label>
              <Textarea
                id="alergias"
                value={formData.alergias}
                onChange={(e) => handleInputChange("alergias", e.target.value)}
                placeholder="Detallar alergias conocidas (medicamentos, alimentos, sustancias, etc.)"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="medicacionHabitual" className="text-foreground">Medicación Habitual</Label>
              <Textarea
                id="medicacionHabitual"
                value={formData.medicacionHabitual}
                onChange={(e) => handleInputChange("medicacionHabitual", e.target.value)}
                placeholder="Medicamentos que toma regularmente, dosis y frecuencia"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Información Familiar y Licencias */}
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Información Familiar y Licencias</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="tieneHijos" className="text-foreground">¿Tiene Hijos?</Label>
              <Select onValueChange={(value) => handleInputChange("tieneHijos", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="si">Sí</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.tieneHijos === "si" && (
              <div>
                <Label htmlFor="nombresHijos" className="text-foreground">Nombres de los Hijos</Label>
                <Textarea
                  id="nombresHijos"
                  value={formData.nombresHijos}
                  onChange={(e) => handleInputChange("nombresHijos", e.target.value)}
                  placeholder="Ingrese los nombres de los hijos"
                  rows={2}
                />
              </div>
            )}

            <div>
              <Label htmlFor="tieneLicencia" className="text-foreground">¿Posee Licencia de Conducir?</Label>
              <Select onValueChange={(value) => handleInputChange("tieneLicencia", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="si">Sí</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.tieneLicencia === "si" && (
              <div>
                <Label className="text-foreground mb-3 block">Tipos de Licencia (seleccione todos los que posee)</Label>
                <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto p-4 border rounded-md bg-background">
                  {licenseTypes.map((license) => {
                    const currentLicenses = Array.isArray(formData.tipoLicencia) ? formData.tipoLicencia : [];
                    const isChecked = currentLicenses.includes(license.id);
                    
                    return (
                      <div key={license.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={license.id}
                          checked={isChecked}
                          onCheckedChange={(checked) => handleLicenseChange(license.id, checked as boolean)}
                        />
                        <Label 
                          htmlFor={license.id} 
                          className="text-sm font-normal cursor-pointer flex-1"
                        >
                          {license.label}
                        </Label>
                      </div>
                    );
                  })}
                </div>
                
                {/* Mostrar licencias seleccionadas */}
                {Array.isArray(formData.tipoLicencia) && formData.tipoLicencia.length > 0 && (
                  <div className="mt-3">
                    <Label className="text-foreground text-sm">Licencias seleccionadas:</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.tipoLicencia.map((licenseId) => {
                        const license = licenseTypes.find(l => l.id === licenseId);
                        return license ? (
                          <Badge key={licenseId} variant="secondary" className="text-xs">
                            {license.label}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Observaciones */}
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Observaciones Adicionales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="observaciones" className="text-foreground">Otras Observaciones</Label>
              <Textarea
                id="observaciones"
                value={formData.observaciones}
                onChange={(e) => handleInputChange("observaciones", e.target.value)}
                placeholder="Cualquier información adicional relevante sobre el empleado..."
                rows={4}
              />
            </div>

            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
              <h4 className="font-semibold text-foreground mb-2">Información sobre el Legajo Digital</h4>
              <ul className="text-sm text-foreground/70 space-y-1">
                <li>• El legajo PDF incluirá todos los datos ingresados</li>
                <li>• Se generará con espacios para firma y aclaración</li>
                <li>• Documento listo para imprimir y firmar</li>
                <li>• Cumple con requisitos legales de documentación laboral</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmployeeForm;