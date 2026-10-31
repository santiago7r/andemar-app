import { createHash } from 'node:crypto';
import { getSupabaseAdmin } from './supabase-admin';

// Documentación: https://docs.wompi.co
const CHECKOUT_URL = 'https://checkout.wompi.co/p/';

export interface WompiTransaction {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR';
  amount_in_cents: number;
  currency: string;
  reference: string;
}

function env(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Falta ${name} en web/.env.local`);
  return value;
}

function sha256(text: string) {
  return createHash('sha256').update(text).digest('hex');
}

// URL del Web Checkout de Wompi. La firma de integridad evita que alguien
// cambie el monto en el navegador.
export function buildCheckoutUrl(reference: string, amountCop: number, redirectUrl: string) {
  const amountInCents = amountCop * 100;
  const signature = sha256(`${reference}${amountInCents}COP${env('WOMPI_INTEGRITY_SECRET')}`);
  const params = new URLSearchParams({
    'public-key': env('WOMPI_PUBLIC_KEY'),
    currency: 'COP',
    'amount-in-cents': String(amountInCents),
    reference,
    'signature:integrity': signature,
    'redirect-url': redirectUrl,
  });
  return `${CHECKOUT_URL}?${params}`;
}

// Consulta la transacción directo a la API de Wompi (fuente confiable).
export async function fetchTransaction(id: string): Promise<WompiTransaction | null> {
  const apiUrl = process.env.WOMPI_API_URL ?? 'https://sandbox.wompi.co/v1';
  const res = await fetch(`${apiUrl}/transactions/${encodeURIComponent(id)}`, {
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const body = (await res.json()) as { data?: WompiTransaction };
  return body.data ?? null;
}

// Verifica la firma de un evento del webhook:
// sha256(valores de signature.properties + timestamp + secreto de eventos)
export function isValidEvent(event: {
  data: Record<string, unknown>;
  signature?: { properties?: string[]; checksum?: string };
  timestamp?: number;
}) {
  const { properties, checksum } = event.signature ?? {};
  if (!properties || !checksum || event.timestamp === undefined) return false;

  const values = properties.map((path) =>
    path.split('.').reduce<unknown>((obj, key) => (obj as Record<string, unknown>)?.[key], event.data)
  );
  const expected = sha256(`${values.join('')}${event.timestamp}${env('WOMPI_EVENTS_SECRET')}`);
  return expected.toUpperCase() === checksum.toUpperCase();
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Aplica el resultado de una transacción a su reserva (referencia = id de la
// reserva). Solo mueve reservas que siguen en 'pending', y solo si el monto
// cobrado coincide con el guardado.
export async function applyTransaction(tx: WompiTransaction) {
  if (!UUID_RE.test(tx.reference)) return;

  const supabase = getSupabaseAdmin();
  const { data: booking } = await supabase
    .from('bookings')
    .select('id, amount_cop, status')
    .eq('id', tx.reference)
    .maybeSingle();

  if (!booking || booking.status !== 'pending') return;
  if (tx.currency !== 'COP' || tx.amount_in_cents !== booking.amount_cop * 100) {
    console.error(`[wompi] Monto no coincide para la reserva ${booking.id}`, tx);
    return;
  }

  const status =
    tx.status === 'APPROVED' ? 'confirmed' : tx.status === 'PENDING' ? 'pending' : 'cancelled';

  await supabase
    .from('bookings')
    .update({
      status,
      wompi_transaction_id: tx.id,
      wompi_status: tx.status,
      paid_at: tx.status === 'APPROVED' ? new Date().toISOString() : null,
    })
    .eq('id', booking.id)
    .eq('status', 'pending');
}
