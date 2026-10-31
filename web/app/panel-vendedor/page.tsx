'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Profile, Booking, Tour } from '@/lib/types';
import { buttonStyle, cardStyle, outlineButtonStyle } from '@/components/ui';

interface SaleItem extends Booking {
  tour?: Tour;
}

export default function PanelVendedorPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sales, setSales] = useState<SaleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);

    async function loadSellerData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/iniciar-sesion');
        return;
      }

      // Obtener perfil del vendedor
      const { data: profileRes } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      const prof = profileRes as Profile | null;
      setProfile(prof);

      if (prof && prof.role === 'seller') {
        // Consultar todas las reservas donde este vendedor fue el referente
        const { data: salesData, error } = await supabase
          .from('bookings')
          .select('*, tour:tours(*)')
          .eq('referrer_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error cargando ventas del vendedor:', error);
        } else {
          setSales((salesData as SaleItem[]) ?? []);
        }
      }

      setLoading(false);
    }

    loadSellerData();
  }, [router]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace('/');
  }

  const referralLink = profile ? `${origin || ''}/?ref=${profile.referral_code}` : '';

  async function copyLink() {
    if (!referralLink) return;
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  if (loading) {
    return (
      <main style={{ maxWidth: 880, margin: '40px auto', padding: '0 24px' }}>
        <p style={{ color: 'var(--muted)' }}>Cargando tu panel de vendedor…</p>
      </main>
    );
  }

  if (!profile) {
    return (
      <main style={{ maxWidth: 600, margin: '40px auto', padding: '0 24px', textAlign: 'center' }}>
        <h1 style={{ color: 'var(--brand-dark)' }}>No encontramos tu perfil</h1>
        <p style={{ color: 'var(--muted)' }}>Por favor inicia sesión nuevamente.</p>
        <button onClick={handleSignOut} style={outlineButtonStyle}>
          Cerrar sesión
        </button>
      </main>
    );
  }

  if (profile.role !== 'seller') {
    return (
      <main style={{ maxWidth: 600, margin: '40px auto', padding: '0 24px', textAlign: 'center' }}>
        <h1 style={{ color: 'var(--brand-dark)' }}>Hola, {profile.full_name}</h1>
        <p style={{ color: 'var(--muted)' }}>
          Tu cuenta actual está registrada como <strong>Viajero</strong>.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20 }}>
          <Link href="/mis-reservas" style={{ ...buttonStyle, textDecoration: 'none' }}>
            Ir a Mis Reservas
          </Link>
          <button onClick={handleSignOut} style={outlineButtonStyle}>
            Cerrar sesión
          </button>
        </div>
      </main>
    );
  }

  // Cálculos de métricas
  const confirmedSales = sales.filter((s) => s.status === 'confirmed');
  const totalSalesAmount = confirmedSales.reduce((acc, s) => acc + (Number(s.amount_cop) || 0), 0);
  const totalCommission = confirmedSales.reduce((acc, s) => {
    const pct = s.tour?.commission_pct ?? 10;
    return acc + (Number(s.amount_cop) || 0) * (pct / 100);
  }, 0);

  return (
    <main style={{ maxWidth: 880, margin: '40px auto', padding: '0 24px' }}>
      {/* Encabezado */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 28,
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ color: 'var(--brand-dark)', fontSize: 28, margin: 0 }}>
              Hola, {profile.full_name}
            </h1>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                background: '#fef3c7',
                color: '#b45309',
                padding: '4px 10px',
                borderRadius: 20,
              }}
            >
              💼 Vendedor Andemar
            </span>
          </div>
          <p style={{ color: 'var(--muted)', marginTop: 4, marginBottom: 0 }}>
            Monitorea tus ventas, comisiones y tu enlace de recomendación.
          </p>
        </div>

        <button onClick={handleSignOut} style={outlineButtonStyle}>
          Cerrar sesión
        </button>
      </header>

      {/* Tarjeta de Código y Enlace de Referido */}
      <section style={{ ...cardStyle, padding: 24, marginBottom: 24, background: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
              Tu Código de Vendedor
            </span>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--brand)', letterSpacing: 3, margin: '4px 0' }}>
              {profile.referral_code}
            </div>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
              Comparte tu enlace personal: cuando un viajero reserve con este link, la venta se vinculará a ti.
            </p>
          </div>

          <button
            onClick={copyLink}
            style={{
              ...buttonStyle,
              background: copied ? '#15803d' : 'var(--brand)',
              padding: '12px 20px',
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'background 0.2s ease',
            }}
          >
            <span>{copied ? '✓ ¡Enlace Copiado!' : '📋 Copiar Enlace de Venta'}</span>
          </button>
        </div>

        <div
          style={{
            marginTop: 16,
            padding: '10px 14px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            fontSize: 13,
            color: '#475569',
            fontFamily: 'monospace',
            wordBreak: 'break-all',
          }}
        >
          {referralLink}
        </div>
      </section>

      {/* Resumen de Métricas */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 32,
        }}
      >
        <div style={{ ...cardStyle, padding: 20, background: '#fff' }}>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>Comisiones Ganadas</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#16a34a' }}>
            ${Math.round(totalCommission).toLocaleString('es-CO')} COP
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Listo para liquidar</div>
        </div>

        <div style={{ ...cardStyle, padding: 20, background: '#fff' }}>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>Ventas Generadas</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--brand-dark)' }}>
            ${totalSalesAmount.toLocaleString('es-CO')} COP
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Monto bruto comercializado</div>
        </div>

        <div style={{ ...cardStyle, padding: 20, background: '#fff' }}>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>Reservas Concretadas</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--brand)' }}>
            {confirmedSales.length}
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
            {sales.length - confirmedSales.length > 0
              ? `${sales.length - confirmedSales.length} pendientes`
              : 'Todas confirmadas'}
          </div>
        </div>
      </section>

      {/* Visibilidad de Ventas */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, color: 'var(--brand-dark)', margin: 0 }}>
            Detalle de Ventas ({sales.length})
          </h2>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>
            Actualizado en tiempo real
          </span>
        </div>

        {sales.length === 0 ? (
          <div style={{ ...cardStyle, padding: 40, textAlign: 'center', background: '#fff' }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>🚀</div>
            <h3 style={{ margin: '0 0 8px', color: 'var(--brand-dark)' }}>
              Aún no registras ventas con tu código
            </h3>
            <p style={{ color: 'var(--muted)', maxWidth: 440, margin: '0 auto 20px', fontSize: 14 }}>
              Empieza compartiendo tu enlace de referido con clientes o en tus redes sociales. Cada vez que reserven un tour, aparecerá aquí al instante.
            </p>
            <button onClick={copyLink} style={buttonStyle}>
              {copied ? '✓ ¡Enlace Copiado!' : 'Copiar mi enlace ahora'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {sales.map((sale) => {
              const tour = sale.tour;
              const commissionPct = tour?.commission_pct ?? 10;
              const saleAmount = Number(sale.amount_cop) || (tour?.price_cop ? tour.price_cop * sale.people_count : 0);
              const commissionCop = saleAmount * (commissionPct / 100);
              const formattedDate = new Date(sale.created_at).toLocaleDateString('es-CO', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={sale.id}
                  style={{
                    ...cardStyle,
                    padding: 18,
                    background: '#fff',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 2 }}>
                        {formattedDate}
                      </div>
                      <h3 style={{ margin: 0, fontSize: 17, color: 'var(--brand-dark)' }}>
                        {tour?.title ?? 'Tour en Colombia'}
                      </h3>
                      <div style={{ fontSize: 13, color: '#334155', marginTop: 4 }}>
                        👤 Cliente: <strong>{sale.customer_name}</strong> · 📱 {sale.customer_phone}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          padding: '3px 10px',
                          borderRadius: 20,
                          background: sale.status === 'confirmed' ? '#dcfce7' : '#fef9c3',
                          color: sale.status === 'confirmed' ? '#15803d' : '#854d0e',
                        }}
                      >
                        {sale.status === 'confirmed' ? '✓ Venta Confirmada' : '⏳ En proceso'}
                      </span>
                    </div>
                  </div>

                  <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '4px 0' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ fontSize: 14 }}>
                      <span style={{ color: 'var(--muted)' }}>Cupos: </span>
                      <strong>{sale.people_count} {sale.people_count === 1 ? 'persona' : 'personas'}</strong>
                    </div>

                    <div style={{ fontSize: 14 }}>
                      <span style={{ color: 'var(--muted)' }}>Total Venta: </span>
                      <strong style={{ color: 'var(--brand-dark)' }}>
                        ${saleAmount.toLocaleString('es-CO')} COP
                      </strong>
                    </div>

                    <div style={{ fontSize: 15, background: '#f0fdf4', padding: '6px 12px', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                      <span style={{ color: '#166534', fontSize: 13 }}>Tu comisión ({commissionPct}%): </span>
                      <strong style={{ color: '#15803d' }}>
                        ${Math.round(commissionCop).toLocaleString('es-CO')} COP
                      </strong>
                    </div>
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
