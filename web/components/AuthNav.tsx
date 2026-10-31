'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

// Links de cuenta arriba a la derecha en todas las páginas
export default function AuthNav() {
  const [signedIn, setSignedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function refresh(userId: string | undefined) {
      setSignedIn(!!userId);
      if (!userId) {
        setIsAdmin(false);
        return;
      }
      const { data } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', userId)
        .maybeSingle();
      setIsAdmin(!!data?.is_admin);
    }

    supabase.auth.getSession().then(({ data }) => refresh(data.session?.user.id));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      refresh(session?.user.id);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <nav
      style={{
        maxWidth: 960,
        margin: '0 auto',
        padding: '16px 24px 0',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 16,
        fontSize: 14,
        fontWeight: 600,
      }}
    >
      {isAdmin && (
        <Link href="/admin" style={{ color: 'var(--brand-dark)' }}>
          Administrar
        </Link>
      )}
      {signedIn ? (
        <Link href="/panel-vendedor" style={{ color: 'var(--brand)' }}>
          Mi cuenta
        </Link>
      ) : (
        <Link href="/iniciar-sesion" style={{ color: 'var(--brand)' }}>
          Iniciar sesión
        </Link>
      )}
    </nav>
  );
}
