import { NextResponse } from 'next/server';
import { applyTransaction, isValidEvent, type WompiTransaction } from '@/lib/wompi';

// Configura esta URL en el dashboard de Wompi como "URL de eventos":
//   https://tu-dominio.com/api/wompi/webhook
export async function POST(request: Request) {
  const event = await request.json().catch(() => null);
  if (!event || !isValidEvent(event)) {
    return NextResponse.json({ error: 'Firma inválida' }, { status: 401 });
  }

  if (event.event === 'transaction.updated') {
    await applyTransaction(event.data.transaction as WompiTransaction);
  }
  return NextResponse.json({ ok: true });
}
