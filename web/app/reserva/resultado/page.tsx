import Link from 'next/link';
import { applyTransaction, fetchTransaction } from '@/lib/wompi';

export const revalidate = 0;

const MESSAGES: Record<string, { title: string; text: string }> = {
  APPROVED: {
    title: '¡Pago aprobado!',
    text: 'Tu reserva está confirmada. Te escribiremos por WhatsApp con los detalles del viaje.',
  },
  PENDING: {
    title: 'Pago en proceso',
    text: 'Tu banco todavía está procesando el pago. Te avisaremos por WhatsApp cuando se confirme.',
  },
  DECLINED: {
    title: 'Pago rechazado',
    text: 'El pago no fue aprobado y no se hizo ningún cobro. Puedes intentar de nuevo desde el tour.',
  },
};

// Wompi redirige aquí con ?id=<transacción> al terminar el checkout.
export default async function ResultadoPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const tx = id ? await fetchTransaction(id) : null;

  // Además del webhook: así la reserva se confirma aunque el webhook no llegue
  // (por ejemplo en local, donde Wompi no puede llamar a localhost).
  if (tx) await applyTransaction(tx);

  const message = tx
    ? (MESSAGES[tx.status] ?? MESSAGES.DECLINED)
    : {
        title: 'No encontramos tu pago',
        text: 'Si ya pagaste, escríbenos por WhatsApp con el comprobante.',
      };

  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: '48px 24px' }}>
      <h1 style={{ color: 'var(--brand-dark)' }}>{message.title}</h1>
      <p style={{ color: 'var(--muted)' }}>{message.text}</p>
      {tx && (
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>
          Referencia: <code>{tx.reference}</code>
        </p>
      )}
      <Link href="/" style={{ color: 'var(--brand)', fontWeight: 600 }}>
        ← Volver a los tours
      </Link>
    </main>
  );
}
