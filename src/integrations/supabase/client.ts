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

// Valores por defecto (desarrollo local - SIEMPRE usar variables de entorno en producción)
const DEFAULT_SUPABASE_URL = "https://hrharsnbombcmwixrgpo.supabase.co";
const DEFAULT_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyaGFyc25ib21iY213aXhyZ3BvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MjQwODAsImV4cCI6MjA3MzEwMDA4MH0.YgTdgAjbrd6ZWI26Fw_nXOWxLCj3K6pCMJb1gSysSzI";

// Usar variables de entorno si están disponibles, sino usar defaults
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_KEY;

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