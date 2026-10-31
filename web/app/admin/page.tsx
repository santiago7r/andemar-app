'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Tour, TourCategory, UserRole } from '@/lib/types';
import { buttonStyle, cardStyle, inputStyle, labelStyle, outlineButtonStyle } from '@/components/ui';

interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  referralCode: string;
  isAdmin: boolean;
  isActive: boolean;
  createdAt: string;
}

type TourForm = Omit<Tour, 'id' | 'created_at' | 'includes' | 'video_360_url' | 'description'> & {
  includes: string;
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

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'users' | 'tours'>('users');
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Estados de Usuarios
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [filterRole, setFilterRole] = useState<'all' | 'traveler' | 'seller'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [userActionMessage, setUserActionMessage] = useState<string | null>(null);

  // Estados de Tours
  const [tours, setTours] = useState<Tour[]>([]);
  const [editingTourId, setEditingTourId] = useState<string | null>(null);
  const [form, setForm] = useState<TourForm>(EMPTY_FORM);
  const [savingTour, setSavingTour] = useState(false);
  const [tourMessage, setTourMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function loadUsers() {
    setLoadingUsers(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const res = await fetch('/api/admin/users', {
        headers: {
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.users) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Error cargando usuarios:', err);
    }
    setLoadingUsers(false);
  }

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

      setCurrentUserId(user.id);

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .maybeSingle();

      const isAdmin = Boolean(profile?.is_admin);
      setAllowed(isAdmin);

      if (isAdmin) {
        loadUsers();
        loadTours();
      }
    }
    init();
  }, [router]);

  // Acciones sobre usuarios
  async function updateUser(userId: string, updates: { fullName?: string; role?: UserRole; isActive?: boolean }) {
    setUserActionMessage(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...updates }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        setUserActionMessage(`Error: ${data.error ?? 'No se pudo actualizar'}`);
        return;
      }

      setUserActionMessage('✓ Usuario actualizado correctamente.');
      setEditingUserId(null);
      loadUsers();
      setTimeout(() => setUserActionMessage(null), 3500);
    } catch (err) {
      console.error(err);
      setUserActionMessage('Error de conexión al actualizar usuario.');
    }
  }

  // Acciones sobre tours
  function setTourField<K extends keyof TourForm>(key: K, value: TourForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function startEditTour(tour: Tour | null) {
    setEditingTourId(tour?.id ?? null);
    setForm(tour ? toForm(tour) : EMPTY_FORM);
    setTourMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleTourSubmit(e: FormEvent) {
    e.preventDefault();
    setSavingTour(true);
    setTourMessage(null);

    const row = {
      ...form,
      slug: slugify(form.slug || form.title),
      includes: form.includes.split('\n').map((s) => s.trim()).filter(Boolean),
      video_360_url: form.video_360_url.trim() || null,
      description: form.description.trim() || null,
    };

    const { error } = editingTourId
      ? await supabase.from('tours').update(row).eq('id', editingTourId)
      : await supabase.from('tours').insert(row);

    setSavingTour(false);
    if (error) {
      setTourMessage({
        ok: false,
        text: error.code === '23505' ? 'Ya existe un tour con ese slug.' : error.message,
      });
      return;
    }
    setTourMessage({ ok: true, text: editingTourId ? 'Tour actualizado.' : 'Tour creado.' });
    if (!editingTourId) setForm(EMPTY_FORM);
    loadTours();
  }

  async function toggleTourActive(tour: Tour) {
    await supabase.from('tours').update({ active: !tour.active }).eq('id', tour.id);
    loadTours();
  }

  const wrap = (children: React.ReactNode) => (
    <main style={{ maxWidth: 1040, margin: '0 auto', padding: '32px 24px' }}>{children}</main>
  );

  if (allowed === null) return wrap(<p style={{ color: 'var(--muted)' }}>Cargando panel de propietario…</p>);

  if (!allowed) {
    return wrap(
      <div style={{ maxWidth: 640, margin: '40px auto', textAlign: 'center' }}>
        <h1 style={{ color: 'var(--brand-dark)' }}>Acceso de Administrador Requerido</h1>
        <p style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
          Tu cuenta actual no tiene privilegios de administrador.
        </p>
        <div style={{ ...cardStyle, background: '#f8fafc', padding: 20, textAlign: 'left', marginTop: 24, fontSize: 13 }}>
          <strong style={{ display: 'block', marginBottom: 8, color: 'var(--brand-dark)' }}>
            ¿Eres el dueño del proyecto? Concede el rol de admin en Supabase:
          </strong>
          <p style={{ color: 'var(--muted)', margin: '0 0 10px' }}>
            Ve al <strong>SQL Editor</strong> en tu dashboard de Supabase y corre:
          </p>
          <pre style={{ background: '#1e293b', color: '#f8fafc', padding: '12px', borderRadius: 8, overflowX: 'auto' }}>
            {`UPDATE profiles SET is_admin = true WHERE id = '${currentUserId ?? 'TU_USER_ID'}';`}
          </pre>
        </div>
        <div style={{ marginTop: 24 }}>
          <Link href="/" style={{ color: 'var(--brand)', fontWeight: 600 }}>
            ← Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  // Filtrado de usuarios
  const filteredUsers = users.filter((u) => {
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.referralCode?.toLowerCase().includes(q);
    return matchesRole && matchesSearch;
  });

  const totalTravelers = users.filter((u) => u.role === 'traveler').length;
  const totalSellers = users.filter((u) => u.role === 'seller').length;
  const totalActive = users.filter((u) => u.isActive).length;

  return wrap(
    <>
      <header style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ color: 'var(--brand-dark)', margin: '0 0 4px', fontSize: 28 }}>
            Panel de Propietario (Admin)
          </h1>
          <p style={{ color: 'var(--muted)', margin: 0, fontSize: 14 }}>
            Control central de usuarios registrados, comisiones y catálogo de tours
          </p>
        </div>

        {/* Selector de Pestaña Principal */}
        <div style={{ display: 'flex', gap: 8, background: '#e2e8f0', padding: 4, borderRadius: 12 }}>
          <button
            onClick={() => setActiveTab('users')}
            style={{
              border: 'none',
              background: activeTab === 'users' ? '#fff' : 'transparent',
              color: activeTab === 'users' ? 'var(--brand-dark)' : '#64748b',
              fontWeight: 700,
              fontSize: 14,
              padding: '8px 16px',
              borderRadius: 8,
              cursor: 'pointer',
              boxShadow: activeTab === 'users' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            👥 Usuarios ({users.length})
          </button>

          <button
            onClick={() => setActiveTab('tours')}
            style={{
              border: 'none',
              background: activeTab === 'tours' ? '#fff' : 'transparent',
              color: activeTab === 'tours' ? 'var(--brand-dark)' : '#64748b',
              fontWeight: 700,
              fontSize: 14,
              padding: '8px 16px',
              borderRadius: 8,
              cursor: 'pointer',
              boxShadow: activeTab === 'tours' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            🏔️ Catálogo Tours ({tours.length})
          </button>
        </div>
      </header>

      {/* ============================================================ */}
      {/* PESTAÑA 1: GESTIÓN DE USUARIOS Y PERFILES                     */}
      {/* ============================================================ */}
      {activeTab === 'users' && (
        <section>
          {/* Tarjetas Resumen */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
            <div style={{ ...cardStyle, padding: 18 }}>
              <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Total Registrados</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--brand-dark)', marginTop: 4 }}>
                {users.length}
              </div>
              <div style={{ fontSize: 12, color: '#16a34a', marginTop: 4 }}>
                {totalActive} activos · {users.length - totalActive} inactivos
              </div>
            </div>

            <div style={{ ...cardStyle, padding: 18 }}>
              <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>🎒 Viajeros Registrados</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#0284c7', marginTop: 4 }}>
                {totalTravelers}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Pueden reservar tours</div>
            </div>

            <div style={{ ...cardStyle, padding: 18 }}>
              <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>💼 Vendedores / Embajadores</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#b45309', marginTop: 4 }}>
                {totalSellers}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Tienen código de referido</div>
            </div>
          </div>

          {/* Barra de Filtros y Búsqueda */}
          <div style={{ ...cardStyle, padding: 16, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>Filtrar por rol:</span>
              {(['all', 'traveler', 'seller'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setFilterRole(r)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: '1px solid var(--surface-200)',
                    background: filterRole === r ? 'var(--brand)' : '#fff',
                    color: filterRole === r ? '#fff' : 'var(--brand-dark)',
                  }}
                >
                  {r === 'all' ? 'Todos' : r === 'traveler' ? 'Viajeros' : 'Vendedores'}
                </button>
              ))}
            </div>

            <input
              placeholder="Buscar por nombre, correo o código…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ ...inputStyle, width: 280, marginBottom: 0, padding: '8px 12px', fontSize: 13 }}
            />
          </div>

          {userActionMessage && (
            <div style={{ padding: '10px 16px', borderRadius: 10, background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', marginBottom: 16, fontSize: 14 }}>
              {userActionMessage}
            </div>
          )}

          {/* Listado de Usuarios */}
          {loadingUsers ? (
            <p style={{ color: 'var(--muted)' }}>Cargando usuarios…</p>
          ) : filteredUsers.length === 0 ? (
            <div style={{ ...cardStyle, padding: 32, textAlign: 'center' }}>
              <p style={{ color: 'var(--muted)', margin: 0 }}>No se encontraron usuarios con ese criterio.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredUsers.map((u) => {
                const isEditing = editingUserId === u.id;
                const formattedDate = new Date(u.createdAt).toLocaleDateString('es-CO', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                });

                return (
                  <div
                    key={u.id}
                    style={{
                      ...cardStyle,
                      padding: 18,
                      opacity: u.isActive ? 1 : 0.6,
                      background: u.isActive ? '#fff' : '#f8fafc',
                      borderLeft: u.role === 'seller' ? '4px solid #b45309' : '4px solid #0284c7',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 16,
                    }}
                  >
                    {/* Información Principal */}
                    <div style={{ flex: '1 1 300px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        {isEditing ? (
                          <input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            style={{ ...inputStyle, width: 220, marginBottom: 0, padding: '4px 8px' }}
                          />
                        ) : (
                          <strong style={{ fontSize: 16, color: 'var(--brand-dark)' }}>{u.fullName}</strong>
                        )}

                        {/* Badge de Rol */}
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: 12,
                            background: u.role === 'seller' ? '#fef3c7' : '#e0f2fe',
                            color: u.role === 'seller' ? '#92400e' : '#0369a1',
                          }}
                        >
                          {u.role === 'seller' ? '💼 Vendedor' : '🎒 Viajero'}
                        </span>

                        {/* Badge de Estado */}
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: 12,
                            background: u.isActive ? '#dcfce7' : '#fee2e2',
                            color: u.isActive ? '#15803d' : '#b91c1c',
                          }}
                        >
                          {u.isActive ? 'Activo' : 'Inactivo'}
                        </span>

                        {u.isAdmin && (
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 12, background: '#f1f5f9', color: '#475569' }}>
                            Admin
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
                        ✉️ {u.email} · Registrado el {formattedDate}
                      </div>

                      {u.role === 'seller' && u.referralCode && (
                        <div style={{ fontSize: 12, color: '#b45309', marginTop: 4 }}>
                          🏷️ Código de referido: <strong>{u.referralCode}</strong>
                        </div>
                      )}
                    </div>

                    {/* Acciones de Edición y Control */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => updateUser(u.id, { fullName: editName })}
                            style={{ ...buttonStyle, padding: '6px 12px', fontSize: 12 }}
                          >
                            Guardar
                          </button>
                          <button
                            onClick={() => setEditingUserId(null)}
                            style={{ ...outlineButtonStyle, padding: '6px 12px', fontSize: 12 }}
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingUserId(u.id);
                            setEditName(u.fullName);
                          }}
                          style={{ ...outlineButtonStyle, padding: '6px 12px', fontSize: 12 }}
                        >
                          Editar nombre
                        </button>
                      )}

                      {/* Cambiar Rol */}
                      <button
                        onClick={() => updateUser(u.id, { role: u.role === 'seller' ? 'traveler' : 'seller' })}
                        title="Cambiar entre Viajero y Vendedor"
                        style={{
                          ...outlineButtonStyle,
                          padding: '6px 12px',
                          fontSize: 12,
                          color: u.role === 'seller' ? '#0369a1' : '#b45309',
                          borderColor: u.role === 'seller' ? '#0369a1' : '#b45309',
                        }}
                      >
                        {u.role === 'seller' ? 'Convertir a Viajero' : 'Convertir a Vendedor'}
                      </button>

                      {/* Activar / Desactivar */}
                      <button
                        onClick={() => updateUser(u.id, { isActive: !u.isActive })}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 14,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          border: 'none',
                          background: u.isActive ? '#fee2e2' : '#dcfce7',
                          color: u.isActive ? '#b91c1c' : '#15803d',
                        }}
                      >
                        {u.isActive ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ============================================================ */}
      {/* PESTAÑA 2: CATÁLOGO DE TOURS (CREAR Y EDITAR)                 */}
      {/* ============================================================ */}
      {activeTab === 'tours' && (
        <section>
          <form onSubmit={handleTourSubmit} style={{ ...cardStyle, marginBottom: 32 }}>
            <h3 style={{ marginTop: 0 }}>{editingTourId ? 'Editar tour' : 'Nuevo tour'}</h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', columnGap: 16 }}>
              <div>
                <label style={labelStyle}>Título</label>
                <input required value={form.title} onChange={(e) => setTourField('title', e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Slug (URL) — vacío = se genera del título</label>
                <input value={form.slug} onChange={(e) => setTourField('slug', e.target.value)} placeholder={slugify(form.title)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Categoría</label>
                <select value={form.category} onChange={(e) => setTourField('category', e.target.value as TourCategory)} style={inputStyle}>
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Ubicación</label>
                <input required value={form.location} onChange={(e) => setTourField('location', e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Precio por persona (COP)</label>
                <input required type="number" min={1000} step={1000} value={form.price_cop} onChange={(e) => setTourField('price_cop', Number(e.target.value))} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Comisión vendedor (%)</label>
                <input required type="number" min={0} max={99} step={0.5} value={form.commission_pct} onChange={(e) => setTourField('commission_pct', Number(e.target.value))} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Calificación</label>
                <input required type="number" min={0} max={5} step={0.1} value={form.rating} onChange={(e) => setTourField('rating', Number(e.target.value))} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Color de portada</label>
                <input type="color" value={form.cover_color} onChange={(e) => setTourField('cover_color', e.target.value)} style={{ ...inputStyle, height: 42, padding: 4 }} />
              </div>
            </div>

            <label style={labelStyle}>Link video 360° (opcional)</label>
            <input type="url" value={form.video_360_url} onChange={(e) => setTourField('video_360_url', e.target.value)} style={inputStyle} />

            <label style={labelStyle}>Qué incluye (uno por línea)</label>
            <textarea rows={4} value={form.includes} onChange={(e) => setTourField('includes', e.target.value)} style={inputStyle} />

            <label style={labelStyle}>Descripción</label>
            <textarea rows={4} value={form.description} onChange={(e) => setTourField('description', e.target.value)} style={inputStyle} />

            <label style={{ ...labelStyle, display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
              <input type="checkbox" checked={form.active} onChange={(e) => setTourField('active', e.target.checked)} />
              Visible en el catálogo
            </label>

            {tourMessage && (
              <p style={{ color: tourMessage.ok ? 'var(--brand)' : 'var(--accent)' }}>{tourMessage.text}</p>
            )}

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button type="submit" disabled={savingTour} style={buttonStyle}>
                {savingTour ? 'Guardando…' : editingTourId ? 'Guardar cambios' : 'Crear tour'}
              </button>
              {editingTourId && (
                <button type="button" onClick={() => startEditTour(null)} style={outlineButtonStyle}>
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
              <button onClick={() => startEditTour(tour)} style={outlineButtonStyle}>Editar</button>
              <button onClick={() => toggleTourActive(tour)} style={outlineButtonStyle}>
                {tour.active ? 'Ocultar' : 'Mostrar'}
              </button>
            </section>
          ))}
        </section>
      )}
    </>
  );
}
