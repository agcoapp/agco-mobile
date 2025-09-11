import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { LastTabProvider } from '../contexts/LastTabContext';
import { AuthProvider } from '../hooks/useAuth';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <LastTabProvider>
        <Stack screenOptions={{ headerBackTitle: "Retour" }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen 
            name="adhesion" 
            options={{ 
              headerShown: true,
              title: 'Fiche d\'adhésion',
            }} 
          />
        </Stack>
      </LastTabProvider>
    </AuthProvider>
  );
}
