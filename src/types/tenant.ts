/**
 * Tipos para el sistema Multi-Tenant (Simplificado)
 *
 * Solo maneja:
 * - Información del tenant/cliente
 * - Usuarios asignados a tenants
 * - Módulos habilitados
 *
 * NO maneja precios (gestionados externamente)
 */

// =====================================================
// TENANT / CLIENTE
// =====================================================

export interface Tenant {
  id: string;
  nombre: string;
  nombre_corto: string | null;
  cuit: string | null;
  email_contacto: string | null;
  telefono: string | null;
  direccion: string | null;
  logo_url: string | null;
  color_primario: string;
  color_secundario: string;
  status: TenantStatus;
  plan: PlanType;
  created_at: string;
  updated_at: string;
}

export type TenantStatus = 'active' | 'suspended' | 'trial' | 'cancelled';
export type PlanType = 'basic' | 'professional' | 'enterprise';

// =====================================================
// USUARIOS POR TENANT
// =====================================================

export interface TenantUser {
  id: string;
  user_id: string;
  tenant_id: string;
  email: string;
  role: TenantUserRole;
  is_active: boolean;
  invited_by: string | null;
  invited_at: string;
  last_access: string | null;
  created_at: string;
  updated_at: string;
}

export type TenantUserRole = 'admin' | 'rrhh' | 'viewer';

// =====================================================
// MÓDULOS
// =====================================================

export interface Module {
  id: string;
  key: string;
  nombre: string;
  descripcion: string | null;
  icono: string | null;
  is_core: boolean;
  plan_minimo: PlanType;
  sort_order: number;
}

export interface ClientModule {
  id: string;
  client_id: string;
  module_id: string;
  is_enabled: boolean;
  enabled_at: string | null;
  enabled_by: string | null;
}

// =====================================================
// CONTEXTO DEL TENANT (SIMPLIFICADO)
// =====================================================

export interface TenantContextType {
  // Estado actual
  tenant: Tenant | null;
  loading: boolean;
  error: string | null;

  // Módulos habilitados
  enabledModules: string[];
  isModuleEnabled: (moduleKey: string) => boolean;

  // Acciones
  switchTenant: (tenantId: string) => Promise<void>;
  refreshTenantData: () => Promise<void>;
}

// =====================================================
// FORMULARIOS
// =====================================================

export interface InviteUserInput {
  email: string;
  role: TenantUserRole;
}

export interface UpdateTenantInput {
  nombre?: string;
  nombre_corto?: string;
  logo_url?: string;
  color_primario?: string;
  color_secundario?: string;
  status?: TenantStatus;
  plan?: PlanType;
}
