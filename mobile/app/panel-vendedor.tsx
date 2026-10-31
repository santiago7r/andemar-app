import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  Share,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import type { Profile, SellerCommission } from '../lib/types';

// Web donde se paga la reserva; el link lleva el código para registrar la comisión
const SITE_URL = process.env.EXPO_PUBLIC_SITE_URL?.replace(/\/$/, '');

export default function PanelVendedor() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [commissions, setCommissions] = useState<SellerCommission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/iniciar-sesion');
        return;
      }

      const [profileRes, commissionsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('seller_commissions').select('*').eq('seller_id', user.id),
      ]);

      if (profileRes.error || commissionsRes.error) {
        setError((profileRes.error ?? commissionsRes.error)!.message);
      }
      setProfile((profileRes.data as Profile | null) ?? null);
      setCommissions((commissionsRes.data as SellerCommission[]) ?? []);
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace('/');
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color="#0E7C90" style={{ marginTop: 20 }} />
      </View>
    );
  }

  const signOutButton = (
    <Pressable onPress={handleSignOut} style={styles.outlineBtn}>
      <Text style={{ color: '#0E7C90', fontWeight: '600' }}>Cerrar sesión</Text>
    </Pressable>
  );

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Mi cuenta</Text>
        <Text style={styles.muted}>
          {error ?? 'No encontramos tu perfil. Intenta cerrar sesión y volver a entrar.'}
        </Text>
        {signOutButton}
      </View>
    );
  }

  if (profile.role !== 'seller') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Hola, {profile.full_name}</Text>
        <Text style={styles.muted}>
          Tu cuenta es de viajero. El panel de comisiones es solo para vendedores.
        </Text>
        {signOutButton}
      </View>
    );
  }

  const totalCommission = commissions.reduce((sum, c) => sum + Number(c.commission_cop), 0);
  const totalBookings = commissions.reduce((sum, c) => sum + Number(c.bookings_confirmed), 0);

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      data={commissions}
      keyExtractor={(c) => c.tour_id}
      ListHeaderComponent={
        <>
          <Text style={styles.title}>Hola, {profile.full_name}</Text>

          <View style={styles.card}>
            <Text style={styles.muted}>Tu código de referido</Text>
            <Text style={styles.code}>{profile.referral_code}</Text>
            <Pressable
              onPress={() =>
                Share.share({
                  message: SITE_URL
                    ? `Reserva tu tour en Andemar: ${SITE_URL}/?ref=${profile.referral_code}`
                    : `Reserva tu tour en Andemar con mi código: ${profile.referral_code}`,
                })
              }
              style={styles.button}
            >
              <Text style={styles.buttonText}>Compartir link de referido</Text>
            </Pressable>
          </View>

          <View style={styles.statsRow}>
            <View style={[styles.card, styles.stat]}>
              <Text style={styles.muted}>Comisiones</Text>
              <Text style={styles.statValue}>${totalCommission.toLocaleString('es-CO')}</Text>
            </View>
            <View style={[styles.card, styles.stat]}>
              <Text style={styles.muted}>Reservas pagadas</Text>
              <Text style={styles.statValue}>{totalBookings}</Text>
            </View>
          </View>

          {error && <Text style={styles.error}>{error}</Text>}
          <Text style={styles.sectionTitle}>Por tour</Text>
          {commissions.length === 0 && (
            <Text style={styles.muted}>
              Aún no tienes reservas referidas. Comparte tu código para empezar a ganar.
            </Text>
          )}
        </>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{item.tour_title}</Text>
          <Text style={styles.muted}>
            {item.bookings_confirmed} pagadas · {item.commission_pct}% de comisión
          </Text>
          <Text style={styles.price}>${Number(item.commission_cop).toLocaleString('es-CO')}</Text>
        </View>
      )}
      ListFooterComponent={signOutButton}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBF8F3', padding: 20 },
  title: { fontSize: 22, fontWeight: '600', color: '#1E2A24', marginBottom: 12 },
  muted: { color: '#4A5A52', fontSize: 13, lineHeight: 19 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1E9D8',
    padding: 14,
    marginBottom: 12,
  },
  code: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1E2A24',
    letterSpacing: 2,
    marginVertical: 8,
  },
  statsRow: { flexDirection: 'row', gap: 12 },
  stat: { flex: 1 },
  statValue: { fontSize: 18, fontWeight: '600', color: '#1E2A24', marginTop: 4 },
  sectionTitle: { fontWeight: '600', marginTop: 8, marginBottom: 8, color: '#1E2A24' },
  cardTitle: { fontWeight: '600', color: '#1E2A24', fontSize: 14 },
  price: { color: '#FF6B4A', fontWeight: '600', marginTop: 6 },
  error: { color: '#C0392B', marginBottom: 8 },
  button: {
    backgroundColor: '#0E7C90',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: { color: '#FBF8F3', fontWeight: '600' },
  outlineBtn: {
    borderWidth: 1.5,
    borderColor: '#0E7C90',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    marginTop: 16,
  },
});
