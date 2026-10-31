import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Linking, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';
import type { Tour } from '../../lib/types';

export default function TourDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tour, setTour] = useState<Tour | null>(null);

  useEffect(() => {
    if (!id) return;
    supabase
      .from('tours')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => setTour(data as Tour));
  }, [id]);

  if (!tour) {
    return (
      <View style={styles.container}>
        <Text style={styles.muted}>Cargando…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.cover, { backgroundColor: tour.cover_color }]} />
      <Text style={styles.title}>{tour.title}</Text>
      <Text style={styles.muted}>
        {tour.location} · ★ {tour.rating}
      </Text>
      <Text style={styles.price}>
        ${tour.price_cop.toLocaleString('es-CO')} <Text style={styles.muted}>/ persona</Text>
      </Text>

      {tour.video_360_url && (
        <Pressable onPress={() => Linking.openURL(tour.video_360_url!)} style={styles.outlineBtn}>
          <Text style={{ color: '#1B4D3E', fontWeight: '600' }}>Ver tour en 360° / VR</Text>
        </Pressable>
      )}

      <Text style={styles.sectionTitle}>Qué incluye</Text>
      {tour.includes.map((item) => (
        <Text key={item} style={styles.includeItem}>
          ✓ {item}
        </Text>
      ))}

      {tour.description && (
        <>
          <Text style={styles.sectionTitle}>Sobre este tour</Text>
          <Text style={styles.muted}>{tour.description}</Text>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBF8F3', padding: 20 },
  cover: { height: 180, borderRadius: 16, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '600', color: '#1E2A24' },
  muted: { color: '#4A5A52', fontSize: 13, lineHeight: 19 },
  price: { fontSize: 20, fontWeight: '600', color: '#FF6B4A', marginVertical: 10 },
  outlineBtn: {
    borderWidth: 1.5,
    borderColor: '#1B4D3E',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: { fontWeight: '600', marginTop: 12, marginBottom: 6, color: '#1E2A24' },
  includeItem: { color: '#4A5A52', marginBottom: 4 },
});
