import Link from 'next/link';
import { applyTransaction, fetchTransaction } from '@/lib/wompi';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import type { Tour } from '@/lib/types';

export const revalidate = 0;

export default async function ResultadoPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; reserva_id?: string }>;
}) {
  const params = await searchParams;
  const wompiId = params.id;
  const reservaId = params.reserva_id;

  // Caso 1: Regreso desde Wompi
  if (wompiId) {
    const tx = await fetchTransaction(wompiId);
    if (tx) await applyTransaction(tx);

    const isApproved = tx?.status === 'APPROVED';
    return (
      <main style={{ maxWidth: 560, margin: '40px auto', padding: '32px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>{isApproved ? '🎉' : '⏳'}</div>
        <h1 style={{ color: 'var(--brand-dark)', fontSize: 26, margin: '0 0 12px' }}>
          {isApproved ? '¡Pago y Reserva Confirmados!' : 'Estado de tu pago'}
        </h1>
        <p style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
          {isApproved
            ? 'Tu reserva ha sido confirmada con éxito. Te hemos enviado un mensaje con los detalles del tour.'
            : 'Tu pago está siendo procesado por la entidad bancaria.'}
        </p>
        {tx && (
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 16 }}>
            Referencia: <code>{tx.reference}</code>
          </p>
        )}
        <div style={{ marginTop: 28, display: 'flex', justifyContent: 'center', gap: 16 }}>
          <Link
            href="/mis-reservas"
            style={{
              background: 'var(--brand)',
              color: '#fff',
              padding: '10px 20px',
              borderRadius: 12,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Ver mis reservas
          </Link>
          <Link
            href="/"
            style={{
              padding: '10px 20px',
              border: '1px solid var(--surface-200)',
              borderRadius: 12,
              fontWeight: 600,
              color: 'var(--brand-dark)',
              textDecoration: 'none',
            }}
          >
            Explorar más tours
          </Link>
        </div>
      </main>
    );
  }

  // Caso 2: Reserva Directa (Modo Simple / Demo)
  if (reservaId) {
    const admin = getSupabaseAdmin();
    const { data: booking } = await admin
      .from('bookings')
      .select('id, customer_name, people_count, amount_cop, status, tour_id')
      .eq('id', reservaId)
      .maybeSingle();

    let tourTitle = 'Tour en Colombia';
    if (booking?.tour_id) {
      const { data: tour } = await admin
        .from('tours')
        .select('title')
        .eq('id', booking.tour_id)
        .maybeSingle();
      if (tour?.title) tourTitle = tour.title;
    }

    return (
      <main style={{ maxWidth: 560, margin: '40px auto', padding: '32px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>🎉</div>
        <h1 style={{ color: 'var(--brand-dark)', fontSize: 28, margin: '0 0 12px' }}>
          ¡Reserva Confirmada con Éxito!
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 16, lineHeight: 1.6, margin: '0 0 24px' }}>
          Gracias, <strong>{booking?.customer_name ?? 'Viajero'}</strong>. Tu cupo para{' '}
          <strong>{tourTitle}</strong> ({booking?.people_count ?? 1}{' '}
          {(booking?.people_count ?? 1) === 1 ? 'persona' : 'personas'}) ha sido registrado.
        </p>

        {booking && (
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 16,
              padding: 20,
              textAlign: 'left',
              marginBottom: 24,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
              <span style={{ color: 'var(--muted)' }}>Tour:</span>
              <span style={{ fontWeight: 600 }}>{tourTitle}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
              <span style={{ color: 'var(--muted)' }}>Viajeros:</span>
              <span style={{ fontWeight: 600 }}>{booking.people_count}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
              <span style={{ color: 'var(--muted)' }}>Total:</span>
              <span style={{ fontWeight: 700, color: 'var(--brand-dark)' }}>
                ${Number(booking.amount_cop).toLocaleString('es-CO')} COP
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: 'var(--muted)' }}>Estado:</span>
              <span style={{ fontWeight: 600, color: '#16a34a' }}>
                {booking.status === 'confirmed' ? '✓ Confirmada' : 'En proceso'}
              </span>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
          <Link
            href="/mis-reservas"
            style={{
              background: 'var(--brand)',
              color: '#fff',
              padding: '12px 24px',
              borderRadius: 14,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Ver mis reservas
          </Link>
          <Link
            href="/"
            style={{
              background: '#fff',
              border: '1px solid var(--surface-200)',
              color: 'var(--brand-dark)',
              padding: '12px 24px',
              borderRadius: 14,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Ver otros tours
          </Link>
        </div>
      </main>
    );
  }

  // Caso por defecto
  return (
    <main style={{ maxWidth: 560, margin: '48px auto', padding: '32px 24px', textAlign: 'center' }}>
      <h1 style={{ color: 'var(--brand-dark)' }}>Reservas Andemar</h1>
      <p style={{ color: 'var(--muted)', marginBottom: 24 }}>
        Explora nuestros destinos o revisa las reservas asociadas a tu cuenta.
      </p>
      <Link href="/" style={{ color: 'var(--brand)', fontWeight: 600 }}>
        ← Volver a los tours
      </Link>
    </main>
  );
}
