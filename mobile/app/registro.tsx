import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import type { UserRole } from '../lib/types';

const ROLES: { value: UserRole; title: string; description: string }[] = [
  {
    value: 'traveler',
    title: 'Soy viajero',
    description: 'Quiero reservar tours y guardar mis viajes.',
  },
  {
    value: 'seller',
    title: 'Soy vendedor',
    description: 'Quiero recomendar tours y ganar comisiones con mi código.',
  },
];

export default function Registro() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>('traveler');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState(false);

  async function handleSubmit() {
    setError(null);
    if (!fullName.trim() || !email.trim() || password.length < 6) {
      setError('Completa todos los campos. La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    // El trigger de la base de datos crea el perfil a partir de options.data
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim(), role } },
    });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    // Sin sesión = el proyecto exige confirmar el correo antes de entrar
    if (!data.session) {
      setPendingConfirmation(true);
      return;
    }

    router.replace(role === 'seller' ? '/panel-vendedor' : '/');
  }

  if (pendingConfirmation) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Revisa tu correo</Text>
        <Text style={styles.muted}>
          Te enviamos un enlace de confirmación a {email.trim()}. Después de confirmarlo, inicia
          sesión.
        </Text>
        <Pressable onPress={() => router.replace('/iniciar-sesion')} style={styles.button}>
          <Text style={styles.buttonText}>Ir a iniciar sesión</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.title}>Crea tu cuenta</Text>
        <Text style={[styles.muted, { marginBottom: 16 }]}>¿Cómo vas a usar Andemar?</Text>

        {ROLES.map((r) => {
          const selected = role === r.value;
          return (
            <Pressable
              key={r.value}
              onPress={() => setRole(r.value)}
              style={[styles.roleCard, selected && styles.roleCardSelected]}
            >
              <Text style={styles.roleTitle}>{r.title}</Text>
              <Text style={styles.muted}>{r.description}</Text>
            </Pressable>
          );
        })}

        <Text style={styles.label}>Nombre completo</Text>
        <TextInput
          value={fullName}
          onChangeText={setFullName}
          style={styles.input}
          autoComplete="name"
          placeholder="Tu nombre"
          placeholderTextColor="#9AA59F"
        />

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
          autoComplete="new-password"
          placeholder="Mínimo 6 caracteres"
          placeholderTextColor="#9AA59F"
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable onPress={handleSubmit} disabled={loading} style={styles.button}>
          {loading ? (
            <ActivityIndicator color="#FBF8F3" />
          ) : (
            <Text style={styles.buttonText}>Crear cuenta</Text>
          )}
        </Pressable>

        <Pressable onPress={() => router.replace('/iniciar-sesion')} style={{ marginTop: 16 }}>
          <Text style={styles.link}>¿Ya tienes cuenta? Inicia sesión</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBF8F3', padding: 20 },
  title: { fontSize: 22, fontWeight: '600', color: '#1E2A24', marginBottom: 6 },
  muted: { color: '#4A5A52', fontSize: 13, lineHeight: 19 },
  roleCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#F1E9D8',
    padding: 14,
    marginBottom: 10,
  },
  roleCardSelected: { borderColor: '#0E7C90', backgroundColor: '#EEF7F8' },
  roleTitle: { fontWeight: '600', color: '#1E2A24', fontSize: 15, marginBottom: 4 },
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
