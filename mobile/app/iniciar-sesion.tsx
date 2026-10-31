import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function IniciarSesion() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    if (!email.trim() || !password) {
      setError('Ingresa tu correo y contraseña.');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error || !data.user) {
      setLoading(false);
      setError(error?.message ?? 'No se pudo iniciar sesión.');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .maybeSingle();
    setLoading(false);

    router.replace(profile?.role === 'seller' ? '/panel-vendedor' : '/');
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>Inicia sesión</Text>
      <Text style={[styles.muted, { marginBottom: 8 }]}>Bienvenido de vuelta a Andemar.</Text>

      <Text style={styles.label}>Correo</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        placeholder="tu@correo.com"
        placeholderTextColor="#9AA59F"
      />

      <Text style={styles.label}>Contraseña</Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        secureTextEntry
        autoComplete="password"
        placeholder="Tu contraseña"
        placeholderTextColor="#9AA59F"
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable onPress={handleSubmit} disabled={loading} style={styles.button}>
        {loading ? (
          <ActivityIndicator color="#FBF8F3" />
        ) : (
          <Text style={styles.buttonText}>Entrar</Text>
        )}
      </Pressable>

      <View style={{ marginTop: 16 }}>
        <Pressable onPress={() => router.replace('/registro')}>
          <Text style={styles.link}>¿No tienes cuenta? Regístrate</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBF8F3', padding: 20 },
  title: { fontSize: 22, fontWeight: '600', color: '#1E2A24', marginBottom: 6 },
  muted: { color: '#4A5A52', fontSize: 13, lineHeight: 19 },
  label: { color: '#1E2A24', fontWeight: '600', marginTop: 14, marginBottom: 6 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F1E9D8',
    borderRadius: 12,
    padding: 12,
    color: '#1E2A24',
  },
  error: { color: '#C0392B', marginTop: 12 },
  button: {
    backgroundColor: '#0E7C90',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: { color: '#FBF8F3', fontWeight: '600' },
  link: { color: '#0E7C90', fontWeight: '600', textAlign: 'center' },
});
