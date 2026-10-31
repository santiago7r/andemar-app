'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { buttonStyle, inputStyle, labelStyle } from '@/components/ui';

export default function IniciarSesionPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error || !data.user) {
      setLoading(false);
      setError(error?.message ?? 'No se pudo iniciar sesión.');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_admin')
      .eq('id', data.user.id)
      .maybeSingle();

    router.replace(
      profile?.is_admin ? '/admin' : profile?.role === 'seller' ? '/panel-vendedor' : '/'
    );
  }

  return (
    <main style={{ maxWidth: 420, margin: '0 auto', padding: '32px 24px' }}>
      <h1 style={{ color: 'var(--brand-dark)', marginBottom: 4 }}>Inicia sesión</h1>
      <p style={{ color: 'var(--muted)', marginTop: 0 }}>Bienvenido de vuelta a Andemar.</p>

      <form onSubmit={handleSubmit}>
        <label style={labelStyle} htmlFor="email">Correo</label>
        <input id="email" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} autoComplete="email" />

        <label style={labelStyle} htmlFor="password">Contraseña</label>
        <input id="password" required type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} autoComplete="current-password" />

        {error && <p style={{ color: 'var(--accent)' }}>{error}</p>}

        <button type="submit" disabled={loading} style={{ ...buttonStyle, width: '100%' }}>
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </form>

      <p style={{ textAlign: 'center', fontSize: 14 }}>
        ¿No tienes cuenta?{' '}
        <Link href="/registro" style={{ color: 'var(--brand)', fontWeight: 600 }}>
          Regístrate
        </Link>
      </p>
    </main>
  );
}
