'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { inputStyle, labelStyle } from '@/components/ui';

export default function BookingForm({
  tourId,
  pricePerPerson,
  referralCode,
}: {
  tourId: string;
  pricePerPerson: number;
  referralCode: string | null;
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [people, setPeople] = useState(1);
  const [status, setStatus] = useState<'idle' | 'sending' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);

  // Pre-cargar nombre del usuario si ya tiene sesión abierta
  useEffect(() => {
    async function checkUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        setSignedIn(true);
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profile?.full_name) {
          setName(profile.full_name);
        }
      }
    }
    checkUser();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus('sending');
    setError(null);

    try {
      // Si hay sesión, mandar el token para asociar la reserva al viajero
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const res = await fetch('/api/reservas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          tourId,
          name: name.trim(),
          phone: phone.trim(),
          people,
          ref: referralCode,
        }),
      });

      const body = (await res.json().catch(() => ({}))) as {
        checkoutUrl?: string;
        error?: string;
      };

      if (!res.ok || !body.checkoutUrl) {
        setStatus('error');
        setError(body.error ?? 'No se pudo crear la reserva, por favor intenta de nuevo.');
        return;
      }

      // Redirigir a confirmación o pasarela de pago
      window.location.href = body.checkoutUrl;
    } catch (err: unknown) {
      console.error(err);
      setStatus('error');
      setError('Error de conexión al procesar la reserva.');
    }
  }

  const total = pricePerPerson * (people || 0);

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        marginTop: 24,
        padding: 24,
        background: '#fff',
        borderRadius: 20,
        border: '1px solid var(--surface-200)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 18, color: 'var(--brand-dark)' }}>
          Reserva tu viaje
        </h3>
        {referralCode && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--brand)',
              background: 'rgba(14, 124, 144, 0.08)',
              padding: '3px 8px',
              borderRadius: 6,
            }}
          >
            🏷️ Código de referido activo
          </span>
        )}
      </div>

      <label style={labelStyle} htmlFor="customer_name">
        Nombre Completo
      </label>
      <input
        id="customer_name"
        required
        placeholder="Tu nombre completo"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ ...inputStyle, marginBottom: 14 }}
      />

      <label style={labelStyle} htmlFor="customer_phone">
        Número de WhatsApp
      </label>
      <input
        id="customer_phone"
        required
        type="tel"
        placeholder="Ej. +57 300 123 4567"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        style={{ ...inputStyle, marginBottom: 14 }}
      />

      <label style={labelStyle} htmlFor="people_count">
        Número de Personas
      </label>
      <input
        id="people_count"
        required
        type="number"
        min={1}
        max={20}
        value={people}
        onChange={(e) => setPeople(Math.max(1, Number(e.target.value) || 1))}
        style={{ ...inputStyle, marginBottom: 18 }}
      />

      <div
        style={{
          background: '#f8fafc',
          padding: '14px 16px',
          borderRadius: 12,
          marginBottom: 18,
          border: '1px solid #e2e8f0',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>
          <span>Precio por persona:</span>
          <span>${pricePerPerson.toLocaleString('es-CO')} COP</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700, color: 'var(--brand-dark)' }}>
          <span>Total a pagar:</span>
          <span style={{ color: 'var(--brand)' }}>${total.toLocaleString('es-CO')} COP</span>
        </div>
      </div>

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
        disabled={status === 'sending'}
        type="submit"
        style={{
          background: 'var(--brand)',
          color: '#fff',
          border: 'none',
          padding: '14px 20px',
          borderRadius: 14,
          width: '100%',
          fontWeight: 700,
          fontSize: 15,
          cursor: status === 'sending' ? 'not-allowed' : 'pointer',
          opacity: status === 'sending' ? 0.7 : 1,
          transition: 'background 0.2s ease',
        }}
      >
        {status === 'sending' ? 'Procesando reserva…' : 'Confirmar Reserva'}
      </button>

      {!signedIn && (
        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted)', marginTop: 12, marginBottom: 0 }}>
          💡 ¿Tienes cuenta? Si inicias sesión, el viaje se guardará en tu perfil.
        </p>
      )}
    </form>
  );
}
