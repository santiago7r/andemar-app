import { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import type { Tour } from '../lib/types';

export default function Home() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(!!session);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    supabase
      .from('tours')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setTours((data as Tour[]) ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => router.push(signedIn ? '/panel-vendedor' : '/iniciar-sesion')}
        style={styles.accountBtn}
      >
        <Text style={styles.accountBtnText}>{signedIn ? 'Mi cuenta' : 'Iniciar sesión'}</Text>
      </Pressable>

      <Text style={styles.title}>¿A dónde vamos hoy?</Text>

      {loading && <ActivityIndicator color="#0E7C90" style={{ marginTop: 20 }} />}

      {!loading && tours.length === 0 && (
        <Text style={styles.muted}>
          Aún no hay tours cargados. Corre supabase/seed.sql en tu proyecto de Supabase.
        </Text>
      )}

      <FlatList
        data={tours}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/tour/${item.id}`)} style={styles.card}>
            <View style={[styles.cover, { backgroundColor: item.cover_color }]} />
            <View style={{ padding: 12 }}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.muted}>{item.location}</Text>
              <Text style={styles.price}>${item.price_cop.toLocaleString('es-CO')}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBF8F3', padding: 20 },
  title: { fontSize: 22, fontWeight: '600', color: '#1E2A24', marginBottom: 12 },
  muted: { color: '#4A5A52', fontSize: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1E9D8',
  },
  cover: { height: 100 },
  cardTitle: { fontWeight: '600', color: '#1E2A24', fontSize: 14 },
  price: { color: '#FF6B4A', fontWeight: '600', marginTop: 6 },
  accountBtn: {
    alignSelf: 'flex-end',
    backgroundColor: '#0E7C90',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  accountBtnText: { color: '#FBF8F3', fontWeight: '600' },
});
