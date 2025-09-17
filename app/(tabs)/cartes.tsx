import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import ImageViewer from '../../components/ui/ImageViewer';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/apiService';

// Interface pour les données des cartes de membres
interface ApprovedMember {
  id: number;
  numero_adhesion: string | null;
  nom_complet: string;
  code_formulaire: string;
  url_qr_code: string | null;
  photo_profil_url: string | null;
  date_emission: string;
  signature_presidente_url: string;
  nom_presidente: string;
  carte_membre: {
    recto_url: string | null;
    verso_url: string | null;
    generee_le: string | null;
    generee_par: number | null;
  };
}

export default function CartesScreen() {
  const { user } = useAuth();
  const [approvedMembers, setApprovedMembers] = useState<ApprovedMember[]>([]);
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // États de pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  const loadApprovedMembers = useCallback(async () => {
    try {
      setLoading(true);
      // Récupérer les cartes de membres via l'API
      const response = await apiService.getMemberCards();
      const allMembers = response.cartes || [];
      // Filtrer pour exclure les membres avec numero_adhesion null
      const filteredMembers = allMembers.filter((member: ApprovedMember) => member.numero_adhesion !== null);
      setApprovedMembers(filteredMembers);
    } catch (error) {
      console.error('Erreur lors du chargement des cartes de membres:', error);
      setMessage({ type: 'error', text: 'Erreur lors du chargement des cartes' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'SECRETAIRE_GENERALE' || user?.role === 'PRESIDENT') {
      loadApprovedMembers();
    }
  }, [user, loadApprovedMembers]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Récupérer les cartes de membres via l'API
      const response = await apiService.getMemberCards();
      const allMembers = response.cartes || [];
      // Filtrer pour exclure les membres avec numero_adhesion null
      const filteredMembers = allMembers.filter((member: ApprovedMember) => member.numero_adhesion !== null);
      setApprovedMembers(filteredMembers);
      console.log(`📋 ${filteredMembers.length} cartes rechargées avec succès`);
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des cartes de membres:', error);
      setMessage({ type: 'error', text: 'Erreur lors du rafraîchissement des cartes' });
    } finally {
      setRefreshing(false);
    }
  }, []);


  // Calculer les membres filtrés avec useMemo pour éviter les re-rendus
  const filteredMembers = useMemo(() => {
    if (!searchTerm) return approvedMembers;
    
    const searchLower = searchTerm.toLowerCase();
    return approvedMembers.filter(member =>
      (member.nom_complet?.toLowerCase() || '').includes(searchLower) ||
      (member.numero_adhesion?.toLowerCase() || '').includes(searchLower) ||
      (member.code_formulaire?.toLowerCase() || '').includes(searchLower)
    );
  }, [approvedMembers, searchTerm]);

  // Calculer la pagination avec useMemo
  const paginationData = useMemo(() => {
    const totalItems = filteredMembers.length;
    const totalPagesCount = Math.ceil(totalItems / itemsPerPage);
    
    // Réinitialiser à la page 1 si la page courante dépasse le nombre total de pages
    let adjustedCurrentPage = currentPage;
    if (currentPage > totalPagesCount && totalPagesCount > 0) {
      adjustedCurrentPage = 1;
    }
    
    const startIndex = (adjustedCurrentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedMembers = filteredMembers.slice(startIndex, endIndex);
    
    return {
      paginatedMembers,
      totalPagesCount,
      adjustedCurrentPage,
      totalItems
    };
  }, [filteredMembers, currentPage, itemsPerPage]);

  // Mettre à jour les états de pagination avec useEffect
  useEffect(() => {
    setTotalPages(paginationData.totalPagesCount);
    if (paginationData.adjustedCurrentPage !== currentPage) {
      setCurrentPage(paginationData.adjustedCurrentPage);
    }
  }, [paginationData.totalPagesCount, paginationData.adjustedCurrentPage, currentPage]);

  // Fonctions de navigation de pagination
  const goToPage = (page: number) => {
    const totalPagesCount = paginationData.totalPagesCount;
    
    if (page >= 1 && page <= totalPagesCount) {
      setCurrentPage(page);
    }
  };

  const goToNextPage = () => {
    goToPage(currentPage + 1);
  };

  const goToPreviousPage = () => {
    goToPage(currentPage - 1);
  };

  const goToFirstPage = () => {
    goToPage(1);
  };

  const goToLastPage = () => {
    goToPage(paginationData.totalPagesCount);
  };

  // Réinitialiser la pagination quand la recherche change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Réinitialiser la pagination quand les données changent
  useEffect(() => {
    setCurrentPage(1);
  }, [approvedMembers]);

  const handleSelectCard = (memberId: string) => {
    const newSelected = new Set(selectedCards);
    if (newSelected.has(memberId)) {
      newSelected.delete(memberId);
    } else {
      newSelected.add(memberId);
    }
    setSelectedCards(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedCards.size === filteredMembers.length) {
      setSelectedCards(new Set());
    } else {
      setSelectedCards(new Set(filteredMembers.map(member => member.id.toString())));
    }
  };

  // Fonction pour vérifier si tous les éléments de la page courante sont sélectionnés
  const isAllCurrentPageSelected = () => {
    return paginationData.paginatedMembers.every(member => selectedCards.has(member.id.toString()));
  };

  // Fonction pour sélectionner/désélectionner tous les éléments de la page courante
  const handleSelectCurrentPage = () => {
    const newSelected = new Set(selectedCards);
    
    if (isAllCurrentPageSelected()) {
      // Désélectionner tous les éléments de la page courante
      paginationData.paginatedMembers.forEach(member => {
        newSelected.delete(member.id.toString());
      });
    } else {
      // Sélectionner tous les éléments de la page courante
      paginationData.paginatedMembers.forEach(member => {
        newSelected.add(member.id.toString());
      });
    }
    
    setSelectedCards(newSelected);
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

  // Fonction pour télécharger une image PNG individuelle
  const downloadPNG = async (imageUrl: string, memberName: string, cardType: 'recto' | 'verso') => {
    try {
      setDownloading(true);
      setDownloadProgress(0);
      
      // Demander les permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Permission nécessaire pour sauvegarder l\'image');
        return;
      }

      // Télécharger l'image
      const fileName = `${memberName}_${cardType}.png`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      const downloadResult = await FileSystem.downloadAsync(
        imageUrl,
        fileUri,
        {
          headers: {
            'Accept': 'image/png'
          }
        }
      );

      if (downloadResult.status === 200) {
        // Sauvegarder dans la galerie
        const asset = await MediaLibrary.createAssetAsync(fileUri);
        await MediaLibrary.createAlbumAsync('Cartes Membres', asset, false);
        
        Alert.alert('Succès', `Image ${cardType} de ${memberName} téléchargée`);
      } else {
        Alert.alert('Erreur', 'Impossible de télécharger l\'image');
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement PNG:', error);
      Alert.alert('Erreur', 'Erreur lors du téléchargement');
    } finally {
      setDownloading(false);
      setDownloadProgress(0);
    }
  };

  // Fonction pour télécharger toutes les images PNG sélectionnées
  const downloadAllPNG = async () => {
    if (selectedCards.size === 0) {
      Alert.alert('Aucune sélection', 'Veuillez sélectionner au moins une carte');
      return;
    }

    try {
      setDownloading(true);
      setDownloadProgress(0);
      
      // Demander les permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Permission nécessaire pour sauvegarder les images');
        return;
      }

      const selectedMembers = approvedMembers.filter(member => 
        selectedCards.has(member.id.toString())
      );

      let downloadedCount = 0;
      const totalMembers = selectedMembers.length;

      for (const member of selectedMembers) {
        // Vérifier que les deux images existent
        if (member.carte_membre.recto_url && member.carte_membre.verso_url) {
          // Télécharger les deux images
          const rectoFileName = `${member.nom_complet}_recto_temp.png`;
          const versoFileName = `${member.nom_complet}_verso_temp.png`;
          const rectoUri = `${FileSystem.documentDirectory}${rectoFileName}`;
          const versoUri = `${FileSystem.documentDirectory}${versoFileName}`;
          
          // Télécharger recto
          await FileSystem.downloadAsync(member.carte_membre.recto_url, rectoUri);
          
          // Télécharger verso
          await FileSystem.downloadAsync(member.carte_membre.verso_url, versoUri);
          
          // Sauvegarder recto
          const rectoAsset = await MediaLibrary.createAssetAsync(rectoUri);
          await MediaLibrary.createAlbumAsync('Cartes Membres', rectoAsset, false);
          
          // Sauvegarder verso
          const versoAsset = await MediaLibrary.createAssetAsync(versoUri);
          await MediaLibrary.createAlbumAsync('Cartes Membres', versoAsset, false);
          
          downloadedCount++;
          setDownloadProgress((downloadedCount / totalMembers) * 100);
        } else if (member.carte_membre.recto_url) {
          // Si seulement recto existe
          const fileName = `${member.nom_complet}_recto.png`;
          const fileUri = `${FileSystem.documentDirectory}${fileName}`;
          
          await FileSystem.downloadAsync(member.carte_membre.recto_url, fileUri);
          const asset = await MediaLibrary.createAssetAsync(fileUri);
          await MediaLibrary.createAlbumAsync('Cartes Membres', asset, false);
          
          downloadedCount++;
          setDownloadProgress((downloadedCount / totalMembers) * 100);
        } else if (member.carte_membre.verso_url) {
          // Si seulement verso existe
          const fileName = `${member.nom_complet}_verso.png`;
          const fileUri = `${FileSystem.documentDirectory}${fileName}`;
          
          await FileSystem.downloadAsync(member.carte_membre.verso_url, fileUri);
          const asset = await MediaLibrary.createAssetAsync(fileUri);
          await MediaLibrary.createAlbumAsync('Cartes Membres', asset, false);
          
          downloadedCount++;
          setDownloadProgress((downloadedCount / totalMembers) * 100);
        }
      }

      Alert.alert('Succès', `${downloadedCount} cartes téléchargées`);
    } catch (error) {
      console.error('Erreur lors du téléchargement groupé PNG:', error);
      Alert.alert('Erreur', 'Erreur lors du téléchargement groupé');
    } finally {
      setDownloading(false);
      setDownloadProgress(0);
    }
  };

  // Fonction pour télécharger une carte complète (recto + verso) en PNG
  const downloadCompletePNG = async (member: ApprovedMember) => {
    try {
      setDownloading(true);
      setDownloadProgress(0);
      
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
      const rectoUri = `${FileSystem.documentDirectory}${rectoFileName}`;
      const versoUri = `${FileSystem.documentDirectory}${versoFileName}`;
      
      // Télécharger recto
      const rectoResult = await FileSystem.downloadAsync(
        member.carte_membre.recto_url,
        rectoUri,
        {
          headers: {
            'Accept': 'image/png'
          }
        }
      );

      // Télécharger verso
      const versoResult = await FileSystem.downloadAsync(
        member.carte_membre.verso_url,
        versoUri,
        {
          headers: {
            'Accept': 'image/png'
          }
        }
      );

      if (rectoResult.status === 200 && versoResult.status === 200) {
        // Créer une image combinée (pour l'instant, on va sauvegarder les deux séparément)
        // Dans une vraie implémentation, on utiliserait une bibliothèque comme react-native-image-manipulator
        // pour combiner les images côte à côte
        
        // Sauvegarder recto
        const rectoAsset = await MediaLibrary.createAssetAsync(rectoUri);
        await MediaLibrary.createAlbumAsync('Cartes Membres', rectoAsset, false);
        
        // Sauvegarder verso
        const versoAsset = await MediaLibrary.createAssetAsync(versoUri);
        await MediaLibrary.createAlbumAsync('Cartes Membres', versoAsset, false);
        
        Alert.alert('Succès', `Carte complète de ${member.nom_complet} téléchargée (recto + verso)`);
      } else {
        Alert.alert('Erreur', 'Impossible de télécharger les images');
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement PNG complet:', error);
      Alert.alert('Erreur', 'Erreur lors du téléchargement');
    } finally {
      setDownloading(false);
      setDownloadProgress(0);
    }
  };

  // Fonction pour créer et télécharger un PDF individuel
  const downloadPDF = async (member: ApprovedMember) => {
    try {
      setDownloading(true);
      
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
      setDownloading(false);
    }
  };

  // Fonction pour créer et télécharger un PDF groupé
  const downloadAllPDF = async () => {
    if (selectedCards.size === 0) {
      Alert.alert('Aucune sélection', 'Veuillez sélectionner au moins une carte');
      return;
    }

    try {
      setDownloading(true);
      
      const selectedMembers = approvedMembers.filter(member => 
        selectedCards.has(member.id.toString())
      );

      // Créer le contenu HTML pour le PDF groupé avec les images intégrées
      let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Cartes Membres - Groupe</title>
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
            .member-section { 
              page-break-after: always; 
              margin-bottom: 40px; 
              background-color: white;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .member-info { 
              margin-bottom: 20px; 
            }
            .card-section { 
              margin-bottom: 30px; 
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
            .member-name {
              color: #007AFF;
              font-size: 24px;
              margin-bottom: 20px;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="color: #007AFF; margin-bottom: 10px;">Cartes Membres</h1>
            <p style="color: #333; font-size: 18px; margin: 0;">Total: ${selectedMembers.length} membres</p>
          </div>
      `;

      for (const member of selectedMembers) {
        htmlContent += `
          <div class="member-section">

            <div class="member-info">
              <div class="info-row">
                <span class="info-label">Nom complet :</span>
                <span class="info-value"> ${member.nom_complet}</span>                
                <span class="info-label">Numéro d'adhésion:</span>
                <span class="info-value"> ${member.numero_adhesion}</span>
              </div>
            </div>
            
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
          </div>
        `;
      }

      htmlContent += `
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
          dialogTitle: `Cartes Membres - Groupe (${selectedMembers.length} membres)`
        });
      } else {
        Alert.alert('Partage non disponible', 'Le partage de fichiers n\'est pas disponible sur cet appareil');
      }
    } catch (error) {
      console.error('Erreur lors de la création du PDF groupé:', error);
      Alert.alert('Erreur', 'Erreur lors de la création du PDF groupé');
    } finally {
      setDownloading(false);
    }
  };

  // Fonction pour ouvrir le menu de téléchargement individuel
  const openDownloadMenu = (member: ApprovedMember) => {
    Alert.alert(
      `Télécharger Carte de ${member.nom_complet}`,
      'Choisissez le format de téléchargement:',
      [
        {
          text: 'PNG',
          onPress: () => downloadCompletePNG(member)
        },
        {
          text: 'PDF',
          onPress: () => downloadPDF(member)
        },
        {
          text: 'Annuler',
          style: 'cancel'
        }
      ]
    );
  };

  // Vérifier les permissions
  if (!user || (user.role !== 'SECRETAIRE_GENERALE' && user.role !== 'PRESIDENT')) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
          <Text style={styles.errorText}>
            Vous n'avez pas les permissions pour accéder à cette page.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement des cartes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Composant de contrôles de pagination
  const PaginationControls = () => {
    const totalItems = paginationData.totalItems;
    const totalPagesCount = paginationData.totalPagesCount;
    
    if (totalPagesCount <= 1) return null;

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
      <View style={styles.paginationContainer}>
        <View style={styles.paginationInfo}>
          <Text style={styles.paginationText}>
            {startItem}-{endItem} sur {totalItems} membres
          </Text>
          <Text style={styles.cardsCountText}>
            {totalItems === 1 
              ? `1 carte trouvée`
              : totalItems <= itemsPerPage
              ? `${totalItems} cartes au total`
              : `Page ${currentPage} sur ${totalPagesCount} - ${totalItems} cartes au total`
            }
          </Text>
        </View>
        
        <View style={styles.paginationControls}>
          <TouchableOpacity
            style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
            onPress={goToFirstPage}
            disabled={currentPage === 1}
          >
            <Ionicons name="chevron-back" size={20} color={currentPage === 1 ? "#999" : "#007AFF"} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
            onPress={goToPreviousPage}
            disabled={currentPage === 1}
          >
            <Ionicons name="chevron-back-outline" size={20} color={currentPage === 1 ? "#999" : "#007AFF"} />
          </TouchableOpacity>
          
          <View style={styles.pageIndicator}>
            <Text style={styles.pageIndicatorText}>
              {currentPage} / {totalPagesCount}
            </Text>
          </View>
          
          <TouchableOpacity
            style={[styles.paginationButton, currentPage === totalPagesCount && styles.paginationButtonDisabled]}
            onPress={goToNextPage}
            disabled={currentPage === totalPagesCount}
          >
            <Ionicons name="chevron-forward-outline" size={20} color={currentPage === totalPagesCount ? "#999" : "#007AFF"} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.paginationButton, currentPage === totalPagesCount && styles.paginationButtonDisabled]}
            onPress={goToLastPage}
            disabled={currentPage === totalPagesCount}
          >
            <Ionicons name="chevron-forward" size={20} color={currentPage === totalPagesCount ? "#999" : "#007AFF"} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.itemsPerPageContainer}>
          <Text style={styles.itemsPerPageLabel}>Éléments par page:</Text>
          <View style={styles.itemsPerPageButtons}>
            {[5, 10, 20, 50].map((count) => (
              <TouchableOpacity
                key={count}
                style={[
                  styles.itemsPerPageButton,
                  itemsPerPage === count && styles.itemsPerPageButtonActive
                ]}
                onPress={() => {
                  setItemsPerPage(count);
                  setCurrentPage(1);
                }}
              >
                <Text style={[
                  styles.itemsPerPageButtonText,
                  itemsPerPage === count && styles.itemsPerPageButtonTextActive
                ]}>
                  {count}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderMemberCard = ({ item }: { item: ApprovedMember }) => (
    <View style={styles.cardContainer}>
      {/* En-tête avec checkbox et informations */}
      <View style={styles.cardHeader}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => handleSelectCard(item.id.toString())}
        >
          <Ionicons
            name={selectedCards.has(item.id.toString()) ? 'checkbox' : 'square-outline'}
            size={24}
            color="#007AFF"
          />
        </TouchableOpacity>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>
            {item.nom_complet || 'Nom non disponible'}
          </Text>
        </View>
        
                 {/* Boutons de téléchargement individuel */}
         <View style={styles.individualActions}>
           <TouchableOpacity
             style={[styles.actionButton, styles.pngButton]}
             onPress={() => openDownloadMenu(item)}
             disabled={downloading}
           >
             <Ionicons name="download" size={16} color="white" />
           </TouchableOpacity>
         </View>
      </View>

      {/* Affichage Recto et Verso côte à côte */}
      <View style={styles.cardsContainer}>
        {/* Carte Recto */}
        <View style={styles.cardWrapper}>
          <Text style={styles.cardLabel}>Recto</Text>
          <View style={styles.cardImageContainer}>
            {item.carte_membre.recto_url ? (
              <TouchableOpacity
                style={styles.imageTouchable}
                onPress={() => handleImagePress(item.carte_membre.recto_url!)}
              >
                <Image
                  source={{ uri: item.carte_membre.recto_url }}
                  style={styles.cardImage}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            ) : (
              <View style={styles.noCardContainer}>
                <Ionicons name="card-outline" size={48} color="#999" />
                <Text style={styles.noCardText}>Carte recto non générée</Text>
              </View>
            )}
          </View>
          

        </View>

        {/* Carte Verso */}
        <View style={styles.cardWrapper}>
          <Text style={styles.cardLabel}>Verso</Text>
          <View style={styles.cardImageContainer}>
            {item.carte_membre.verso_url ? (
              <TouchableOpacity
                style={styles.imageTouchable}
                onPress={() => handleImagePress(item.carte_membre.verso_url!)}
              >
                <Image
                  source={{ uri: item.carte_membre.verso_url }}
                  style={styles.cardImage}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            ) : (
              <View style={styles.noCardContainer}>
                <Ionicons name="card-outline" size={48} color="#999" />
                <Text style={styles.noCardText}>Carte verso non générée</Text>
              </View>
            )}
          </View>
          

        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Cartes de Membres</Text>
      
      {message && (
        <View style={[
          styles.messageContainer,
          message.type === 'success' ? styles.successMessage : styles.errorMessage
        ]}>
          <Ionicons 
            name={message.type === 'success' ? 'checkmark-circle' : 'alert-circle'} 
            size={20} 
            color="white" 
          />
          <Text style={styles.messageText}>{message.text}</Text>
        </View>
      )}

      {/* Barre de sélection avec boutons de téléchargement */}
      <View style={styles.selectionContainer}>
        <View style={styles.selectionHeader}>
          <View style={styles.selectionInfo}>
            <Text style={styles.selectionTitle}>
              {filteredMembers.length === 1 
                ? `1 carte disponible`
                : `${filteredMembers.length} cartes disponibles`
              }
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={handleSelectAll}
          >
            <View style={styles.checkboxWrapper}>
              <Ionicons
                name={
                  selectedCards.size === filteredMembers.length && filteredMembers.length > 0
                    ? 'checkbox'
                    : selectedCards.size > 0 && selectedCards.size < filteredMembers.length
                    ? 'remove-circle'
                    : 'square-outline'
                }
                size={24}
                color="#007AFF"
              />
            </View>
            <Text style={styles.selectionLabel}>
              Sélectionner tout ({selectedCards.size}/{filteredMembers.length})
            </Text>
          </TouchableOpacity>
          
          {filteredMembers.length > itemsPerPage && (
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={handleSelectCurrentPage}
            >
              <View style={styles.checkboxWrapper}>
                <Ionicons
                  name={
                    isAllCurrentPageSelected()
                      ? 'checkbox'
                      : paginationData.paginatedMembers.some(member => selectedCards.has(member.id.toString()))
                      ? 'remove-circle'
                      : 'square-outline'
                  }
                  size={24}
                  color="#007AFF"
                />
              </View>
              <Text style={styles.selectionLabel}>
                Page courante ({paginationData.paginatedMembers.filter(member => selectedCards.has(member.id.toString())).length}/{paginationData.paginatedMembers.length})
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        {selectedCards.size > 0 && (
          <View style={styles.downloadButtons}>
            <TouchableOpacity
              style={[styles.downloadButton, styles.downloadButtonMain]}
              onPress={() => {
                Alert.alert(
                  'Télécharger en lot',
                  'Choisissez le format de téléchargement:',
                  [
                    {
                      text: 'PNG',
                      onPress: downloadAllPNG
                    },
                    {
                      text: 'PDF',
                      onPress: downloadAllPDF
                    },
                    {
                      text: 'Annuler',
                      style: 'cancel'
                    }
                  ]
                );
              }}
              disabled={downloading}
            >
              <Ionicons name="download" size={16} color="white" />
              <Text style={styles.downloadButtonText}>Tout télécharger</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher par nom, numéro d'adhésion ou code formulaire..."
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
      </View>

      {/* Contrôles de pagination */}
      <PaginationControls />

      <FlatList
        data={paginationData.paginatedMembers}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={renderMemberCard}
        keyExtractor={(item) => item.id.toString()}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {!loading && filteredMembers.length === 0 && (
        <View style={styles.emptyContainer}>
          <Ionicons name="card-outline" size={64} color="#999" />
          <Text style={styles.emptyTitle}>
            Aucune carte de membre disponible
          </Text>
          <Text style={styles.emptyText}>
            {searchTerm ? 'Aucun membre ne correspond à votre recherche' : 'Les cartes apparaîtront ici une fois qu\'elles seront générées'}
          </Text>
        </View>
      )}

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 8,
  },
  successMessage: {
    backgroundColor: '#4CAF50',
  },
  errorMessage: {
    backgroundColor: '#F44336',
  },
  messageText: {
    color: 'white',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  selectionContainer: {
    backgroundColor: 'white',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  selectionHeader: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  selectionInfo: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  selectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  checkboxWrapper: {
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
    height: 24,
  },
  selectionLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  downloadButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
      downloadButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
  downloadButtonMain: {
    backgroundColor: '#007AFF',
    width: 170,
    alignSelf: 'center',
  },
    pngButton: {
      backgroundColor: '#007AFF',
    },
  pdfButton: {
    backgroundColor: '#007AFF',
  },
  downloadButtonText: {
    color: 'white',
    fontSize: 14,
    marginLeft: 8,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  cardContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  checkbox: {
    marginRight: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  memberDetails: {
    fontSize: 14,
    color: '#666',
  },
  individualActions: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    marginLeft: 4,
  },
  cardsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  cardWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  cardImageContainer: {
    width: "100%",
    height: 100,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    backgroundColor: 'white',
  },
  imageTouchable: {
    flex: 1,
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  
  noCardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  noCardText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
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
  // Styles de pagination
  paginationContainer: {
    backgroundColor: 'white',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  paginationInfo: {
    alignItems: 'center',
    marginBottom: 12,
  },
  paginationText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  cardsCountText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '400',
    marginTop: 4,
    textAlign: 'center',
  },
  paginationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  paginationButton: {
    padding: 8,
    marginHorizontal: 4,
    borderRadius: 6,
    backgroundColor: '#F5F5F5',
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paginationButtonDisabled: {
    backgroundColor: '#F0F0F0',
  },
  pageIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 6,
    marginHorizontal: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  pageIndicatorText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemsPerPageContainer: {
    alignItems: 'center',
  },
  itemsPerPageLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  itemsPerPageButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  itemsPerPageButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  itemsPerPageButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  itemsPerPageButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  itemsPerPageButtonTextActive: {
    color: 'white',
  },
});
