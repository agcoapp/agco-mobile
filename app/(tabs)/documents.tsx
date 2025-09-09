import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/apiService';


// Interface pour les documents
interface Document {
  id: number;
  titre: string;
  description?: string;
  telecharge_le: string;
  type_document: string;
  url_cloudinary: string;
  cloudinary_id?: string;
  nom_fichier_original: string;
  est_actif: boolean;
}

export default function DocumentsScreen() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    category: 'pv' as 'pv' | 'comptesRendus' | 'decisions' | 'reglement',
    selectedFile: null as DocumentPicker.DocumentPickerAsset | null,
    fileName: '',
    fileSize: 0
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const [newlyAddedDocument, setNewlyAddedDocument] = useState<string | null>(null);
  const [deletedDocument, setDeletedDocument] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [refreshing, setRefreshing] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [documents, setDocuments] = useState<{
    pv: Document[];
    comptesRendus: Document[];
    decisions: Document[];
    reglement: Document | null;
  }>({
    pv: [],
    comptesRendus: [],
    decisions: [],
    reglement: null
  });
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Vérifier que le composant est monté côté client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Retirer le marquage du document nouvellement ajouté après 5 secondes
  useEffect(() => {
    if (newlyAddedDocument) {
      const timer = setTimeout(() => {
        setNewlyAddedDocument(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [newlyAddedDocument]);

  // Fonction utilitaire pour extraire les messages d'erreur de l'API
  const extractErrorMessage = (error: any, defaultMessage: string): { message: string; details: string | null } => {
    let message = defaultMessage;
    let details = null;
    
    if (error?.response?.data?.message) {
      message = error.response.data.message;
    } else if (error?.response?.data?.erreur) {
      message = error.response.data.erreur;
    } else if (error?.response?.data?.detail) {
      message = error.response.data.detail;
    } else if (error?.response?.data?.error) {
      message = error.response.data.error;
    } else if (error.message) {
      message = error.message;
    } else if (error.erreur) {
      message = error.erreur;
    } else if (error.details) {
      message = error.details;
    } else if (error.error && error.error.message) {
      message = error.error.message;
    }
    
    const detailsParts = [];
    
    if (error?.response?.status) {
      detailsParts.push(`Status HTTP: ${error.response.status}`);
    }
    if (error?.response?.statusText) {
      detailsParts.push(`Status Text: ${error.response.statusText}`);
    }
    if (error?.response?.data?.code) {
      detailsParts.push(`Code d'erreur API: ${error.response.data.code}`);
    } else if (error.code) {
      detailsParts.push(`Code d'erreur: ${error.code}`);
    }
    if (error?.config?.url) {
      detailsParts.push(`URL: ${error.config.url}`);
    }
    if (error?.config?.method) {
      detailsParts.push(`Méthode: ${error.config.method.toUpperCase()}`);
    }
    if (error?.response?.data?.details && error.response.data.details !== message) {
      detailsParts.push(`Détails API: ${error.response.data.details}`);
    }
    
    detailsParts.push(`Timestamp: ${new Date().toLocaleString('fr-FR')}`);
    
    if (detailsParts.length > 0) {
      details = detailsParts.join('\n');
    }
    
    return { message, details };
  };

  const loadDocuments = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setDocumentsLoading(true);
      }
      const response = await apiService.getTextesOfficiels();
      const allDocuments = response.documents;
      
      const categorizedDocuments = {
        pv: allDocuments.filter((doc: any) => doc.type_document === 'PV_REUNION').sort((a: any, b: any) => 
          new Date(b.telecharge_le).getTime() - new Date(a.telecharge_le).getTime()
        ) as Document[],
        comptesRendus: allDocuments.filter((doc: any) => doc.type_document === 'COMPTE_RENDU').sort((a: any, b: any) => 
          new Date(b.telecharge_le).getTime() - new Date(a.telecharge_le).getTime()
        ) as Document[],
        decisions: allDocuments.filter((doc: any) => doc.type_document === 'DECISION').sort((a: any, b: any) => 
          new Date(b.telecharge_le).getTime() - new Date(a.telecharge_le).getTime()
        ) as Document[],
        reglement: allDocuments.find((doc: any) => doc.type_document === 'REGLEMENT_INTERIEUR') as Document | null
      };
      
      setDocuments(categorizedDocuments);
    } catch (error: any) {
      console.error('Erreur lors du chargement des documents:', error);
      
      const errorInfo = extractErrorMessage(error, 'Erreur lors du chargement des documents.');
      setToastMessage(errorInfo.message);
      setErrorDetails(errorInfo.details);
      setToastType('error');
      setShowToast(true);
    } finally {
      if (showLoading) {
        setDocumentsLoading(false);
      }
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadDocuments(false); // Recharger sans afficher le loading
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error);
    } finally {
      setRefreshing(false);
    }
  }, [loadDocuments]);

  // Charger les documents depuis localStorage au montage du composant
  useEffect(() => {
    if (mounted) {
      loadDocuments(true);
    }
  }, [mounted, loadDocuments]);

  const handleTabChange = (newValue: number) => {
    setTabValue(newValue);
  };

  const handleViewDocument = (document: Document) => {
    console.log('Opening document:', document.titre, 'URL:', document.url_cloudinary);
    setSelectedDocument(document);
    setShowDocumentModal(true);
  };

  const handleCloseModal = () => {
    setShowDocumentModal(false);
    setSelectedDocument(null);
  };

  const handleOpenInBrowser = async () => {
    if (selectedDocument?.url_cloudinary) {
      try {
        await WebBrowser.openBrowserAsync(selectedDocument.url_cloudinary, {
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
          controlsColor: '#007AFF',
        });
      } catch (error) {
        console.error('Error opening PDF in browser:', error);
        setToastMessage('Erreur lors de l\'ouverture du PDF dans le navigateur');
        setToastType('error');
        setShowToast(true);
      }
    }
  };

  // Fonction pour sélectionner un fichier PDF
  const handleSelectPDF = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        console.log('Fichier sélectionné:', file);
        
        // Stocker le fichier sélectionné sans l'uploader immédiatement
        setUploadForm(prev => ({
          ...prev,
          selectedFile: file,
          fileName: file.name || `document_${Date.now()}.pdf`,
          fileSize: file.size || 0
        }));
        
        setToastMessage('Fichier PDF sélectionné avec succès !');
        setToastType('success');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Erreur lors de la sélection du fichier:', error);
      setToastMessage('Erreur lors de la sélection du fichier PDF');
      setToastType('error');
      setShowToast(true);
    }
  };

  // Fonction pour uploader vers Cloudinary
  const uploadToCloudinary = async (file: DocumentPicker.DocumentPickerAsset) => {
    // Configuration Cloudinary
    const cloudName = 'dtqxhyqtp'; // Votre cloud name Cloudinary
    const uploadPreset = 'sgm_preset_textes_officiels'; // Votre upload preset
    
    // Créer le nom du fichier avec timestamp
    const timestamp = Date.now();
    const fileName = `texte_officiel_${uploadForm.category}_${timestamp}.pdf`;
    
    // URL d'upload Cloudinary
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;
    
    // Préparer les données de l'upload
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      type: 'application/pdf',
      name: fileName,
    } as any);
    formData.append('upload_preset', uploadPreset);
    formData.append('public_id', `${uploadForm.category}/${fileName}`);
    formData.append('resource_type', 'raw');
    
    console.log('Upload vers Cloudinary en cours...');
    
    // Effectuer l'upload
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Erreur upload Cloudinary: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Upload réussi:', result);
    
    // Retourner les données Cloudinary
    return {
      cloudinaryUrl: result.secure_url,
      cloudinaryId: result.public_id,
      fileSize: result.bytes || file.size || 0,
      fileName: fileName
    };
  };

  // Fonction de formatage des dates avec heure
  const formatDateWithTime = (dateString: string) => {
    const date = new Date(dateString);
    const dateFormatted = date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const timeFormatted = `${hours}h:${minutes}min:${seconds}s`;
    
    return `le ${dateFormatted} à ${timeFormatted}`;
  };

  // Fonction de filtrage des documents
  const filterDocuments = (documents: Document[]) => {
    if (!searchTerm.trim() && !dateFilter) return documents;
    
    let filtered = documents;

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.titre.toLowerCase().includes(searchLower) ||
        doc.description?.toLowerCase().includes(searchLower) ||
        doc.nom_fichier_original.toLowerCase().includes(searchLower)
      );
    }

    if (dateFilter) {
      filtered = filtered.filter(doc => 
        new Date(doc.telecharge_le).toISOString().startsWith(dateFilter)
      );
    }
    
    return filtered.sort((a, b) => 
      new Date(b.telecharge_le).getTime() - new Date(a.telecharge_le).getTime()
    );
  };

  // Fonction pour effacer tous les filtres
  const clearFilters = () => {
    setSearchTerm('');
    setDateFilter('');
  };

  // Fonction pour générer les styles des éléments de liste
  const getListItemStyles = (docTitle: string) => {
    const isNewlyAdded = newlyAddedDocument === docTitle;
    const isDeleted = deletedDocument === docTitle;
    
    return {
      borderWidth: (isNewlyAdded || isDeleted) ? 2 : 1,
      borderColor: isNewlyAdded ? '#34C759' : isDeleted ? '#FF3B30' : '#E0E0E0',
      backgroundColor: isNewlyAdded ? '#e8f5e8' : isDeleted ? '#ffebee' : 'white',
      shadowColor: isNewlyAdded ? '#34C759' : isDeleted ? '#FF3B30' : '#000',
      shadowOpacity: (isNewlyAdded || isDeleted) ? 0.3 : 0.1,
    };
  };

  // Fonctions pour l'upload de documents
  const handleUploadModalOpen = () => {
    setShowUploadModal(true);
  };

  const handleUploadModalClose = () => {
    setShowUploadModal(false);
    setUploadForm({
      title: '',
      description: '',
      category: 'pv',
      selectedFile: null,
      fileName: '',
      fileSize: 0
    });
    setNewlyAddedDocument(null);
    setDateFilter('');
  };

  const handleDeleteDocument = (document: Document) => {
    setDocumentToDelete(document);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setShowDeleteModal(false);
    if (documentToDelete) {
      try {
        setDeletedDocument(documentToDelete.titre);
        
        setTimeout(async () => {
          try {
            await apiService.deleteTexteOfficiel(documentToDelete.id);
            
            loadDocuments(false);
            setDocumentToDelete(null);
            setDeletedDocument(null);
            
            setToastMessage('Document supprimé avec succès !');
            setToastType('success');
            setShowToast(true);
          } catch (error: any) {
            console.error('Erreur lors de la suppression du document:', error);
            
            const errorInfo = extractErrorMessage(error, 'Erreur lors de la suppression du document.');
            setToastMessage(errorInfo.message);
            setErrorDetails(errorInfo.details);
            setToastType('error');
            setShowToast(true);
          }
        }, 500);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDocumentToDelete(null);
  };

  const handleUploadSubmit = async () => {
    if (!uploadForm.title.trim() || !uploadForm.description.trim() || !uploadForm.selectedFile) {
      setToastMessage('Veuillez remplir tous les champs et sélectionner un fichier PDF.');
      setToastType('error');
      setShowToast(true);
      return;
    }

    try {
      setIsUploading(true);
      
      // 1. D'abord uploader vers Cloudinary
      const cloudinaryData = await uploadToCloudinary(uploadForm.selectedFile);
      
      // 2. Ensuite envoyer à l'API
      const newDocumentData = {
        titre: uploadForm.title,
        description: uploadForm.description,
        type_document: (uploadForm.category === 'pv' ? 'PV_REUNION' : 
                      uploadForm.category === 'comptesRendus' ? 'COMPTE_RENDU' :
                      uploadForm.category === 'decisions' ? 'DECISION' : 'REGLEMENT_INTERIEUR') as 'PV_REUNION' | 'COMPTE_RENDU' | 'DECISION' | 'REGLEMENT_INTERIEUR',
        url_cloudinary: cloudinaryData.cloudinaryUrl,
        cloudinary_id: cloudinaryData.cloudinaryId,
        nom_fichier_original: cloudinaryData.fileName,
        taille_fichier: cloudinaryData.fileSize
      };

      await apiService.createTexteOfficiel(newDocumentData);

      const tabIndexMap = {
        'pv': 0,
        'comptesRendus': 1,
        'decisions': 2,
        'reglement': 3
      };
      setTabValue(tabIndexMap[uploadForm.category]);

      setNewlyAddedDocument(newDocumentData.titre);
      await loadDocuments(false);

      setToastMessage('Texte officiel ajouté !');
      setToastType('success');
      setShowToast(true);

      setTimeout(() => {
        setShowToast(true);
      }, 1000);

      handleUploadModalClose();
    } catch (error: any) {
      console.error('Erreur lors du téléversement:', error);
      
      const errorInfo = extractErrorMessage(error, 'Erreur lors du téléversement du document.');
      setToastMessage(errorInfo.message);
      setErrorDetails(errorInfo.details);
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsUploading(false);
    }
  };

  // Afficher un indicateur de chargement
  if (documentsLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement des documents...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.content}>
          {/* Bouton de retour */}
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
          
          {/* Titre */}
          <Text style={styles.title}>Textes Officiels de l'association</Text>

          {/* Champ de recherche et bouton d'upload */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher dans les textes officiels..."
                value={searchTerm}
                onChangeText={setSearchTerm}
              />
            </View>
            
            {/* Bouton d'upload pour le secrétaire général */}
            {user?.role === 'SECRETAIRE_GENERALE' && (
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={handleUploadModalOpen}
              >
                <Ionicons name="cloud-upload-outline" size={20} color="white" />
                <Text style={styles.uploadButtonText}>Téléverser un document</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Onglets */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, tabValue === 0 && styles.activeTab]}
              onPress={() => handleTabChange(0)}
            >
              <Text style={[styles.tabText, tabValue === 0 && styles.activeTabText]}>
                PV de réunions
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, tabValue === 1 && styles.activeTab]}
              onPress={() => handleTabChange(1)}
            >
              <Text style={[styles.tabText, tabValue === 1 && styles.activeTabText]}>
                Comptes rendus
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, tabValue === 2 && styles.activeTab]}
              onPress={() => handleTabChange(2)}
            >
              <Text style={[styles.tabText, tabValue === 2 && styles.activeTabText]}>
                Décisions
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, tabValue === 3 && styles.activeTab]}
              onPress={() => handleTabChange(3)}
            >
              <Text style={[styles.tabText, tabValue === 3 && styles.activeTabText]}>
                Règlement intérieur
          </Text>
            </TouchableOpacity>
          </View>

          {/* Contenu des onglets */}
          <View style={styles.tabContent}>
            {tabValue === 0 && (
              <View>
                <Text style={styles.tabTitle}>
                  PV de réunions ({documents.pv.length})
                </Text>
                <FlatList
                  data={filterDocuments(documents.pv)}
                  refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                  }
                  renderItem={({ item }) => (
                    <View style={[styles.documentItem, getListItemStyles(item.titre)]}>
                      <View style={styles.documentIcon}>
              <Ionicons name="document-outline" size={24} color="#007AFF" />
                      </View>
                      <View style={styles.documentInfo}>
                        <Text style={styles.documentTitle}>{item.titre}</Text>
                        <Text style={styles.documentDescription}>{item.description}</Text>
                        <Text style={styles.documentDate}>
                          Téléversé {formatDateWithTime(item.telecharge_le)}
                        </Text>
                      </View>
                      <View style={styles.documentActions}>
                        <TouchableOpacity
                          style={styles.viewButton}
                          onPress={() => handleViewDocument(item)}
                        >
                          <Ionicons name="eye-outline" size={16} color="#007AFF" />
                          <Text style={styles.viewButtonText}>Voir</Text>
                        </TouchableOpacity>
                        {user?.role === 'SECRETAIRE_GENERALE' && (
                          <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => handleDeleteDocument(item)}
                          >
                            <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                            <Text style={styles.deleteButtonText}>Supprimer</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  )}
                  keyExtractor={(item) => item.id.toString()}
                  showsVerticalScrollIndicator={false}
                />
                {filterDocuments(documents.pv).length === 0 && (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>
                      Aucun procès-verbal disponible pour le moment
                    </Text>
                  </View>
                )}
            </View>
            )}

            {tabValue === 1 && (
              <View>
                <Text style={styles.tabTitle}>
                  Comptes rendus ({documents.comptesRendus.length})
                </Text>
                <FlatList
                  data={filterDocuments(documents.comptesRendus)}
                  refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                  }
                  renderItem={({ item }) => (
                    <View style={[styles.documentItem, getListItemStyles(item.titre)]}>
                      <View style={styles.documentIcon}>
              <Ionicons name="newspaper-outline" size={24} color="#34C759" />
                      </View>
                      <View style={styles.documentInfo}>
                        <Text style={styles.documentTitle}>{item.titre}</Text>
                        <Text style={styles.documentDescription}>{item.description}</Text>
                        <Text style={styles.documentDate}>
                          Téléversé {formatDateWithTime(item.telecharge_le)}
                        </Text>
                      </View>
                      <View style={styles.documentActions}>
                        <TouchableOpacity
                          style={styles.viewButton}
                          onPress={() => handleViewDocument(item)}
                        >
                          <Ionicons name="eye-outline" size={16} color="#007AFF" />
                          <Text style={styles.viewButtonText}>Voir</Text>
                        </TouchableOpacity>
                        {user?.role === 'SECRETAIRE_GENERALE' && (
                          <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => handleDeleteDocument(item)}
                          >
                            <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                            <Text style={styles.deleteButtonText}>Supprimer</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  )}
                  keyExtractor={(item) => item.id.toString()}
                  showsVerticalScrollIndicator={false}
                />
                {filterDocuments(documents.comptesRendus).length === 0 && (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>
                      Aucun compte rendu disponible pour le moment
                    </Text>
                  </View>
                )}
              </View>
            )}

            {tabValue === 2 && (
              <View>
                <Text style={styles.tabTitle}>
                  Décisions ({documents.decisions.length})
                </Text>
                <FlatList
                  data={filterDocuments(documents.decisions)}
                  refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                  }
                  renderItem={({ item }) => (
                    <View style={[styles.documentItem, getListItemStyles(item.titre)]}>
                      <View style={styles.documentIcon}>
                        <Ionicons name="hammer-outline" size={24} color="#FF9500" />
                      </View>
                      <View style={styles.documentInfo}>
                        <Text style={styles.documentTitle}>{item.titre}</Text>
                        <Text style={styles.documentDescription}>{item.description}</Text>
                        <Text style={styles.documentDate}>
                          Téléversé {formatDateWithTime(item.telecharge_le)}
                        </Text>
                      </View>
                      <View style={styles.documentActions}>
                        <TouchableOpacity
                          style={styles.viewButton}
                          onPress={() => handleViewDocument(item)}
                        >
                          <Ionicons name="eye-outline" size={16} color="#007AFF" />
                          <Text style={styles.viewButtonText}>Voir</Text>
                        </TouchableOpacity>
                        {user?.role === 'SECRETAIRE_GENERALE' && (
                          <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => handleDeleteDocument(item)}
                          >
                            <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                            <Text style={styles.deleteButtonText}>Supprimer</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  )}
                  keyExtractor={(item) => item.id.toString()}
                  showsVerticalScrollIndicator={false}
                />
                {filterDocuments(documents.decisions).length === 0 && (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>
                      Aucune décision disponible pour le moment
                    </Text>
                  </View>
                )}
              </View>
            )}

            {tabValue === 3 && (
              <View>
                <Text style={styles.tabTitle}>
                  Règlement intérieur ({documents.reglement ? 1 : 0})
                </Text>
                {documents.reglement ? (
                  <FlatList
                    data={filterDocuments([documents.reglement])}
                    refreshControl={
                      <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    renderItem={({ item }) => (
                      <View style={[styles.documentItem, getListItemStyles(item.titre)]}>
                        <View style={styles.documentIcon}>
                          <Ionicons name="book-outline" size={24} color="#AF52DE" />
                        </View>
                        <View style={styles.documentInfo}>
                          <Text style={styles.documentTitle}>{item.titre}</Text>
                          <Text style={styles.documentDescription}>{item.description}</Text>
                          <Text style={styles.documentDate}>
                            Téléversé {formatDateWithTime(item.telecharge_le)}
                          </Text>
                        </View>
                        <View style={styles.documentActions}>
                          <TouchableOpacity
                            style={styles.viewButton}
                            onPress={() => handleViewDocument(item)}
                          >
                            <Ionicons name="eye-outline" size={16} color="#007AFF" />
                            <Text style={styles.viewButtonText}>Voir</Text>
                          </TouchableOpacity>
                          {user?.role === 'SECRETAIRE_GENERALE' && (
                            <TouchableOpacity
                              style={styles.deleteButton}
                              onPress={() => handleDeleteDocument(item)}
                            >
                              <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                              <Text style={styles.deleteButtonText}>Supprimer</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    )}
                    keyExtractor={(item) => item.id.toString()}
                    showsVerticalScrollIndicator={false}
                  />
                ) : (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>
                      Aucun règlement intérieur disponible pour le moment
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>

      {/* Modal d'affichage du document */}
      <Modal
        visible={showDocumentModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.pdfModalOverlay}>
          <View style={styles.pdfModalContent}>
            <View style={styles.pdfModalHeader}>
              <Text style={styles.pdfModalTitle}>{selectedDocument?.titre}</Text>
              <TouchableOpacity onPress={handleCloseModal} style={styles.pdfModalCloseButton}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {selectedDocument?.url_cloudinary && (
              <View style={styles.pdfViewerContainer}>
                <WebView
                  source={{ uri: selectedDocument.url_cloudinary }}
                  style={styles.pdfWebView}
                  onLoadStart={() => console.log('PDF loading started')}
                  onLoadEnd={() => console.log('PDF loading ended')}
                  onError={(error) => console.log('PDF loading error:', error)}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  startInLoadingState={true}
                  renderLoading={() => (
                    <View style={styles.pdfLoadingContainer}>
                      <ActivityIndicator size="large" color="#007AFF" />
                      <Text style={styles.pdfLoadingText}>Chargement du PDF...</Text>
                    </View>
                  )}
                />
            </View>
            )}
            
            <View style={styles.pdfModalActions}>
              <TouchableOpacity style={styles.pdfBrowserButton} onPress={handleOpenInBrowser}>
                <Ionicons name="open-outline" size={20} color="white" />
                <Text style={styles.pdfBrowserButtonText}>Ouvrir dans le navigateur</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.pdfCloseButton} onPress={handleCloseModal}>
                <Ionicons name="close-circle-outline" size={20} color="white" />
                <Text style={styles.pdfCloseButtonText}>Fermer</Text>
              </TouchableOpacity>
            </View>
            </View>
          </View>
      </Modal>

      {/* Modal d'upload de document */}
      <Modal
        visible={showUploadModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleUploadModalClose}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Téléverser un nouveau texte officiel</Text>
                <TouchableOpacity onPress={handleUploadModalClose}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalBody}>
                <TextInput
                  style={styles.input}
                  placeholder="Titre du texte officiel"
                  value={uploadForm.title}
                  onChangeText={(text) => setUploadForm(prev => ({ ...prev, title: text }))}
                />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Description"
                  value={uploadForm.description}
                  onChangeText={(text) => setUploadForm(prev => ({ ...prev, description: text }))}
                  multiline
                  numberOfLines={3}
                />
                <Text style={styles.categoryLabel}>Catégorie :</Text>
                <View style={styles.categoryButtons}>
                  <TouchableOpacity
                    style={[styles.categoryButton, uploadForm.category === 'pv' && styles.activeCategoryButton]}
                    onPress={() => setUploadForm(prev => ({ ...prev, category: 'pv' }))}
                  >
                    <Text style={[styles.categoryButtonText, uploadForm.category === 'pv' && styles.activeCategoryButtonText]}>
                      PV de réunions
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.categoryButton, uploadForm.category === 'comptesRendus' && styles.activeCategoryButton]}
                    onPress={() => setUploadForm(prev => ({ ...prev, category: 'comptesRendus' }))}
                  >
                    <Text style={[styles.categoryButtonText, uploadForm.category === 'comptesRendus' && styles.activeCategoryButtonText]}>
                      Comptes rendus
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.categoryButton, uploadForm.category === 'decisions' && styles.activeCategoryButton]}
                    onPress={() => setUploadForm(prev => ({ ...prev, category: 'decisions' }))}
                  >
                    <Text style={[styles.categoryButtonText, uploadForm.category === 'decisions' && styles.activeCategoryButtonText]}>
                      Décisions
                    </Text>
                  </TouchableOpacity>
          <TouchableOpacity
                    style={[styles.categoryButton, uploadForm.category === 'reglement' && styles.activeCategoryButton]}
                    onPress={() => setUploadForm(prev => ({ ...prev, category: 'reglement' }))}
          >
                    <Text style={[styles.categoryButtonText, uploadForm.category === 'reglement' && styles.activeCategoryButtonText]}>
                      Règlement intérieur
                    </Text>
          </TouchableOpacity>
        </View>
                 
                 {/* Section d'upload de fichier PDF */}
                 <Text style={styles.uploadSectionTitle}>Fichier PDF :</Text>
                 <TouchableOpacity 
                   style={[styles.uploadFileButton, uploadForm.selectedFile && styles.uploadFileButtonSuccess]} 
                   onPress={handleSelectPDF}
                   disabled={isUploading}
                 >
                   {isUploading ? (
                     <ActivityIndicator size="small" color="white" />
                   ) : (
                     <Ionicons 
                       name={uploadForm.selectedFile ? "checkmark-circle" : "cloud-upload-outline"} 
                       size={20} 
                       color="white" 
                     />
                   )}
                   <Text style={styles.uploadFileButtonText}>
                     {uploadForm.selectedFile 
                       ? 'Fichier PDF sélectionné ✓' 
                       : 'Sélectionner un fichier PDF'
                     }
                   </Text>
                 </TouchableOpacity>
                 
                 {uploadForm.selectedFile && (
                   <View style={styles.uploadSuccessInfo}>
                     <Text style={styles.uploadSuccessText}>
                       ✓ Fichier sélectionné : {uploadForm.fileName}
                     </Text>
                   </View>
                 )}
      </ScrollView>
              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={handleUploadModalClose}
                  disabled={isUploading}
                >
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>
                 <TouchableOpacity 
                   style={[styles.submitButton, (!uploadForm.title.trim() || !uploadForm.description.trim() || !uploadForm.selectedFile || isUploading) && styles.disabledButton]} 
                   onPress={handleUploadSubmit}
                   disabled={!uploadForm.title.trim() || !uploadForm.description.trim() || !uploadForm.selectedFile || isUploading}
                 >
                  {isUploading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.submitButtonText}>Téléverser</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal de confirmation de suppression */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="slide"
        onRequestClose={cancelDelete}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Confirmer la suppression</Text>
              <TouchableOpacity onPress={cancelDelete}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.modalText}>
                Êtes-vous sûr de vouloir supprimer le document "{documentToDelete?.titre}" ?
              </Text>
              <Text style={styles.warningText}>
                Cette action est irréversible et supprimera définitivement le document.
              </Text>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={cancelDelete}
                disabled={isDeleting}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.deleteConfirmButton, isDeleting && styles.disabledButton]} 
                onPress={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.deleteConfirmButtonText}>Supprimer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Toast pour les messages */}
      {showToast && (
        <View style={[styles.toast, toastType === 'success' ? styles.successToast : styles.errorToast]}>
          <Ionicons 
            name={toastType === 'success' ? 'checkmark-circle' : 'alert-circle'} 
            size={20} 
            color="white" 
          />
          <Text style={styles.toastText}>{toastMessage}</Text>
          <TouchableOpacity onPress={() => setShowToast(false)}>
            <Ionicons name="close" size={20} color="white" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
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
  content: {
    flex: 1,
    padding: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
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
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 20,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  activeTabText: {
    color: 'white',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
  },
  tabTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  documentIcon: {
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  documentDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  documentDate: {
    fontSize: 12,
    color: '#999',
  },
  documentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  viewButtonText: {
    fontSize: 12,
    color: '#007AFF',
    marginLeft: 4,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  deleteButtonText: {
    fontSize: 12,
    color: '#FF3B30',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    margin: 20,
    maxWidth: '90%',
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  modalBody: {
    marginBottom: 20,
  },
  modalText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  modalDescription: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  warningText: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  closeButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteConfirmButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  deleteConfirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: 'white',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryButton: {
    backgroundColor: '#F0F0F0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  activeCategoryButton: {
    backgroundColor: '#007AFF',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#666',
  },
  activeCategoryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  uploadSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    marginTop: 8,
  },
  uploadFileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  uploadFileButtonSuccess: {
    backgroundColor: '#34C759',
  },
  uploadFileButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  uploadSuccessInfo: {
    backgroundColor: '#E8F5E8',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#34C759',
  },
  uploadSuccessText: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '600',
    marginBottom: 4,
  },
  uploadSuccessUrl: {
    fontSize: 12,
    color: '#666',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  toast: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  successToast: {
    backgroundColor: '#34C759',
  },
  errorToast: {
    backgroundColor: '#FF3B30',
  },
  toastText: {
    color: 'white',
    fontSize: 14,
    flex: 1,
    marginLeft: 8,
  },
  // Styles pour le modal PDF
  pdfModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pdfModalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    margin: 10,
    width: '95%',
    height: '90%',
    maxWidth: '95%',
    maxHeight: '90%',
  },
  pdfModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  pdfModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 16,
  },
  pdfModalCloseButton: {
    padding: 4,
  },
  pdfViewerContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
  },
  pdfWebView: {
    flex: 1,
  },
  pdfLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  pdfLoadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  pdfModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 12,
  },
  pdfBrowserButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34C759',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
  },
  pdfBrowserButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  pdfCloseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
  },
  pdfCloseButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});
