'use client';

import { useState, useEffect, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { UserRole } from '@/lib/types';
import { buttonStyle, cardStyle, inputStyle, labelStyle } from '@/components/ui';

export default function RegistroPage() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>('traveler');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Leer si en la URL viene ?rol=vendedor o ?role=seller
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlRole = params.get('rol') || params.get('role');
      if (urlRole === 'vendedor' || urlRole === 'seller') {
        setRole('seller');
      } else if (urlRole === 'viajero' || urlRole === 'traveler') {
        setRole('traveler');
      }
    }
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Registro a través del servidor para asegurar creación inmediata de perfil en Supabase
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
        router.replace('/iniciar-sesion');
        return;
      }

      // 3. Redirección según el rol
      if (role === 'seller') {
        router.replace('/panel-vendedor');
      } else {
        router.replace('/mis-reservas');
      }
    } catch (err: unknown) {
      console.error(err);
      setError('Error de conexión. Verifica tu conexión e intenta de nuevo.');
      setLoading(false);
    }
  }

  const isSeller = role === 'seller';

  return (
    <main style={{ maxWidth: 520, margin: '40px auto', padding: '0 20px' }}>
      <header style={{ marginBottom: 24, textAlign: 'center' }}>
        <h1 style={{ color: 'var(--brand-dark)', fontSize: 28, margin: '0 0 8px' }}>
          {isSeller ? 'Registro de Vendedor' : 'Registro de Viajero'}
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0 }}>
          {isSeller
            ? 'Crea tu perfil comercial para recomendar tours y comisionar'
            : 'Crea tu perfil para reservar tours y gestionar tus viajes'}
        </p>
      </header>

      {/* Selector de Rol Tipo Pestaña / Botones Claros */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          marginBottom: 20,
        }}
      >
        {/* Opción Viajero */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setRole('traveler')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') setRole('traveler');
          }}
          style={{
            ...cardStyle,
            padding: 16,
            cursor: 'pointer',
            textAlign: 'left',
            userSelect: 'none',
            border: !isSeller ? '2px solid var(--brand)' : '1.5px solid #e2e8f0',
            background: !isSeller ? '#f0fdfa' : '#fff',
            boxShadow: !isSeller ? '0 4px 12px rgba(14, 124, 144, 0.12)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ pointerEvents: 'none' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#0369a1', display: 'block', marginBottom: 4 }}>
              🎒 Opción 1
            </span>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--brand-dark)', marginBottom: 4 }}>
              Soy Viajero
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.4 }}>
              Quiero explorar y reservar viajes
            </div>
          </div>
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, pointerEvents: 'none' }}>
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
              {!isSeller ? 'Activo' : 'Seleccionar'}
            </span>
          </div>
        </div>

        {/* Opción Vendedor */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setRole('seller')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') setRole('seller');
          }}
          style={{
            ...cardStyle,
            padding: 16,
            cursor: 'pointer',
            textAlign: 'left',
            userSelect: 'none',
            border: isSeller ? '2px solid #b45309' : '1.5px solid #e2e8f0',
            background: isSeller ? '#fefce8' : '#fff',
            boxShadow: isSeller ? '0 4px 12px rgba(180, 83, 9, 0.12)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ pointerEvents: 'none' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#b45309', display: 'block', marginBottom: 4 }}>
              💼 Opción 2
            </span>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#78350f', marginBottom: 4 }}>
              Soy Vendedor
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.4 }}>
              Quiero comisionar recomendando tours
            </div>
          </div>
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, pointerEvents: 'none' }}>
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
              {isSeller ? 'Activo' : 'Seleccionar'}
            </span>
          </div>
        </div>
      </div>

      {/* Banner Informativo del Rol Seleccionado */}
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
            <strong>💼 Modo Vendedor seleccionado:</strong> Tu cuenta tendrá un código de referido único para ganar comisiones por cada tour vendido con tu enlace.
          </div>
        ) : (
          <div>
            <strong>🎒 Modo Viajero seleccionado:</strong> Tu cuenta te permitirá reservar tours en línea y revisar el estado de todas tus reservas.
          </div>
        )}
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} style={{ ...cardStyle, padding: 24, background: '#fff' }}>
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
