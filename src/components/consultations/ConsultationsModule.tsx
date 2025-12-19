import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Users, Eye } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatDateLocal } from "@/utils/dateUtils";

interface VisitaConsultor {
  id: string;
  fecha_consulta: string;
  detalle: string;
  consultor: string | null;
  observaciones: string | null;
  created_at: string;
}

const ConsultationsModule = () => {
  const [visits, setVisits] = useState<VisitaConsultor[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingVisit, setEditingVisit] = useState<VisitaConsultor | null>(null);
  const [selectedVisit, setSelectedVisit] = useState<VisitaConsultor | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    fecha_consulta: "",
    detalle: "",
    consultor: "",
    observaciones: "",
  });

  useEffect(() => {
    fetchVisits();
  }, []);

  const fetchVisits = async () => {
    try {
      const { data, error } = await supabase
        .from("visitas_consultores")
        .select("*")
        .order("fecha_consulta", { ascending: false });

      if (error) throw error;
      setVisits(data || []);
    } catch (error) {
      console.error("Error fetching visits:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las visitas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      fecha_consulta: "",
      detalle: "",
      consultor: "",
      observaciones: "",
    });
    setEditingVisit(null);
    setShowForm(false);
  };

  const handleEdit = (visit: VisitaConsultor) => {
    setEditingVisit(visit);
    setFormData({
      fecha_consulta: visit.fecha_consulta,
      detalle: visit.detalle,
      consultor: visit.consultor || "",
      observaciones: visit.observaciones || "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fecha_consulta || !formData.detalle) {
      toast({
        title: "Error",
        description: "Por favor complete la fecha y el detalle de la consulta",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingVisit) {
        // Actualizar visita existente
        const { error } = await supabase
          .from("visitas_consultores")
          .update({
            fecha_consulta: formData.fecha_consulta,
            detalle: formData.detalle,
            consultor: formData.consultor || null,
            observaciones: formData.observaciones || null,
          })
          .eq("id", editingVisit.id);

        if (error) throw error;

        toast({
          title: "Éxito",
          description: "Visita actualizada correctamente",
        });
      } else {
        // Crear nueva visita
        const { error } = await supabase
          .from("visitas_consultores")
          .insert([{
            fecha_consulta: formData.fecha_consulta,
            detalle: formData.detalle,
            consultor: formData.consultor || null,
            observaciones: formData.observaciones || null,
          }]);

        if (error) throw error;

        toast({
          title: "Éxito",
          description: "Visita registrada correctamente",
        });
      }

      resetForm();
      fetchVisits();
    } catch (error) {
      console.error("Error saving visit:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar la visita",
        variant: "destructive",
      });
    }
  };

  const deleteVisit = async (id: string) => {
    if (!confirm("¿Está seguro de que desea eliminar esta visita?")) return;

    try {
      const { error } = await supabase
        .from("visitas_consultores")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Visita eliminada correctamente",
      });
      fetchVisits();
    } catch (error) {
      console.error("Error deleting visit:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la visita",
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
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            Visitas de Consultores
          </h1>
          <p className="text-muted-foreground">Registra y gestiona las visitas de consultores externos</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Visita
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingVisit ? "Editar Visita" : "Nueva Visita de Consultor"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fecha_consulta">Fecha de Consulta *</Label>
                  <Input
                    id="fecha_consulta"
                    type="date"
                    value={formData.fecha_consulta}
                    onChange={(e) => setFormData({ ...formData, fecha_consulta: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="consultor">Nombre del Consultor</Label>
                  <Input
                    id="consultor"
                    value={formData.consultor}
                    onChange={(e) => setFormData({ ...formData, consultor: e.target.value })}
                    placeholder="Nombre del consultor (opcional)"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="detalle">Detalle de la Consulta *</Label>
                <Textarea
                  id="detalle"
                  value={formData.detalle}
                  onChange={(e) => setFormData({ ...formData, detalle: e.target.value })}
                  placeholder="Describe el motivo y contenido de la consulta..."
                  rows={4}
                  required
                />
              </div>

              <div>
                <Label htmlFor="observaciones">Observaciones Adicionales</Label>
                <Textarea
                  id="observaciones"
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  placeholder="Observaciones, resultados o acciones a seguir..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingVisit ? "Actualizar Visita" : "Registrar Visita"}
                </Button>
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
          <CardTitle>Historial de Visitas</CardTitle>
        </CardHeader>
        <CardContent>
          {visits.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay visitas registradas</p>
              <Button 
                variant="outline" 
                className="mt-2"
                onClick={() => setShowForm(true)}
              >
                Registrar primera visita
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Consultor</TableHead>
                  <TableHead>Detalle</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visits.map((visit) => (
                  <TableRow key={visit.id}>
                    <TableCell>
                      {formatDateLocal(visit.fecha_consulta)}
                    </TableCell>
                    <TableCell>
                      {visit.consultor || "No especificado"}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="truncate" title="Haz clic en 'Ver detalle' para ver completo">
                          {visit.detalle.length > 50 ? `${visit.detalle.substring(0, 50)}...` : visit.detalle}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedVisit(visit)}
                          title="Ver detalle completo"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(visit)}
                          title="Editar visita"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteVisit(visit.id)}
                          title="Eliminar visita"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog para ver detalle completo */}
      <Dialog open={!!selectedVisit} onOpenChange={() => setSelectedVisit(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle de la Visita</DialogTitle>
          </DialogHeader>
          {selectedVisit && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Fecha de Consulta</Label>
                  <p className="text-sm">{formatDateLocal(selectedVisit.fecha_consulta)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Consultor</Label>
                  <p className="text-sm">{selectedVisit.consultor || "No especificado"}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Detalle de la Consulta</Label>
                <div className="mt-2 p-3 bg-muted rounded-md">
                  <p className="text-sm whitespace-pre-wrap">{selectedVisit.detalle}</p>
                </div>
              </div>
              
              {selectedVisit.observaciones && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Observaciones</Label>
                  <div className="mt-2 p-3 bg-muted rounded-md">
                    <p className="text-sm whitespace-pre-wrap">{selectedVisit.observaciones}</p>
                  </div>
                </div>
              )}
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Fecha de Registro</Label>
                <p className="text-sm">{formatDateLocal(selectedVisit.created_at)} a las {new Date(selectedVisit.created_at).toLocaleTimeString('es-AR')}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConsultationsModule;