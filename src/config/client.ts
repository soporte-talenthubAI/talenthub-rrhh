/**
 * Configuración del Cliente/Empresa
 * 
 * ARQUITECTURA:
 * 1. La config se carga desde la tabla `client_config` en Supabase
 * 2. Fallback a variables de entorno si la tabla no existe
 * 3. El logo se guarda en el bucket `client-assets`
 * 
 * FLUJO:
 * - App inicia → loadClientConfig() → guarda en memoria
 * - Componentes usan getClientConfig() para obtener valores
 */

import { supabase } from "@/integrations/supabase/client";

export interface ClientConfig {
  // Información de la empresa
  nombre: string;
  nombreCorto: string;
  logoUrl: string;
  faviconUrl: string;
  
  // Colores de la marca (hex)
  colorPrimario: string;
  colorSecundario: string;
  colorFondo: string;
  
  // Información de contacto (para documentos PDF)
  direccion: string;
  telefono: string;
  email: string;
  cuit: string;
  
  // Configuración de la app
  appTitle: string;
  timezone: string;
  fechaFormato: string;
  moneda: string;
  
  // Módulos habilitados
  modulosHabilitados: string[];
  
  // Firma para documentos
  firmaEmpresaNombre: string;
  firmaEmpresaCargo: string;
  piePaginaDocumentos: string;
  
  // Estado
  isConfigured: boolean;
}

// Valores por defecto
const DEFAULT_CONFIG: ClientConfig = {
  nombre: 'TalentHub RRHH',
  nombreCorto: 'TalentHub',
  logoUrl: '',
  faviconUrl: '',
  colorPrimario: '#16a34a',
  colorSecundario: '#0891b2',
  colorFondo: '#f8fafc',
  direccion: '',
  telefono: '',
  email: '',
  cuit: '',
  appTitle: 'Sistema RRHH',
  timezone: 'America/Argentina/Buenos_Aires',
  fechaFormato: 'DD/MM/YYYY',
  moneda: 'ARS',
  modulosHabilitados: ['dashboard', 'employees'],
  firmaEmpresaNombre: '',
  firmaEmpresaCargo: '',
  piePaginaDocumentos: '',
  isConfigured: false,
};

// Config en memoria (se carga una vez al iniciar)
let _clientConfig: ClientConfig = { ...DEFAULT_CONFIG };
let _configLoaded = false;

/**
 * Carga la configuración desde Supabase
 * Se llama una vez al iniciar la app (en App.tsx)
 * 
 * @param tenantId - Opcional. Si se proporciona, carga la config de ese tenant específico
 */
