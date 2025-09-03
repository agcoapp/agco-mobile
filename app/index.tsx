import { router } from 'expo-router';
import { useEffect } from 'react';
import LoadingScreen from '../components/ui/LoadingScreen';
import { useAuth } from '../hooks/useAuth';

export default function Index() {
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && user) {
        // L'utilisateur est connecté, vérifier son statut d'adhésion
        console.log('🔍 Index: Utilisateur authentifié, vérification du statut...');
        console.log('📋 Statut utilisateur:', user);
        
        if (user.a_soumis_formulaire) {
          // L'utilisateur a soumis un formulaire, la redirection sera gérée par checkAuth
          console.log('✅ Index: Formulaire soumis, laissez checkAuth gérer la redirection');
          // Ne pas rediriger ici, laissez checkAuth faire son travail
        } else {
          // L'utilisateur n'a pas soumis de formulaire, rediriger vers register
          console.log('📝 Index: Pas de formulaire soumis, redirection vers /register');
          router.replace('/register');
        }
      } else {
        // L'utilisateur n'est pas connecté, rediriger vers login
        console.log('❌ Index: Utilisateur non authentifié, redirection vers /login');
        router.replace('/login');
      }
    }
  }, [isAuthenticated, isLoading, user]);

  // Afficher l'écran de chargement pendant la vérification
  return <LoadingScreen message="Vérification de votre statut..." />;
}
