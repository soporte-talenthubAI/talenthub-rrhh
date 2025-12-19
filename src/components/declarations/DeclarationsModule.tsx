import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Download, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useEmployees } from "@/hooks/useEmployees";
import html2pdf from 'html2pdf.js';
import { formatDateLocal } from "@/utils/dateUtils";

interface DeclaracionDomicilio {
  id: string;
  employee_id: string;
  nombres: string;
  apellidos: string;
  domicilio: string;
  calle_paralela_1: string | null;
  calle_paralela_2: string | null;
  fecha_declaracion: string;
  created_at: string;
}

const DeclarationsModule = () => {
  const [declarations, setDeclarations] = useState<DeclaracionDomicilio[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const { employees } = useEmployees();
  
  const [formData, setFormData] = useState({
    employee_id: "",
    nombres: "",
    apellidos: "",
    domicilio: "",
    calle_paralela_1: "",
    calle_paralela_2: "",
  });

  useEffect(() => {
    fetchDeclarations();
  }, []);

  const fetchDeclarations = async () => {
    try {
      const { data, error } = await supabase
        .from("declaraciones_domicilio")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDeclarations(data || []);
    } catch (error) {
      console.error("Error fetching declarations:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las declaraciones",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeSelect = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (employee) {
      setFormData({
        ...formData,
        employee_id: employeeId,
        nombres: employee.nombres,
        apellidos: employee.apellidos,
        domicilio: employee.direccion || "",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      employee_id: "",
      nombres: "",
      apellidos: "",
      domicilio: "",
      calle_paralela_1: "",
      calle_paralela_2: "",
    });
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.employee_id || !formData.nombres || !formData.apellidos || !formData.domicilio) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos obligatorios",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("declaraciones_domicilio")
        .insert([formData]);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Declaración jurada creada correctamente",
      });

      resetForm();
      fetchDeclarations();
    } catch (error) {
      console.error("Error creating declaration:", error);
      toast({
        title: "Error",
        description: "No se pudo crear la declaración",
        variant: "destructive",
      });
    }
  };

  const generatePDF = (declaration: DeclaracionDomicilio) => {
    const employee = employees.find(emp => emp.id === declaration.employee_id);
    
    const content = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333; border-bottom: 2px solid #333; padding-bottom: 10px;">
            DECLARACIÓN JURADA DE DOMICILIO
          </h1>
        </div>
        
        <div style="margin-bottom: 30px;">
          <p style="text-align: justify; line-height: 1.6;">
            Yo, <strong>${declaration.nombres} ${declaration.apellidos}</strong>, 
            declaro bajo juramento que mi domicilio real es el siguiente:
          </p>
        </div>

        <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 30px;">
          <h3 style="margin-top: 0; color: #333;">DATOS DEL DOMICILIO:</h3>
          <p><strong>Dirección:</strong> ${declaration.domicilio}</p>
          ${declaration.calle_paralela_1 ? `<p><strong>Calle Paralela 1:</strong> ${declaration.calle_paralela_1}</p>` : ''}
          ${declaration.calle_paralela_2 ? `<p><strong>Calle Paralela 2:</strong> ${declaration.calle_paralela_2}</p>` : ''}
          <p><strong>Fecha de Declaración:</strong> ${formatDateLocal(declaration.fecha_declaracion)}</p>
          ${employee?.dni ? `<p><strong>DNI:</strong> ${employee.dni}</p>` : ''}
        </div>

        <div style="margin-bottom: 30px;">
          <p style="text-align: justify; line-height: 1.6;">
            Declaro que la información brindada es veraz y completa, y que asumo toda responsabilidad 
            legal por la exactitud de los datos proporcionados en la presente declaración jurada.
          </p>
        </div>

        <div style="margin-top: 50px;">
          <div style="display: flex; justify-content: space-between;">
            <div style="text-align: center; width: 45%;">
              <div style="height: 24px; margin-bottom: 5px;"></div>
              <div style="border-top: 1px solid #333; padding-top: 10px;">
                <strong>Firma del Declarante</strong>
              </div>
            </div>
            <div style="text-align: center; width: 45%;">
              <div style="margin-bottom: 5px;">
                ${declaration.nombres} ${declaration.apellidos}
              </div>
              <div style="border-top: 1px solid #333; padding-top: 10px;">
                <strong>Aclaración</strong>
              </div>
            </div>
          </div>
        </div>

        <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #666;">
          <p>Lugar y fecha: ________________________________________________</p>
        </div>
      </div>
    `;

    const element = document.createElement('div');
    element.innerHTML = content;
    document.body.appendChild(element);

    const opt = {
      margin: 1,
      filename: `declaracion_jurada_${declaration.nombres}_${declaration.apellidos}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
      document.body.removeChild(element);
    });
  };

  const deleteDeclaration = async (id: string) => {
    if (!confirm("¿Está seguro de que desea eliminar esta declaración?")) return;

    try {
      const { error } = await supabase
        .from("declaraciones_domicilio")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Declaración eliminada correctamente",
      });
      fetchDeclarations();
    } catch (error) {
      console.error("Error deleting declaration:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la declaración",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Declaraciones Juradas de Domicilio</h1>
          <p className="text-muted-foreground">Gestiona las declaraciones juradas de domicilio de los empleados</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Declaración
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Nueva Declaración Jurada</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="employee">Empleado *</Label>
                  <Select value={formData.employee_id} onValueChange={handleEmployeeSelect}>
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

                <div>
                  <Label htmlFor="nombres">Nombres *</Label>
                  <Input
                    id="nombres"
                    value={formData.nombres}
                    onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                    disabled={!!formData.employee_id}
                    placeholder={formData.employee_id ? "Autocompletado desde empleado" : "Ingrese nombres"}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="apellidos">Apellidos *</Label>
                  <Input
                    id="apellidos"
                    value={formData.apellidos}
                    onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                    disabled={!!formData.employee_id}
                    placeholder={formData.employee_id ? "Autocompletado desde empleado" : "Ingrese apellidos"}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="domicilio">Domicilio *</Label>
                <Textarea
                  id="domicilio"
                  value={formData.domicilio}
                  onChange={(e) => setFormData({ ...formData, domicilio: e.target.value })}
                  placeholder={formData.employee_id ? "Autocompletado desde empleado (puedes modificar)" : "Dirección completa del domicilio"}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="calle_paralela_1">Calle Paralela 1 (opcional)</Label>
                  <Input
                    id="calle_paralela_1"
                    value={formData.calle_paralela_1}
                    onChange={(e) => setFormData({ ...formData, calle_paralela_1: e.target.value })}
                    placeholder="Primera calle de referencia"
                  />
                </div>

                <div>
                  <Label htmlFor="calle_paralela_2">Calle Paralela 2 (opcional)</Label>
                  <Input
                    id="calle_paralela_2"
                    value={formData.calle_paralela_2}
                    onChange={(e) => setFormData({ ...formData, calle_paralela_2: e.target.value })}
                    placeholder="Segunda calle de referencia"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit">Crear Declaración</Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Declaraciones Registradas</CardTitle>
        </CardHeader>
        <CardContent>
          {declarations.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay declaraciones registradas
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empleado</TableHead>
                  <TableHead>Domicilio</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {declarations.map((declaration) => {
                  const employee = employees.find(emp => emp.id === declaration.employee_id);
                  return (
                    <TableRow key={declaration.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {declaration.nombres} {declaration.apellidos}
                          </div>
                          {employee?.dni && (
                            <div className="text-sm text-muted-foreground">
                              DNI: {employee.dni}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">{declaration.domicilio}</div>
                        {(declaration.calle_paralela_1 || declaration.calle_paralela_2) && (
                          <div className="text-sm text-muted-foreground">
                            {declaration.calle_paralela_1 && `Entre: ${declaration.calle_paralela_1}`}
                            {declaration.calle_paralela_2 && ` y ${declaration.calle_paralela_2}`}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {formatDateLocal(declaration.fecha_declaracion)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => generatePDF(declaration)}
                            title="Descargar PDF"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteDeclaration(declaration.id)}
                            title="Eliminar declaración"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DeclarationsModule;