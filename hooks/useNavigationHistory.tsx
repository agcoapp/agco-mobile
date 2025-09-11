import { router } from 'expo-router';
import { useLastTab } from '../contexts/LastTabContext';

export const useNavigationHistory = () => {
  const { getPreviousTab, tabHistory, addToHistory, cleanHistory } = useLastTab();

  // Fonction pour naviguer avec enregistrement automatique de l'historique
  const navigateToTab = (tabName: string) => {
    console.log('🚀 Navigation vers:', tabName);
    addToHistory(tabName);
    router.push(`/(tabs)/${tabName}` as any);
  };

  const handleBackNavigation = () => {
    const previousTab = getPreviousTab();
    console.log('🔙 Retour vers:', previousTab);
    console.log('🔙 Historique complet:', tabHistory);
    
    if (previousTab && previousTab !== 'index') {
      // Naviguer vers l'onglet précédent dans l'historique
      console.log('🔙 Navigation vers l\'onglet précédent:', previousTab);
      router.push(`/(tabs)/${previousTab}` as any);
    } else {
      // Si pas d'onglet précédent valide, aller au tableau de bord
      console.log('🔙 Pas d\'onglet précédent valide, navigation vers index');
      router.push('/(tabs)/index' as any);
    }
  };

  const canGoBack = () => {
    return tabHistory.length > 1;
  };

  return {
    handleBackNavigation,
    navigateToTab,
    canGoBack,
    tabHistory,
    cleanHistory,
  };
};
