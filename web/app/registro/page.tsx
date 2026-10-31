'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { UserRole } from '@/lib/types';
import { buttonStyle, cardStyle, inputStyle, labelStyle } from '@/components/ui';

const ROLES: { value: UserRole; title: string; description: string }[] = [
  {
    value: 'traveler',
    title: 'Soy viajero',
    description: 'Quiero reservar tours y guardar mis viajes.',
  },
  {
    value: 'seller',
    title: 'Soy vendedor',
    description: 'Quiero recomendar tours y ganar comisiones con mi código.',
  },
];

export default function RegistroPage() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>('traveler');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    // El trigger on_auth_user_created (supabase/fase2.sql) crea el perfil con estos datos
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: fullName.trim(), role },
        emailRedirectTo: `${window.location.origin}/iniciar-sesion`,
      },
    });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }
    if (!data.session) {
      setPendingConfirmation(true);
      return;
    }
    router.replace(role === 'seller' ? '/panel-vendedor' : '/');
  }

  if (pendingConfirmation) {
    return (
      <main style={{ maxWidth: 480, margin: '0 auto', padding: '32px 24px' }}>
        <h1 style={{ color: 'var(--brand-dark)' }}>Revisa tu correo</h1>
        <p style={{ color: 'var(--muted)' }}>
          Te enviamos un enlace de confirmación a {email.trim()}. Después de confirmarlo, inicia
          sesión.
        </p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 480, margin: '0 auto', padding: '32px 24px' }}>
      <h1 style={{ color: 'var(--brand-dark)', marginBottom: 4 }}>Crea tu cuenta</h1>
      <p style={{ color: 'var(--muted)', marginTop: 0 }}>¿Cómo vas a usar Andemar?</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
        {ROLES.map((r) => (
          <button
            key={r.value}
            type="button"
            onClick={() => setRole(r.value)}
            style={{
              ...cardStyle,
              textAlign: 'left',
              cursor: 'pointer',
              font: 'inherit',
              borderWidth: 1.5,
              borderColor: role === r.value ? 'var(--brand)' : 'var(--surface-200)',
              background: role === r.value ? '#eef7f8' : '#fff',
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{r.title}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>{r.description}</div>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <label style={labelStyle} htmlFor="full_name">Nombre completo</label>
        <input id="full_name" required value={fullName} onChange={(e) => setFullName(e.target.value)} style={inputStyle} autoComplete="name" />

        <label style={labelStyle} htmlFor="email">Correo</label>
        <input id="email" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} autoComplete="email" />

        <label style={labelStyle} htmlFor="password">Contraseña</label>
        <input id="password" required type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} autoComplete="new-password" />

        {error && <p style={{ color: 'var(--accent)' }}>{error}</p>}

        <button type="submit" disabled={loading} style={{ ...buttonStyle, width: '100%' }}>
          {loading ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
      </form>

      <p style={{ textAlign: 'center', fontSize: 14 }}>
        ¿Ya tienes cuenta?{' '}
        <Link href="/iniciar-sesion" style={{ color: 'var(--brand)', fontWeight: 600 }}>
          Inicia sesión
        </Link>
      </p>
    </main>
  );
}
