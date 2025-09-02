import { router } from 'expo-router';
import { useEffect } from 'react';
import LoadingScreen from '../components/ui/LoadingScreen';
import { useAuth } from '../hooks/useAuth';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        // L'utilisateur est connecté, rediriger vers Home
        router.replace('/(tabs)');
      } else {
        // L'utilisateur n'est pas connecté, rediriger vers login
        router.replace('/login');
      }
    }
  }, [isAuthenticated, isLoading]);

  // Afficher l'écran de chargement pendant la vérification
  return <LoadingScreen message="Démarrage de l'application..." />;
}
