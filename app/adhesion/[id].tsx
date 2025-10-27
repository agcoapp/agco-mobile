import { Ionicons } from '@expo/vector-icons';
import { File, Paths } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
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

interface AdhesionData {
  id: number;
  nom_complet: string;
  statut: 'EN_ATTENTE' | 'APPROUVE' | 'REJETE';
  date_soumission: string;
  formulaireImage: string;
  adhesionNumber?: string | null;
  status: 'validated' | 'pending';
}

export default function AdhesionDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [adhesion, setAdhesion] = useState<AdhesionData | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showImageViewer, setShowImageViewer] = useState(false);

  // Récupérer les détails de l'adhésion
  useEffect(() => {
    const fetchAdhesionDetails = async () => {
      const adhesionId = id;
      if (adhesionId && user) {
        try {
          setLoadingDetails(true);
          setError(null);
          // Si l'utilisateur est un MEMBRE, utiliser ses données directement
          if (user?.role === 'MEMBRE') {
            // Récupérer les données complètes de l'utilisateur
            const userStatus = await apiService.getUserStatus();
            
            if (userStatus.formulaire_adhesion?.donnees_snapshot) {
              const snapshotData = userStatus.formulaire_adhesion.donnees_snapshot;
              
              // Créer l'objet adhésion avec les données de l'utilisateur connecté
              const adhesionData: AdhesionData = {
                id: userStatus.formulaire_adhesion.id,
                nom_complet: userStatus.utilisateur.nom_complet,
                statut: userStatus.statut_formulaire?.statut || 'EN_ATTENTE',
                date_soumission: userStatus.formulaire_adhesion.cree_le || new Date().toISOString(),
                // Image du formulaire depuis formulaire_adhesion
                formulaireImage: userStatus.formulaire_adhesion.url_image_formulaire || '',
                // Numéro d'adhésion si validée
                adhesionNumber: userStatus.utilisateur.numero_adhesion || null,
                status: userStatus.statut_formulaire?.statut === 'APPROUVE' ? 'validated' : 'pending'
              };
              
              setAdhesion(adhesionData);
            } else {
              console.error('Données d\'adhésion non trouvées pour l\'utilisateur MEMBRE');
              setError('Données d\'adhésion non trouvées');
            }
          } else {
            // Pour les autres rôles (PRESIDENT, SECRETAIRE_GENERALE), vérifier d'abord si c'est un formulaire d'administrateur
            let specificAdhesion = null;
            
            // D'abord, essayer de récupérer les formulaires d'administrateurs
            try {
              const adminFormulaires = await apiService.getSecretaryAdminFormulaires();
              if (adminFormulaires?.donnees?.formulaires) {
                specificAdhesion = adminFormulaires.donnees.formulaires.find(
                  (form: any) => form.id === parseInt(adhesionId)
                );
                
                if (specificAdhesion) {
                  console.log('📊 Formulaire d\'administrateur trouvé:', specificAdhesion);
                }
              }
            } catch (error) {
              console.log('📊 Pas de formulaire d\'administrateur trouvé, recherche dans les adhésions normales');
            }
            
            // Si pas trouvé dans les formulaires d'administrateurs, chercher dans les adhésions normales
            if (!specificAdhesion) {
              const adhesionDetails = await apiService.getAdhesionForms();
              
              if (adhesionDetails.donnees?.formulaires) {
                specificAdhesion = adhesionDetails.donnees.formulaires.find(
                  (form: any) => form.id === parseInt(adhesionId)
                );
              } else if (adhesionDetails.formulaires) {
                specificAdhesion = adhesionDetails.formulaires.find(
                  (form: any) => form.id === parseInt(adhesionId)
                );
              }
            }
            
            if (specificAdhesion && (specificAdhesion.formulaire_actuel?.donnees_snapshot || specificAdhesion.formulaire_adhesion || specificAdhesion.url_fiche_formulaire)) {
              // Créer l'objet adhésion avec seulement l'image du formulaire
              const adhesionData: AdhesionData = {
                id: specificAdhesion.id,
                nom_complet: specificAdhesion.nom_complet || specificAdhesion.utilisateur?.nom_complet || 'Nom non disponible',
                statut: specificAdhesion.statut || 'EN_ATTENTE',
                date_soumission: specificAdhesion.date_soumission || specificAdhesion.cree_le || new Date().toISOString(),
                // Image du formulaire - gérer les deux cas (adhésions normales et formulaires d'administrateurs)
                formulaireImage: specificAdhesion.formulaire_adhesion?.url_image_formulaire || 
                                 specificAdhesion.formulaire_actuel?.url_image_formulaire || 
                                 specificAdhesion.url_fiche_formulaire || '',
                // Numéro d'adhésion si validée
                adhesionNumber: specificAdhesion.numero_fiche || specificAdhesion.numero_adhesion || null,
                status: (specificAdhesion.statut || 'EN_ATTENTE') === 'APPROUVE' ? 'validated' : 'pending'
              };
              
              setAdhesion(adhesionData);
            } else {
              console.error('Données d\'adhésion non trouvées ou incomplètes');
              setError('Données d\'adhésion non trouvées');
            }
          }
        } catch (error) {
          console.error('Erreur lors de la récupération des détails de l\'adhésion:', error);
          setError('Erreur lors de la récupération des détails de l\'adhésion');
        } finally {
          setLoadingDetails(false);
        }
      }
    };
    
    fetchAdhesionDetails();
  }, [id, user]);

  const handleBack = () => {
    router.back();
  };

  const handleDownloadAdhesion = async () => {
    if (!adhesion?.formulaireImage) {
      Alert.alert('Erreur', 'Aucune image de formulaire disponible');
      return;
    }

    Alert.alert(
      'Choisir le format',
      'Comment souhaitez-vous télécharger la fiche d\'adhésion ?',
      [
        {
          text: 'PNG',
          onPress: () => downloadAsPNG()
        },
        {
          text: 'PDF',
          onPress: () => downloadAsPDF()
        },
        {
          text: 'Annuler',
          style: 'cancel'
        }
      ]
    );
  };

  const downloadAsPNG = async () => {
    try {
      // Demander la permission d'accéder à la galerie
      const { status } = await MediaLibrary.requestPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Permission d\'accès à la galerie refusée');
        return;
      }

      // Créer un nom de fichier unique
      const fileName = `fiche_adhesion_${adhesion?.nom_complet || 'membre'}_${Date.now()}.png`;
      const tempFile = new File(Paths.document, fileName);

      // Télécharger l'image
      const downloadedFile = await File.downloadFileAsync(
        adhesion!.formulaireImage,
        tempFile,
        { idempotent: true }
      );

      if (downloadedFile) {
        // Sauvegarder dans la galerie
        const asset = await MediaLibrary.createAssetAsync(downloadedFile.uri);
        await MediaLibrary.createAlbumAsync('SGM', asset, false);
        
        Alert.alert(
          'Succès',
          'Image téléchargée avec succès dans votre galerie !',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Erreur', 'Échec du téléchargement de l\'image');
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement PNG:', error);
      Alert.alert(
        'Erreur',
        'Erreur lors du téléchargement de l\'image. Veuillez réessayer.',
        [{ text: 'OK' }]
      );
    }
  };

  const downloadAsPDF = async () => {
    try {
      // Créer un nom de fichier unique
      const fileName = `fiche_adhesion_${adhesion?.nom_complet || 'membre'}_${Date.now()}.pdf`;
      const tempFile = new File(Paths.document, fileName);

      // Télécharger l'image (nous la traitons comme un PDF)
      const downloadedFile = await File.downloadFileAsync(
        adhesion!.formulaireImage,
        tempFile,
        { idempotent: true }
      );

      if (downloadedFile) {
        // Vérifier si le partage est disponible
        const isAvailable = await Sharing.isAvailableAsync();
        
        if (isAvailable) {
          // Partager le fichier
          await Sharing.shareAsync(downloadedFile.uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Fiche d\'adhésion'
          });
        } else {
          Alert.alert(
            'Succès',
            `Fichier PDF téléchargé avec succès !\nFichier: ${fileName}`,
            [{ text: 'OK' }]
          );
        }
      } else {
        Alert.alert('Erreur', 'Échec du téléchargement du fichier PDF');
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement PDF:', error);
      Alert.alert(
        'Erreur',
        'Erreur lors du téléchargement du fichier PDF. Veuillez réessayer.',
        [{ text: 'OK' }]
      );
    }
  };

  if (loadingDetails) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement des détails...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
          <Text style={styles.errorTitle}>Erreur</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!adhesion) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="document-outline" size={64} color="#8E8E93" />
          <Text style={styles.errorTitle}>Adhésion non trouvée</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Boutons de navigation */}
        <View style={styles.navigationContainer}>
          {/* Bouton de téléchargement de la fiche d'adhésion */}
          {adhesion?.formulaireImage && (
            <TouchableOpacity style={styles.downloadButton} onPress={handleDownloadAdhesion}>
              <Ionicons name="download-outline" size={24} color="white" />
              <Text style={styles.downloadButtonText}>
                {adhesion?.nom_complet?.includes('LENGANDZI') ? 'Télécharger le formulaire d\'administrateur' : 'Télécharger la fiche d\'adhésion'}
              </Text>
            </TouchableOpacity>
            
          )}
        </View>

        {/* Image du formulaire */}
        <View style={styles.imageContainer}>
          {adhesion.formulaireImage ? (
            <TouchableOpacity 
              style={styles.imageWrapper}
              onPress={() => setShowImageViewer(true)}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: adhesion.formulaireImage }}
                style={styles.formImage}
                resizeMode="contain"
              />
              <View style={styles.zoomOverlay}>
                <Ionicons name="search-outline" size={24} color="rgba(255, 255, 255, 0.8)" />
                <Text style={styles.zoomText}>Appuyez pour zoomer</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.noImageContainer}>
              <Ionicons name="image-outline" size={64} color="#8E8E93" />
              <Text style={styles.noImageText}>
                Aucune image de formulaire disponible
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal pour l'image zoomable */}
      <Modal
        visible={showImageViewer}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageViewer(false)}
      >
        <ImageViewer
          imageUri={adhesion.formulaireImage}
          onClose={() => setShowImageViewer(false)}
        />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  headerContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#8E8E93',
    marginBottom: 16,
  },
  statusContainer: {
    alignItems: 'flex-start',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    flexWrap: 'wrap',
    gap: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  backButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  downloadButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  imageContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  imageWrapper: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    position: 'relative',
  },
  formImage: {
    width: '100%',
    height: 600,
    backgroundColor: '#F2F2F7',
  },
  noImageContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'white',
    borderRadius: 12,
    width: '100%',
  },
  noImageText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    textAlign: 'center',
  },
  zoomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
});
