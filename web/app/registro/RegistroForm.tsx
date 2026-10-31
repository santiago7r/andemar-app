'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { UserRole } from '@/lib/types';
import { buttonStyle, cardStyle, inputStyle, labelStyle } from '@/components/ui';

export default function RegistroForm({ initialRole = 'traveler' }: { initialRole?: UserRole }) {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>(initialRole);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSeller = role === 'seller';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
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

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        router.replace('/iniciar-sesion');
        return;
      }

      if (role === 'seller') {
        router.replace('/panel-vendedor');
      } else {
        router.replace('/mis-reservas');
      }
    } catch (err: unknown) {
      console.error(err);
      setError('Error de conexión. Intenta de nuevo.');
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 520, margin: '40px auto', padding: '0 20px' }}>
      <header style={{ marginBottom: 24, textAlign: 'center' }}>
        <h1 style={{ color: 'var(--brand-dark)', fontSize: 28, margin: '0 0 8px' }}>
          {isSeller ? '💼 Registro de Vendedor' : '🎒 Registro de Viajero'}
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0 }}>
          {isSeller
            ? 'Regístrate para obtener tu link de embajador y comisionar por cada tour'
            : 'Regístrate para reservar tours y guardar el historial de tus viajes'}
        </p>
      </header>

      {/* PESTAÑAS NATIVAS DE NAVEGACIÓN (<Link>) - Imposible que falle el clic */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          marginBottom: 20,
        }}
      >
        {/* Pestaña Viajero */}
        <Link
          href="/registro?rol=viajero"
          onClick={(e) => {
            setRole('traveler');
          }}
          style={{
            ...cardStyle,
            textDecoration: 'none',
            display: 'block',
            padding: 16,
            cursor: 'pointer',
            textAlign: 'left',
            border: !isSeller ? '2px solid var(--brand)' : '1.5px solid #e2e8f0',
            background: !isSeller ? '#f0fdfa' : '#fff',
            boxShadow: !isSeller ? '0 4px 12px rgba(14, 124, 144, 0.12)' : 'none',
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 700, color: '#0369a1', display: 'block', marginBottom: 4 }}>
            🎒 Opción 1
          </span>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--brand-dark)', marginBottom: 4 }}>
            Soy Viajero
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.4 }}>
            Explorar y reservar tours
          </div>
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                border: !isSeller ? '4px solid var(--brand)' : '2px solid #cbd5e1',
                display: 'inline-block',
                background: '#fff',
              }}
            />
            <span style={{ fontSize: 12, fontWeight: 700, color: !isSeller ? 'var(--brand)' : '#64748b' }}>
              {!isSeller ? '✓ Activo' : 'Cambiar a Viajero'}
            </span>
          </div>
        </Link>

        {/* Pestaña Vendedor */}
        <Link
          href="/registro?rol=vendedor"
          onClick={(e) => {
            setRole('seller');
          }}
          style={{
            ...cardStyle,
            textDecoration: 'none',
            display: 'block',
            padding: 16,
            cursor: 'pointer',
            textAlign: 'left',
            border: isSeller ? '2px solid #b45309' : '1.5px solid #e2e8f0',
            background: isSeller ? '#fefce8' : '#fff',
            boxShadow: isSeller ? '0 4px 12px rgba(180, 83, 9, 0.12)' : 'none',
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 700, color: '#b45309', display: 'block', marginBottom: 4 }}>
            💼 Opción 2
          </span>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#78350f', marginBottom: 4 }}>
            Soy Vendedor
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.4 }}>
            Ganar comisiones con mi código
          </div>
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                border: isSeller ? '4px solid #b45309' : '2px solid #cbd5e1',
                display: 'inline-block',
                background: '#fff',
              }}
            />
            <span style={{ fontSize: 12, fontWeight: 700, color: isSeller ? '#b45309' : '#64748b' }}>
              {isSeller ? '✓ Activo' : 'Cambiar a Vendedor'}
            </span>
          </div>
        </Link>
      </div>

      {/* Banner Informativo */}
      <div
        style={{
          padding: '12px 16px',
          borderRadius: 12,
          marginBottom: 20,
          fontSize: 13,
          lineHeight: 1.5,
          background: isSeller ? '#fef3c7' : '#e0f2fe',
          border: isSeller ? '1px solid #fde68a' : '1px solid #bae6fd',
          color: isSeller ? '#92400e' : '#0369a1',
        }}
      >
        {isSeller ? (
          <div>
            <strong>💼 Modo Vendedor activo:</strong> Recibirás tu link de recomendación único para comisionar por cada reserva.
          </div>
        ) : (
          <div>
            <strong>🎒 Modo Viajero activo:</strong> Podrás reservar tours directamente y ver tus viajes en &ldquo;Mis Reservas&rdquo;.
          </div>
        )}
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} style={{ ...cardStyle, padding: 24, background: '#fff' }}>
        {/* Selector de rol dentro del formulario (segunda alternativa de cambio directo) */}
        <label style={labelStyle} htmlFor="role_selector">
          Tipo de Perfil a Crear
        </label>
        <select
          id="role_selector"
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
          style={{
            ...inputStyle,
            marginBottom: 16,
            fontWeight: 600,
            cursor: 'pointer',
            borderColor: isSeller ? '#b45309' : 'var(--brand)',
            color: isSeller ? '#b45309' : 'var(--brand-dark)',
          }}
        >
          <option value="traveler">🎒 Cuenta de Viajero (Explorar y reservar tours)</option>
          <option value="seller">💼 Cuenta de Vendedor (Recomendar tours y ganar comisiones)</option>
        </select>

        <label style={labelStyle} htmlFor="full_name">
          Nombre Completo
        </label>
        <input
          id="full_name"
          required
          placeholder={isSeller ? 'Ej. Andrés Vendedor' : 'Ej. Carolina Gómez'}
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
            background: isSeller ? '#b45309' : 'var(--brand)',
            padding: '14px',
            fontSize: 15,
            opacity: loading ? 0.7 : 1,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s ease',
          }}
        >
          {loading
            ? 'Creando perfil…'
            : isSeller
            ? 'Crear Cuenta de Vendedor →'
            : 'Crear Cuenta de Viajero →'}
        </button>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted)', marginTop: 18, marginBottom: 0 }}>
          ¿Ya tienes cuenta?{' '}
          <Link href="/iniciar-sesion" style={{ color: 'var(--brand)', fontWeight: 600, textDecoration: 'none' }}>
            Inicia sesión aquí
          </Link>
        </p>
      </form>
    </main>
  );
}