export async function loadClientConfig(tenantId?: string): Promise<ClientConfig> {
  // Si no hay tenantId, usar config genérica de TalentHub
  if (!tenantId) {
    if (!_configLoaded) {
      _clientConfig = { ...DEFAULT_CONFIG };
      _configLoaded = true;
      applyClientTheme();
      console.log('✅ [CLIENT CONFIG] Usando config genérica de TalentHub');
    }
    return _clientConfig;
  }

  try {
    // Cargar config específica del tenant desde client_config
    const { data, error } = await supabase
      .from('client_config')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    if (!error && data) {
      _clientConfig = {
        nombre: data.nombre || DEFAULT_CONFIG.nombre,
        nombreCorto: data.nombre_corto || DEFAULT_CONFIG.nombreCorto,
        logoUrl: data.logo_url || DEFAULT_CONFIG.logoUrl,
        faviconUrl: data.favicon_url || DEFAULT_CONFIG.faviconUrl,
        colorPrimario: data.color_primario || DEFAULT_CONFIG.colorPrimario,
        colorSecundario: data.color_secundario || DEFAULT_CONFIG.colorSecundario,
        colorFondo: data.color_fondo || DEFAULT_CONFIG.colorFondo,
        direccion: data.direccion || DEFAULT_CONFIG.direccion,
        telefono: data.telefono || DEFAULT_CONFIG.telefono,
        email: data.email || DEFAULT_CONFIG.email,
        cuit: data.cuit || DEFAULT_CONFIG.cuit,
        appTitle: data.app_title || DEFAULT_CONFIG.appTitle,
        timezone: data.timezone || DEFAULT_CONFIG.timezone,
        fechaFormato: data.fecha_formato || DEFAULT_CONFIG.fechaFormato,
        moneda: data.moneda || DEFAULT_CONFIG.moneda,
        modulosHabilitados: data.modulos_habilitados || DEFAULT_CONFIG.modulosHabilitados,
        firmaEmpresaNombre: data.firma_empresa_nombre || DEFAULT_CONFIG.firmaEmpresaNombre,
        firmaEmpresaCargo: data.firma_empresa_cargo || DEFAULT_CONFIG.firmaEmpresaCargo,
        piePaginaDocumentos: data.pie_pagina_documentos || DEFAULT_CONFIG.piePaginaDocumentos,
        isConfigured: data.is_configured || false,
      };
      
      console.log('✅ [CLIENT CONFIG] Cargado para tenant:', _clientConfig.nombre);
    } else {
      // Si no hay config específica, intentar cargar desde talenthub_clients
      const { data: clientData } = await (supabase as any)
        .from('talenthub_clients')
        .select('*')
        .eq('id', tenantId)
        .single();

      if (clientData) {
        _clientConfig = {
          ...DEFAULT_CONFIG,
          nombre: clientData.nombre || DEFAULT_CONFIG.nombre,
          nombreCorto: clientData.nombre_corto || DEFAULT_CONFIG.nombreCorto,
          logoUrl: clientData.logo_url || DEFAULT_CONFIG.logoUrl,
          colorPrimario: clientData.color_primario || DEFAULT_CONFIG.colorPrimario,
          colorSecundario: clientData.color_secundario || DEFAULT_CONFIG.colorSecundario,
          email: clientData.email_contacto || DEFAULT_CONFIG.email,
          telefono: clientData.telefono || DEFAULT_CONFIG.telefono,
          cuit: clientData.cuit || DEFAULT_CONFIG.cuit,
          direccion: clientData.direccion || DEFAULT_CONFIG.direccion,
          isConfigured: true,
        };
        console.log('✅ [CLIENT CONFIG] Cargado desde talenthub_clients:', _clientConfig.nombre);
      } else {
        console.log('⚠️ [CLIENT CONFIG] Tenant no encontrado, usando defaults');
        _clientConfig = { ...DEFAULT_CONFIG };
      }
    }
  } catch (error) {
    console.warn('⚠️ [CLIENT CONFIG] Error cargando config:', error);
    _clientConfig = { ...DEFAULT_CONFIG };
  }

  _configLoaded = true;
  
  // Aplicar tema
  applyClientTheme();
  
  return _clientConfig;
}

/**
 * Resetea la config para permitir recargar con otro tenant
 */
export function resetClientConfig(): void {
  _clientConfig = { ...DEFAULT_CONFIG };
  _configLoaded = false;
}

/**
 * Carga configuración desde variables de entorno (fallback)
 */
function loadFromEnvVars(): ClientConfig {
  return {
    nombre: import.meta.env.VITE_CLIENT_NOMBRE || DEFAULT_CONFIG.nombre,
    nombreCorto: import.meta.env.VITE_CLIENT_NOMBRE_CORTO || DEFAULT_CONFIG.nombreCorto,
    logoUrl: import.meta.env.VITE_CLIENT_LOGO_URL || DEFAULT_CONFIG.logoUrl,
    faviconUrl: import.meta.env.VITE_CLIENT_FAVICON_URL || DEFAULT_CONFIG.faviconUrl,
    colorPrimario: import.meta.env.VITE_CLIENT_COLOR_PRIMARIO || DEFAULT_CONFIG.colorPrimario,
    colorSecundario: import.meta.env.VITE_CLIENT_COLOR_SECUNDARIO || DEFAULT_CONFIG.colorSecundario,
    colorFondo: import.meta.env.VITE_CLIENT_COLOR_FONDO || DEFAULT_CONFIG.colorFondo,
    direccion: import.meta.env.VITE_CLIENT_DIRECCION || DEFAULT_CONFIG.direccion,
    telefono: import.meta.env.VITE_CLIENT_TELEFONO || DEFAULT_CONFIG.telefono,
    email: import.meta.env.VITE_CLIENT_EMAIL || DEFAULT_CONFIG.email,
    cuit: import.meta.env.VITE_CLIENT_CUIT || DEFAULT_CONFIG.cuit,
    appTitle: import.meta.env.VITE_CLIENT_APP_TITLE || DEFAULT_CONFIG.appTitle,
    timezone: DEFAULT_CONFIG.timezone,
    fechaFormato: DEFAULT_CONFIG.fechaFormato,
    moneda: DEFAULT_CONFIG.moneda,
    modulosHabilitados: DEFAULT_CONFIG.modulosHabilitados,
    firmaEmpresaNombre: DEFAULT_CONFIG.firmaEmpresaNombre,
    firmaEmpresaCargo: DEFAULT_CONFIG.firmaEmpresaCargo,
    piePaginaDocumentos: DEFAULT_CONFIG.piePaginaDocumentos,
    isConfigured: true,
  };
}

