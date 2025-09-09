import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import CarteRectoGenerator, { CarteRectoGeneratorRef } from '../../components/CarteRectoGenerator';
import CarteVersoGenerator, { CarteVersoGeneratorRef } from '../../components/CarteVersoGenerator';
import { apiService } from '../../services/apiService';
import { cleanCodeFormulaire } from '../../utils/fonctions';

const { width } = Dimensions.get('window');

interface MemberCard {
  id: number;
  carte_membre: {
    recto_url: string;
    verso_url: string;
  };
}

interface Member {
  id: number;
  nom_complet: string;
  code_formulaire: string;
  numero_adhesion?: string;
  telephone?: string;
  statut: 'EN_ATTENTE' | 'APPROUVE' | 'REJETE';
  soumis_le: string;
  formulaire_actuel: {
    donnees_snapshot: {
      nom: string;
      prenoms: string;
      profession: string;
      date_naissance: string;
      telephone: string;
      selfie_photo_url?: string;
      lieu_naissance?: string;
      adresse?: string;
      ville_residence?: string;
      numero_carte_consulaire?: string;
      date_emission_piece?: string;
      date_entree_congo?: string;
      employeur_ecole?: string;
      nom_conjoint?: string;
      prenom_conjoint?: string;
      nombre_enfants?: string;
      commentaire?: string;
    };
  };
}

