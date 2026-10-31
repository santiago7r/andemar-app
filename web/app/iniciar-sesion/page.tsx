'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { buttonStyle, cardStyle, inputStyle, labelStyle } from '@/components/ui';

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
      setError(
        error?.message?.includes('Invalid login credentials')
          ? 'Correo o contraseña incorrectos.'
          : error?.message ?? 'No se pudo iniciar sesión.'
      );
      return;
    }

    // Consultar el perfil del usuario para redirigir según su rol
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_admin')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profile?.is_admin) {
      router.replace('/admin');
    } else if (profile?.role === 'seller') {
      router.replace('/panel-vendedor');
    } else {
      router.replace('/mis-reservas');
    }
  }

  return (
    <main style={{ maxWidth: 440, margin: '48px auto', padding: '0 24px' }}>
      <header style={{ marginBottom: 24, textAlign: 'center' }}>
        <h1 style={{ color: 'var(--brand-dark)', fontSize: 28, margin: '0 0 8px' }}>
          Inicia sesión
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0 }}>
          Ingresa a tu cuenta de Viajero o Vendedor en Andemar
        </p>
      </header>

      <form onSubmit={handleSubmit} style={{ ...cardStyle, padding: 24, background: '#fff' }}>
        <label style={labelStyle} htmlFor="email">
          Correo Electrónico
        </label>
        <input
          id="email"
          required
          type="email"
          placeholder="tu@correo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ ...inputStyle, marginBottom: 14 }}
          autoComplete="email"
        />

        <label style={labelStyle} htmlFor="password">
          Contraseña
        </label>
        <input
          id="password"
          required
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ ...inputStyle, marginBottom: 20 }}
          autoComplete="current-password"
        />

        {error && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 10,
              background: '#fef2f2',
              color: '#b91c1c',
              fontSize: 13,
              marginBottom: 16,
              border: '1px solid #fecaca',
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            ...buttonStyle,
            width: '100%',
            padding: '13px',
            fontSize: 15,
            opacity: loading ? 0.7 : 1,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Ingresando…' : 'Iniciar Sesión'}
        </button>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted)', marginTop: 18, marginBottom: 0 }}>
          ¿Aún no tienes cuenta?{' '}
          <Link href="/registro" style={{ color: 'var(--brand)', fontWeight: 600, textDecoration: 'none' }}>
            Regístrate aquí
          </Link>
        </p>
      </form>
    </main>
  );
}
