'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Profile, Booking, Tour } from '@/lib/types';
import { buttonStyle, cardStyle, outlineButtonStyle } from '@/components/ui';

interface BookingWithTour extends Booking {
  tour?: Tour;
}

export default function MisReservasPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bookings, setBookings] = useState<BookingWithTour[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/iniciar-sesion');
        return;
      }

      // Obtener perfil
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      setProfile(profileData as Profile | null);

      // Si es vendedor, sugerirle ir a su panel
      if (profileData?.role === 'seller') {
        router.replace('/panel-vendedor');
        return;
      }

      // Obtener reservas del viajero
      const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select('*, tour:tours(*)')
        .eq('traveler_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error cargando reservas:', error);
      } else {
        setBookings((bookingsData as BookingWithTour[]) ?? []);
      }

      setLoading(false);
    }

    loadData();
  }, [router]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace('/');
  }

  if (loading) {
    return (
      <main style={{ maxWidth: 760, margin: '40px auto', padding: '0 24px' }}>
        <p style={{ color: 'var(--muted)' }}>Cargando tus viajes…</p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 760, margin: '40px auto', padding: '0 24px' }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 32,
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ color: 'var(--brand-dark)', fontSize: 28, margin: 0 }}>
              Hola, {profile?.full_name ?? 'Viajero'}
            </h1>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                background: '#e0f2fe',
                color: '#0284c7',
                padding: '4px 10px',
                borderRadius: 20,
              }}
            >
              🎒 Cuenta de Viajero
            </span>
          </div>
          <p style={{ color: 'var(--muted)', marginTop: 6, marginBottom: 0 }}>
            Aquí puedes ver el historial y estado de todas tus reservas en Andemar.
          </p>
        </div>

        <button onClick={handleSignOut} style={outlineButtonStyle}>
          Cerrar sesión
        </button>
      </header>

      {/* Lista de Reservas */}
      <section>
        <h2 style={{ fontSize: 18, color: 'var(--brand-dark)', marginBottom: 16 }}>
          Mis Reservas ({bookings.length})
        </h2>

        {bookings.length === 0 ? (
          <div
            style={{
              ...cardStyle,
              padding: 40,
              textAlign: 'center',
              background: '#fff',
            }}
          >
            <div style={{ fontSize: 42, marginBottom: 12 }}>🌴</div>
            <h3 style={{ margin: '0 0 8px', color: 'var(--brand-dark)' }}>
              Aún no tienes viajes reservados
            </h3>
            <p style={{ color: 'var(--muted)', maxWidth: 400, margin: '0 auto 24px', fontSize: 14 }}>
              Descubre los mejores destinos entre el Caribe y los Andes y reserva tu próxima aventura en minutos.
            </p>
            <Link
              href="/"
              style={{
                ...buttonStyle,
                display: 'inline-block',
                textDecoration: 'none',
                padding: '12px 24px',
              }}
            >
              Explorar Tours Disponibles
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {bookings.map((booking) => {
              const tour = booking.tour;
              const formattedDate = new Date(booking.created_at).toLocaleDateString('es-CO', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              });

              return (
                <div
                  key={booking.id}
                  style={{
                    ...cardStyle,
                    padding: 20,
                    background: '#fff',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>
                        Reservado el {formattedDate}
                      </div>
                      <h3 style={{ margin: 0, fontSize: 18, color: 'var(--brand-dark)' }}>
                        {tour?.title ?? 'Tour en Colombia'}
                      </h3>
                      {tour?.location && (
                        <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
                          📍 {tour.location}
                        </div>
                      )}
                    </div>

                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        padding: '4px 12px',
                        borderRadius: 20,
                        background: booking.status === 'confirmed' ? '#dcfce7' : '#fef9c3',
                        color: booking.status === 'confirmed' ? '#15803d' : '#854d0e',
                      }}
                    >
                      {booking.status === 'confirmed' ? '✓ Confirmada' : '⏳ Pendiente'}
                    </span>
                  </div>

                  <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '4px 0' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ fontSize: 14 }}>
                      <span style={{ color: 'var(--muted)' }}>Viajeros: </span>
                      <strong>{booking.people_count} {booking.people_count === 1 ? 'persona' : 'personas'}</strong>
                    </div>

                    <div style={{ fontSize: 16 }}>
                      <span style={{ color: 'var(--muted)' }}>Total pagado: </span>
                      <strong style={{ color: 'var(--brand-dark)' }}>
                        ${Number(booking.amount_cop).toLocaleString('es-CO')} COP
                      </strong>
                    </div>

                    {tour?.slug && (
                      <Link
                        href={`/tours/${tour.slug}`}
                        style={{
                          fontSize: 13,
                          color: 'var(--brand)',
                          fontWeight: 600,
                          textDecoration: 'none',
                        }}
                      >
                        Ver detalles del tour →
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