export default function CarteMembreScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [member, setMember] = useState<Member | null>(null);
  const [memberCard, setMemberCard] = useState<MemberCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showAllInfo, setShowAllInfo] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  
  const carteRectoGeneratorRef = useRef<CarteRectoGeneratorRef>(null);
  const carteVersoGeneratorRef = useRef<CarteVersoGeneratorRef>(null);

  useEffect(() => {
    const fetchMemberData = async () => {
      if (!id) {
        setError('ID du membre manquant');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Récupérer les données du membre depuis l'API des adhésions
        const adhesionResponse = await apiService.getAdhesionForms();
        const foundMember = adhesionResponse.donnees?.formulaires?.find((adhesion: any) => 
          adhesion.id === parseInt(id) && adhesion.statut === 'APPROUVE'
        );
        
        if (foundMember) {
          setMember(foundMember);
          
          // Récupérer les cartes de membres depuis l'API
          const cardsResponse = await apiService.getMemberCards();
          const foundCard = cardsResponse.cartes?.find((card: any) => 
            card.id === parseInt(id)
          );
          
          if (foundCard) {
            setMemberCard(foundCard);
          } else {
            setError('Aucune carte générée pour ce membre');
          }
        } else {
          setError('Membre non trouvé ou adhésion non validée');
        }
      } catch (err) {
        console.error('Erreur lors du chargement du membre:', err);
        setError('Erreur lors du chargement du membre');
      } finally {
        setLoading(false);
      }
    };

    fetchMemberData();
  }, [id]);

  const handleBack = () => {
    router.back();
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
    Alert.alert(
      'Choisir le format',
      'Dans quel format souhaitez-vous télécharger la carte ?',
      [
        {
          text: 'PNG',
          onPress: generateCartePNG,
          style: 'default',
        },
        {
          text: 'PDF',
          onPress: generateCartePDF,
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

  // Fonction pour générer la carte en PNG
  const generateCartePNG = async () => {
    if (!member) return;
    
    setIsDownloading(true);
    try {
      console.log('🔄 Génération de la carte PNG...');
      
      // Générer les cartes RECTO et VERSO
      const rectoBase64 = await carteRectoGeneratorRef.current?.generatePNG();
      const versoBase64 = await carteVersoGeneratorRef.current?.generatePNG();
      
      if (!rectoBase64 || !versoBase64) {
        throw new Error('Erreur lors de la génération des cartes');
      }
      
      // Créer un nom de fichier unique
      const fileName = `carte_membre_${cleanCodeFormulaire(member.code_formulaire)}.png`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      // Convertir les base64 en fichiers temporaires
      const rectoFileUri = FileSystem.documentDirectory + 'recto_temp.png';
      const versoFileUri = FileSystem.documentDirectory + 'verso_temp.png';
      
      await FileSystem.writeAsStringAsync(rectoFileUri, rectoBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      await FileSystem.writeAsStringAsync(versoFileUri, versoBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Combiner les deux images (recto + verso)
      const combinedBase64 = await combineImages(rectoBase64, versoBase64);
      
      // Sauvegarder le fichier final
      await FileSystem.writeAsStringAsync(fileUri, combinedBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Partager le fichier
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'image/png',
          dialogTitle: 'Télécharger la carte de membre',
        });
      } else {
        Alert.alert('Succès', 'Carte générée avec succès !');
      }
      
      // Nettoyer les fichiers temporaires
      await FileSystem.deleteAsync(rectoFileUri, { idempotent: true });
      await FileSystem.deleteAsync(versoFileUri, { idempotent: true });
      
      console.log('✅ Carte PNG générée avec succès');
      
    } catch (error) {
      console.error('❌ Erreur lors de la génération de la carte PNG:', error);
      Alert.alert('Erreur', 'Impossible de générer la carte PNG');
    } finally {
      setIsDownloading(false);
    }
  };

  // Fonction pour générer la carte en PDF
  const generateCartePDF = async () => {
    if (!member) return;
    
    setIsDownloading(true);
    try {
      console.log('🔄 Génération de la carte PDF...');
      
      // Générer les cartes RECTO et VERSO
      const rectoBase64 = await carteRectoGeneratorRef.current?.generatePNG();
      const versoBase64 = await carteVersoGeneratorRef.current?.generatePNG();
      
      if (!rectoBase64 || !versoBase64) {
        throw new Error('Erreur lors de la génération des cartes');
      }
      
      // Créer le HTML pour le PDF avec les deux cartes
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              margin: 0;
              padding: 20px;
              font-family: Arial, sans-serif;
            }
            .card-container {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 20px;
            }
            .card {
              max-width: 100%;
              height: auto;
            }
            .card-title {
              text-align: center;
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 10px;
              color: #333;
            }
          </style>
        </head>
        <body>
          <div class="card-container">
            <div>
              <div class="card-title">RECTO</div>
              <img src="data:image/png;base64,${rectoBase64}" class="card" />
            </div>
            <div>
              <div class="card-title">VERSO</div>
              <img src="data:image/png;base64,${versoBase64}" class="card" />
            </div>
          </div>
        </body>
        </html>
      `;
      
      // Générer le PDF
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });
      
      // Partager le PDF
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Télécharger la carte de membre',
        });
      } else {
        Alert.alert('Succès', 'Carte PDF générée avec succès !');
      }
      
      console.log('✅ Carte PDF générée avec succès');
      
    } catch (error) {
      console.error('❌ Erreur lors de la génération de la carte PDF:', error);
      Alert.alert('Erreur', 'Impossible de générer la carte PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  // Fonction pour combiner deux images en une seule
  const combineImages = async (rectoBase64: string, versoBase64: string): Promise<string> => {
    // Pour simplifier, on retourne juste le recto
    // Dans une implémentation complète, on utiliserait une librairie d'image processing
    return rectoBase64;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Chargement de la carte...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
        <Text style={styles.errorTitle}>Erreur</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <Text style={styles.errorSubMessage}>ID recherché: {id}</Text>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!member) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="person-outline" size={64} color="#FF3B30" />
        <Text style={styles.errorTitle}>Aucun membre trouvé</Text>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Bouton de téléchargement */}
      <View style={styles.downloadContainer}>
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

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
      >
        {/* Cartes RECTO et VERSO */}
        <View style={styles.cardsContainer}>
          {memberCard?.carte_membre ? (
            <>
              {/* Carte RECTO */}
              <View style={styles.cardSection}>
                <Text style={styles.cardTitle}>RECTO</Text>
                <View style={styles.cardImageContainer}>
                  {memberCard.carte_membre.recto_url ? (
                    <TouchableOpacity
                      style={styles.imageTouchable}
                      onPress={() => handleImagePress(memberCard.carte_membre.recto_url)}
                    >
                      <Image
                        source={{ uri: memberCard.carte_membre.recto_url }}
                        style={styles.cardImage}
                        resizeMode="contain"
                      />
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.noImageContainer}>
                      <Ionicons name="image-outline" size={48} color="#999" />
                      <Text style={styles.noImageText}>Image RECTO non disponible</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Carte VERSO */}
              <View style={styles.cardSection}>
                <Text style={styles.cardTitle}>VERSO</Text>
                <View style={styles.cardImageContainer}>
                  {memberCard.carte_membre.verso_url ? (
                    <TouchableOpacity
                      style={styles.imageTouchable}
                      onPress={() => handleImagePress(memberCard.carte_membre.verso_url)}
                    >
                      <Image
                        source={{ uri: memberCard.carte_membre.verso_url }}
                        style={styles.cardImage}
                        resizeMode="contain"
                      />
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.noImageContainer}>
                      <Ionicons name="image-outline" size={48} color="#999" />
                      <Text style={styles.noImageText}>Image VERSO non disponible</Text>
                    </View>
                  )}
                </View>
              </View>
            </>
          ) : (
            <View style={styles.noCardContainer}>
              <Ionicons name="card-outline" size={64} color="#999" />
              <Text style={styles.noCardText}>Aucune carte générée pour ce membre</Text>
            </View>
          )}
        </View>

        {/* Informations du membre */}
        <View style={styles.memberInfoCard}>
          <Text style={styles.memberInfoTitle}>Informations du membre</Text>
          <View style={styles.memberInfoContent}>
            <Text style={styles.memberInfoText}>
              • <Text style={styles.memberInfoLabel}>Numéro d'adhésion:</Text> {cleanCodeFormulaire(member.code_formulaire)}
            </Text>
            <Text style={styles.memberInfoText}>
              • <Text style={styles.memberInfoLabel}>Nom:</Text> {member.formulaire_actuel?.donnees_snapshot?.nom || 'Non renseigné'}
            </Text>
            <Text style={styles.memberInfoText}>
              • <Text style={styles.memberInfoLabel}>Prénom:</Text> {member.formulaire_actuel?.donnees_snapshot?.prenoms || 'Non renseigné'}
            </Text>
            <Text style={styles.memberInfoText}>
              • <Text style={styles.memberInfoLabel}>Profession:</Text> {member.formulaire_actuel?.donnees_snapshot?.profession || 'Non renseigné'}
            </Text>
            <Text style={styles.memberInfoText}>
              • <Text style={styles.memberInfoLabel}>Date de naissance:</Text> {member.formulaire_actuel?.donnees_snapshot?.date_naissance || 'Non renseigné'}
            </Text>
            <Text style={styles.memberInfoText}>
              • <Text style={styles.memberInfoLabel}>Téléphone:</Text> {member.formulaire_actuel?.donnees_snapshot?.telephone || 'Non renseigné'}
            </Text>
            
            {!showAllInfo && (
              <TouchableOpacity
                style={styles.showMoreButton}
                onPress={() => setShowAllInfo(true)}
              >
                <Text style={styles.showMoreButtonText}>Voir plus...</Text>
              </TouchableOpacity>
            )}

            {showAllInfo && (
              <>
                <Text style={styles.memberInfoText}>
                  • <Text style={styles.memberInfoLabel}>Lieu de naissance:</Text> {member.formulaire_actuel?.donnees_snapshot?.lieu_naissance || 'Non renseigné'}
                </Text>
                <Text style={styles.memberInfoText}>
                  • <Text style={styles.memberInfoLabel}>Adresse:</Text> {member.formulaire_actuel?.donnees_snapshot?.adresse || 'Non renseigné'}
                </Text>
                <Text style={styles.memberInfoText}>
                  • <Text style={styles.memberInfoLabel}>Ville de résidence:</Text> {member.formulaire_actuel?.donnees_snapshot?.ville_residence || 'Non renseigné'}
                </Text>
                <Text style={styles.memberInfoText}>
                  • <Text style={styles.memberInfoLabel}>Numéro de pièce d'identité:</Text> {member.formulaire_actuel?.donnees_snapshot?.numero_carte_consulaire || 'Non renseigné'}
                </Text>
                <Text style={styles.memberInfoText}>
                  • <Text style={styles.memberInfoLabel}>Date de délivrance:</Text> {member.formulaire_actuel?.donnees_snapshot?.date_emission_piece || 'Non renseigné'}
                </Text>
                <Text style={styles.memberInfoText}>
                  • <Text style={styles.memberInfoLabel}>Date d'entrée au Congo:</Text> {member.formulaire_actuel?.donnees_snapshot?.date_entree_congo || 'Non renseigné'}
                </Text>
                <Text style={styles.memberInfoText}>
                  • <Text style={styles.memberInfoLabel}>Employeur/École:</Text> {member.formulaire_actuel?.donnees_snapshot?.employeur_ecole || 'Non renseigné'}
                </Text>
                <Text style={styles.memberInfoText}>
                  • <Text style={styles.memberInfoLabel}>Nom du conjoint:</Text> {member.formulaire_actuel?.donnees_snapshot?.nom_conjoint || 'Non renseigné'}
                </Text>
                <Text style={styles.memberInfoText}>
                  • <Text style={styles.memberInfoLabel}>Prénom du conjoint:</Text> {member.formulaire_actuel?.donnees_snapshot?.prenom_conjoint || 'Non renseigné'}
                </Text>
                <Text style={styles.memberInfoText}>
                  • <Text style={styles.memberInfoLabel}>Nombre d'enfants:</Text> {member.formulaire_actuel?.donnees_snapshot?.nombre_enfants || 'Non renseigné'}
                </Text>
                <Text style={styles.memberInfoText}>
                  • <Text style={styles.memberInfoLabel}>Statut:</Text> {member.statut === 'APPROUVE' ? 'Approuvé' : member.statut === 'EN_ATTENTE' ? 'En attente' : 'Rejeté'}
                </Text>
                <Text style={styles.memberInfoText}>
                  • <Text style={styles.memberInfoLabel}>Date de soumission:</Text> {new Date(member.soumis_le).toLocaleDateString('fr-FR')}
                </Text>
                <Text style={styles.memberInfoText}>
                  • <Text style={styles.memberInfoLabel}>Commentaire:</Text> {member.formulaire_actuel?.donnees_snapshot?.commentaire || 'Aucun commentaire'}
                </Text>

                <TouchableOpacity
                  style={styles.showMoreButton}
                  onPress={() => setShowAllInfo(false)}
                >
                  <Text style={styles.showMoreButtonText}>Voir moins</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Générateurs de cartes cachés */}
      <CarteRectoGenerator
        ref={carteRectoGeneratorRef}
        member={member}
        logoImage={undefined}
        photoImage={member?.formulaire_actuel?.donnees_snapshot?.selfie_photo_url}
      />
      <CarteVersoGenerator
        ref={carteVersoGeneratorRef}
        member={member}
        qrCodeImage={undefined}
        signatureImage={undefined}
      />

      {/* Modal pour afficher l'image en plein écran */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeImageModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={closeImageModal}
          >
            <Ionicons name="close" size={30} color="white" />
          </TouchableOpacity>
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={styles.modalImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubMessage: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButtonHeader: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  downloadContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    backgroundColor: '#007AFF',
  },
  downloadButtonDisabled: {
    opacity: 0.6,
  },
  downloadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  showMoreButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  showMoreButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  memberInfoCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  memberInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  memberInfoContent: {
    gap: 8,
  },
  memberInfoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  memberInfoLabel: {
    fontWeight: 'bold',
    color: '#333',
  },
  cardsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  cardSection: {
    marginBottom: 24,
    marginTop: 24,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  cardImageContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardImage: {
    width: '100%',
    height: width * 0.6, // Ratio 3:5 pour les cartes
    borderRadius: 8,
  },
  noImageContainer: {
    height: width * 0.6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  noImageText: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  noCardContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  noCardText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#029350',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  imageTouchable: {
    flex: 1,
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
    padding: 10,
  },
  modalImage: {
    width: '90%',
    height: '80%',
  },
});
