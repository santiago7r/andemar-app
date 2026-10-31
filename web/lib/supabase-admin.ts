import { createClient } from '@supabase/supabase-js';

// Cliente con la clave secreta: salta RLS. Solo se importa desde rutas /api y
// páginas del servidor, nunca desde un archivo con 'use client'.
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY en web/.env.local');
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
