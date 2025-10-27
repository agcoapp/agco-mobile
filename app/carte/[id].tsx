import { Ionicons } from '@expo/vector-icons';
import { File, Paths } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Print from 'expo-print';
import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
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
import ImageViewer from '../../components/ui/ImageViewer';
import { apiService } from '../../services/apiService';
import { normalizeMemberData } from '../../utils/fonctions';

const { width } = Dimensions.get('window');

interface MemberCard {
  id: number;
  carte_membre: {
    recto_url: string;
    verso_url: string;
  };
}

interface MemberForDownload {
  nom_complet: string;
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
  email?: string;
  nom_utilisateur?: string;
  role?: string;
  statut: 'EN_ATTENTE' | 'APPROUVE' | 'REJETE';
  soumis_le?: string;
  type?: string;
  donnees_snapshot?: {
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
    nombre_enfants?: string | number;
    commentaire?: string;
  };
  formulaire_actuel?: {
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
      nombre_enfants?: string | number;
      commentaire?: string;
    };
  };
  utilisateur?: {
    nom_utilisateur?: string;
    email?: string;
    role?: string;
    numero_adhesion?: string;
    telephone?: string;
    selfie_photo_url?: string;
    photo_profil_url?: string;
    signature_url?: string;
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
        let foundMember = adhesionResponse.donnees?.formulaires?.find((adhesion: any) => 
          adhesion.id === parseInt(id) && adhesion.statut === 'APPROUVE'
        );
        
        // Si pas trouvé dans les adhésions normales, chercher dans les formulaires d'administrateur
        if (!foundMember) {
          try {
            const adminResponse = await apiService.getSecretaryAdminFormulaires();
            foundMember = adminResponse.donnees?.formulaires?.find((adminForm: any) => 
              adminForm.id === parseInt(id) && adminForm.statut === 'APPROUVE'
            );
            console.log("🔍 Recherche dans les formulaires admin pour ID:", id);
            if (foundMember) {
              console.log("✅ Membre administrateur trouvé:", foundMember);
            }
          } catch (adminError) {
            console.log("Erreur lors de la recherche dans les formulaires admin:", adminError);
          }
        }
        
        if (foundMember) {
          setMember(foundMember);
          
          // Récupérer les cartes de membres depuis l'API
          const cardsResponse = await apiService.getMemberCards();
          console.log("📋 Réponse cartes:", cardsResponse);
          console.log("📋 Cartes disponibles:", cardsResponse.cartes?.length || 0);
          
          // Pour les membres administrateur, utiliser l'ID utilisateur au lieu de l'ID formulaire
          const searchId = foundMember.utilisateur?.id || parseInt(id);
          console.log("🔍 ID de recherche:", searchId, "(utilisateur ID:", foundMember.utilisateur?.id, ", formulaire ID:", id, ")");
          
          // Essayer plusieurs méthodes de recherche
          let foundCard = cardsResponse.cartes?.find((card: any) => 
            card.id === searchId
          );
          
          // Si pas trouvé, essayer avec l'ID original
          if (!foundCard) {
            foundCard = cardsResponse.cartes?.find((card: any) => 
              card.id === parseInt(id)
            );
          }
          
          // Si pas trouvé, essayer avec string
          if (!foundCard) {
            foundCard = cardsResponse.cartes?.find((card: any) => 
              card.id === id || card.id === String(id)
            );
          }
          
          // Si pas trouvé, essayer avec comparaison lâche
          if (!foundCard) {
            foundCard = cardsResponse.cartes?.find((card: any) => 
              String(card.id) === String(id) || card.id == id
            );
          }
          
          console.log("🔍 Carte recherchée pour ID:", id, "(type:", typeof id, ")");
          console.log("🔍 ID converti:", parseInt(id), "(type:", typeof parseInt(id), ")");
          console.log("✅ Carte trouvée:", foundCard);
          
          if (foundCard) {
            setMemberCard(foundCard);
          } else {
            console.log("❌ Aucune carte trouvée pour ce membre");
            // Pour les membres administrateur, on peut utiliser les données du formulaire pour créer une carte virtuelle
            if (foundMember.type === 'ADMIN_PERSONNEL') {
              console.log("🔧 Membre administrateur détecté, création de carte virtuelle");
              // Créer une carte virtuelle avec les données du membre administrateur
              const virtualCard = {
                id: foundMember.id,
                carte_membre: {
                  recto_url: foundMember.url_fiche_formulaire || '',
                  verso_url: foundMember.url_fiche_formulaire || ''
                }
              };
              setMemberCard(virtualCard);
            } else {
              setError('Aucune carte générée pour ce membre');
            }
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
    if (!member) return;
    
    // Créer un objet membre avec les données nécessaires pour le téléchargement
    const memberForDownload: MemberForDownload = {
      nom_complet: member.nom_complet,
      carte_membre: {
        recto_url: memberCard?.carte_membre?.recto_url || '',
        verso_url: memberCard?.carte_membre?.verso_url || ''
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
      const rectoResult = await File.downloadFileAsync(
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
      const versoResult = await File.downloadFileAsync(
        member.carte_membre.verso_url,
        versoFile,
        {
          idempotent: true,
          headers: {
            'Accept': 'image/png'
          }
        }
      );

      if (rectoResult && versoResult) {
        // Sauvegarder recto
        const rectoAsset = await MediaLibrary.createAssetAsync(rectoResult.uri);
        await MediaLibrary.createAlbumAsync('Cartes Membres', rectoAsset, false);
        
        // Sauvegarder verso
        const versoAsset = await MediaLibrary.createAssetAsync(versoResult.uri);
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
            {(() => {
              const normalizedData = normalizeMemberData(member);
              const { donneesSnapshot } = normalizedData;
              
              return (
                <>
                  <Text style={styles.memberInfoText}>
                    • <Text style={styles.memberInfoLabel}>Numéro d'adhésion:</Text> {normalizedData.numeroAdhesion || 'Non renseigné'}
                  </Text>
                  <Text style={styles.memberInfoText}>
                    • <Text style={styles.memberInfoLabel}>Nom:</Text> {donneesSnapshot.nom || 'Non renseigné'}
                  </Text>
                  <Text style={styles.memberInfoText}>
                    • <Text style={styles.memberInfoLabel}>Prénom:</Text> {donneesSnapshot.prenoms || 'Non renseigné'}
                  </Text>
                  <Text style={styles.memberInfoText}>
                    • <Text style={styles.memberInfoLabel}>Profession:</Text> {donneesSnapshot.profession || 'Non renseigné'}
                  </Text>
                  <Text style={styles.memberInfoText}>
                    • <Text style={styles.memberInfoLabel}>Date de naissance:</Text> {donneesSnapshot.date_naissance || 'Non renseigné'}
                  </Text>
                  <Text style={styles.memberInfoText}>
                    • <Text style={styles.memberInfoLabel}>Téléphone:</Text> {donneesSnapshot.telephone || 'Non renseigné'}
                  </Text>
                </>
              );
            })()}
            
            {!showAllInfo && (
              <TouchableOpacity
                style={styles.showMoreButton}
                onPress={() => setShowAllInfo(true)}
              >
                <Text style={styles.showMoreButtonText}>Voir plus...</Text>
              </TouchableOpacity>
            )}

            {showAllInfo && (() => {
              // Utiliser normalizeMemberData pour obtenir les données unifiées
              const normalizedData = normalizeMemberData(member);
              const { donneesSnapshot } = normalizedData;
              
              // Debug: Log the normalized data
              console.log("🔍 Member raw data:", JSON.stringify(member, null, 2));
              console.log("🔍 Normalized data:", JSON.stringify(normalizedData, null, 2));
              console.log("🔍 donneesSnapshot:", JSON.stringify(donneesSnapshot, null, 2));
              
              // Fonction helper pour formater les dates au format DD/MM/YYYY
              const formatDate = (dateString: string): string => {
                if (!dateString) return '';
                try {
                  // Si c'est déjà au format DD/MM/YYYY, retourner tel quel
                  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
                    return dateString;
                  }
                  // Si c'est au format DD-MM-YYYY, convertir
                  if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
                    return dateString.replace(/-/g, '/');
                  }
                  // Si c'est au format ISO (YYYY-MM-DD), convertir
                  if (/^\d{4}-\d{2}-\d{2}/.test(dateString)) {
                    const date = new Date(dateString);
                    const day = date.getDate().toString().padStart(2, '0');
                    const month = (date.getMonth() + 1).toString().padStart(2, '0');
                    const year = date.getFullYear();
                    return `${day}/${month}/${year}`;
                  }
                  return dateString;
                } catch (error) {
                  return dateString;
                }
              };

              // Fonction helper pour obtenir le rôle d'affichage
              const getDisplayRole = () => {
                const role = member?.type === "ADMIN_PERSONNEL" ? member?.utilisateur?.role : member?.role;
                switch (role) {
                  case 'SECRETAIRE_GENERALE': return 'Secrétaire Générale';
                  case 'PRESIDENT': return 'Président';
                  case 'MEMBRE': return 'Membre';
                  default: return 'Membre';
                }
              };

              // Déterminer l'email et le nom d'utilisateur selon le type
              const email = member?.type === "ADMIN_PERSONNEL" 
                ? member?.utilisateur?.email || member?.email || '' 
                : member?.email || '';
              const nomUtilisateur = member?.type === "ADMIN_PERSONNEL" 
                ? member?.utilisateur?.nom_utilisateur || member?.nom_utilisateur || '' 
                : member?.nom_utilisateur || '';

              return (
              <>
                <Text style={styles.memberInfoText}>
                  • <Text style={styles.memberInfoLabel}>Lieu de naissance:</Text> {donneesSnapshot.lieu_naissance || 'Non renseigné'}
                </Text>
                <Text style={styles.memberInfoText}>
                  • <Text style={styles.memberInfoLabel}>Adresse:</Text> {donneesSnapshot.adresse || 'Non renseigné'}
                </Text>
                {email ? (
                  <Text style={styles.memberInfoText}>
                    • <Text style={styles.memberInfoLabel}>Email:</Text> {email}
                  </Text>
                ) : null}
                {nomUtilisateur ? (
                  <Text style={styles.memberInfoText}>
                    • <Text style={styles.memberInfoLabel}>Nom d&apos;utilisateur:</Text> {nomUtilisateur}
                  </Text>
                ) : null}
                <Text style={styles.memberInfoText}>
                  • <Text style={styles.memberInfoLabel}>Rôle:</Text> {getDisplayRole()}
                </Text>
                <Text style={styles.memberInfoText}>
                  • <Text style={styles.memberInfoLabel}>Numéro de carte d&apos;identité consulaire:</Text> {donneesSnapshot.numero_carte_consulaire || 'Non renseigné'}
                </Text>
                <Text style={styles.memberInfoText}>
                  • <Text style={styles.memberInfoLabel}>Date de délivrance de la carte:</Text> {formatDate(donneesSnapshot.date_emission_piece) || 'Non renseigné'}
                </Text>
                <Text style={styles.memberInfoText}>
                  • <Text style={styles.memberInfoLabel}>Date d&apos;entrée au Congo:</Text> {formatDate(donneesSnapshot.date_entree_congo) || 'Non renseigné'}
                </Text>
                <Text style={styles.memberInfoText}>
                  • <Text style={styles.memberInfoLabel}>Employeur:</Text> {donneesSnapshot.employeur_ecole || 'Non renseigné'}
                </Text>
                <Text style={styles.memberInfoText}>
                  • <Text style={styles.memberInfoLabel}>Nom du conjoint:</Text> {donneesSnapshot.nom_conjoint || 'Non renseigné'}
                </Text>
                <Text style={styles.memberInfoText}>
                  • <Text style={styles.memberInfoLabel}>Prénom du conjoint:</Text> {donneesSnapshot.prenom_conjoint || 'Non renseigné'}
                </Text>
                <Text style={styles.memberInfoText}>
                  • <Text style={styles.memberInfoLabel}>Nombre d&apos;enfants:</Text> {donneesSnapshot.nombre_enfants || 0}
                </Text>
                <Text style={styles.memberInfoText}>
                  • <Text style={styles.memberInfoLabel}>Statut:</Text> {member.statut === 'APPROUVE' ? 'Approuvé' : member.statut === 'EN_ATTENTE' ? 'En attente' : 'Rejeté'}
                </Text>
                {member.soumis_le ? (
                  <Text style={styles.memberInfoText}>
                    • <Text style={styles.memberInfoLabel}>Date de soumission:</Text> {new Date(member.soumis_le).toLocaleDateString('fr-FR')}
                  </Text>
                ) : null}
                {donneesSnapshot.commentaire ? (
                  <Text style={styles.memberInfoText}>
                    • <Text style={styles.memberInfoLabel}>Commentaire:</Text> {donneesSnapshot.commentaire}
                  </Text>
                ) : null}

                <TouchableOpacity
                  style={styles.showMoreButton}
                  onPress={() => setShowAllInfo(false)}
                >
                  <Text style={styles.showMoreButtonText}>Voir moins</Text>
                </TouchableOpacity>
              </>
              );
            })()}
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

