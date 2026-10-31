import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { buildCheckoutUrl } from '@/lib/wompi';

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as {
      tourId?: string;
      name?: string;
      phone?: string;
      people?: number;
      ref?: string | null;
    } | null;

    const name = body?.name?.trim();
    const phone = body?.phone?.trim();
    const people = Number(body?.people);
    if (!body?.tourId || !name || !phone || !Number.isInteger(people) || people < 1 || people > 20) {
      return NextResponse.json({ error: 'Datos de reserva inválidos.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: tour } = await supabase
      .from('tours')
      .select('id, title, price_cop, commission_pct')
      .eq('id', body.tourId)
      .eq('active', true)
      .maybeSingle();

    if (!tour) {
      return NextResponse.json({ error: 'Tour no disponible o inactivo.' }, { status: 404 });
    }

    // Buscar al vendedor por código de referido (si viene ?ref=CODIGO)
    let referrerId: string | null = null;
    if (body.ref) {
      const { data: sellerProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('referral_code', body.ref)
        .eq('role', 'seller')
        .maybeSingle();

      referrerId = sellerProfile?.id ?? null;
    }

    // Si el viajero tiene sesión activa, asociar la reserva a su cuenta
    let travelerId: string | null = null;
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace(/^Bearer /, '');
    if (token) {
      const { data } = await supabase.auth.getUser(token);
      travelerId = data.user?.id ?? null;
    }

    const amountCop = tour.price_cop * people;

    // Verificar si Wompi está configurado
    const integritySecret = process.env.WOMPI_INTEGRITY_SECRET;
    const hasWompi =
      Boolean(process.env.WOMPI_PUBLIC_KEY) &&
      Boolean(integritySecret) &&
      Boolean(integritySecret && !integritySecret.includes('xxx'));

    // Si no hay Wompi configurado, la reserva se marca como 'confirmed' (modo simple/demo)
    // para que tanto el viajero como el vendedor la vean reflejada de inmediato.
    const initialStatus = hasWompi ? 'pending' : 'confirmed';

    const insertPayload: Record<string, unknown> = {
      tour_id: tour.id,
      traveler_id: travelerId,
      referrer_id: referrerId,
      customer_name: name,
      customer_phone: phone,
      people_count: people,
      status: initialStatus,
    };

    // Intentar primero con amount_cop (si se corrió setup_completo.sql)
    let { data: booking, error } = await supabase
      .from('bookings')
      .insert({ ...insertPayload, amount_cop: amountCop })
      .select('id')
      .single();

    // Si la columna amount_cop aún no existe en Supabase, insertar sin ella
    if (error && (error.message?.includes('amount_cop') || error.code === '42703')) {
      const retry = await supabase
        .from('bookings')
        .insert(insertPayload)
        .select('id')
        .single();
      booking = retry.data;
      error = retry.error;
    }

    if (error || !booking) {
      console.error('[reservas:error]', error);
      return NextResponse.json({ error: 'No se pudo crear la reserva en la base de datos.' }, { status: 500 });
    }

    const origin = new URL(request.url).origin;
    const redirectUrl = `${origin}/reserva/resultado?reserva_id=${booking.id}`;

    if (hasWompi) {
      try {
        const checkoutUrl = buildCheckoutUrl(booking.id, amountCop, redirectUrl);
        return NextResponse.json({ checkoutUrl, bookingId: booking.id });
      } catch (e) {
        console.warn('[reservas] Error generando Wompi checkout, redirigiendo a confirmación directa:', e);
      }
    }

    // Modo simple directo
    return NextResponse.json({
      checkoutUrl: redirectUrl,
      bookingId: booking.id,
      directConfirmed: true,
    });
  } catch (err: unknown) {
    console.error('[reservas:fatal]', err);
    const message = err instanceof Error ? err.message : 'Error interno al procesar la reserva.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
