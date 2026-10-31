'use client';

import { useState, type FormEvent } from 'react';
import { supabase } from '@/lib/supabase';

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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus('sending');
    setError(null);

    // Si hay sesión, se manda el token para asociar la reserva a la cuenta
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const res = await fetch('/api/reservas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({ tourId, name, phone, people, ref: referralCode }),
    });
    const body = (await res.json().catch(() => ({}))) as { checkoutUrl?: string; error?: string };

    if (!res.ok || !body.checkoutUrl) {
      setStatus('error');
      setError(body.error ?? 'Algo salió mal, intenta de nuevo.');
      return;
    }
    // Checkout de Wompi (PSE, Nequi, tarjeta…). Al terminar vuelve a /reserva/resultado
    window.location.href = body.checkoutUrl;
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ marginTop: 24, padding: 20, background: 'var(--surface-200)', borderRadius: 18 }}
    >
      <h3 style={{ marginTop: 0 }}>Reservar</h3>

      <input
        required
        placeholder="Tu nombre"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={inputStyle}
      />
      <input
        required
        placeholder="Tu WhatsApp"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        style={inputStyle}
      />
      <input
        required
        type="number"
        min={1}
        max={20}
        value={people}
        onChange={(e) => setPeople(Number(e.target.value))}
        style={{ ...inputStyle, marginBottom: 12 }}
      />

      <p style={{ margin: '0 0 12px', fontWeight: 600 }}>
        Total: ${(pricePerPerson * (people || 0)).toLocaleString('es-CO')} COP
      </p>

      <button
        disabled={status === 'sending'}
        type="submit"
        style={{
          background: 'var(--brand)',
          color: '#fff',
          border: 'none',
          padding: '12px 20px',
          borderRadius: 14,
          width: '100%',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        {status === 'sending' ? 'Redirigiendo al pago…' : 'Pagar y reservar'}
      </button>

      {error && <p style={{ color: 'var(--accent)' }}>{error}</p>}
    </form>
  );
}

const inputStyle = {
  width: '100%',
  padding: 10,
  marginBottom: 8,
  borderRadius: 10,
  border: '1px solid #ddd',
  fontSize: 14,
} as const;
