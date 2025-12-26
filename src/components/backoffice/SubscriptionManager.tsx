/**
 * Componente simplificado para gestionar módulos de clientes
 *
 * Solo maneja:
 * - Visualización del plan del cliente
 * - Habilitación/deshabilitación de módulos
 *
 * NO maneja precios (gestionados externamente)
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Building2,
  LayoutDashboard,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Module {
  id: string;
  key: string;
  nombre: string;
  descripcion: string;
  is_core: boolean;
  plan_minimo: string;
}

interface SubscriptionManagerProps {
  tenantId?: string | null;
  tenantName?: string | null;
  onUpdate?: () => void;
}

const SubscriptionManager = ({ tenantId, tenantName, onUpdate }: SubscriptionManagerProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [modules, setModules] = useState<Module[]>([]);
  const [clientModules, setClientModules] = useState<Record<string, boolean>>({});
  const [clientPlan, setClientPlan] = useState<string>('basic');
  const [clientStatus, setClientStatus] = useState<string>('active');

  // Si no hay tenant seleccionado, mostrar mensaje
  if (!tenantId) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-8 text-center">
          <Building2 className="h-12 w-12 text-slate-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Selecciona un Cliente</h3>
          <p className="text-slate-400">
            Selecciona un cliente del menú superior para gestionar sus módulos.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Cargar datos del cliente y módulos
  useEffect(() => {
    const loadData = async () => {
      if (!tenantId) return;

      setLoading(true);
      try {
        // Cargar datos del cliente
        const { data: clientData } = await (supabase as any)
          .from('talenthub_clients')
          .select('plan, status')
          .eq('id', tenantId)
          .single();

        if (clientData) {
          setClientPlan(clientData.plan || 'basic');
          setClientStatus(clientData.status || 'active');
        }

        // Cargar todos los módulos
        const { data: modulesData } = await (supabase as any)
          .from('talenthub_modules')
          .select('*')
          .order('sort_order');

        if (modulesData) {
          setModules(modulesData);
        }

        // Cargar módulos habilitados para este cliente
        const { data: clientModulesData } = await (supabase as any)
          .from('talenthub_client_modules')
          .select('module_id, is_enabled')
          .eq('client_id', tenantId);

        const modMap: Record<string, boolean> = {};
        modulesData?.forEach((m: Module) => {
          const clientMod = clientModulesData?.find((cm: any) => cm.module_id === m.id);
          modMap[m.id] = clientMod?.is_enabled ?? m.is_core;
        });
        setClientModules(modMap);

      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los datos del cliente',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [tenantId, toast]);

  // Cambiar plan del cliente
  const handleChangePlan = async (newPlan: string) => {
    try {
      const { error } = await (supabase as any)
        .from('talenthub_clients')
        .update({ plan: newPlan })
        .eq('id', tenantId);

      if (error) throw error;

      setClientPlan(newPlan);
      toast({
        title: 'Plan actualizado',
        description: `El plan se cambió a ${newPlan}`,
      });
      onUpdate?.();
    } catch (error) {
      console.error('Error updating plan:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el plan',
        variant: 'destructive',
      });
    }
  };

  // Cambiar estado del cliente
  const handleChangeStatus = async (newStatus: string) => {
    try {
      const { error } = await (supabase as any)
        .from('talenthub_clients')
        .update({ status: newStatus })
        .eq('id', tenantId);

      if (error) throw error;

      setClientStatus(newStatus);
      toast({
        title: 'Estado actualizado',
        description: `El cliente ahora está ${newStatus}`,
      });
      onUpdate?.();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado',
        variant: 'destructive',
      });
    }
  };

  // Toggle módulo
  const handleToggleModule = async (moduleId: string, enabled: boolean) => {
    try {
      // Verificar si ya existe el registro
      const { data: existing } = await (supabase as any)
        .from('talenthub_client_modules')
        .select('id')
        .eq('client_id', tenantId)
        .eq('module_id', moduleId)
        .single();

      if (existing) {
        // Actualizar
        const { error } = await (supabase as any)
          .from('talenthub_client_modules')
          .update({ is_enabled: enabled })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Insertar
        const { error } = await (supabase as any)
          .from('talenthub_client_modules')
          .insert({
            client_id: tenantId,
            module_id: moduleId,
            is_enabled: enabled,
          });

        if (error) throw error;
      }

      setClientModules(prev => ({ ...prev, [moduleId]: enabled }));

      toast({
        title: enabled ? 'Módulo habilitado' : 'Módulo deshabilitado',
        description: `El módulo ha sido ${enabled ? 'habilitado' : 'deshabilitado'}`,
      });
      onUpdate?.();
    } catch (error) {
      console.error('Error toggling module:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el módulo',
        variant: 'destructive',
      });
    }
  };

  // Badge de estado
  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; icon: typeof CheckCircle; label: string }> = {
      active: { color: 'bg-green-500', icon: CheckCircle, label: 'Activo' },
      trial: { color: 'bg-blue-500', icon: Clock, label: 'Prueba' },
      suspended: { color: 'bg-red-500', icon: AlertTriangle, label: 'Suspendido' },
      cancelled: { color: 'bg-gray-500', icon: XCircle, label: 'Cancelado' },
    };

    const { color, icon: Icon, label } = variants[status] || variants.cancelled;
    return (
      <Badge className={`${color} text-white flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  // Verificar si módulo está disponible para el plan
  const isModuleAvailableForPlan = (modulePlanMinimo: string) => {
    const planOrder = { basic: 1, professional: 2, enterprise: 3 };
    return planOrder[clientPlan as keyof typeof planOrder] >= planOrder[modulePlanMinimo as keyof typeof planOrder];
  };

  // Color según plan mínimo
  const getPlanColor = (planMinimo: string) => {
    const colors: Record<string, string> = {
      basic: 'border-slate-500',
      professional: 'border-blue-500',
      enterprise: 'border-purple-500',
    };
    return colors[planMinimo] || colors.basic;
  };

  return (
    <div className="space-y-6">
      {/* Header con información del cliente */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {tenantName || 'Cliente'}
              </CardTitle>
              <CardDescription className="text-slate-400">
                Gestión de plan y módulos
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              {getStatusBadge(clientStatus)}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Selector de Plan */}
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Plan</label>
              <Select value={clientPlan} onValueChange={handleChangePlan}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Selector de Estado */}
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Estado</label>
              <Select value={clientStatus} onValueChange={handleChangeStatus}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="trial">Prueba</SelectItem>
                  <SelectItem value="suspended">Suspendido</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Módulos */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5" />
            Módulos Habilitados
          </CardTitle>
          <CardDescription className="text-slate-400">
            Activa o desactiva módulos para este cliente según su plan
          </CardDescription>
          {/* Leyenda de planes */}
          <div className="flex gap-4 mt-2 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded border-2 border-slate-500"></span> Basic
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded border-2 border-blue-500"></span> Professional
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded border-2 border-purple-500"></span> Enterprise
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-400">
              Cargando módulos...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {modules.map((module) => {
                const isAvailable = isModuleAvailableForPlan(module.plan_minimo);
                const isEnabled = clientModules[module.id] ?? module.is_core;

                return (
                  <div
                    key={module.id}
                    className={`flex items-center justify-between p-4 rounded-lg bg-slate-700/50 border-2 ${getPlanColor(module.plan_minimo)} ${!isAvailable ? 'opacity-50' : ''}`}
                  >
                    <div className="flex-1">
                      <p className="font-medium text-white">{module.nombre}</p>
                      <p className="text-sm text-slate-400 line-clamp-1">{module.descripcion}</p>
                      <div className="flex gap-1 mt-2">
                        {module.is_core && (
                          <Badge variant="secondary" className="text-xs">
                            Core
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            module.plan_minimo === 'enterprise'
                              ? 'border-purple-500 text-purple-400'
                              : module.plan_minimo === 'professional'
                              ? 'border-blue-500 text-blue-400'
                              : 'border-slate-500 text-slate-400'
                          }`}
                        >
                          {module.plan_minimo}
                        </Badge>
                      </div>
                    </div>
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={(checked) => handleToggleModule(module.id, checked)}
                      disabled={module.is_core || !isAvailable}
                      title={
                        module.is_core
                          ? 'Módulo core - siempre habilitado'
                          : !isAvailable
                          ? `Requiere plan ${module.plan_minimo}`
                          : ''
                      }
                    />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionManager;
