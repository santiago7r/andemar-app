import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { buildCheckoutUrl } from '@/lib/wompi';

// Crea la reserva (en 'pending') con el precio calculado aquí en el servidor
// y devuelve la URL del checkout de Wompi.
export async function POST(request: Request) {
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
    .select('id, price_cop')
    .eq('id', body.tourId)
    .eq('active', true)
    .maybeSingle();
  if (!tour) {
    return NextResponse.json({ error: 'Tour no disponible.' }, { status: 404 });
  }

  let referrerId: string | null = null;
  if (body.ref) {
    const { data } = await supabase.rpc('seller_id_for_referral_code', { code: body.ref });
    referrerId = (data as string | null) ?? null;
  }

  // Si el viajero tiene sesión, la reserva queda asociada a su cuenta
  let travelerId: string | null = null;
  const token = request.headers.get('authorization')?.replace(/^Bearer /, '');
  if (token) {
    const { data } = await supabase.auth.getUser(token);
    travelerId = data.user?.id ?? null;
  }

  const amountCop = tour.price_cop * people;
  const { data: booking, error } = await supabase
    .from('bookings')
    .insert({
      tour_id: tour.id,
      traveler_id: travelerId,
      referrer_id: referrerId,
      customer_name: name,
      customer_phone: phone,
      people_count: people,
      amount_cop: amountCop,
    })
    .select('id')
    .single();

  if (error || !booking) {
    console.error('[reservas]', error);
    return NextResponse.json({ error: 'No se pudo crear la reserva.' }, { status: 500 });
  }

  const redirectUrl = `${new URL(request.url).origin}/reserva/resultado`;
  return NextResponse.json({ checkoutUrl: buildCheckoutUrl(booking.id, amountCop, redirectUrl) });
}
