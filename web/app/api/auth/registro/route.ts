import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import type { UserRole } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as {
      fullName?: string;
      email?: string;
      password?: string;
      role?: UserRole;
    } | null;

    const fullName = body?.fullName?.trim();
    const email = body?.email?.trim().toLowerCase();
    const password = body?.password;
    const role: UserRole = body?.role === 'seller' ? 'seller' : 'traveler';

    if (!fullName || !email || !password || password.length < 6) {
      return NextResponse.json(
        { error: 'Datos incompletos. La contraseña debe tener al menos 6 caracteres.' },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdmin();

    // 1. Crear el usuario en auth confirmando el correo automáticamente
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role,
      },
    });

    if (authError || !authData.user) {
      // Si ya existe, indicar mensaje amigable
      if (authError?.message?.includes('already registered') || authError?.message?.includes('unique')) {
        return NextResponse.json(
          { error: 'Ya existe una cuenta con este correo electrónico.' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: authError?.message ?? 'No se pudo crear el usuario.' },
        { status: 500 }
      );
    }

    const userId = authData.user.id;

    // 2. Generar código de referido único para vendedores (8 caracteres alfanuméricos)
    const referralCode =
      role === 'seller'
        ? Math.random().toString(36).substring(2, 10).toLowerCase()
        : Math.random().toString(36).substring(2, 10).toLowerCase();

    // 3. Asegurar la creación del perfil en la tabla profiles
    const { error: profileError } = await admin.from('profiles').upsert(
      {
        id: userId,
        full_name: fullName,
        role,
        referral_code: referralCode,
      },
      { onConflict: 'id' }
    );

    if (profileError) {
      console.error('[registro:profile]', profileError);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email,
        fullName,
        role,
      },
    });
  } catch (err: unknown) {
    console.error('[registro:error]', err);
    const message = err instanceof Error ? err.message : 'Error interno al registrar usuario.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