/**
 * Obtiene la configuración actual (sincrónico)
 * Usar después de que loadClientConfig() haya sido llamado
 */
export function getClientConfig(): ClientConfig {
  return _clientConfig;
}

/**
 * Alias para compatibilidad con código existente
 */
export const clientConfig = new Proxy({} as ClientConfig, {
  get(_, prop: keyof ClientConfig) {
    return _clientConfig[prop];
  }
});

/**
 * Carga la configuración de un tenant específico (para uso en Backoffice)
 * NO modifica la config global en memoria
 */
export async function loadClientConfigForTenant(tenantId: string): Promise<ClientConfig> {
  try {
    const { data, error } = await supabase
      .from('client_config')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    if (!error && data) {
      return {
        nombre: data.nombre || DEFAULT_CONFIG.nombre,
        nombreCorto: data.nombre_corto || DEFAULT_CONFIG.nombreCorto,
        logoUrl: data.logo_url || DEFAULT_CONFIG.logoUrl,
        faviconUrl: data.favicon_url || DEFAULT_CONFIG.faviconUrl,
        colorPrimario: data.color_primario || DEFAULT_CONFIG.colorPrimario,
        colorSecundario: data.color_secundario || DEFAULT_CONFIG.colorSecundario,
        colorFondo: data.color_fondo || DEFAULT_CONFIG.colorFondo,
        direccion: data.direccion || DEFAULT_CONFIG.direccion,
        telefono: data.telefono || DEFAULT_CONFIG.telefono,
        email: data.email || DEFAULT_CONFIG.email,
        cuit: data.cuit || DEFAULT_CONFIG.cuit,
        appTitle: data.app_title || DEFAULT_CONFIG.appTitle,
        timezone: data.timezone || DEFAULT_CONFIG.timezone,
        fechaFormato: data.fecha_formato || DEFAULT_CONFIG.fechaFormato,
        moneda: data.moneda || DEFAULT_CONFIG.moneda,
        modulosHabilitados: data.modulos_habilitados || DEFAULT_CONFIG.modulosHabilitados,
        firmaEmpresaNombre: data.firma_empresa_nombre || DEFAULT_CONFIG.firmaEmpresaNombre,
        firmaEmpresaCargo: data.firma_empresa_cargo || DEFAULT_CONFIG.firmaEmpresaCargo,
        piePaginaDocumentos: data.pie_pagina_documentos || DEFAULT_CONFIG.piePaginaDocumentos,
        isConfigured: data.is_configured || false,
      };
    }

    // Si no existe config para este tenant, intentar desde talenthub_clients
    const { data: clientData } = await (supabase as any)
      .from('talenthub_clients')
      .select('*')
      .eq('id', tenantId)
      .single();

    if (clientData) {
      return {
        ...DEFAULT_CONFIG,
        nombre: clientData.nombre || DEFAULT_CONFIG.nombre,
        nombreCorto: clientData.nombre_corto || DEFAULT_CONFIG.nombreCorto,
        logoUrl: clientData.logo_url || DEFAULT_CONFIG.logoUrl,
        colorPrimario: clientData.color_primario || DEFAULT_CONFIG.colorPrimario,
        colorSecundario: clientData.color_secundario || DEFAULT_CONFIG.colorSecundario,
        email: clientData.email_contacto || DEFAULT_CONFIG.email,
        telefono: clientData.telefono || DEFAULT_CONFIG.telefono,
        cuit: clientData.cuit || DEFAULT_CONFIG.cuit,
        direccion: clientData.direccion || DEFAULT_CONFIG.direccion,
        isConfigured: false,
      };
    }

    return { ...DEFAULT_CONFIG };
  } catch (error) {
    console.warn('Error loading tenant config:', error);
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * Actualiza la configuración en Supabase
 * @param updates - Cambios parciales a aplicar
 * @param tenantId - Si se proporciona, actualiza la config de ese tenant específico
 */
export async function updateClientConfig(updates: Partial<ClientConfig>, tenantId?: string): Promise<boolean> {
  try {
    // Mapear a nombres de columnas de BD
    const dbUpdates: Record<string, any> = {};
    
    if (updates.nombre !== undefined) dbUpdates.nombre = updates.nombre;
    if (updates.nombreCorto !== undefined) dbUpdates.nombre_corto = updates.nombreCorto;
    if (updates.logoUrl !== undefined) dbUpdates.logo_url = updates.logoUrl;
    if (updates.faviconUrl !== undefined) dbUpdates.favicon_url = updates.faviconUrl;
    if (updates.colorPrimario !== undefined) dbUpdates.color_primario = updates.colorPrimario;
    if (updates.colorSecundario !== undefined) dbUpdates.color_secundario = updates.colorSecundario;
    if (updates.colorFondo !== undefined) dbUpdates.color_fondo = updates.colorFondo;
    if (updates.direccion !== undefined) dbUpdates.direccion = updates.direccion;
    if (updates.telefono !== undefined) dbUpdates.telefono = updates.telefono;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.cuit !== undefined) dbUpdates.cuit = updates.cuit;
    if (updates.appTitle !== undefined) dbUpdates.app_title = updates.appTitle;
    if (updates.modulosHabilitados !== undefined) dbUpdates.modulos_habilitados = updates.modulosHabilitados;
    if (updates.firmaEmpresaNombre !== undefined) dbUpdates.firma_empresa_nombre = updates.firmaEmpresaNombre;
    if (updates.firmaEmpresaCargo !== undefined) dbUpdates.firma_empresa_cargo = updates.firmaEmpresaCargo;
    if (updates.piePaginaDocumentos !== undefined) dbUpdates.pie_pagina_documentos = updates.piePaginaDocumentos;
    if (updates.isConfigured !== undefined) dbUpdates.is_configured = updates.isConfigured;

    if (tenantId) {
      // Actualizar config específica del tenant
      // Primero verificar si existe
      const { data: existing } = await supabase
        .from('client_config')
        .select('id')
        .eq('tenant_id', tenantId)
        .single();

      if (existing) {
        // Actualizar existente
        const { error } = await supabase
          .from('client_config')
          .update(dbUpdates)
          .eq('tenant_id', tenantId);
        
        if (error) throw error;
      } else {
        // Crear nuevo registro para este tenant
        const { error } = await supabase
          .from('client_config')
          .insert({
            tenant_id: tenantId,
            ...dbUpdates,
            is_configured: true,
          });
        
        if (error) throw error;
      }
    } else {
      // Comportamiento original para config global
      const { error } = await supabase
        .from('client_config')
        .update(dbUpdates)
        .eq('id', (await supabase.from('client_config').select('id').single()).data?.id);

      if (error) throw error;
      
      // Solo actualizar memoria si es config global
      _clientConfig = { ..._clientConfig, ...updates };
      applyClientTheme();
    }

    return true;
  } catch (error) {
    console.error('Error updating client config:', error);
    return false;
  }
}

/**
 * Sube el logo al bucket y actualiza la config
 * @param file - Archivo de imagen a subir
 * @param tenantId - Si se proporciona, organiza el archivo por tenant
 */
export async function uploadClientLogo(file: File, tenantId?: string): Promise<string | null> {
  try {
    const fileExt = file.name.split('.').pop();
    // Incluir tenantId en el nombre del archivo para evitar colisiones
    const fileName = tenantId 
      ? `${tenantId}/logo-${Date.now()}.${fileExt}`
      : `logo-${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('client-assets')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('client-assets')
      .getPublicUrl(fileName);

    const logoUrl = urlData.publicUrl;

    // Actualizar config con tenantId si se proporciona
    await updateClientConfig({ logoUrl }, tenantId);

    return logoUrl;
  } catch (error) {
    console.error('Error uploading logo:', error);
    return null;
  }
}

/**
 * Aplica los colores del cliente al DOM
 */
export function applyClientTheme(): void {
  const root = document.documentElement;
  
  const hexToHSL = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '222 47% 11%';
    
    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  // Aplicar colores del cliente
  root.style.setProperty('--primary', hexToHSL(_clientConfig.colorPrimario));
  root.style.setProperty('--secondary', hexToHSL(_clientConfig.colorSecundario));

  // Actualizar título y favicon
  document.title = `${_clientConfig.nombre} - ${_clientConfig.appTitle}`;
  
  if (_clientConfig.faviconUrl) {
    const favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement;
    if (favicon) {
      favicon.href = _clientConfig.faviconUrl;
    }
  }
}

export default clientConfig;
