'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/types';

export default function AuthNav() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser(userId: string | undefined) {
      if (!userId) {
        setProfile(null);
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      setProfile((data as Profile | null) ?? null);
      setLoading(false);
    }

    supabase.auth.getSession().then(({ data }) => {
      loadUser(data.session?.user.id);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      loadUser(session?.user?.id);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setProfile(null);
    router.replace('/');
  }

  return (
    <nav
      style={{
        maxWidth: 960,
        margin: '0 auto',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid var(--surface-200)',
      }}
    >
      {/* Lado izquierdo: Logo y enlaces directos */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <Link
          href="/"
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: 'var(--brand-dark)',
            textDecoration: 'none',
          }}
        >
          Andemar
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 600 }}>
          <Link
            href="/"
            style={{
              color: 'var(--muted)',
              textDecoration: 'none',
              padding: '6px 10px',
              borderRadius: 8,
            }}
          >
            Tours
          </Link>

          {!profile && (
            <>
              <Link
                href="/registro/viajero"
                style={{
                  color: 'var(--brand-dark)',
                  textDecoration: 'none',
                  padding: '6px 10px',
                  borderRadius: 8,
                  border: '1px solid var(--surface-200)',
                  background: '#f8fafc',
                }}
              >
                🎒 Registro Viajero
              </Link>

              <Link
                href="/registro/vendedor"
                style={{
                  background: '#b45309',
                  color: '#fff',
                  padding: '6px 12px',
                  borderRadius: 8,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  boxShadow: '0 2px 5px rgba(180, 83, 9, 0.2)',
                }}
              >
                💼 Registro Vendedor
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Lado derecho: Acceso a Cuenta / Iniciar sesión */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 13, fontWeight: 600 }}>
        {loading ? null : profile ? (
          <>
            {profile.is_admin && (
              <Link href="/admin" style={{ color: 'var(--brand-dark)', textDecoration: 'none' }}>
                Administrar
              </Link>
            )}

            {profile.role === 'seller' ? (
              <Link
                href="/panel-vendedor"
                style={{
                  color: '#b45309',
                  textDecoration: 'none',
                  background: '#fef3c7',
                  padding: '6px 12px',
                  borderRadius: 8,
                }}
              >
                💼 Panel Vendedor
              </Link>
            ) : (
              <Link
                href="/mis-reservas"
                style={{
                  color: 'var(--brand)',
                  textDecoration: 'none',
                  background: 'rgba(14, 124, 144, 0.08)',
                  padding: '6px 12px',
                  borderRadius: 8,
                }}
              >
                🎒 Mis Reservas
              </Link>
            )}

            <span style={{ color: 'var(--brand-dark)', fontWeight: 600 }}>
              {profile.full_name.split(' ')[0]}
            </span>

            <button
              onClick={handleSignOut}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--muted)',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: 13,
                padding: '4px 6px',
              }}
            >
              Salir
            </button>
          </>
        ) : (
          <Link
            href="/iniciar-sesion"
            style={{
              color: 'var(--brand-dark)',
              textDecoration: 'none',
              padding: '6px 12px',
              borderRadius: 8,
              border: '1px solid var(--surface-200)',
            }}
          >
            Iniciar sesión
          </Link>
        )}
      </div>
    </nav>
  );
}
