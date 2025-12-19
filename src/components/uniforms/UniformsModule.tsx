import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useEmployees } from "@/hooks/useEmployees";
import { useUniforms, UniformDelivery } from "@/hooks/useUniforms";
import { Shirt, Plus, Download, Calendar, User, Package, Trash2, Search, Filter, Pencil } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import html2pdf from "html2pdf.js";
import { formatDateLocal } from "@/utils/dateUtils";
import { clientConfig } from "@/config/client";

const UniformsModule = () => {
  const { getActiveEmployees } = useEmployees();
  const { uniforms, addUniform, updateUniform, deleteUniform, loading } = useUniforms();
  const { toast } = useToast();
  const activeEmployees = getActiveEmployees();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUniform, setEditingUniform] = useState<UniformDelivery | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [uniformType, setUniformType] = useState("");
  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
  const [season, setSeason] = useState("");
  const [condition, setCondition] = useState("");
  const [notes, setNotes] = useState("");
  const [galpon, setGalpon] = useState("");
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const uniformTypes = [
    "Barbijo",
    "Guantes",
    "Mameluco",
    "Sordina",
    "Gafas de seguridad",
    "Remera",
    "Pantalón cargo",
    "Zapatos punta de acero",
    "Campera",
    "Buzo"
  ];

  const sizes = ["Sin talle", "XS", "S", "M", "L", "XL", "XXL", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46", "47", "48", "49", "50"];

  const seasons = ["Verano", "Invierno", "Todo el año"];

  const conditions = ["Nuevo", "Usado - Buen estado", "Usado - Estado regular"];

  // Elementos de protección se entregan a demanda
  const protectionElements = ["Barbijo", "Guantes", "Mameluco", "Sordina", "Gafas de seguridad"];
  
  // Uniformes tienen fechas programadas de entrega
  const uniformTypes6Months = ["Remera", "Pantalón cargo", "Campera", "Buzo"];
  const uniformTypes1Year = ["Zapatos punta de acero"];

  const getItemCategory = (uniformType: string) => {
    if (protectionElements.includes(uniformType)) {
      return "Elemento de protección";
    }
    return "Uniforme";
  };

  const calculateNextDeliveryDate = (uniformType: string, deliveryDate: string) => {
    if (protectionElements.includes(uniformType)) {
      return null; // A demanda
    }
    
    const delivery = new Date(deliveryDate);
    if (uniformTypes1Year.includes(uniformType)) {
      const nextDate = new Date(delivery);
      nextDate.setFullYear(delivery.getFullYear() + 1);
      return nextDate;
    } else if (uniformTypes6Months.includes(uniformType)) {
      const nextDate = new Date(delivery);
      nextDate.setMonth(delivery.getMonth() + 6);
      return nextDate;
    }
    
    return null;
  };

  const getNextDeliveryStatus = (uniformType: string, deliveryDate: string) => {
    const nextDate = calculateNextDeliveryDate(uniformType, deliveryDate);
    
    if (!nextDate) {
      return { text: "A demanda", color: "text-foreground/70", bgColor: "bg-muted" };
    }
    
    const today = new Date();
    const isOverdue = nextDate < today;
    
    // Convertir nextDate a formato YYYY-MM-DD para usar formatDateLocal
    const year = nextDate.getFullYear();
    const month = String(nextDate.getMonth() + 1).padStart(2, '0');
    const day = String(nextDate.getDate()).padStart(2, '0');
    const nextDateString = `${year}-${month}-${day}`;
    
    return {
      text: formatDateLocal(nextDateString),
      color: isOverdue ? "text-red-600" : "text-green-600",
      bgColor: isOverdue ? "bg-red-50" : "bg-green-50"
    };
  };

  // Función de filtrado
  const filteredUniforms = uniforms.filter(uniform => {
    const matchesSearch = (
      uniform.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      uniform.employeeDni?.includes(searchTerm) ||
      uniform.uniform_type?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const matchesType = !filterType || filterType === "all" || uniform.uniform_type === filterType;
    const matchesStatus = !filterStatus || filterStatus === "all" || uniform.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleSubmit = async () => {
    if (!selectedEmployee || !uniformType || !size || !season || !condition || !deliveryDate) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive",
      });
      return;
    }

    const employee = activeEmployees.find(emp => emp.id.toString() === selectedEmployee);
    if (!employee) return;

    try {
      await addUniform({
        employee_id: employee.id,
        uniform_type: uniformType,
        size,
        quantity: parseInt(quantity),
        delivery_date: deliveryDate,
        season,
        condition,
        notes: notes || null,
        galpon: galpon ? parseInt(galpon) : null,
        status: "entregado"
      } as any);

      // Reset form
      setSelectedEmployee("");
      setUniformType("");
      setSize("");
      setQuantity("1");
      setDeliveryDate(new Date().toISOString().split('T')[0]);
      setSeason("");
      setCondition("");
      setNotes("");
      setGalpon("");
      setIsDialogOpen(false);
    } catch (error) {
      // Error already handled by hook
    }
  };

  const handleEditUniform = (uniform: UniformDelivery) => {
    setEditingUniform(uniform);
    setSelectedEmployee(uniform.employee_id);
    setUniformType(uniform.uniform_type);
    setSize(uniform.size);
    setQuantity(uniform.quantity.toString());
    setDeliveryDate(uniform.delivery_date);
    setSeason(uniform.season);
    setCondition(uniform.condition);
    setNotes(uniform.notes || "");
    setGalpon(uniform.galpon?.toString() || "");
    setIsEditDialogOpen(true);
  };

  const handleUpdateUniform = async () => {
    if (!editingUniform || !selectedEmployee || !uniformType || !size || !season || !condition || !deliveryDate) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateUniform(editingUniform.id, {
        employee_id: selectedEmployee,
        uniform_type: uniformType,
        size,
        quantity: parseInt(quantity),
        delivery_date: deliveryDate,
        season,
        condition,
        notes: notes || null,
        galpon: galpon ? parseInt(galpon) : null,
        status: editingUniform.status
      } as any);

      // Reset form
      setEditingUniform(null);
      setSelectedEmployee("");
      setUniformType("");
      setSize("");
      setQuantity("1");
      setDeliveryDate(new Date().toISOString().split('T')[0]);
      setSeason("");
      setCondition("");
      setNotes("");
      setGalpon("");
      setIsEditDialogOpen(false);
    } catch (error) {
      // Error already handled by hook
    }
  };

  const handleDeleteUniform = async (uniformId: string, employeeName: string) => {
    try {
      await deleteUniform(uniformId);
      toast({
        title: "Uniforme eliminado",
        description: `El registro de uniforme de ${employeeName} ha sido eliminado`,
      });
    } catch (error) {
      // El hook ya muestra el toast de error
    }
  };

  const generateDeliveryReceipt = (delivery: any) => {
    // Buscar el empleado para obtener el puesto
    const employee = activeEmployees.find(emp => emp.id.toString() === delivery.employee_id.toString());
    const puesto = employee?.puesto || '';
    
    const content = `
      <div style="font-family: Arial, sans-serif; padding: 12px; max-width: 1350px; font-size: 12px;">
        <!-- Encabezado -->
        <div style="text-align: center; margin-bottom: 15px; border: 3px solid #000; padding: 8px;">
          <h2 style="margin: 0; font-size: 16px; font-weight: bold;">CONSTANCIA DE ENTREGA DE ROPA DE TRABAJO Y ELEMENTOS DE PROTECCIÓN PERSONAL</h2>
          <p style="margin: 3px 0; font-size: 12px;">(Resolución 299/11, Anexo I)</p>
        </div>
        
        <!-- Datos de la empresa -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; border: 2px solid #000; font-size: 11px;">
          <tr>
            <td style="border: 2px solid #000; padding: 6px; font-weight: bold; width: 12%; background-color: #f0f0f0;">Razón social:</td>
            <td style="border: 2px solid #000; padding: 6px; width: 28%;">${clientConfig.nombre}</td>
            <td style="border: 2px solid #000; padding: 6px; font-weight: bold; width: 10%; background-color: #f0f0f0;">C.U.I.T.:</td>
            <td style="border: 2px solid #000; padding: 6px; width: 20%;">20-24088189-7</td>
            <td style="border: 2px solid #000; padding: 6px; font-weight: bold; width: 10%; background-color: #f0f0f0;">C.P.:</td>
            <td style="border: 2px solid #000; padding: 6px; width: 20%;">5127</td>
          </tr>
          <tr>
            <td style="border: 2px solid #000; padding: 6px; font-weight: bold; background-color: #f0f0f0;">Dirección:</td>
            <td style="border: 2px solid #000; padding: 6px;">Avda. José Hernández 90</td>
            <td style="border: 2px solid #000; padding: 6px; font-weight: bold; background-color: #f0f0f0;">Localidad:</td>
            <td style="border: 2px solid #000; padding: 6px;">Río Primero</td>
            <td style="border: 2px solid #000; padding: 6px; font-weight: bold; background-color: #f0f0f0;">Provincia:</td>
            <td style="border: 2px solid #000; padding: 6px;">Córdoba</td>
          </tr>
          <tr>
            <td style="border: 2px solid #000; padding: 6px; font-weight: bold; background-color: #f0f0f0;">Nombre y apellido del trabajador:</td>
            <td style="border: 2px solid #000; padding: 6px;">${delivery.employeeName}</td>
            <td style="border: 2px solid #000; padding: 6px; font-weight: bold; background-color: #f0f0f0;">D.N.I.:</td>
            <td colspan="3" style="border: 2px solid #000; padding: 6px;">${delivery.employeeDni}</td>
          </tr>
          <tr>
            <td style="border: 2px solid #000; padding: 6px; font-weight: bold; background-color: #f0f0f0;">Puesto/s de trabajo:</td>
            <td colspan="5" style="border: 2px solid #000; padding: 6px;">${puesto}</td>
          </tr>
        </table>
        
        <!-- Solo título de elementos de protección -->
        <div style="background-color: #000; color: white; text-align: center; padding: 10px; font-weight: bold; margin-bottom: 15px; font-size: 14px;">
          ELEMENTOS DE PROTECCIÓN PERSONAL E INDUMENTARIA, NECESARIOS PARA EL TRABAJADOR SEGÚN PUESTO DE TRABAJO
        </div>
        
        <!-- Tabla principal de productos entregados -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; border: 2px solid #000; font-size: 11px;">
          <tr style="background-color: #f0f0f0;">
            <td style="border: 2px solid #000; padding: 8px; text-align: center; font-weight: bold; width: 6%;">Nº</td>
            <td style="border: 2px solid #000; padding: 8px; text-align: center; font-weight: bold; width: 22%;">Producto</td>
            <td style="border: 2px solid #000; padding: 8px; text-align: center; font-weight: bold; width: 16%;">Tipo / Modelo</td>
            <td style="border: 2px solid #000; padding: 8px; text-align: center; font-weight: bold; width: 14%;">Marca</td>
            <td style="border: 2px solid #000; padding: 8px; text-align: center; font-weight: bold; width: 12%;">Certificación</td>
            <td style="border: 2px solid #000; padding: 8px; text-align: center; font-weight: bold; width: 8%;">Cantidad</td>
            <td style="border: 2px solid #000; padding: 8px; text-align: center; font-weight: bold; width: 12%;">Fecha de entrega</td>
            <td style="border: 2px solid #000; padding: 8px; text-align: center; font-weight: bold; width: 10%;">Firma del Trabajador</td>
          </tr>
          <!-- Fila con los datos del uniforme entregado -->
          <tr>
            <td style="border: 2px solid #000; padding: 12px; text-align: center; font-size: 12px;">1</td>
            <td style="border: 2px solid #000; padding: 12px; font-size: 12px;">${delivery.uniform_type}</td>
            <td style="border: 2px solid #000; padding: 12px; font-size: 12px;">${delivery.condition}</td>
            <td style="border: 2px solid #000; padding: 12px; font-size: 12px;">GENERICO</td>
            <td style="border: 2px solid #000; padding: 12px; font-size: 12px;">SI</td>
            <td style="border: 2px solid #000; padding: 12px; text-align: center; font-size: 12px;">${delivery.quantity}</td>
            <td style="border: 2px solid #000; padding: 12px; text-align: center; font-size: 12px;">${formatDateLocal(delivery.delivery_date)}</td>
            <td style="border: 2px solid #000; padding: 12px;">&nbsp;</td>
          </tr>
          <!-- Filas vacías optimizadas -->
          ${Array.from({length: 4}, (_, i) => `
            <tr>
              <td style="border: 2px solid #000; padding: 12px; text-align: center;">${i + 2}</td>
              <td style="border: 2px solid #000; padding: 12px;">&nbsp;</td>
              <td style="border: 2px solid #000; padding: 12px;">&nbsp;</td>
              <td style="border: 2px solid #000; padding: 12px;">&nbsp;</td>
              <td style="border: 2px solid #000; padding: 12px;">&nbsp;</td>
              <td style="border: 2px solid #000; padding: 12px;">&nbsp;</td>
              <td style="border: 2px solid #000; padding: 12px;">&nbsp;</td>
              <td style="border: 2px solid #000; padding: 12px;">&nbsp;</td>
            </tr>
          `).join('')}
        </table>
        
        <!-- Observaciones -->
        <div style="border: 2px solid #000; padding: 15px; font-size: 11px;">
          <strong>Observaciones:</strong>
          <div style="margin-top: 8px; min-height: 50px;">
            ${delivery.notes || ''}
          </div>
        </div>
      </div>
    `;

    const opt = {
      margin: [0.15, 0.15, 0.15, 0.15],
      filename: `constancia-entrega-${delivery.employeeName?.replace(/\s+/g, '-')}-${delivery.id}.pdf`,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        dpi: 300,
        letterRendering: true
      },
      jsPDF: { 
        unit: 'in', 
        format: 'a4', 
        orientation: 'landscape',
        compress: false
      }
    };

    html2pdf().set(opt).from(content).save();
  };

  const generateGeneralReport = () => {
    const content = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1f2937;">REPORTE GENERAL DE UNIFORMES</h1>
          <p style="color: #6b7280;">Generado el ${new Date().toLocaleDateString('es-AR')}</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="color: #1f2937;">Resumen</h3>
          <p><strong>Total de entregas:</strong> ${uniforms.length}</p>
          <p><strong>Empleados con uniformes:</strong> ${new Set(uniforms.map(d => d.employee_id)).size}</p>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Empleado</th>
              <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Tipo</th>
              <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Talle</th>
              <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Fecha</th>
              <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Estado</th>
            </tr>
          </thead>
          <tbody>
            ${uniforms.map(delivery => `
              <tr>
                <td style="border: 1px solid #d1d5db; padding: 8px;">${delivery.employeeName}</td>
                <td style="border: 1px solid #d1d5db; padding: 8px;">${delivery.uniform_type}</td>
                <td style="border: 1px solid #d1d5db; padding: 8px;">${delivery.size}</td>
                <td style="border: 1px solid #d1d5db; padding: 8px;">${formatDateLocal(delivery.delivery_date)}</td>
                <td style="border: 1px solid #d1d5db; padding: 8px;">${delivery.status}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    const opt = {
      margin: 1,
      filename: `reporte-uniformes-${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(content).save();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Shirt className="h-8 w-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold text-foreground">Entrega de Uniformes</h2>
            <p className="text-foreground/70">Gestiona la entrega y control de uniformes de trabajo</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={generateGeneralReport}>
            <Download className="h-4 w-4 mr-2" />
            Reporte General
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Entrega
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Registrar Entrega de Uniforme</DialogTitle>
                <DialogDescription>
                  Completa la información de la entrega de uniforme
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div>
                  <Label htmlFor="employee">Empleado *</Label>
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar empleado" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeEmployees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id.toString()}>
                          {employee.nombres} {employee.apellidos} - {employee.dni}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="uniformType">Tipo de Uniforme *</Label>
                  <Select value={uniformType} onValueChange={(value) => {
                    setUniformType(value);
                    // Auto-asignar temporada para elementos de protección
                    if (protectionElements.includes(value)) {
                      setSeason("Todo el año");
                      setSize("Sin talle");
                    } else {
                      setSeason("");
                      setSize("");
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                        Elementos de Protección
                      </div>
                      {protectionElements.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                      <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground border-t mt-1 pt-2">
                        Uniformes
                      </div>
                      {["Remera", "Pantalón cargo", "Zapatos punta de acero", "Campera", "Buzo"].map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="size">Talle *</Label>
                    <Select value={size} onValueChange={setSize}>
                      <SelectTrigger>
                        <SelectValue placeholder="Talle" />
                      </SelectTrigger>
                      <SelectContent>
                        {sizes.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="quantity">Cantidad</Label>
                    <Input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      min="1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="deliveryDate">Fecha de Entrega *</Label>
                  <Input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="season">
                    Temporada * 
                    {protectionElements.includes(uniformType) && (
                      <span className="text-xs text-muted-foreground ml-1">(Auto-asignado)</span>
                    )}
                  </Label>
                  <Select 
                    value={season} 
                    onValueChange={setSeason}
                    disabled={protectionElements.includes(uniformType)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar temporada" />
                    </SelectTrigger>
                    <SelectContent>
                      {seasons.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="condition">Estado *</Label>
                  <Select value={condition} onValueChange={setCondition}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {conditions.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="galpon">Galpón</Label>
                  <Select value={galpon} onValueChange={setGalpon}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar galpón (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sin galpón</SelectItem>
                      <SelectItem value="1">Galpón 1</SelectItem>
                      <SelectItem value="2">Galpón 2</SelectItem>
                      <SelectItem value="3">Galpón 3</SelectItem>
                      <SelectItem value="4">Galpón 4</SelectItem>
                      <SelectItem value="5">Galpón 5</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="notes">Observaciones/Finalidad</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Observaciones y/o finalidad de la entrega (opcional)"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit}>Registrar Entrega</Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Dialog para Editar Uniforme */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Editar Entrega de Uniforme</DialogTitle>
                <DialogDescription>
                  Modifica la información de la entrega de uniforme
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div>
                  <Label htmlFor="employee">Empleado *</Label>
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar empleado" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeEmployees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id.toString()}>
                          {employee.nombres} {employee.apellidos} - {employee.dni}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="uniformType">Tipo de Uniforme/Elemento *</Label>
                  <Select value={uniformType} onValueChange={setUniformType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {uniformTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="size">Talle *</Label>
                    <Select value={size} onValueChange={setSize}>
                      <SelectTrigger>
                        <SelectValue placeholder="Talle" />
                      </SelectTrigger>
                      <SelectContent>
                        {sizes.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="quantity">Cantidad *</Label>
                    <Input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="deliveryDate">Fecha de Entrega *</Label>
                  <Input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="season">Temporada *</Label>
                  <Select value={season} onValueChange={setSeason}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar temporada" />
                    </SelectTrigger>
                    <SelectContent>
                      {seasons.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="condition">Estado *</Label>
                  <Select value={condition} onValueChange={setCondition}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {conditions.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="galpon">Galpón</Label>
                  <Select value={galpon} onValueChange={setGalpon}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar galpón (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sin galpón</SelectItem>
                      <SelectItem value="1">Galpón 1</SelectItem>
                      <SelectItem value="2">Galpón 2</SelectItem>
                      <SelectItem value="3">Galpón 3</SelectItem>
                      <SelectItem value="4">Galpón 4</SelectItem>
                      <SelectItem value="5">Galpón 5</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="notes">Observaciones/Finalidad</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Observaciones y/o finalidad de la entrega (opcional)"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleUpdateUniform}>Guardar Cambios</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filtros y Búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Filtros y Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground/60" />
              <Input
                placeholder="Buscar por empleado, DNI, tipo de uniforme..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {uniformTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="entregado">Entregado</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Uniformes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Lista de Entregas ({filteredUniforms.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
                <p className="text-lg font-medium text-foreground">Cargando entregas...</p>
              </div>
            </div>
          ) : filteredUniforms.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-foreground">
                  {uniforms.length === 0 ? "No hay entregas registradas" : "No se encontraron entregas"}
                </p>
                <p className="text-foreground/70">
                  {uniforms.length === 0 
                    ? "Comienza registrando la primera entrega de uniforme"
                    : "No hay entregas que coincidan con los filtros seleccionados"
                  }
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border">
                  <tr className="text-left">
                    <th className="px-6 py-3 text-sm font-medium text-foreground/70">Empleado</th>
                    <th className="px-6 py-3 text-sm font-medium text-foreground/70">Tipo</th>
                    <th className="px-6 py-3 text-sm font-medium text-foreground/70">Categoría</th>
                    <th className="px-6 py-3 text-sm font-medium text-foreground/70">Talle</th>
                    <th className="px-6 py-3 text-sm font-medium text-foreground/70">Cantidad</th>
                    <th className="px-6 py-3 text-sm font-medium text-foreground/70">Galpón</th>
                    <th className="px-6 py-3 text-sm font-medium text-foreground/70">Fecha Entrega</th>
                    <th className="px-6 py-3 text-sm font-medium text-foreground/70">Próxima Entrega</th>
                    <th className="px-6 py-3 text-sm font-medium text-foreground/70">Estado</th>
                    <th className="px-6 py-3 text-sm font-medium text-foreground/70">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUniforms.map((delivery) => (
                    <tr key={delivery.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">
                            {delivery.employeeName}
                          </span>
                          <span className="text-sm text-foreground/60">DNI: {delivery.employeeDni}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-foreground">{delivery.uniform_type}</td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="text-xs whitespace-nowrap">
                          {getItemCategory(delivery.uniform_type)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-foreground">{delivery.size}</td>
                      <td className="px-6 py-4 text-foreground">{delivery.quantity}</td>
                      <td className="px-6 py-4 text-foreground">
                        {(delivery as any).galpon ? `Galpón ${(delivery as any).galpon}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-foreground">
                        {formatDateLocal(delivery.delivery_date)}
                      </td>
                      <td className="px-6 py-4">
                        {(() => {
                          const status = getNextDeliveryStatus(delivery.uniform_type, delivery.delivery_date);
                          return (
                            <div className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap ${status.bgColor} ${status.color}`}>
                              {status.text}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={delivery.status === "entregado" ? "default" : "secondary"}>
                          {delivery.status}
                        </Badge>
                      </td>
                       <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditUniform(delivery)}
                          >
                            <Pencil className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => generateDeliveryReceipt(delivery)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            PDF
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar entrega?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. Se eliminará permanentemente el registro de entrega de {delivery.uniform_type} de {delivery.employeeName}.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteUniform(delivery.id, delivery.employeeName)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UniformsModule;