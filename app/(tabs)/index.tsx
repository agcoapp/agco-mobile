import { Ionicons } from '@expo/vector-icons';
import { File, Paths } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Print from 'expo-print';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Modal,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import ImageViewer from '../../components/ui/ImageViewer';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/apiService';

const { width } = Dimensions.get('window');

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

interface MemberForDownload {
  nom_complet: string;
  carte_membre: {
    recto_url: string;
    verso_url: string;
  };
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
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [totalMembersCount, setTotalMembersCount] = useState(0);
  const [isLoadingMembersCount, setIsLoadingMembersCount] = useState(false);
  

  useEffect(() => {
    const loadStats = async () => {
      // Ne pas charger les statistiques si l'utilisateur n'est pas connecté ou s'il est un membre
      if (!user || user?.role === 'MEMBRE') {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Récupérer les statistiques du tableau de bord via l'API
        const dashboardData = await apiService.getSecretaryDashboard();
        // Récupérer les formulaires d'administrateur
        let adminStats = {
          totalAdminMembers: 0,
          pendingAdminAdhesions: 0,
          validatedAdminAdhesions: 0,
          rejectedAdminAdhesions: 0,
        };
        
        try {
          const adminFormulaires = await apiService.getSecretaryAdminFormulaires();
          if (adminFormulaires?.donnees?.formulaires) {
            adminStats = {
              totalAdminMembers: adminFormulaires.donnees.formulaires.filter((form: any) => 
                form.statut === 'APPROUVE' || form.statut_formulaire?.statut === 'APPROUVE'
              ).length,
              pendingAdminAdhesions: adminFormulaires.donnees.formulaires.filter((form: any) => 
                form.statut === 'EN_ATTENTE' || form.statut_formulaire?.statut === 'EN_ATTENTE'
              ).length,
              validatedAdminAdhesions: adminFormulaires.donnees.formulaires.filter((form: any) => 
                form.statut === 'APPROUVE' || form.statut_formulaire?.statut === 'APPROUVE'
              ).length,
              rejectedAdminAdhesions: adminFormulaires.donnees.formulaires.filter((form: any) => 
                form.statut === 'REJETE' || form.statut_formulaire?.statut === 'REJETE'
              ).length,
            };
          }
        } catch (adminError) {
          console.log('Pas de formulaires d\'administrateur trouvés ou erreur:', adminError);
        }
        
        // Additionner les statistiques normales avec les formulaires d'administrateur
        setStats({
          totalMembers: dashboardData.donnees.statistiques.membres_approuves + adminStats.totalAdminMembers,
          pendingAdhesions: dashboardData.donnees.statistiques.membres_en_attente + adminStats.pendingAdminAdhesions,
          validatedAdhesions: dashboardData.donnees.statistiques.membres_approuves + adminStats.validatedAdminAdhesions,
          rejectedAdhesions: dashboardData.donnees.statistiques.membres_rejetes + adminStats.rejectedAdminAdhesions,
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
    // Ne pas rafraîchir les statistiques si l'utilisateur n'est pas connecté
    if (!user) {
      setRefreshing(false);
      return;
    }
    
    // Si c'est un membre, rafraîchir seulement le nombre de membres
    if (user?.role === 'MEMBRE') {
      try {
        const memberDirectory = await apiService.getMemberDirectory();
        if (memberDirectory?.donnees?.pagination?.total) {
          setTotalMembersCount(memberDirectory.donnees.pagination.total);
        } else if (memberDirectory?.donnees?.membres) {
          setTotalMembersCount(memberDirectory.donnees.membres.length);
        }
      } catch (error) {
        console.error('Erreur lors du rafraîchissement du nombre de membres:', error);
      } finally {
        setRefreshing(false);
      }
      return;
    }
    
    setRefreshing(true);
    try {
      setError(null);
      
      // Récupérer les statistiques du tableau de bord via l'API
      const dashboardData = await apiService.getSecretaryDashboard();
      console.log('Dashboard data (refresh):', dashboardData);
      
      // Récupérer les formulaires d'administrateur
      let adminStats = {
        totalAdminMembers: 0,
        pendingAdminAdhesions: 0,
        validatedAdminAdhesions: 0,
        rejectedAdminAdhesions: 0,
      };
      
      try {
        const adminFormulaires = await apiService.getSecretaryAdminFormulaires();
        if (adminFormulaires?.donnees?.formulaires) {
          adminStats = {
            totalAdminMembers: adminFormulaires.donnees.formulaires.filter((form: any) => 
              form.statut === 'APPROUVE' || form.statut_formulaire?.statut === 'APPROUVE'
            ).length,
            pendingAdminAdhesions: adminFormulaires.donnees.formulaires.filter((form: any) => 
              form.statut === 'EN_ATTENTE' || form.statut_formulaire?.statut === 'EN_ATTENTE'
            ).length,
            validatedAdminAdhesions: adminFormulaires.donnees.formulaires.filter((form: any) => 
              form.statut === 'APPROUVE' || form.statut_formulaire?.statut === 'APPROUVE'
            ).length,
            rejectedAdminAdhesions: adminFormulaires.donnees.formulaires.filter((form: any) => 
              form.statut === 'REJETE' || form.statut_formulaire?.statut === 'REJETE'
            ).length,
          };
        }
      } catch (adminError) {
        console.log('Pas de formulaires d\'administrateur trouvés ou erreur:', adminError);
      }
      
      // Additionner les statistiques normales avec les formulaires d'administrateur
      setStats({
        totalMembers: dashboardData.donnees.statistiques.membres_approuves + adminStats.totalAdminMembers,
        pendingAdhesions: dashboardData.donnees.statistiques.membres_en_attente + adminStats.pendingAdminAdhesions,
        validatedAdhesions: dashboardData.donnees.statistiques.membres_approuves + adminStats.validatedAdminAdhesions,
        rejectedAdhesions: dashboardData.donnees.statistiques.membres_rejetes + adminStats.rejectedAdminAdhesions,
      });
      
      console.log('📋 Statistiques rechargées avec succès (incluant formulaires admin)');
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des statistiques:', error);
      setError('Erreur lors du rafraîchissement des statistiques');
    } finally {
      setRefreshing(false);
    }
  };

  // Fonction pour afficher l'image en plein écran
  const handleImagePress = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setIsModalVisible(true);
  };

  const closeImageModal = () => {
    setIsModalVisible(false);
    setSelectedImage(null);
  };

  // Fonction pour afficher l'Alert de sélection du format
  const showDownloadFormatAlert = () => {
    if (!user) return;
    
    // Créer un objet membre avec les données nécessaires pour le téléchargement
    const memberForDownload: MemberForDownload = {
      nom_complet: `${user.prenoms} ${user.nom}`,
      carte_membre: {
        recto_url: memberCardImages.recto,
        verso_url: memberCardImages.verso
      }
    };
    
    Alert.alert(
      'Choisir le format',
      'Dans quel format souhaitez-vous télécharger la carte ?',
      [
        {
          text: 'PNG',
          onPress: () => downloadCompletePNG(memberForDownload),
          style: 'default',
        },
        {
          text: 'PDF',
          onPress: () => downloadPDF(memberForDownload),
          style: 'default',
        },
        {
          text: 'Annuler',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  // Fonction pour télécharger une carte complète (recto + verso) en PNG
  const downloadCompletePNG = async (member: MemberForDownload) => {
    try {
      setIsDownloading(true);
      
      // Demander les permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Permission nécessaire pour sauvegarder l\'image');
        return;
      }

      // Vérifier que les deux images existent
      if (!member.carte_membre.recto_url || !member.carte_membre.verso_url) {
        Alert.alert('Images manquantes', 'Les images recto et verso sont requises pour créer une carte complète');
        return;
      }

      // Télécharger les deux images
      const rectoFileName = `${member.nom_complet}_recto_temp.png`;
      const versoFileName = `${member.nom_complet}_verso_temp.png`;
      const rectoFile = new File(Paths.document, rectoFileName);
      const versoFile = new File(Paths.document, versoFileName);
      
      // Télécharger recto
      const rectoDownloaded = await File.downloadFileAsync(
        member.carte_membre.recto_url,
        rectoFile,
        {
          idempotent: true,
          headers: {
            'Accept': 'image/png'
          }
        }
      );

      // Télécharger verso
      const versoDownloaded = await File.downloadFileAsync(
        member.carte_membre.verso_url,
        versoFile,
        {
          idempotent: true,
          headers: {
            'Accept': 'image/png'
          }
        }
      );

      if (rectoDownloaded && versoDownloaded) {
        // Sauvegarder recto
        const rectoAsset = await MediaLibrary.createAssetAsync(rectoDownloaded.uri);
        await MediaLibrary.createAlbumAsync('Cartes Membres', rectoAsset, false);
        
        // Sauvegarder verso
        const versoAsset = await MediaLibrary.createAssetAsync(versoDownloaded.uri);
        await MediaLibrary.createAlbumAsync('Cartes Membres', versoAsset, false);
        
        Alert.alert('Succès', `Carte complète de ${member.nom_complet} téléchargée (recto + verso)`);
      } else {
        Alert.alert('Erreur', 'Impossible de télécharger les images');
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement PNG complet:', error);
      Alert.alert('Erreur', 'Erreur lors du téléchargement');
    } finally {
      setIsDownloading(false);
    }
  };

  // Fonction pour créer et télécharger un PDF individuel
  const downloadPDF = async (member: MemberForDownload) => {
    try {
      setIsDownloading(true);
      
      // Créer le contenu HTML pour le PDF avec les images intégrées
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Carte Membre - ${member.nom_complet}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              background-color: #f5f5f5;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
              background-color: white;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .member-info { 
              margin-bottom: 20px; 
              background-color: white;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .card-section { 
              margin-bottom: 30px; 
              background-color: white;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .card-title { 
              font-weight: bold; 
              margin-bottom: 15px; 
              color: #333;
              font-size: 18px;
            }
            .card-image { 
              max-width: 100%; 
              height: auto; 
              border-radius: 8px;
              box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            }
            .info-row {
              margin-bottom: 10px;
            }
            .info-label {
              font-weight: bold;
              color: #555;
            }
            .info-value {
              color: #333;
            }
          </style>
        </head>
        <body>          
          ${member.carte_membre.recto_url ? `
            <div class="card-section">
              <img src="${member.carte_membre.recto_url}" class="card-image" alt="Carte recto" />
            </div>
          ` : ''}
          
          ${member.carte_membre.verso_url ? `
            <div class="card-section">
              <img src="${member.carte_membre.verso_url}" class="card-image" alt="Carte verso" />
            </div>
          ` : ''}
        </body>
        </html>
      `;

      // Générer le PDF avec expo-print
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false
      });
      
      // Partager le fichier PDF
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Carte Membre - ${member.nom_complet}`
        });
      } else {
        Alert.alert('Partage non disponible', 'Le partage de fichiers n\'est pas disponible sur cet appareil');
      }
    } catch (error) {
      console.error('Erreur lors de la création du PDF:', error);
      Alert.alert('Erreur', 'Erreur lors de la création du PDF');
    } finally {
      setIsDownloading(false);
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

  // Charger le nombre total de membres
  useEffect(() => {
    const loadMembersCount = async () => {
      if (user?.role === 'MEMBRE') {
        try {
          setIsLoadingMembersCount(true);
          const memberDirectory = await apiService.getMemberDirectory();
          console.log('Member directory:', memberDirectory);
          
          // Récupérer le nombre total de membres depuis la pagination
          if (memberDirectory?.donnees?.pagination?.total) {
            setTotalMembersCount(memberDirectory.donnees.pagination.total);
          } else if (memberDirectory?.donnees?.membres) {
            setTotalMembersCount(memberDirectory.donnees.membres.length);
          }
        } catch (error) {
          console.error('Erreur lors du chargement du nombre de membres:', error);
          setTotalMembersCount(0);
        } finally {
          setIsLoadingMembersCount(false);
        }
      }
    };

    loadMembersCount();
  }, [user]);


  const handleStatCardClick = (card: any) => {
    if (card.route === '/membres') {
      router.push('/(tabs)/membres');
    } else if (card.route === '/adhesions') {
      // Déterminer quel onglet afficher selon le type de carte
      if (card.title === 'Adhésions En Attente') {
        router.push('/(tabs)/adhesions?tab=pending');
      } else if (card.title === 'Adhésions Validées') {
        router.push('/(tabs)/adhesions?tab=validated');
      } else if (card.title === 'Adhésions Rejetées') {
        router.push('/(tabs)/adhesions?tab=rejected');
      } else {
        router.push('/(tabs)/adhesions');
      }
    } else if (card.route === '/cartes') {
      router.push('/(tabs)/cartes');
    } else if (card.route === '/codes') {
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

            {/* Statistiques des membres */}
            <View style={styles.statsSection}>
              <Text style={styles.sectionTitle}>Statistiques</Text>
              <View style={[styles.statsGrid, { justifyContent: 'center' }]}>
                <TouchableOpacity
                  style={styles.statCard}
                  onPress={() => router.push('/(tabs)/membres')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="people-outline" size={40} color="#007AFF" />
                  <Text style={[styles.statValue, { color: '#007AFF' }]}>
                    {isLoadingMembersCount ? '...' : totalMembersCount}
                  </Text>
                  <Text style={styles.statTitle}>Total Des Membres</Text>
                </TouchableOpacity>
              </View>
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
                    <TouchableOpacity
                      style={styles.imageTouchable}
                      onPress={() => handleImagePress(memberCardImages.recto)}
                    >
                      <Image
                        source={{ uri: memberCardImages.recto }}
                        style={styles.cardImage}
                        resizeMode="contain"
                      />
                    </TouchableOpacity>
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
                    <TouchableOpacity
                      style={styles.imageTouchable}
                      onPress={() => handleImagePress(memberCardImages.verso)}
                    >
                      <Image
                        source={{ uri: memberCardImages.verso }}
                        style={styles.cardImage}
                        resizeMode="contain"
                      />
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.noImageContainer}>
                      <Text style={styles.noImageText}>Image Du Verso Non Disponible</Text>
                    </View>
                  )}
                </View>
              </View>
              
              {/* Bouton de téléchargement */}
              <TouchableOpacity
                style={[styles.downloadButton, isDownloading && styles.downloadButtonDisabled]}
                onPress={showDownloadFormatAlert}
                disabled={isDownloading}
              >
                <Ionicons 
                  name={isDownloading ? "hourglass-outline" : "download-outline"} 
                  size={20} 
                  color="white" 
                />
                <Text style={styles.downloadButtonText}>
                  {isDownloading ? 'Génération...' : 'Télécharger'}
                </Text>
              </TouchableOpacity>
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
                        router.push(`/adhesion/${user.id}`);
                      }
                    } catch (error) {
                      console.error('Erreur lors de la récupération de la carte:', error);
                    }
                  }}
                >
                  <Ionicons name="person-add-outline" size={48} color="#007AFF" />
                  <Text style={styles.actionTitle}>Ma Fiche D'Adhésion</Text>
                  <Text style={styles.actionSubtitle}>Consulter Mes Informations</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionCard}
                  onPress={() => router.push('/(tabs)/change-password')}
                >
                  <Ionicons name="key-outline" size={48} color="#AF52DE" />
                  <Text style={styles.actionTitle}>Sécurité Du Compte</Text>
                  <Text style={styles.actionSubtitle}>Changer Mon Mot De Passe</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
        
        {/* Modal pour afficher l'image en plein écran avec zoom */}
        <Modal
          visible={isModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={closeImageModal}
        >
          {selectedImage && (
            <ImageViewer
              imageUri={selectedImage}
              onClose={closeImageModal}
            />
          )}
        </Modal>
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
          <View style={[styles.statsGrid, { justifyContent: 'space-between' }]}>
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
                  onPress={() => handleStatCardClick(card)}
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
                <Text style={styles.actionTitle}>Adhésions</Text>
                <Text style={styles.actionSubtitle}>{user?.role === "SECRETAIRE_GENERALE" ? "Gérer Les Demandes D'Adhésions" : "Voir La Liste Des Demandes D'Adhésions"}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push('/(tabs)/cartes')}
              >
                <Text style={styles.actionTitle}>Cartes De Membres</Text>
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
  imageTouchable: {
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
  statsSection: {
    marginBottom: 32,
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
  downloadButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
  },
  downloadButtonDisabled: {
    backgroundColor: '#999',
  },
  downloadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 10,
  },
  modalImage: {
    width: width * 0.9,
    height: width * 0.9,
  },
});
