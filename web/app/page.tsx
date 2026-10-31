import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { Tour } from '@/lib/types';

// Sin cache: siempre trae los tours mas recientes de Supabase.
export const revalidate = 0;

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  // Link de vendedor: andemar.co/?ref=CODIGO — se mantiene al entrar a un tour
  const { ref } = await searchParams;
  const refQuery = ref ? `?ref=${encodeURIComponent(ref)}` : '';

  const { data: tours, error } = await supabase
    .from('tours')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error cargando tours desde Supabase:', error);
  }

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: '40px 24px' }}>
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, color: 'var(--brand-dark)', margin: 0 }}>Andemar</h1>
        <p style={{ color: 'var(--muted)', marginTop: 4 }}>
          El Caribe y los Andes, en un mismo viaje.
        </p>
      </header>

      {error && (
        <p style={{ color: 'var(--accent)' }}>
          No se pudieron cargar los tours. Revisa tus variables de entorno de Supabase en{' '}
          <code>web/.env.local</code>.
        </p>
      )}

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 20,
        }}
      >
        {(tours as Tour[] | null)?.map((tour) => (
          <Link
            key={tour.id}
            href={`/tours/${tour.slug}${refQuery}`}
            style={{
              display: 'block',
              border: '1px solid var(--surface-200)',
              borderRadius: 18,
              overflow: 'hidden',
              background: '#fff',
            }}
          >
            <div style={{ height: 120, background: tour.cover_color }} />
            <div style={{ padding: 14 }}>
              <div style={{ fontWeight: 600 }}>{tour.title}</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
                {tour.location}
              </div>
              <div style={{ marginTop: 8, fontWeight: 600, color: 'var(--accent)' }}>
                ${tour.price_cop.toLocaleString('es-CO')}
              </div>
            </div>
          </Link>
        ))}

        {tours && tours.length === 0 && (
          <p style={{ color: 'var(--muted)' }}>
            Aún no hay tours cargados. Corre <code>supabase/seed.sql</code> en el SQL Editor de tu
            proyecto de Supabase.
          </p>
        )}
      </section>
    </main>
  );
}
