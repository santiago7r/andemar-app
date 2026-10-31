import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#1B4D3E' },
        headerTintColor: '#FBF8F3',
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: '#FBF8F3' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Andemar' }} />
      <Stack.Screen name="tour/[id]" options={{ title: '' }} />
      <Stack.Screen name="registro" options={{ title: 'Crear cuenta' }} />
      <Stack.Screen name="iniciar-sesion" options={{ title: 'Iniciar sesión' }} />
      <Stack.Screen name="panel-vendedor" options={{ title: 'Mi cuenta' }} />
    </Stack>
  );
}
