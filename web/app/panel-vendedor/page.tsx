'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Profile, SellerCommission } from '@/lib/types';
import { buttonStyle, cardStyle, outlineButtonStyle } from '@/components/ui';

export default function PanelVendedorPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [commissions, setCommissions] = useState<SellerCommission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/iniciar-sesion');
        return;
      }

      const [profileRes, commissionsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('seller_commissions').select('*').eq('seller_id', user.id),
      ]);
      if (profileRes.error || commissionsRes.error) {
        setError((profileRes.error ?? commissionsRes.error)!.message);
      }
      setProfile((profileRes.data as Profile | null) ?? null);
      setCommissions((commissionsRes.data as SellerCommission[]) ?? []);
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace('/');
  }

  const wrap = (children: React.ReactNode) => (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px' }}>{children}</main>
  );
  const signOutButton = (
    <button onClick={handleSignOut} style={{ ...outlineButtonStyle, marginTop: 24 }}>
      Cerrar sesión
    </button>
  );

  if (loading) return wrap(<p style={{ color: 'var(--muted)' }}>Cargando…</p>);

  if (!profile) {
    return wrap(
      <>
        <h1 style={{ color: 'var(--brand-dark)' }}>Mi cuenta</h1>
        <p style={{ color: 'var(--muted)' }}>
          {error ?? 'No encontramos tu perfil. Intenta cerrar sesión y volver a entrar.'}
        </p>
        {signOutButton}
      </>
    );
  }

  if (profile.role !== 'seller') {
    return wrap(
      <>
        <h1 style={{ color: 'var(--brand-dark)' }}>Hola, {profile.full_name}</h1>
        <p style={{ color: 'var(--muted)' }}>
          Tu cuenta es de viajero. El panel de comisiones es solo para vendedores.
        </p>
        {signOutButton}
      </>
    );
  }

  const referralLink = `${window.location.origin}/?ref=${profile.referral_code}`;
  const totalCommission = commissions.reduce((sum, c) => sum + Number(c.commission_cop), 0);
  const totalBookings = commissions.reduce((sum, c) => sum + Number(c.bookings_confirmed), 0);

  async function copyLink() {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return wrap(
    <>
      <h1 style={{ color: 'var(--brand-dark)' }}>Hola, {profile.full_name}</h1>

      <section style={{ ...cardStyle, marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>Tu código de referido</div>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: 2, margin: '6px 0' }}>
          {profile.referral_code}
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)', wordBreak: 'break-all', marginBottom: 12 }}>
          {referralLink}
        </div>
        <button onClick={copyLink} style={buttonStyle}>
          {copied ? '¡Copiado!' : 'Copiar link de referido'}
        </button>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <section style={cardStyle}>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>Comisiones</div>
          <div style={{ fontSize: 22, fontWeight: 600 }}>${totalCommission.toLocaleString('es-CO')}</div>
        </section>
        <section style={cardStyle}>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>Reservas pagadas</div>
          <div style={{ fontSize: 22, fontWeight: 600 }}>{totalBookings}</div>
        </section>
      </div>

      {error && <p style={{ color: 'var(--accent)' }}>{error}</p>}

      <h3>Por tour</h3>
      {commissions.length === 0 ? (
        <p style={{ color: 'var(--muted)' }}>
          Aún no tienes reservas referidas. Comparte tu link para empezar a ganar.
        </p>
      ) : (
        commissions.map((c) => (
          <section key={c.tour_id} style={{ ...cardStyle, marginBottom: 12 }}>
            <div style={{ fontWeight: 600 }}>{c.tour_title}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>
              {c.bookings_confirmed} pagadas · {c.commission_pct}% de comisión
            </div>
            <div style={{ color: 'var(--accent)', fontWeight: 600, marginTop: 6 }}>
              ${Number(c.commission_cop).toLocaleString('es-CO')}
            </div>
          </section>
        ))
      )}

      {signOutButton}
    </>
  );
}
