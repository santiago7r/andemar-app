import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    'Faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Copia web/.env.local.example a web/.env.local y llena tus valores.'
  );
}

// Polyfill para Node.js 20 donde WebSocket nativo no está activo por defecto en SSR
if (typeof window === 'undefined' && !globalThis.WebSocket) {
  // @ts-expect-error polyfill para entornos node sin global WebSocket
  globalThis.WebSocket = class DummyWebSocket {};
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
