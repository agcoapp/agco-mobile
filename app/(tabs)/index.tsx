import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/apiService';

interface DashboardStats {
  totalMembers: number;
  pendingAdhesions: number;
  validatedAdhesions: number;
  rejectedAdhesions: number;
}

interface MemberCardImages {
  recto: string;
  verso: string;
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    pendingAdhesions: 0,
    validatedAdhesions: 0,
    rejectedAdhesions: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [memberCardImages, setMemberCardImages] = useState<MemberCardImages>({ recto: '', verso: '' });
  const [isLoadingCard, setIsLoadingCard] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const loadStats = async () => {
      // Ne pas charger les statistiques du secrétaire si l'utilisateur est un membre
      if (user?.role === 'MEMBRE') {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Récupérer les statistiques du tableau de bord via l'API
        const dashboardData = await apiService.getSecretaryDashboard();
        console.log('Dashboard data:', dashboardData);
        
        setStats({
          totalMembers: dashboardData.donnees.statistiques.membres_approuves,
          pendingAdhesions: dashboardData.donnees.statistiques.membres_en_attente,
          validatedAdhesions: dashboardData.donnees.statistiques.membres_approuves,
          rejectedAdhesions: dashboardData.donnees.statistiques.membres_rejetes,
        });
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
        setError('Erreur lors du chargement des statistiques');
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, [user]);

  const onRefresh = async () => {
    // Ne pas rafraîchir les statistiques du secrétaire si l'utilisateur est un membre
    if (user?.role === 'MEMBRE') {
      setRefreshing(false);
      return;
    }
    
    setRefreshing(true);
    try {
      setError(null);
      
      // Récupérer les statistiques du tableau de bord via l'API
      const dashboardData = await apiService.getSecretaryDashboard();
      console.log('Dashboard data (refresh):', dashboardData);
      
      setStats({
        totalMembers: dashboardData.donnees.statistiques.membres_approuves,
        pendingAdhesions: dashboardData.donnees.statistiques.membres_en_attente,
        validatedAdhesions: dashboardData.donnees.statistiques.membres_approuves,
        rejectedAdhesions: dashboardData.donnees.statistiques.membres_rejetes,
      });
      
      console.log('📋 Statistiques rechargées avec succès');
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des statistiques:', error);
      setError('Erreur lors du rafraîchissement des statistiques');
    } finally {
      setRefreshing(false);
    }
  };

  // Charger les images de la carte de membre depuis userStatus
  useEffect(() => {
    const loadMemberCardImages = async () => {
      if (user?.role === 'MEMBRE') {
        try {
          setIsLoadingCard(true);
          const userStatus = await apiService.getUserStatus();
          console.log('User status:', userStatus);
          
          // Vérifier si les images de la carte sont disponibles
          if (userStatus?.images?.carte_membre) {
            setMemberCardImages({
              recto: userStatus.images.carte_membre.recto || '',
              verso: userStatus.images.carte_membre.verso || ''
            });
          }
        } catch (error) {
          console.error('Erreur lors du chargement des images de la carte:', error);
          setMemberCardImages({ recto: '', verso: '' });
        } finally {
          setIsLoadingCard(false);
        }
      }
    };

    loadMemberCardImages();
  }, [user]);

  const handleCardClick = (route: string) => {
    if (route === '/membres') {
      router.push('/(tabs)/membres');
    } else if (route === '/adhesions') {
      router.push('/(tabs)/adhesions');
    } else if (route === '/cartes') {
      router.push('/(tabs)/cartes');
    } else if (route === '/codes') {
      router.push('/(tabs)/codes');
    }
  };

  // Si c'est un membre normal, afficher le dashboard membre
  if (user?.role === 'MEMBRE') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView 
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.content}>
            {/* En-tête de bienvenue */}
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeTitle}>
                Bienvenue à L'Espace Membre
              </Text>
              <Text style={styles.welcomeSubtitle}>
                Association des Gabonais du Congo (AGCO)
              </Text>
            </View>

            {/* Carte membre complète avec recto/verso */}
            <View style={styles.cardSection}>
              <Text style={styles.sectionTitle}>Ma Carte De Membre</Text>
              
              <View style={styles.cardContainer}>
                {/* Recto */}
                <View style={styles.cardSide}>
                  <Text style={styles.cardSideTitle}>RECTO</Text>
                  {isLoadingCard ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color="#007AFF" />
                      <Text style={styles.loadingText}>Chargement De L'Image...</Text>
                    </View>
                  ) : memberCardImages.recto ? (
                    <View style={styles.imageContainer}>
                      <Image
                        source={{ uri: memberCardImages.recto }}
                        style={styles.cardImage}
                        resizeMode="contain"
                      />
                    </View>
                  ) : (
                    <View style={styles.noImageContainer}>
                      <Text style={styles.noImageText}>Image Du Recto Non Disponible</Text>
                    </View>
                  )}
                </View>

                {/* Verso */}
                <View style={styles.cardSide}>
                  <Text style={styles.cardSideTitle}>VERSO</Text>
                  {isLoadingCard ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color="#007AFF" />
                      <Text style={styles.loadingText}>Chargement De L'Image...</Text>
                    </View>
                  ) : memberCardImages.verso ? (
                    <View style={styles.imageContainer}>
                      <Image
                        source={{ uri: memberCardImages.verso }}
                        style={styles.cardImage}
                        resizeMode="contain"
                      />
                    </View>
                  ) : (
                    <View style={styles.noImageContainer}>
                      <Text style={styles.noImageText}>Image Du Verso Non Disponible</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Actions rapides */}
            <View style={styles.actionsSection}>
              <Text style={styles.sectionTitle}>Actions Rapides</Text>
              <View style={styles.actionsGrid}>
                <TouchableOpacity
                  style={styles.actionCard}
                  onPress={async () => {
                    try {
                      const userStatus = await apiService.getUserStatus();
                      if (userStatus) {
                        router.push('/membre/mon-adhesion');
                      }
                    } catch (error) {
                      console.error('Erreur lors de la récupération de la carte:', error);
                    }
                  }}
                >
                  <Ionicons name="person-add-outline" size={48} color="#007AFF" />
                  <Text style={styles.actionTitle}>Ma fiche D'Adhésion</Text>
                  <Text style={styles.actionSubtitle}>Consulter Vos Informations</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionCard}
                  onPress={() => router.push('/membre/change-password')}
                >
                  <Ionicons name="key-outline" size={48} color="#AF52DE" />
                  <Text style={styles.actionTitle}>Sécurité du compte</Text>
                  <Text style={styles.actionSubtitle}>Changer votre mot de passe</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionCard}
                  onPress={() => router.push('/(tabs)/membres')}
                >
                  <Ionicons name="card-outline" size={48} color="#34C759" />
                  <Text style={styles.actionTitle}>Ma carte de membre</Text>
                  <Text style={styles.actionSubtitle}>Télécharger ma carte de membre</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Dashboard pour les administrateurs
  const statCards = [
    {
      title: 'Liste Des Membres',
      value: stats.totalMembers,
      icon: 'people-outline',
      color: '#007AFF',
      route: '/membres',
    },
    {
      title: 'Adhésions En Attente',
      value: stats.pendingAdhesions,
      icon: 'time-outline',
      color: '#FF9500',
      route: '/adhesions',
    },
    {
      title: 'Adhésions Validées',
      value: stats.validatedAdhesions,
      icon: 'checkmark-circle-outline',
      color: '#34C759',
      route: '/adhesions',
    },
    {
      title: 'Adhésions Rejetées',
      value: stats.rejectedAdhesions,
      icon: 'close-circle-outline',
      color: '#FF3B30',
      route: '/adhesions',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.content}>
          <Text style={styles.mainTitle}>Tableau De Bord</Text>
          
          {/* Cartes de statistiques */}
          <View style={styles.statsGrid}>
            {isLoading ? (
              // Affichage du chargement
              Array.from({ length: 4 }).map((_, index) => (
                <View key={index} style={styles.loadingCard}>
                  <View style={styles.loadingIcon} />
                  <View style={styles.loadingValue} />
                  <View style={styles.loadingTitle} />
                </View>
              ))
            ) : error ? (
              // Affichage de l'erreur
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton}>
                  <Text style={styles.retryButtonText}>Réessayer</Text>
                </TouchableOpacity>
              </View>
            ) : (
              // Affichage des cartes avec les données
              statCards.map((card, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.statCard}
                  onPress={() => handleCardClick(card.route)}
                  activeOpacity={0.7}
                >
                  <Ionicons name={card.icon as any} size={40} color={card.color} />
                  <Text style={[styles.statValue, { color: card.color }]}>
                    {card.value}
                  </Text>
                  <Text style={styles.statTitle}>{card.title}</Text>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Actions rapides */}
          <View style={styles.actionsSection}>
            <Text style={styles.sectionTitle}>Actions Rapides</Text>
            <View style={styles.actionsGrid}>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push('/(tabs)/adhesions')}
              >
                <Text style={styles.actionTitle}>Liste Des Adhésions</Text>
                <Text style={styles.actionSubtitle}>Gérer Les Demandes d'Adhésion</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push('/(tabs)/cartes')}
              >
                <Text style={styles.actionTitle}>Cartes Des Membres</Text>
                <Text style={styles.actionSubtitle}>Voir Et Télécharger Les Cartes De Membres</Text>
              </TouchableOpacity>
              
              {/* Seulement le secrétaire général voit le lien "Code d'accès" */}
              {user?.role === 'SECRETAIRE_GENERALE' && (
                <TouchableOpacity
                  style={styles.actionCard}
                  onPress={() => router.push('/(tabs)/codes')}
                >
                  <Text style={styles.actionTitle}>Code D'Accès</Text>
                  <Text style={styles.actionSubtitle}>Gérer Les Codes d'accès</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  cardSection: {
    marginBottom: 32,
  },
  cardContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardSide: {
    marginBottom: 16,
  },
  cardSideTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  imageContainer: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 200,
  },
  noImageContainer: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  noImageText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    width: '48%',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  loadingCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    width: '48%',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    marginBottom: 8,
  },
  loadingValue: {
    width: 60,
    height: 24,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 4,
  },
  loadingTitle: {
    width: 80,
    height: 16,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
  },
  errorContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  actionsSection: {
    marginBottom: 32,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  actionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    width: '45%',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});
