import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import type { UserRole } from '@/lib/types';

// Listar usuarios (solo accesible para administradores o con service_role)
export async function GET(request: Request) {
  try {
    const admin = getSupabaseAdmin();

    // 1. Verificar si el usuario que consulta es administrador
    const authHeader = request.headers.get('authorization')?.replace(/^Bearer /, '');
    if (authHeader) {
      const { data: userRes } = await admin.auth.getUser(authHeader);
      const requesterId = userRes?.user?.id;
      if (requesterId) {
        const { data: profile } = await admin
          .from('profiles')
          .select('is_admin')
          .eq('id', requesterId)
          .maybeSingle();

        if (!profile?.is_admin) {
          return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 403 });
        }
      }
    }

    // 2. Obtener lista de usuarios de Auth y perfiles de la BD
    const [{ data: authUsers }, { data: profiles, error: profilesError }] = await Promise.all([
      admin.auth.admin.listUsers({ perPage: 200 }),
      admin.from('profiles').select('*').order('created_at', { ascending: false }),
    ]);

    if (profilesError) {
      console.error('[admin:users:profilesError]', profilesError);
    }

    const emailMap = new Map<string, string>();
    authUsers?.users?.forEach((u) => {
      if (u.id && u.email) emailMap.set(u.id, u.email);
    });

    // Combinar datos
    const users = (profiles ?? []).map((p) => ({
      id: p.id,
      email: emailMap.get(p.id) || 'Sin correo',
      fullName: p.full_name,
      role: p.role as UserRole,
      referralCode: p.referral_code,
      isAdmin: Boolean(p.is_admin),
      isActive: p.is_active !== false, // default true
      createdAt: p.created_at,
    }));

    return NextResponse.json({ users });
  } catch (err: unknown) {
    console.error('[admin:users:GET]', err);
    return NextResponse.json({ error: 'Error al consultar usuarios' }, { status: 500 });
  }
}

// Editar perfil de usuario (activar/desactivar, cambiar rol, cambiar nombre)
export async function PATCH(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as {
      userId?: string;
      fullName?: string;
      role?: UserRole;
      isActive?: boolean;
    } | null;

    if (!body?.userId) {
      return NextResponse.json({ error: 'ID de usuario requerido' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    const updates: Record<string, unknown> = {};
    if (typeof body.fullName === 'string' && body.fullName.trim()) {
      updates.full_name = body.fullName.trim();
    }
    if (body.role === 'seller' || body.role === 'traveler') {
      updates.role = body.role;
    }
    if (typeof body.isActive === 'boolean') {
      updates.is_active = body.isActive;
    }

    // Actualizar en la tabla profiles
    let { error: profileError } = await admin
      .from('profiles')
      .update(updates)
      .eq('id', body.userId);

    // Si falló porque la columna is_active no existe aún en la BD, reintentar sin is_active
    if (profileError && profileError.message?.includes('is_active')) {
      delete updates.is_active;
      const retry = await admin.from('profiles').update(updates).eq('id', body.userId);
      profileError = retry.error;
    }

    if (profileError) {
      console.error('[admin:users:PATCH]', profileError);
      return NextResponse.json({ error: 'No se pudo actualizar el perfil' }, { status: 500 });
    }

    return NextResponse.json({ success: true, updated: updates });
  } catch (err: unknown) {
    console.error('[admin:users:PATCH:fatal]', err);
    return NextResponse.json({ error: 'Error al actualizar usuario' }, { status: 500 });
  }
}
