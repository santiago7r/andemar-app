'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Tour, TourCategory } from '@/lib/types';
import { buttonStyle, cardStyle, inputStyle, labelStyle, outlineButtonStyle } from '@/components/ui';

type TourForm = Omit<Tour, 'id' | 'created_at' | 'includes' | 'video_360_url' | 'description'> & {
  includes: string; // un ítem por línea
  video_360_url: string;
  description: string;
};

const EMPTY_FORM: TourForm = {
  slug: '',
  title: '',
  category: 'playa',
  location: '',
  price_cop: 0,
  rating: 5,
  cover_color: '#0E7C90',
  video_360_url: '',
  includes: '',
  description: '',
  commission_pct: 10,
  active: true,
};

const CATEGORIES: { value: TourCategory; label: string }[] = [
  { value: 'playa', label: 'Playa' },
  { value: 'isla', label: 'Isla' },
  { value: 'montana', label: 'Montaña' },
];

function slugify(text: string) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function toForm({ id: _id, created_at: _createdAt, ...tour }: Tour): TourForm {
  return {
    ...tour,
    includes: tour.includes.join('\n'),
    video_360_url: tour.video_360_url ?? '',
    description: tour.description ?? '',
  };
}

// Crear/editar tours sin tocar SQL. Los permisos los controla RLS
// (supabase/fase2.sql): solo perfiles con is_admin = true pueden escribir.
export default function AdminPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [tours, setTours] = useState<Tour[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TourForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function loadTours() {
    const { data } = await supabase.from('tours').select('*').order('created_at', { ascending: false });
    setTours((data as Tour[]) ?? []);
  }

  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/iniciar-sesion');
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .maybeSingle();
      setAllowed(!!profile?.is_admin);
      if (profile?.is_admin) loadTours();
    }
    init();
  }, [router]);

  function set<K extends keyof TourForm>(key: K, value: TourForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function startEdit(tour: Tour | null) {
    setEditingId(tour?.id ?? null);
    setForm(tour ? toForm(tour) : EMPTY_FORM);
    setMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const row = {
      ...form,
      slug: slugify(form.slug || form.title),
      includes: form.includes.split('\n').map((s) => s.trim()).filter(Boolean),
      video_360_url: form.video_360_url.trim() || null,
      description: form.description.trim() || null,
    };

    const { error } = editingId
      ? await supabase.from('tours').update(row).eq('id', editingId)
      : await supabase.from('tours').insert(row);

    setSaving(false);
    if (error) {
      setMessage({
        ok: false,
        text: error.code === '23505' ? 'Ya existe un tour con ese slug.' : error.message,
      });
      return;
    }
    setMessage({ ok: true, text: editingId ? 'Tour actualizado.' : 'Tour creado.' });
    if (!editingId) setForm(EMPTY_FORM);
    loadTours();
  }

  async function toggleActive(tour: Tour) {
    await supabase.from('tours').update({ active: !tour.active }).eq('id', tour.id);
    loadTours();
  }

  const wrap = (children: React.ReactNode) => (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }}>{children}</main>
  );

  if (allowed === null) return wrap(<p style={{ color: 'var(--muted)' }}>Cargando…</p>);
  if (!allowed) {
    return wrap(
      <>
        <h1 style={{ color: 'var(--brand-dark)' }}>Sin acceso</h1>
        <p style={{ color: 'var(--muted)' }}>Esta sección es solo para administradores.</p>
      </>
    );
  }

  return wrap(
    <>
      <h1 style={{ color: 'var(--brand-dark)' }}>Administrar tours</h1>

      <form onSubmit={handleSubmit} style={{ ...cardStyle, marginBottom: 32 }}>
        <h3 style={{ marginTop: 0 }}>{editingId ? 'Editar tour' : 'Nuevo tour'}</h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', columnGap: 16 }}>
          <div>
            <label style={labelStyle}>Título</label>
            <input required value={form.title} onChange={(e) => set('title', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Slug (URL) — vacío = se genera del título</label>
            <input value={form.slug} onChange={(e) => set('slug', e.target.value)} placeholder={slugify(form.title)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Categoría</label>
            <select value={form.category} onChange={(e) => set('category', e.target.value as TourCategory)} style={inputStyle}>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Ubicación</label>
            <input required value={form.location} onChange={(e) => set('location', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Precio por persona (COP)</label>
            <input required type="number" min={1000} step={1000} value={form.price_cop} onChange={(e) => set('price_cop', Number(e.target.value))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Comisión vendedor (%)</label>
            <input required type="number" min={0} max={99} step={0.5} value={form.commission_pct} onChange={(e) => set('commission_pct', Number(e.target.value))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Calificación</label>
            <input required type="number" min={0} max={5} step={0.1} value={form.rating} onChange={(e) => set('rating', Number(e.target.value))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Color de portada</label>
            <input type="color" value={form.cover_color} onChange={(e) => set('cover_color', e.target.value)} style={{ ...inputStyle, height: 42, padding: 4 }} />
          </div>
        </div>

        <label style={labelStyle}>Link video 360° (opcional)</label>
        <input type="url" value={form.video_360_url} onChange={(e) => set('video_360_url', e.target.value)} style={inputStyle} />

        <label style={labelStyle}>Qué incluye (uno por línea)</label>
        <textarea rows={4} value={form.includes} onChange={(e) => set('includes', e.target.value)} style={inputStyle} />

        <label style={labelStyle}>Descripción</label>
        <textarea rows={4} value={form.description} onChange={(e) => set('description', e.target.value)} style={inputStyle} />

        <label style={{ ...labelStyle, display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
          <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} />
          Visible en el catálogo
        </label>

        {message && (
          <p style={{ color: message.ok ? 'var(--brand)' : 'var(--accent)' }}>{message.text}</p>
        )}

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button type="submit" disabled={saving} style={buttonStyle}>
            {saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Crear tour'}
          </button>
          {editingId && (
            <button type="button" onClick={() => startEdit(null)} style={outlineButtonStyle}>
              Cancelar edición
            </button>
          )}
        </div>
      </form>

      <h3>Tours ({tours.length})</h3>
      {tours.map((tour) => (
        <section
          key={tour.id}
          style={{ ...cardStyle, marginBottom: 12, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', opacity: tour.active ? 1 : 0.6 }}
        >
          <div style={{ width: 48, height: 48, borderRadius: 12, background: tour.cover_color, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontWeight: 600 }}>
              {tour.title} {!tour.active && <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(oculto)</span>}
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>
              {tour.location} · ${tour.price_cop.toLocaleString('es-CO')} · {tour.commission_pct}% comisión
            </div>
          </div>
          <button onClick={() => startEdit(tour)} style={outlineButtonStyle}>Editar</button>
          <button onClick={() => toggleActive(tour)} style={outlineButtonStyle}>
            {tour.active ? 'Ocultar' : 'Mostrar'}
          </button>
        </section>
      ))}
    </>
  );
}
