import { Stack } from 'expo-router';

export default function AdhesionLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="[id]" 
        options={{ 
          title: 'Fiche d\'adhésion',
          headerShown: false,
        }} 
      />
    </Stack>
  );
}
