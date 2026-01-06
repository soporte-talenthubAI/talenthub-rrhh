/**
 * Hook para manejar catálogos personalizables
 * (puestos, sectores, tipos de contrato, etc.)
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type CatalogType = 
  | 'puestos' 
  | 'sectores' 
  | 'tipos_contrato' 
  | 'motivos_licencia' 
  | 'tipos_documento'
  | 'estados_empleado';

export interface CatalogItem {
  id: string;
  catalog_type: CatalogType;
  value: string;
  label: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Cache en memoria para evitar múltiples queries
const catalogsCache: Record<CatalogType, CatalogItem[]> = {
  puestos: [],
  sectores: [],
  tipos_contrato: [],
  motivos_licencia: [],
  tipos_documento: [],
  estados_empleado: [],
};
let cacheLoaded = false;

export function useCustomCatalogs() {
  const [catalogs, setCatalogs] = useState<Record<CatalogType, CatalogItem[]>>(catalogsCache);
  const [loading, setLoading] = useState(!cacheLoaded);
  const [error, setError] = useState<string | null>(null);

  // Cargar todos los catálogos
  const loadCatalogs = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data, error: fetchError } = await supabase
        .from('custom_catalogs')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (fetchError) {
        // Si la tabla no existe, usar valores por defecto
        console.warn('Tabla custom_catalogs no disponible, usando defaults');
        setCatalogs(getDefaultCatalogs());
        return;
      }

      // Agrupar por tipo
      const grouped: Record<CatalogType, CatalogItem[]> = {
        puestos: [],
        sectores: [],
        tipos_contrato: [],
        motivos_licencia: [],
        tipos_documento: [],
        estados_empleado: [],
      };

      (data || []).forEach((item: CatalogItem) => {
        if (grouped[item.catalog_type as CatalogType]) {
          grouped[item.catalog_type as CatalogType].push(item);
        }
      });

      // Actualizar cache y estado
      Object.assign(catalogsCache, grouped);
      cacheLoaded = true;
      setCatalogs(grouped);
      setError(null);
    } catch (err) {
      console.error('Error loading catalogs:', err);
      setError('Error cargando catálogos');
      setCatalogs(getDefaultCatalogs());
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener items de un catálogo específico
  const getCatalog = useCallback((type: CatalogType): CatalogItem[] => {
    return catalogs[type] || [];
  }, [catalogs]);

  // Obtener opciones para un Select (value/label)
  const getSelectOptions = useCallback((type: CatalogType): { value: string; label: string }[] => {
    return (catalogs[type] || []).map(item => ({
      value: item.value,
      label: item.label,
    }));
  }, [catalogs]);

  // Agregar nuevo item
  const addItem = async (type: CatalogType, value: string, label: string, description?: string): Promise<boolean> => {
    try {
      const maxOrder = Math.max(0, ...(catalogs[type] || []).map(i => i.sort_order));
      
      const { error: insertError } = await supabase
        .from('custom_catalogs')
        .insert({
          catalog_type: type,
          value: value.toLowerCase().replace(/\s+/g, '-'),
          label,
          description,
          sort_order: maxOrder + 1,
        });

      if (insertError) throw insertError;
      
      await loadCatalogs();
      return true;
    } catch (err) {
      console.error('Error adding catalog item:', err);
      return false;
    }
  };

  // Actualizar item
  const updateItem = async (id: string, updates: Partial<CatalogItem>): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('custom_catalogs')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;
      
      await loadCatalogs();
      return true;
    } catch (err) {
      console.error('Error updating catalog item:', err);
      return false;
    }
  };

  // Eliminar item (soft delete)
  const deleteItem = async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('custom_catalogs')
        .update({ is_active: false })
        .eq('id', id);

      if (deleteError) throw deleteError;
      
      await loadCatalogs();
      return true;
    } catch (err) {
      console.error('Error deleting catalog item:', err);
      return false;
    }
  };

  // Reordenar items
  const reorderItems = async (type: CatalogType, orderedIds: string[]): Promise<boolean> => {
    try {
      const updates = orderedIds.map((id, index) => ({
        id,
        sort_order: index + 1,
      }));

      for (const update of updates) {
        await supabase
          .from('custom_catalogs')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id);
      }
      
      await loadCatalogs();
      return true;
    } catch (err) {
      console.error('Error reordering catalog items:', err);
      return false;
    }
  };

  // Cargar al montar
  useEffect(() => {
    if (!cacheLoaded) {
      loadCatalogs();
    }
  }, [loadCatalogs]);

  return {
    catalogs,
    loading,
    error,
    getCatalog,
    getSelectOptions,
    addItem,
    updateItem,
    deleteItem,
    reorderItems,
    refresh: loadCatalogs,
  };
}

// Valores por defecto si no hay tabla
function getDefaultCatalogs(): Record<CatalogType, CatalogItem[]> {
  const now = new Date().toISOString();
  const makeItem = (type: CatalogType, value: string, label: string, order: number): CatalogItem => ({
    id: `default-${type}-${value}`,
    catalog_type: type,
    value,
    label,
    sort_order: order,
    is_active: true,
    created_at: now,
    updated_at: now,
  });

  return {
    puestos: [
      makeItem('puestos', 'operario-produccion', 'Operario Producción', 1),
      makeItem('puestos', 'operario-mantenimiento', 'Operario Mantenimiento', 2),
      makeItem('puestos', 'administracion', 'Administración', 3),
      makeItem('puestos', 'recursos-humanos', 'Recursos Humanos', 4),
      makeItem('puestos', 'chofer', 'Chofer', 5),
    ],
    sectores: [
      makeItem('sectores', 'produccion', 'Producción', 1),
      makeItem('sectores', 'administracion', 'Administración', 2),
      makeItem('sectores', 'mantenimiento', 'Mantenimiento', 3),
    ],
    tipos_contrato: [
      makeItem('tipos_contrato', 'indefinido', 'Contrato por tiempo indeterminado', 1),
      makeItem('tipos_contrato', 'temporal', 'Contrato temporal', 2),
      makeItem('tipos_contrato', 'obra', 'Contrato por obra o servicio', 3),
      makeItem('tipos_contrato', 'pasantia', 'Pasantía', 4),
      makeItem('tipos_contrato', 'eventual', 'Trabajo eventual', 5),
    ],
    motivos_licencia: [
      makeItem('motivos_licencia', 'vacaciones-anuales', 'Vacaciones Anuales', 1),
      makeItem('motivos_licencia', 'licencia-medica', 'Licencia Médica', 2),
      makeItem('motivos_licencia', 'asuntos-personales', 'Asuntos Personales', 3),
    ],
    tipos_documento: [
      makeItem('tipos_documento', 'contrato', 'Contrato de Trabajo', 1),
      makeItem('tipos_documento', 'recibo', 'Recibo de Sueldo', 2),
      makeItem('tipos_documento', 'certificado', 'Certificado', 3),
    ],
    estados_empleado: [
      makeItem('estados_empleado', 'activo', 'Activo', 1),
      makeItem('estados_empleado', 'inactivo', 'Inactivo', 2),
      makeItem('estados_empleado', 'licencia', 'En Licencia', 3),
      makeItem('estados_empleado', 'suspension', 'Suspendido', 4),
    ],
  };
}

export default useCustomCatalogs;

