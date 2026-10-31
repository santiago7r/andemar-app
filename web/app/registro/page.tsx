'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { UserRole } from '@/lib/types';
import { buttonStyle, cardStyle, inputStyle, labelStyle } from '@/components/ui';

const ROLES: { value: UserRole; title: string; badge: string; description: string }[] = [
  {
    value: 'traveler',
    title: 'Soy Viajero',
    badge: '🎒 Explorador',
    description: 'Quiero descubrir destinos, reservar tours y gestionar mis viajes.',
  },
  {
    value: 'seller',
    title: 'Soy Vendedor',
    badge: '💼 Embajador / Guía',
    description: 'Quiero recomendar tours con mi link propio y ganar comisiones por venta.',
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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Registro seguro a través del servidor para asegurar creación inmediata de perfil y auth
      const res = await fetch('/api/auth/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          password,
          role,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.error) {
        setError(data.error ?? 'Hubo un error al crear la cuenta. Intenta nuevamente.');
        setLoading(false);
        return;
      }

      // 2. Iniciar sesión automáticamente
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        // Si no inicia sesión automática, enviarlo a iniciar sesión
        router.replace('/iniciar-sesion');
        return;
      }

      // 3. Redirección inteligente según el rol elegido
      if (role === 'seller') {
        router.replace('/panel-vendedor');
      } else {
        router.replace('/mis-reservas');
      }
    } catch (err: unknown) {
      console.error(err);
      setError('Error de conexión. Verifica tu internet y vuelve a intentar.');
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 500, margin: '40px auto', padding: '0 24px' }}>
      <header style={{ marginBottom: 28, textAlign: 'center' }}>
        <h1 style={{ color: 'var(--brand-dark)', fontSize: 28, margin: '0 0 8px' }}>
          Crea tu cuenta en Andemar
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 15, margin: 0 }}>
          Elige cómo deseas utilizar la plataforma
        </p>
      </header>

      {/* Selector de rol */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
        {ROLES.map((r) => {
          const isSelected = role === r.value;
          return (
            <button
              key={r.value}
              type="button"
              onClick={() => setRole(r.value)}
              style={{
                ...cardStyle,
                textAlign: 'left',
                cursor: 'pointer',
                border: isSelected ? '2px solid var(--brand)' : '1px solid var(--surface-200)',
                background: isSelected ? 'rgba(14, 124, 144, 0.06)' : '#fff',
                padding: '16px 14px',
                transition: 'all 0.15s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand)', display: 'block', marginBottom: 6 }}>
                  {r.badge}
                </span>
                <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--brand-dark)', marginBottom: 6 }}>
                  {r.title}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.4 }}>
                  {r.description}
                </div>
              </div>
              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    border: isSelected ? '4px solid var(--brand)' : '2px solid #cbd5e1',
                    display: 'inline-block',
                  }}
                />
                <span style={{ fontSize: 12, fontWeight: 600, color: isSelected ? 'var(--brand)' : '#64748b' }}>
                  {isSelected ? 'Seleccionado' : 'Elegir'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} style={{ ...cardStyle, padding: 24, background: '#fff' }}>
        <label style={labelStyle} htmlFor="full_name">
          Nombre y Apellido
        </label>
        <input
          id="full_name"
          required
          placeholder="Ej. Carolina Gómez"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          style={{ ...inputStyle, marginBottom: 14 }}
          autoComplete="name"
        />

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
          Contraseña (mínimo 6 caracteres)
        </label>
        <input
          id="password"
          required
          type="password"
          minLength={6}
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ ...inputStyle, marginBottom: 20 }}
          autoComplete="new-password"
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
            opacity: loading ? 0.7 : 1,
            cursor: loading ? 'not-allowed' : 'pointer',
            padding: '14px',
            fontSize: 15,
          }}
        >
          {loading
            ? 'Creando perfil…'
            : role === 'seller'
            ? 'Registrarme como Vendedor'
            : 'Registrarme como Viajero'}
        </button>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted)', marginTop: 16, marginBottom: 0 }}>
          ¿Ya tienes cuenta?{' '}
          <Link href="/iniciar-sesion" style={{ color: 'var(--brand)', fontWeight: 600, textDecoration: 'none' }}>
            Inicia sesión aquí
          </Link>
        </p>
      </form>
    </main>
  );
}
