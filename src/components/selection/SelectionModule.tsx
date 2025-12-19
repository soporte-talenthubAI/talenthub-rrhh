import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Search, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ApplicationCard } from './ApplicationCard';
import { formatDateLocal } from "@/utils/dateUtils";

interface Application {
  id: string;
  full_name: string;
  birth_date: string;
  phone: string;
  position: string;
  education: string;
  experience: string;
  reference_name: string;
  reference_position: string;
  reference_company: string;
  reference_phone: string;
  has_transport: string;
  work_schedule: string;
  willing_to_work_onsite: string;
  why_work_here: string;
  cv_file_path?: string;
  cv_file_name?: string;
  cv_file_size?: number;
  accept_terms: boolean;
  created_at: string;
  updated_at: string;
}

export const SelectionModule = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [ageFilter, setAgeFilter] = useState('');
  const [educationFilter, setEducationFilter] = useState('');
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [applicationToDelete, setApplicationToDelete] = useState<Application | null>(null);
  const { toast } = useToast();

  const educationOptions = useMemo(() => {
    const set = new Set<string>();
    applications.forEach(app => {
      const val = app.education?.trim();
      if (val) set.add(val);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
  }, [applications]);

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    filterApplications();
  }, [applications, searchTerm, ageFilter, educationFilter]);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('applications' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications((data || []) as unknown as Application[]);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las postulaciones",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const filterApplications = () => {
    let filtered = applications;

    if (searchTerm) {
      filtered = filtered.filter(app => 
        app.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.experience?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.education?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (ageFilter && ageFilter.trim() !== '') {
      const targetAge = parseInt(ageFilter);
      if (!isNaN(targetAge)) {
        filtered = filtered.filter(app => {
          if (!app.birth_date) return false;
          const age = getAge(app.birth_date);
          return age >= targetAge;
        });
      }
    }

    if (educationFilter && educationFilter.trim() !== '' && educationFilter !== 'todos') {
      const needle = educationFilter.toLowerCase().trim();
      filtered = filtered.filter(app => app.education?.toLowerCase().includes(needle));
    }

    setFilteredApplications(filtered);
  };

  const deleteApplication = async () => {
    if (!applicationToDelete) return;

    try {
      const { error } = await supabase
        .from('applications' as any)
        .delete()
        .eq('id', applicationToDelete.id);

      if (error) throw error;

      toast({
        title: "Postulación eliminada",
        description: "La postulación ha sido eliminada correctamente",
      });

      setShowDeleteDialog(false);
      setApplicationToDelete(null);
      fetchApplications();
    } catch (error) {
      console.error('Error deleting application:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la postulación",
        variant: "destructive",
      });
    }
  };

  const confirmDeleteApplication = (application: Application) => {
    setApplicationToDelete(application);
    setShowDeleteDialog(true);
  };

  const downloadSelectedProfiles = () => {
    const csvContent = [
      ['Nombre', 'Edad', 'Teléfono', 'Posición', 'Educación', 'Fecha'].join(','),
      ...filteredApplications.map(app => [
        app.full_name || '',
        app.birth_date ? getAge(app.birth_date) : '',
        app.phone || '',
        app.position || '',
        app.education || '',
        formatDateLocal(app.created_at)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'postulaciones_seleccionadas.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const openDetailDialog = (application: Application) => {
    setSelectedApplication(application);
    setShowDetailDialog(true);
  };

  const downloadCV = async (application: Application) => {
    const candidates = [application.cv_file_path?.trim(), application.cv_file_name?.trim()].filter(
      (v): v is string => !!v && v.length > 0
    );

    if (candidates.length === 0) {
      toast({
        title: "Error",
        description: "No hay CV adjunto para esta postulación",
        variant: "destructive",
      });
      return;
    }

    const tryPaths = candidates.map((raw) => {
      let p = raw.replace(/^\/+/, '');
      return p.toLowerCase().startsWith('cv-files/') ? p.slice('cv-files/'.length) : p;
    });

    for (const path of tryPaths) {
      try {
        // 1) Intento con la API de Storage (evita problemas de encoding)
        const { data: blob, error } = await supabase.storage.from('cv-files').download(path);
        if (!error && blob) {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = path.split('/').pop() || 'cv.pdf';
          a.click();
          window.URL.revokeObjectURL(url);
          toast({ title: "Éxito", description: "CV descargado correctamente" });
          return;
        }
      } catch (e) {
        console.warn('Fallo download() para', path, e);
      }

      try {
        // 2) Fallback: URL pública
        const { data } = supabase.storage.from('cv-files').getPublicUrl(path);
        const response = await fetch(data.publicUrl);
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          // Intentar obtener nombre desde Content-Disposition
          const cd = response.headers.get('content-disposition');
          let filename = path.split('/').pop() || 'cv.pdf';
          const match = cd?.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i);
          if (match) filename = decodeURIComponent(match[1] || match[2]);
          a.href = url;
          a.download = filename;
          a.click();
          window.URL.revokeObjectURL(url);
          toast({ title: "Éxito", description: "CV descargado correctamente" });
          return;
        }
      } catch (e) {
        console.warn('Fallo fetch(publicUrl) para', path, e);
      }
    }

    toast({
      title: "Error",
      description: "No se pudo descargar el CV. Verifica que el archivo exista en el bucket cv-files.",
      variant: "destructive",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Selección de Personal</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadSelectedProfiles}>
            <Download className="h-4 w-4 mr-2" />
            Descargar Selección
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filtros de Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Búsqueda General</Label>
              <Input
                id="search"
                placeholder="Nombre, posición, experiencia..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="age">Edad</Label>
              <Input
                id="age"
                type="number"
                placeholder="Edad"
                value={ageFilter}
                onChange={(e) => setAgeFilter(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="education">Educación</Label>
              <Select value={educationFilter} onValueChange={setEducationFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {educationOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid de Cards de Postulaciones */}
      <Card>
        <CardHeader>
          <CardTitle>Postulaciones ({filteredApplications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Cargando...</div>
          ) : filteredApplications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron postulaciones
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredApplications.map((application) => (
                <ApplicationCard
                  key={application.id}
                  application={application}
                  onView={() => openDetailDialog(application)}
                  onDelete={() => confirmDeleteApplication(application)}
                  onDownloadCV={() => downloadCV(application)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para ver detalle */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Perfil Completo - {selectedApplication?.full_name}</DialogTitle>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Información Personal</Label>
                  <div className="space-y-2 mt-2">
                    <p><strong>Nombre:</strong> {selectedApplication.full_name}</p>
                    <p><strong>Fecha de nacimiento:</strong> {formatDateLocal(selectedApplication.birth_date)}</p>
                    <p><strong>Edad:</strong> {getAge(selectedApplication.birth_date)} años</p>
                    <p><strong>Teléfono:</strong> {selectedApplication.phone}</p>
                    <p><strong>Educación:</strong> {selectedApplication.education}</p>
                  </div>
                </div>
                <div>
                  <Label>Información Laboral</Label>
                  <div className="space-y-2 mt-2">
                    <p><strong>Posición:</strong> {selectedApplication.position}</p>
                    <p><strong>Horario de trabajo:</strong> {selectedApplication.work_schedule}</p>
                    <p><strong>Dispuesto a trabajar on-site:</strong> {selectedApplication.willing_to_work_onsite}</p>
                    <p><strong>Tiene transporte:</strong> {selectedApplication.has_transport}</p>
                  </div>
                </div>
              </div>
              
              {selectedApplication.experience && (
                <div>
                  <Label>Experiencia Laboral</Label>
                  <div className="mt-2 p-3 bg-muted rounded">
                    <p className="whitespace-pre-wrap">{selectedApplication.experience}</p>
                  </div>
                </div>
              )}

              {selectedApplication.why_work_here && (
                <div>
                  <Label>¿Por qué quiere trabajar aquí?</Label>
                  <div className="mt-2 p-3 bg-muted rounded">
                    <p className="whitespace-pre-wrap">{selectedApplication.why_work_here}</p>
                  </div>
                </div>
              )}

              <div>
                <Label>Referencias Laborales</Label>
                <div className="mt-2 p-3 bg-muted rounded space-y-2">
                  <p><strong>Nombre:</strong> {selectedApplication.reference_name}</p>
                  <p><strong>Posición:</strong> {selectedApplication.reference_position}</p>
                  <p><strong>Empresa:</strong> {selectedApplication.reference_company}</p>
                  <p><strong>Teléfono:</strong> {selectedApplication.reference_phone}</p>
                </div>
              </div>

              {selectedApplication.cv_file_name && (
                <div>
                  <Label>CV Adjunto</Label>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="outline" className="text-sm">
                      {selectedApplication.cv_file_name}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadCV(selectedApplication)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Descargar CV
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación para eliminar */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la postulación de{' '}
              <strong>{applicationToDelete?.full_name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={deleteApplication}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
