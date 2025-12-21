/**
 * Cliente de Supabase configurado por cliente/empresa
 * 
 * IMPORTANTE: Cada cliente tiene su propia instancia de Supabase
 * Las credenciales se configuran en las variables de entorno:
 * - VITE_SUPABASE_URL
 * - VITE_SUPABASE_ANON_KEY
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Variables de entorno (OBLIGATORIAS)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validar que las variables existan
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    '❌ Faltan variables de entorno de Supabase.\n' +
    'Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu archivo .env o en Vercel.'
  );
}

// Log para debug (solo en desarrollo)
if (import.meta.env.DEV) {
  console.log('🔧 [SUPABASE] Conectando a:', SUPABASE_URL.substring(0, 30) + '...');
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});