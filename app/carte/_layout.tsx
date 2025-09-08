import { Stack } from 'expo-router';

export default function CarteLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="[id]" 
        options={{
          title: 'Carte de membre',
          headerShown: false, // On utilise notre header personnalisé
        }} 
      />
    </Stack>
  );
}
