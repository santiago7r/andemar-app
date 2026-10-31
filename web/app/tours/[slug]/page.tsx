import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { Tour } from '@/lib/types';
import BookingForm from './BookingForm';

export const revalidate = 0;

export default async function TourPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ref?: string }>;
}) {
  const { slug } = await params;
  const { ref } = await searchParams;

  const { data: tour } = await supabase
    .from('tours')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!tour) {
    return (
      <main style={{ padding: 24 }}>
        Tour no encontrado.{' '}
        <Link href="/" style={{ color: 'var(--brand)' }}>
          Volver al inicio
        </Link>
      </main>
    );
  }

  const t = tour as Tour;

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px' }}>
      <Link href="/" style={{ color: 'var(--brand)', fontSize: 13 }}>
        ← Volver
      </Link>

      <div
        style={{ height: 220, background: t.cover_color, borderRadius: 20, margin: '16px 0' }}
      />

      <h1 style={{ color: 'var(--brand-dark)', margin: 0 }}>{t.title}</h1>
      <p style={{ color: 'var(--muted)' }}>
        {t.location} · ★ {t.rating}
      </p>
      <p style={{ fontSize: 24, fontWeight: 600, color: 'var(--accent)' }}>
        ${t.price_cop.toLocaleString('es-CO')}{' '}
        <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 400 }}>/ persona</span>
      </p>

      {t.video_360_url && (
        <a
          href={t.video_360_url}
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'inline-block',
            border: '1.5px solid var(--brand-dark)',
            color: 'var(--brand-dark)',
            padding: '10px 18px',
            borderRadius: 14,
            marginBottom: 20,
            fontWeight: 600,
          }}
        >
          Ver tour en 360° / VR
        </a>
      )}

      <h3>Qué incluye</h3>
      <ul style={{ color: 'var(--muted)' }}>
        {t.includes.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      {t.description && <p style={{ color: 'var(--muted)' }}>{t.description}</p>}

      {/* Si alguien llega con ?ref=CODIGO, el servidor lo asocia al vendedor al crear la reserva */}
      <BookingForm tourId={t.id} pricePerPerson={t.price_cop} referralCode={ref ?? null} />
    </main>
  );
}
