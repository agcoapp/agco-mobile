import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';

import AdhesionFormGenerator, { AdhesionFormGeneratorRef } from '../../components/AdhesionFormGenerator';
import CarteRectoGenerator, { CarteRectoGeneratorRef } from '../../components/CarteRectoGenerator';
import CarteVersoGenerator, { CarteVersoGeneratorRef } from '../../components/CarteVersoGenerator';
import { useAuth } from '../../hooks/useAuth';
import { useNavigationHistory } from '../../hooks/useNavigationHistory';
import { useRouterWithHistory } from '../../hooks/useRouterWithHistory';
import { apiService } from '../../services/apiService';
import { convertImageToBase64, convertImageToBase64WithTransparency } from '../../utils/fonctions';

interface AdhesionForm {
  id: number;
  nom_complet: string;
  statut: 'EN_ATTENTE' | 'APPROUVE' | 'REJETE';
  date_soumission: string;
  soumis_le?: string;
  raison_rejet?: string;
  photos_urls: {
    id_front: string;
    id_back: string;
    selfie: string;
  };
}

export default function AdhesionsScreen() {
  const { user } = useAuth();
  const { handleBackNavigation } = useNavigationHistory();
  const router = useRouterWithHistory();
  const { tab } = useLocalSearchParams();
  
  // Déterminer l'onglet initial basé sur les paramètres de navigation
  const getInitialTabValue = () => {
    if (tab === 'pending') return 0;
    if (tab === 'validated') return 1;
    if (tab === 'rejected') return 2;
    return 0; // Par défaut, onglet "En attente"
  };
  
  const [tabValue, setTabValue] = useState(getInitialTabValue());
  const [searchTerm, setSearchTerm] = useState('');
  const [adhesions, setAdhesions] = useState<AdhesionForm[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [selectedAdhesion, setSelectedAdhesion] = useState<AdhesionForm | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedReason, setSelectedReason] = useState('');
  const [showReasonPicker, setShowReasonPicker] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // États pour la gestion des étapes de validation
  const [validationStep, setValidationStep] = useState(0);
  const [isValidating, setIsValidating] = useState(false);

  // États pour les formulaires d'administrateurs
  const [adminFormulaires, setAdminFormulaires] = useState<any[]>([]);
  const [adminTabValue, setAdminTabValue] = useState(0);
  const [showAdminFormulaires, setShowAdminFormulaires] = useState(false);
  const [loadingAdminFormulaires, setLoadingAdminFormulaires] = useState(false);

  // Références aux générateurs
  const adhesionFormGeneratorRef = useRef<AdhesionFormGeneratorRef>(null);
  const carteRectoGeneratorRef = useRef<CarteRectoGeneratorRef>(null);
  const carteVersoGeneratorRef = useRef<CarteVersoGeneratorRef>(null);

  // Raisons de rejet prédéfinies
  const REJECTION_REASONS = [
    { value: 'documents_manquants', label: 'Documents Manquants Ou Incomplets' },
    { value: 'informations_incorrectes', label: 'Informations Incorrectes' },
    { value: 'photo_illisible', label: 'Photo Non Conforme' },
    { value: 'autre', label: 'Autre Raison' }
  ];

  // Fonction pour obtenir le texte des étapes de validation
  const getValidationStepText = (step: number) => {
    const steps = [
      "1 - Récupération de la Signature du président",
      "2 - Envoi de l'image de la fiche d'adhésion",
      "3 - Envoi de l'image du Recto de la carte de membre",
      "4 - Envoi de l'image du Verso de la carte de membre",
      "5 - Finalisation (veuillez patienter)"
    ];
    return steps[step] || "";
  };

  // Mettre à jour l'onglet quand les paramètres de navigation changent
  useEffect(() => {
    const newTabValue = getInitialTabValue();
    setTabValue(newTabValue);
  }, [tab]);

  // Charger les formulaires d'adhésion
  useEffect(() => {
    const loadAdhesionForms = async () => {
      // Ne pas charger les adhésions si l'utilisateur n'est pas connecté
      if (!user) {
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        setAdhesions([]); // Reset avant chargement
        
        const data = await apiService.getAdhesionForms();
        console.log("📊 Données reçues de l'API:", data);
        
        // Traiter la structure spécifique de l'API avec plus de sécurité
        let processedData: any[] = [];
        
        if (data && typeof data === 'object') {
          if (data.donnees && data.donnees.formulaires && Array.isArray(data.donnees.formulaires)) {
            // Structure attendue : data.donnees.formulaires
            processedData = data.donnees.formulaires;
            console.log('✅ Structure de données correcte détectée');
          } else if (Array.isArray(data)) {
            // Fallback : si c'est directement un tableau
            processedData = data;
            console.log('⚠️ Données reçues directement comme tableau');
          } else if (data.formulaires && Array.isArray(data.formulaires)) {
            // Autre structure possible
            processedData = data.formulaires;
            console.log('✅ Structure alternative détectée');
          } else {
            console.warn('❌ Structure de données inattendue:', data);
            processedData = [];
          }
        } else {
          console.warn('❌ Données invalides reçues:', data);
          processedData = [];
        }
        
        // Validation supplémentaire des données
        if (Array.isArray(processedData)) {
          // Filtrer les éléments invalides
          const validData = processedData.filter(item => 
            item && typeof item === 'object' && item.id !== undefined
          );
          
          if (validData.length !== processedData.length) {
            console.warn(`⚠️ ${processedData.length - validData.length} éléments invalides filtrés`);
          }
          
          processedData = validData;
        }
        
        console.log(`📋 ${processedData.length} adhésions chargées avec succès`);
        setAdhesions(processedData);
        
      } catch (error) {
        console.error('❌ Erreur lors du chargement des formulaires d\'adhésion:', error);
        
        // Gestion d'erreur plus détaillée
        if (error instanceof Error) {
          console.error('Message d\'erreur:', error.message);
          console.error('Stack trace:', error.stack);
        }
        
        setAdhesions([]);
        setError('Erreur lors du chargement des adhésions. Veuillez réessayer.');
      } finally {
        setLoading(false);
      }
    };

    // Appeler la fonction de chargement
    loadAdhesionForms();
  }, [user]);

  const onRefresh = async () => {
    // Ne pas rafraîchir si l'utilisateur n'est pas connecté
    if (!user) {
      setRefreshing(false);
      return;
    }
    
    setRefreshing(true);
    try {
      setError(null);
      // Ne pas vider la liste pendant le refresh pour éviter l'affichage "Aucune adhésion trouvée"
      
      const data = await apiService.getAdhesionForms();
      console.log("📊 Données reçues de l'API (refresh):", data);
      
      // Traiter la structure spécifique de l'API avec plus de sécurité
      let processedData: any[] = [];
      
      if (data && typeof data === 'object') {
        if (data.donnees && data.donnees.formulaires && Array.isArray(data.donnees.formulaires)) {
          processedData = data.donnees.formulaires;
        } else if (Array.isArray(data)) {
          processedData = data;
        } else if (data.formulaires && Array.isArray(data.formulaires)) {
          processedData = data.formulaires;
        }
      }
      
      // Validation supplémentaire des données
      if (Array.isArray(processedData)) {
        const validData = processedData.filter(item => 
          item && typeof item === 'object' && item.id !== undefined
        );
        processedData = validData;
      }
      
      console.log(`📋 ${processedData.length} adhésions rechargées avec succès`);
      setAdhesions(processedData);
      
    } catch (error) {
      console.error('❌ Erreur lors du rafraîchissement des formulaires d\'adhésion:', error);
      if (error instanceof Error) {
        setError(`Erreur lors du rafraîchissement: ${error.message}`);
      } else {
        setError('Erreur inconnue lors du rafraîchissement');
      }
    } finally {
      setRefreshing(false);
    }
  };

  // Compter les adhésions par statut de manière sécurisée
  const getTabCount = (status: 'EN_ATTENTE' | 'APPROUVE' | 'REJETE') => {
    try {
      if (!Array.isArray(adhesions)) return 0;
      return adhesions.filter((a: any) => a && a.statut === status).length;
    } catch (error) {
      console.error('❌ Erreur lors du comptage des adhésions:', error);
      return 0;
    }
  };

  // Compter les formulaires d'administrateurs par statut
  const getAdminTabCount = (status: 'EN_ATTENTE' | 'APPROUVE' | 'REJETE') => {
    try {
      if (!Array.isArray(adminFormulaires)) return 0;
      
      // Pour les formulaires d'administrateurs, si pas de statut défini, considérer comme EN_ATTENTE
      return adminFormulaires.filter((a: any) => {
        if (!a || typeof a !== 'object') return false;
        
        // Si pas de champ statut, considérer comme EN_ATTENTE
        const formulaireStatus = a.statut || 'EN_ATTENTE';
        return formulaireStatus === status;
      }).length;
    } catch (error) {
      console.error('❌ Erreur lors du comptage des formulaires d\'administrateurs:', error);
      return 0;
    }
  };

  // Charger les formulaires d'administrateurs
  const loadAdminFormulaires = async () => {
    try {
      setLoadingAdminFormulaires(true);
      const response = await apiService.getSecretaryAdminFormulaires();
      console.log('📊 Formulaires d\'administrateurs reçus:', response);

      if (response?.donnees?.formulaires) {
        setAdminFormulaires(response.donnees.formulaires);
        console.log('📊 Formulaires d\'administrateurs définis:', response.donnees.formulaires);
        console.log('📊 Nombre total de formulaires:', response.donnees.formulaires.length);
        
        // Debug: compter par statut
        const enAttente = response.donnees.formulaires.filter((f: any) => !f.statut || f.statut === 'EN_ATTENTE').length;
        const valides = response.donnees.formulaires.filter((f: any) => f.statut === 'APPROUVE').length;
        const rejetes = response.donnees.formulaires.filter((f: any) => f.statut === 'REJETE').length;
        console.log('📊 Répartition:', { enAttente, valides, rejetes });
      } else {
        setAdminFormulaires([]);
        console.log('📊 Aucun formulaire d\'administrateur trouvé');
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des formulaires d\'administrateurs:', error);
      setAdminFormulaires([]);
    } finally {
      setLoadingAdminFormulaires(false);
    }
  };

  // Filtrer les formulaires d'administrateurs selon le terme de recherche
  const getFilteredAdminFormulaires = (status: 'EN_ATTENTE' | 'APPROUVE' | 'REJETE') => {
    try {
      if (!Array.isArray(adminFormulaires)) {
        return [];
      }
      
      let filteredByStatus = adminFormulaires.filter((a: any) => {
        if (!a || typeof a !== 'object') return false;
        
        // Si pas de champ statut, considérer comme EN_ATTENTE
        const formulaireStatus = a.statut || 'EN_ATTENTE';
        return formulaireStatus === status;
      });
            
      if (!searchTerm || searchTerm.trim() === '') {
        return filteredByStatus;
      }
      
      const searchLower = searchTerm.toLowerCase().trim();
      const searchResults = filteredByStatus.filter((formulaire: any) => {
        if (!formulaire || typeof formulaire !== 'object') return false;
        
        const nomComplet = formulaire.utilisateur?.nom_complet || '';
        const nomUtilisateur = formulaire.utilisateur?.nom_utilisateur || '';
        
        return (
          nomComplet.toLowerCase().includes(searchLower) ||
          nomUtilisateur.toLowerCase().includes(searchLower)
        );
      });
      
      return searchResults;
    } catch (error) {
      console.error('❌ Erreur lors du filtrage des formulaires d\'administrateurs:', error);
      return [];
    }
  };

  // Filtrer les adhésions selon le terme de recherche
  const getFilteredAdhesions = (status: 'EN_ATTENTE' | 'APPROUVE' | 'REJETE') => {
    try {
      // Vérifier que adhesions est un tableau
      if (!Array.isArray(adhesions)) {
        console.warn('⚠️ adhesions n\'est pas un tableau:', adhesions);
        return [];
      }
      
      // Filtrer par statut avec validation
      let filteredByStatus = adhesions.filter((a: any) => {
        if (!a || typeof a !== 'object') return false;
        return a.statut === status;
      });
            
      if (!searchTerm || searchTerm.trim() === '') {
        return filteredByStatus;
      }
      
      const searchLower = searchTerm.toLowerCase().trim();
      const searchResults = filteredByStatus.filter((adhesion: any) => {
        if (!adhesion || typeof adhesion !== 'object') return false;
        
        // Rechercher dans nom_complet, email, et téléphone avec validation
        const nomComplet = adhesion.nom_complet || '';
        const email = adhesion.email || '';
        const telephone = adhesion.telephone || '';
        
        return (
          nomComplet.toLowerCase().includes(searchLower) ||
          email.toLowerCase().includes(searchLower) ||
          telephone.toLowerCase().includes(searchLower)
        );
      });
      
      console.log(`🔍 ${searchResults.length} résultats trouvés pour la recherche: "${searchTerm}"`);
      return searchResults;
      
    } catch (error) {
      console.error('❌ Erreur lors du filtrage des adhésions:', error);
      return [];
    }
  };

  // Fonction pour générer la carte RECTO en utilisant le générateur
  const generateCardRecto = async (member: any): Promise<string> => {
    try {
      // Convertir les images en base64
      let logoBase64 = '';
      let photoBase64 = '';
      
      try {
        const { Image } = require('react-native');
        const logoUri = Image.resolveAssetSource(require('../../assets/images/logo.png')).uri;
        logoBase64 = await convertImageToBase64WithTransparency(logoUri, 250, 220, 0.9, true);
      } catch (error) {
        console.log('⚠️ Logo non trouvé:', error);
      }
      
      if (member.formulaire_actuel?.donnees_snapshot?.selfie_photo_url) {
        try {
          photoBase64 = await convertImageToBase64(member.formulaire_actuel.donnees_snapshot.selfie_photo_url, 160, 200, 0.8);
        } catch (error) {
          console.log('Photo non trouvée');
        }
      }
      
      // Ajouter le numéro d'adhésion à member pour l'affichage sur la carte
      const memberWithNumber = {
        ...member,
        numero_adhesion: member.numero_adhesion || "AGC-2024-001" // Utiliser le numéro de l'API ou défaut
      };
      
      console.log('🏷️ Numéro d\'adhésion ajouté à member:', memberWithNumber.numero_adhesion);
      
      // Utiliser le générateur de carte recto
      if (carteRectoGeneratorRef.current) {
        console.log('🔄 Génération de la carte RECTO avec le générateur...');
        console.log('Logo disponible:', logoBase64 ? 'Oui' : 'Non');
        console.log('Photo disponible:', photoBase64 ? 'Oui' : 'Non');
        
        const pngBase64 = await carteRectoGeneratorRef.current.generatePNG(logoBase64, photoBase64, memberWithNumber.numero_adhesion);
        console.log('✅ Carte RECTO générée avec succès');
        return pngBase64;
      } else {
        throw new Error('Référence du générateur de carte recto non disponible');
      }
      
    } catch (error) {
      console.error('Erreur lors de la génération de la carte RECTO PNG:', error);
      // Retourner une image de placeholder en base64 pour éviter l'erreur
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    }
  };

  // Fonction pour générer la carte VERSO en utilisant le générateur
  const generateCardVerso = async (member: any, presidentSignatureUrl: string, finalFormUrl?: string): Promise<string> => {
    try {
      // Convertir les images en base64
      let signatureBase64 = '';
      
      // Utiliser la signature du président récupérée via l'API
      if (presidentSignatureUrl) {
        try {
          console.log('🖼️ Conversion de la signature du président en cours...', presidentSignatureUrl);
          signatureBase64 = await convertImageToBase64WithTransparency(presidentSignatureUrl, 280, 180, 0.9, true);
          console.log('✅ Signature du président convertie avec succès, taille:', signatureBase64.length);
        } catch (error) {
          console.log('⚠️ Signature du président non trouvée, génération sans signature');
          // Continuer sans la signature du président
        }
      }

      // Utiliser le générateur de carte verso
      if (carteVersoGeneratorRef.current) {
        console.log('🔄 Génération de la carte VERSO avec le générateur...');
        console.log('QR Code sera généré automatiquement à partir de:', finalFormUrl || member.formulaire_actuel?.url_image_formulaire);
        console.log('Signature disponible:', signatureBase64 ? 'Oui' : 'Non');
        
        // Ne pas passer de QR code - il sera généré automatiquement par le générateur
        const pngBase64 = await carteVersoGeneratorRef.current.generatePNG(undefined, signatureBase64, finalFormUrl);
        console.log('✅ Carte VERSO générée avec succès');
        return pngBase64;
      } else {
        throw new Error('Référence du générateur de carte verso non disponible');
      }
      
    } catch (error) {
      console.error('Erreur lors de la génération de la carte VERSO PNG:', error);
      // Retourner une image de placeholder en base64 pour éviter l'erreur
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    }
  };

  // Fonction pour uploader l'image PNG vers Cloudinary avec signature Cloudinary signée
  const uploadPNGToCloudinary = async (base64Image: string, publicId?: string): Promise<{ url: string; public_id: string }> => {
    try {
      // Validation de l'image base64 avant l'upload
      if (!base64Image || base64Image.length === 0) {
        throw new Error('L\'image base64 est vide ou invalide');
      }      
      
      // L'image est déjà en base64, pas besoin de conversion
      const base64String = base64Image;
      
      // Obtenir la signature Cloudinary signée
      // Si on a un publicId, on doit inclure les paramètres d'overwrite dans la signature
      const signatureParams: any = {
        public_id: publicId,
        folder: 'formulaires_adhesion',
        resource_type: 'image',
        format: 'png'
      };
      
      // 1. Obtenir la signature Cloudinary via l'API
      console.log('Obtention de la signature Cloudinary...');
      const signatureResponse = await apiService.generateCloudinarySignature(signatureParams);
      const { signature, timestamp, api_key, cloud_name, upload_preset } = signatureResponse;
      console.log('Signature Cloudinary obtenue avec succès');
      
      // 2. Créer un FormData pour l'upload avec le preset signed
      const formData = new FormData();
      // Si un public_id est fourni, l'ajouter au FormData (Cloudinary écrasera automatiquement l'image existante)
      if (publicId) {
        formData.append('public_id', publicId);
      }
      formData.append('file', `data:image/png;base64,${base64String}`);
      formData.append('upload_preset', upload_preset); // Utiliser le preset signed
      formData.append('signature', signature);
      formData.append('timestamp', timestamp.toString());
      formData.append('api_key', api_key);

      try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorText = await response.text(); // Lire le corps de la réponse pour plus de détails
          console.error('Réponse d\'erreur Cloudinary:', errorText);
          throw new Error(`Erreur HTTP: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const result = await response.json();
        
        if (result.secure_url && result.public_id) {
          return {
            url: result.secure_url,
            public_id: result.public_id
          };
        } else {
          throw new Error('Réponse invalide de Cloudinary: ' + JSON.stringify(result));
        }
      } catch (fetchError: any) {
        if (fetchError.name === 'AbortError') {
          throw new Error('Timeout: La requête vers Cloudinary a pris trop de temps (30s)');
        }
        throw fetchError;
      }
    } catch (error) {
      console.error('Erreur détaillée Cloudinary:', error);
      throw new Error(`Erreur lors de l'upload vers Cloudinary: ${error}`);
    }
  };

  // Fonction pour régénérer le PNG avec le numéro d'adhésion et le réuploader (utilise la signature Cloudinary signée)
  const regenerateAndReuploadPNG = async (adhesionData: any, presidentSignatureUrl: string, publicId: string, numeroAdhesion: string): Promise<string> => {
    try {
      // Créer une copie des données avec le numéro d'adhésion mis à jour
      const adhesionDataWithNumber = {
        ...adhesionData,
        status: 'validated',
        adhesionNumber: numeroAdhesion
      };
      
      // Convertir les images en base64
      let logoBase64 = '';
      
      try {
        const { Image } = require('react-native');
        const logoUri = Image.resolveAssetSource(require('../../assets/images/logo.png')).uri;
        logoBase64 = await convertImageToBase64WithTransparency(logoUri, 250, 220, 0.9, true);
      } catch (error) {
        console.log('⚠️ Logo non trouvé:', error);
      }
      
      // Générer le nouveau PNG avec le numéro d'adhésion
      console.log('🖼️ Génération du nouveau PNG avec numéro d\'adhésion...');
      const pngBase64 = await adhesionFormGeneratorRef.current?.generatePNG(
        logoBase64, 
        adhesionDataWithNumber.selfie_photo_url, 
        adhesionDataWithNumber.signature_url,
        adhesionDataWithNumber,
        presidentSignatureUrl
      );
      
      if (!pngBase64) {
        throw new Error('Impossible de générer le PNG');
      }
      
      // Réuploader sur le même public_id avec overwrite (utilise la signature Cloudinary signée)
      console.log('☁️ Réupload du PNG sur Cloudinary avec signature signée et overwrite...');
      const result = await uploadPNGToCloudinary(pngBase64, publicId);
      
      console.log('✅ PNG régénéré et réuploadé avec succès:', result.url);
      console.log('🏷️ Public ID Cloudinary final:', result.public_id);
      return result.url;
      
    } catch (error) {
      console.error('❌ Erreur lors de la régénération du PNG:', error);
      throw new Error('Erreur lors de la régénération du PNG');
    }
  };

  const handleValidateAdhesion = async (id: number) => {
    try {
      setIsValidating(true);
      setValidationStep(0);
      console.log('✅ Récupération de la Signature du président');
      
      // Récupérer la signature du président
      const presidentSignatureData = await apiService.getPresidentSignature();
      const presidentSignatureUrl = presidentSignatureData.signature_url;
      
      console.log('✅ Signature du président récupérée:', presidentSignatureUrl);

      // Récupérer les données complètes de l'adhésion
      const adhesionDetails = await apiService.getAdhesionForms();
      
      // Trouver l'adhésion spécifique dans la liste
      const specificAdhesion = adhesionDetails.donnees?.formulaires?.find(
        (form: any) => form.id === id
      ) || adhesionDetails.formulaires?.find(
        (form: any) => form.id === id
      );

      // Créer le public_id fixe basé sur l'ID de l'adhésion
      const publicId = `adhesions/${id}`;
      console.log('🏷️ Public ID fixe:', publicId);

      // Convertir les images en base64
      let logoBase64 = '';
      
      try {
        const { Image } = require('react-native');
        const logoUri = Image.resolveAssetSource(require('../../assets/images/logo.png')).uri
        logoBase64 = await convertImageToBase64WithTransparency(logoUri, 250, 220, 0.9, true);
      } catch (error) {
        console.log('⚠️ Logo non trouvé:', error);
      }

      // Générer le PNG de la fiche d'adhésion avec la signature du président (sans numéro d'adhésion)
      setValidationStep(1);
      console.log('🖼️ Génération du PNG de la fiche d\'adhésion...', specificAdhesion.formulaire_actuel.donnees_snapshot);
      const pngBase64 = await adhesionFormGeneratorRef.current?.generatePNG(
        logoBase64,
        specificAdhesion.formulaire_actuel.donnees_snapshot.selfie_photo_url, 
        specificAdhesion.formulaire_actuel.donnees_snapshot.signature_url,
        specificAdhesion.formulaire_actuel.donnees_snapshot,
        presidentSignatureUrl
      );
      
      if (!pngBase64) {
        throw new Error('Impossible de générer le PNG de la fiche d\'adhésion');
      }
      
      // Uploader le PNG sur Cloudinary avec le public_id fixe (utilise la signature Cloudinary signée)
      console.log('☁️ Upload du PNG sur Cloudinary avec signature signée et public_id fixe...');
      const cloudinaryResult = await uploadPNGToCloudinary(pngBase64, publicId);
      
      console.log('✅ PNG uploadé sur Cloudinary:', cloudinaryResult);

      // Maintenant que nous avons le numéro d'adhésion, générer les cartes RECTO et VERSO
      console.log('🔄 Génération des cartes RECTO et VERSO avec le numéro d\'adhésion...');
      
      // Générer la carte RECTO
      setValidationStep(2);
      console.log('🖼️ Génération de la carte RECTO...');
      const rectoBase64 = await generateCardRecto(specificAdhesion);
      
      // Uploader la carte RECTO sur Cloudinary avec public_id fixe
      const rectoPublicId = `cartes_membres/${id}_recto`;
      console.log('☁️ Upload de la carte RECTO sur Cloudinary...');
      const rectoResult = await uploadPNGToCloudinary(rectoBase64, rectoPublicId);
      console.log('✅ Carte RECTO uploadée:', rectoResult.url);
      
      // Générer la carte VERSO
      setValidationStep(3);
      console.log('🖼️ Génération de la carte VERSO...');
      const versoBase64 = await generateCardVerso(specificAdhesion, presidentSignatureUrl, cloudinaryResult.url);
      
      // Uploader la carte VERSO sur Cloudinary avec public_id fixe
      const versoPublicId = `cartes_membres/${id}_verso`;
      console.log('☁️ Upload de la carte VERSO sur Cloudinary...');
      const versoResult = await uploadPNGToCloudinary(versoBase64, versoPublicId);
      console.log('✅ Carte VERSO uploadée:', versoResult.url);
      
      // Appeler l'API pour approuver le formulaire avec les URLs des cartes
      setValidationStep(4);
      console.log('📋 Appel de l\'API pour approuver le formulaire...');
      const result = await apiService.approveForm({
        id_utilisateur: id,
        commentaire: 'Formulaire approuvé avec succès',
        url_formulaire_final: cloudinaryResult.url,
        carte_recto_url: rectoResult.url,
        carte_verso_url: versoResult.url
      });
      
      console.log('✅ Formulaire approuvé avec succès:', result);
      
      // Récupérer le numéro d'adhésion de la réponse
      const numeroAdhesion = result?.utilisateur?.numero_adhesion;

      if (!numeroAdhesion) {
        throw new Error('Numéro d\'adhésion non trouvé dans la réponse de l\'API');
      }
      
      // Maintenant que nous avons le numéro d'adhésion, régénérer le PNG et le réuploader
      console.log('🔄 Régénération du PNG avec le numéro d\'adhésion...');
      const finalUrl = await regenerateAndReuploadPNG(
        specificAdhesion.formulaire_actuel.donnees_snapshot, 
        presidentSignatureUrl, 
        publicId,
        numeroAdhesion
      );

      console.log('✅ PNG final avec numéro d\'adhésion:', finalUrl);
      
      // Maintenant que nous avons le numéro d'adhésion, régénérer les cartes RECTO et VERSO
      console.log('🔄 Régénération des cartes RECTO et VERSO avec le numéro d\'adhésion...');
      
      // Régénérer la carte RECTO avec le numéro d'adhésion
      console.log('🖼️ Régénération de la carte RECTO avec numéro d\'adhésion...');
      
      // Ajouter le numéro d'adhésion à specificAdhesion pour l'affichage sur la carte
      const specificAdhesionWithNumber = {
        ...specificAdhesion,
        numero_adhesion: numeroAdhesion // Utiliser le numéro de l'API ou défaut
      };
      
      const rectoBase64WithNumber = await generateCardRecto(specificAdhesionWithNumber);
      
      // Réuploader la carte RECTO sur le même public_id avec overwrite
      console.log('☁️ Réupload de la carte RECTO sur Cloudinary avec overwrite...');
      const rectoResultWithNumber = await uploadPNGToCloudinary(rectoBase64WithNumber, rectoPublicId);
      console.log('✅ Carte RECTO régénérée et réuploadée:', rectoResultWithNumber.url);
      
      // Régénérer la carte VERSO avec le numéro d'adhésion
      console.log('🖼️ Régénération de la carte VERSO avec numéro d\'adhésion...');
      const versoBase64WithNumber = await generateCardVerso(specificAdhesionWithNumber, presidentSignatureUrl, cloudinaryResult.url);
      
      // Réuploader la carte VERSO sur le même public_id avec overwrite
      console.log('☁️ Réupload de la carte VERSO sur Cloudinary avec overwrite...');
      const versoResultWithNumber = await uploadPNGToCloudinary(versoBase64WithNumber, versoPublicId);
      console.log('✅ Carte VERSO régénérée et réuploadée:', versoResultWithNumber.url);

      console.log('✅ PNG final avec numéro d\'adhésion:', finalUrl);
      console.log('✅ Cartes RECTO et VERSO régénérées et réuploadées avec succès !');

      // Mettre à jour la liste locale
      const updatedAdhesions = adhesions.map((a: any) => 
        a.id === id ? { ...a, statut: 'APPROUVE' as const } : a
      );
      
      setAdhesions(updatedAdhesions);
      
      // Réinitialiser les états de validation
      setIsValidating(false);
      setValidationStep(0);
      
      Alert.alert(
        'Succès',
        'Adhésion validée avec succès !',
        [{ text: 'OK' }]
      );
      
      // Fermer le modal de confirmation seulement après succès
      setShowValidationModal(false);
      setSelectedAdhesion(null);
      
    } catch (error: any) {
      console.error('❌ Erreur lors de la validation:', error);
      
      // Réinitialiser les états de validation en cas d'erreur
      setIsValidating(false);
      setValidationStep(0);
      
      Alert.alert(
        'Erreur',
        error.message || 'Erreur lors de la validation de l\'adhésion',
        [{ text: 'OK' }]
      );
      // En cas d'erreur, ne pas fermer le modal pour permettre à l'utilisateur de corriger
    }
  };

  const handleRejectAdhesion = async (id: number, reason: string) => {
    try {
      setActionLoading(id);
      
      console.log('❌ Rejet de l\'adhésion:', id, 'Raison:', reason);
      
      // Appeler l'API pour rejeter le formulaire
      const result = await apiService.rejectForm({
        id_utilisateur: id,
        raison: reason
      });

      console.log('❌ Réponse API rejet:', result);

      // Mettre à jour la liste locale des adhésions
      const updatedAdhesions = adhesions.map((a: any) => 
        a.id === id ? { ...a, statut: 'REJETE' as const, raison_rejet: reason } : a
      );
      
      setAdhesions(updatedAdhesions);
      
      Alert.alert(
        'Succès',
        'Adhésion rejetée avec succès !',
        [{ text: 'OK' }]
      );
      
      // Fermer le modal de confirmation et nettoyer les états seulement après succès
      setShowRejectionModal(false);
      setSelectedAdhesion(null);
      setSelectedReason('');
      setRejectionReason('');
      
    } catch (error: any) {
      console.error('❌ Erreur lors du rejet:', error);
      Alert.alert(
        'Erreur',
        error.message || 'Erreur lors du rejet de l\'adhésion',
        [{ text: 'OK' }]
      );
      // En cas d'erreur, ne pas fermer le modal pour permettre à l'utilisateur de corriger
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'EN_ATTENTE':
        return '#FF9500';
      case 'APPROUVE':
        return '#34C759';
      case 'REJETE':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'EN_ATTENTE':
        return 'En attente';
      case 'APPROUVE':
        return 'Approuvé';
      case 'REJETE':
        return 'Rejeté';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      
      // Vérifier si la date est valide
      if (isNaN(date.getTime())) {
        return 'Date invalide';
      }
      
      // Formater la date en français
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      return 'Erreur de formatage';
    }
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        return 'Heure invalide';
      }
      
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const seconds = date.getSeconds().toString().padStart(2, '0');
      
      return `${hours}h:${minutes}min:${seconds}s`;
    } catch (error) {
      return 'N/A';
    }
  };

  // Vérifier les permissions
  if (!user || (user.role !== 'PRESIDENT' && user.role !== 'SECRETAIRE_GENERALE')) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={64} color="#FF3B30" />
          <Text style={styles.errorTitle}>Accès non autorisé</Text>
          <Text style={styles.errorText}>
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
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
          <Text style={styles.loadingText}>Chargement des adhésions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderAdhesionItem = ({ item }: { item: AdhesionForm }) => {
    const showActions = tabValue === 0 && user?.role === 'SECRETAIRE_GENERALE';
    
    return (
      <View style={styles.adhesionCard}>
        <View style={styles.adhesionHeader}>
          <Text style={styles.adhesionName}>{item.nom_complet}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.statut) }]}>
            <Text style={styles.statusText}>{getStatusLabel(item.statut)}</Text>
          </View>
        </View>
        
        <View style={styles.adhesionDetails}>
          <Text style={styles.dateText}>
            {formatDate(item.soumis_le || item.date_soumission)}
          </Text>
          <Text style={styles.timeText}>
            {formatTime(item.soumis_le || item.date_soumission)}
          </Text>
        </View>
        
        {tabValue === 2 && item.raison_rejet && (
          <View style={styles.rejectionReason}>
            <Text style={styles.rejectionLabel}>Raison du rejet :</Text>
            <Text style={styles.rejectionText}>{item.raison_rejet}</Text>
          </View>
        )}
        
        <View style={styles.adhesionActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push(`/adhesion/${item.id}`)}
            disabled={actionLoading === item.id}
          >
            <Ionicons name="eye-outline" size={20} color="#007AFF" />
            <Text style={styles.actionButtonText}>Voir</Text>
          </TouchableOpacity>
          
          {showActions && item.statut === 'EN_ATTENTE' && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.validateButton]}
                onPress={() => {
                  setSelectedAdhesion(item);
                  setShowValidationModal(true);
                }}
                disabled={actionLoading === item.id}
              >
                {actionLoading === item.id ? (
                  <ActivityIndicator size={16} color="white" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={20} color="white" />
                    <Text style={[styles.actionButtonText, styles.validateButtonText]}>Approuver</Text>
                  </>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => {
                  setSelectedAdhesion(item);
                  setShowRejectionModal(true);
                }}
                disabled={actionLoading === item.id}
              >
                {actionLoading === item.id ? (
                  <ActivityIndicator size={16} color="white" />
                ) : (
                  <>
                    <Ionicons name="close-circle-outline" size={20} color="white" />
                    <Text style={[styles.actionButtonText, styles.rejectButtonText]}>Rejeter</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>        
        {/* Titre */}
        <Text style={styles.title}>
          {showAdminFormulaires ? 'Formulaires d\'Administrateurs' : 'Gestion des Adhésions'}
        </Text>

        {/* Barre de recherche */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#8E8E93" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher par nom, email ou téléphone..."
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>

        {/* Bouton pour les formulaires d'administrateurs (visible seulement pour SECRETAIRE_GENERALE) */}
        {user?.role === 'SECRETAIRE_GENERALE' && (
          <TouchableOpacity
            style={styles.adminFormulairesButton}
            onPress={() => {
              setShowAdminFormulaires(!showAdminFormulaires);
              if (!showAdminFormulaires) {
                loadAdminFormulaires();
              }
            }}
          >
            <Ionicons 
              name={showAdminFormulaires ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="#007AFF" 
            />
            <Text style={styles.adminFormulairesButtonText}>
              {showAdminFormulaires ? 'Masquer' : 'Afficher'} les formulaires d'administrateurs
            </Text>
          </TouchableOpacity>
        )}

        {/* Message si pas de données */}
        {!loading && (!Array.isArray(adhesions) || adhesions.length === 0) && (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={64} color="#8E8E93" />
            <Text style={styles.emptyTitle}>Aucune adhésion trouvée</Text>
            <Text style={styles.emptyText}>
              {Array.isArray(adhesions) 
                ? 'Il n\'y a actuellement aucune adhésion dans le système.'
                : 'Erreur lors du chargement des données. Veuillez rafraîchir la page.'
              }
            </Text>
          </View>
        )}

        {/* Onglets - Affichage conditionnel selon le mode */}
        {showAdminFormulaires ? (
          <>
            <Text style={styles.adminFormulairesTitle}>Formulaires d'Administrateurs</Text>
            <View style={styles.tabsContainer}>
              <TouchableOpacity
                style={[styles.tab, adminTabValue === 0 && styles.activeTab]}
                onPress={() => setAdminTabValue(0)}
              >
                <Text style={[styles.tabText, adminTabValue === 0 && styles.activeTabText]}>
                  En attente ({getAdminTabCount('EN_ATTENTE')})
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.tab, adminTabValue === 1 && styles.activeTab]}
                onPress={() => setAdminTabValue(1)}
              >
                <Text style={[styles.tabText, adminTabValue === 1 && styles.activeTabText]}>
                  Validés ({getAdminTabCount('APPROUVE')})
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.tab, adminTabValue === 2 && styles.activeTab]}
                onPress={() => setAdminTabValue(2)}
              >
                <Text style={[styles.tabText, adminTabValue === 2 && styles.activeTabText]}>
                  Rejetés ({getAdminTabCount('REJETE')})
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, tabValue === 0 && styles.activeTab]}
              onPress={() => setTabValue(0)}
            >
              <Text style={[styles.tabText, tabValue === 0 && styles.activeTabText]}>
                En attente ({getTabCount('EN_ATTENTE')})
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tab, tabValue === 1 && styles.activeTab]}
              onPress={() => setTabValue(1)}
            >
              <Text style={[styles.tabText, tabValue === 1 && styles.activeTabText]}>
                Validées ({getTabCount('APPROUVE')})
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tab, tabValue === 2 && styles.activeTab]}
              onPress={() => setTabValue(2)}
            >
              <Text style={[styles.tabText, tabValue === 2 && styles.activeTabText]}>
                Rejetées ({getTabCount('REJETE')})
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Contenu des onglets - Affichage conditionnel selon le mode */}
        <View style={styles.tabContent}>
          {showAdminFormulaires ? (
            <>
              {adminTabValue === 0 && (
                <>
                  {!loadingAdminFormulaires && getFilteredAdminFormulaires('EN_ATTENTE').length === 0 ? (
                    <View style={styles.emptyContainer}>
                      <Ionicons name="document-outline" size={64} color="#8E8E93" />
                      <Text style={styles.emptyTitle}>Aucun formulaire d'administrateur en attente</Text>
                      <Text style={styles.emptyText}>
                        Il n'y a actuellement aucun formulaire d'administrateur en attente de validation.
                      </Text>
                    </View>
                  ) : (
                    <FlatList
                      data={getFilteredAdminFormulaires('EN_ATTENTE')}
                      renderItem={({ item }) => (
                        <View style={styles.adhesionCard}>
                          <View style={styles.adhesionHeader}>
                            <Text style={styles.adhesionName}>{item.utilisateur?.nom_complet}</Text>
                            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.statut) }]}>
                              <Text style={styles.statusText}>{getStatusLabel(item.statut)}</Text>
                            </View>
                          </View>
                          
                          <View style={styles.adhesionDetails}>
                            <Text style={styles.dateText}>
                              {formatDate(item.date_soumission)}
                            </Text>
                            <Text style={styles.timeText}>
                              {formatTime(item.date_soumission)}
                            </Text>
                            <Text style={styles.adminRoleText}>
                              Rôle: {item.utilisateur?.role}
                            </Text>
                          </View>
                          
                          <View style={styles.adhesionActions}>
                            <TouchableOpacity
                              style={styles.actionButton}
                              onPress={() => {
                                // TODO: Implémenter la vue détaillée du formulaire d'administrateur
                                Alert.alert('Info', 'Fonctionnalité en cours de développement');
                              }}
                            >
                              <Ionicons name="eye-outline" size={20} color="#007AFF" />
                              <Text style={styles.actionButtonText}>Voir</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                      keyExtractor={(item) => item.id.toString()}
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={styles.listContainer}
                    />
                  )}
                </>
              )}

              {adminTabValue === 1 && (
                <>
                  {!loadingAdminFormulaires && getFilteredAdminFormulaires('APPROUVE').length === 0 ? (
                    <View style={styles.emptyContainer}>
                      <Ionicons name="checkmark-circle-outline" size={64} color="#34C759" />
                      <Text style={styles.emptyTitle}>Aucun formulaire d'administrateur validé</Text>
                      <Text style={styles.emptyText}>
                        Il n'y a actuellement aucun formulaire d'administrateur validé.
                      </Text>
                    </View>
                  ) : (
                    <FlatList
                      data={getFilteredAdminFormulaires('APPROUVE')}
                      renderItem={({ item }) => (
                        <View style={styles.adhesionCard}>
                          <View style={styles.adhesionHeader}>
                            <Text style={styles.adhesionName}>{item.utilisateur?.nom_complet}</Text>
                            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.statut) }]}>
                              <Text style={styles.statusText}>{getStatusLabel(item.statut)}</Text>
                            </View>
                          </View>
                          
                          <View style={styles.adhesionDetails}>
                            <Text style={styles.dateText}>
                              {formatDate(item.date_soumission)}
                            </Text>
                            <Text style={styles.timeText}>
                              {formatTime(item.date_soumission)}
                            </Text>
                            <Text style={styles.adminRoleText}>
                              Rôle: {item.utilisateur?.role}
                            </Text>
                          </View>
                          
                          <View style={styles.adhesionActions}>
                            <TouchableOpacity
                              style={styles.actionButton}
                              onPress={() => {
                                // TODO: Implémenter la vue détaillée du formulaire d'administrateur
                                Alert.alert('Info', 'Fonctionnalité en cours de développement');
                              }}
                            >
                              <Ionicons name="eye-outline" size={20} color="#007AFF" />
                              <Text style={styles.actionButtonText}>Voir</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                      keyExtractor={(item) => item.id.toString()}
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={styles.listContainer}
                    />
                  )}
                </>
              )}

              {adminTabValue === 2 && (
                <>
                  {!loadingAdminFormulaires && getFilteredAdminFormulaires('REJETE').length === 0 ? (
                    <View style={styles.emptyContainer}>
                      <Ionicons name="close-circle-outline" size={64} color="#FF3B30" />
                      <Text style={styles.emptyTitle}>Aucun formulaire d'administrateur rejeté</Text>
                      <Text style={styles.emptyText}>
                        Il n'y a actuellement aucun formulaire d'administrateur rejeté.
                      </Text>
                    </View>
                  ) : (
                    <FlatList
                      data={getFilteredAdminFormulaires('REJETE')}
                      renderItem={({ item }) => (
                        <View style={styles.adhesionCard}>
                          <View style={styles.adhesionHeader}>
                            <Text style={styles.adhesionName}>{item.utilisateur?.nom_complet}</Text>
                            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.statut) }]}>
                              <Text style={styles.statusText}>{getStatusLabel(item.statut)}</Text>
                            </View>
                          </View>
                          
                          <View style={styles.adhesionDetails}>
                            <Text style={styles.dateText}>
                              {formatDate(item.date_soumission)}
                            </Text>
                            <Text style={styles.timeText}>
                              {formatTime(item.date_soumission)}
                            </Text>
                            <Text style={styles.adminRoleText}>
                              Rôle: {item.utilisateur?.role}
                            </Text>
                          </View>
                          
                          {item.raison_rejet && (
                            <View style={styles.rejectionReason}>
                              <Text style={styles.rejectionLabel}>Raison du rejet :</Text>
                              <Text style={styles.rejectionText}>{item.raison_rejet}</Text>
                            </View>
                          )}
                          
                          <View style={styles.adhesionActions}>
                            <TouchableOpacity
                              style={styles.actionButton}
                              onPress={() => {
                                // TODO: Implémenter la vue détaillée du formulaire d'administrateur
                                Alert.alert('Info', 'Fonctionnalité en cours de développement');
                              }}
                            >
                              <Ionicons name="eye-outline" size={20} color="#007AFF" />
                              <Text style={styles.actionButtonText}>Voir</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                      keyExtractor={(item) => item.id.toString()}
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={styles.listContainer}
                    />
                  )}
                </>
              )}
            </>
          ) : (
            <>
              {tabValue === 0 && (
            <>
              {!loading && getFilteredAdhesions('EN_ATTENTE').length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="document-outline" size={64} color="#8E8E93" />
                  <Text style={styles.emptyTitle}>Aucune adhésion en attente</Text>
                  <Text style={styles.emptyText}>
                    Il n'y a actuellement aucune adhésion en attente de validation.
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={getFilteredAdhesions('EN_ATTENTE')}
                  refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                  }
                  renderItem={renderAdhesionItem}
                  keyExtractor={(item) => item.id.toString()}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.listContainer}
                />
              )}
            </>
          )}

          {tabValue === 1 && (
            <>
              {!loading && getFilteredAdhesions('APPROUVE').length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="checkmark-circle-outline" size={64} color="#34C759" />
                  <Text style={styles.emptyTitle}>Aucune adhésion validée</Text>
                  <Text style={styles.emptyText}>
                    Il n'y a actuellement aucune adhésion validée.
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={getFilteredAdhesions('APPROUVE')}
                  refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                  }
                  renderItem={renderAdhesionItem}
                  keyExtractor={(item) => item.id.toString()}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.listContainer}
                />
              )}
            </>
          )}

          {tabValue === 2 && (
            <>
              {!loading && getFilteredAdhesions('REJETE').length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="close-circle-outline" size={64} color="#FF3B30" />
                  <Text style={styles.emptyTitle}>Aucune adhésion rejetée</Text>
                  <Text style={styles.emptyText}>
                    Il n'y a actuellement aucune adhésion rejetée.
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={getFilteredAdhesions('REJETE')}
                  refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                  }
                  renderItem={renderAdhesionItem}
                  keyExtractor={(item) => item.id.toString()}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.listContainer}
                />
              )}
            </>
          )}
            </>
          )}
        </View>
      </View>

      {/* Modal de confirmation d'approbation */}
      <Modal
        visible={showValidationModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => !isValidating && setShowValidationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {isValidating ? 'Validation en cours...' : 'Confirmer l\'approbation'}
            </Text>
            
            {isValidating ? (
              <View style={styles.validationContainer}>
                <ActivityIndicator size="large" color="#007AFF" style={styles.validationLoader} />
                <Text style={styles.validationStepText}>{getValidationStepText(validationStep)}</Text>
                <Text style={styles.validationInfoText}>
                  Veuillez patienter pendant la validation de l'adhésion...
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.modalText}>
                  Êtes-vous sûr de vouloir approuver le formulaire de {selectedAdhesion?.nom_complet} ?
                </Text>
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setShowValidationModal(false)}
                  >
                    <Text style={styles.cancelButtonText}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.confirmButton]}
                    onPress={() => {
                      if (selectedAdhesion) {
                        handleValidateAdhesion(selectedAdhesion.id);
                      }
                    }}
                  >
                    <Text style={styles.confirmButtonText}>Approuver</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

        {/* Modal de confirmation de rejet */}
        <Modal
          visible={showRejectionModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowRejectionModal(false)}
        >
                   <KeyboardAvoidingView 
           style={styles.modalOverlay}
           behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
           keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
         >
           <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
             <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirmer le rejet</Text>
            <Text style={styles.modalText}>
              Êtes-vous sûr de vouloir rejeter le formulaire de {selectedAdhesion?.nom_complet} ?
            </Text>
            
            <Text style={styles.modalLabel}>Raison du rejet *</Text>
            
            {/* Menu déroulant pour les raisons prédéfinies */}
            <TouchableOpacity
              style={styles.pickerContainer}
              onPress={() => setShowReasonPicker(!showReasonPicker)}
            >
              <Text style={[
                styles.pickerText,
                !selectedReason && styles.pickerPlaceholder
              ]}>
                {selectedReason 
                  ? REJECTION_REASONS.find(r => r.value === selectedReason)?.label 
                  : 'Sélectionnez une raison'
                }
              </Text>
              <Ionicons 
                name={showReasonPicker ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#666" 
              />
            </TouchableOpacity>
            
            {/* Liste déroulante des raisons */}
            {showReasonPicker && (
              <View style={styles.pickerDropdown}>
                {REJECTION_REASONS.map((reason) => (
                  <TouchableOpacity
                    key={reason.value}
                    style={[
                      styles.pickerItem,
                      selectedReason === reason.value && styles.pickerItemSelected
                    ]}
                    onPress={() => {
                      setSelectedReason(reason.value);
                      setShowReasonPicker(false);
                    }}
                  >
                    <Text style={[
                      styles.pickerItemText,
                      selectedReason === reason.value && styles.pickerItemTextSelected
                    ]}>
                      {reason.label}
                    </Text>
                    {selectedReason === reason.value && (
                      <Ionicons name="checkmark" size={16} color="#007AFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
            
            {/* Raison personnalisée */}
            {selectedReason === 'autre' && (
              <>
                <Text style={styles.modalLabel}>Précisez la raison</Text>
                <TextInput
                  style={styles.reasonInput}
                  placeholder="Entrez la raison du rejet..."
                  value={rejectionReason}
                  onChangeText={setRejectionReason}
                  multiline
                  numberOfLines={3}
                />
              </>
            )}
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowRejectionModal(false);
                  setRejectionReason('');
                  setSelectedReason('');
                }}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton, 
                  styles.rejectButton,
                  (!selectedReason || (selectedReason === 'autre' && !rejectionReason.trim())) && styles.disabledButton
                ]}
                onPress={() => {
                  if (selectedAdhesion) {
                    const finalReason = selectedReason === 'autre' ? rejectionReason : selectedReason;
                    if (finalReason.trim()) {
                      handleRejectAdhesion(selectedAdhesion.id, finalReason.trim());
                    }
                  }
                  setShowRejectionModal(false);
                  setRejectionReason('');
                  setSelectedReason('');
                }}
                disabled={!selectedReason || (selectedReason === 'autre' && !rejectionReason.trim())}
              >
                <Text style={styles.rejectButtonText}>Rejeter</Text>
              </TouchableOpacity>
                                                   </View>
             </View>
           </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
       </Modal>

        {/* Composants générateurs (cachés) */}
        {selectedAdhesion && (
          <>
            <AdhesionFormGenerator
              ref={adhesionFormGeneratorRef}
              adhesionData={selectedAdhesion}
              onError={(error) => console.error('Erreur génération formulaire:', error)}
            />
            <CarteRectoGenerator
              ref={carteRectoGeneratorRef}
              member={selectedAdhesion}
              onError={(error) => console.error('Erreur génération carte recto:', error)}
            />
            <CarteVersoGenerator
              ref={carteVersoGeneratorRef}
              member={selectedAdhesion}
              onError={(error) => console.error('Erreur génération carte verso:', error)}
            />
          </>
        )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8E8E93',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  activeTabText: {
    color: 'white',
  },
  tabContent: {
    flex: 1,
  },
  listContainer: {
    paddingBottom: 20,
  },
  adhesionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  adhesionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  adhesionName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  adhesionDetails: {
    marginBottom: 12,
  },
  dateText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  rejectionReason: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFEAA7',
  },
  rejectionLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 4,
  },
  rejectionText: {
    fontSize: 14,
    color: '#856404',
  },
  adhesionActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginLeft: 4,
  },
  validateButton: {
    backgroundColor: '#34C759',
  },
  validateButtonText: {
    color: 'white',
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
  },
  rejectButtonText: {
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
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
    lineHeight: 24,
    marginBottom: 24,
  },
  // Modal styles
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
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 24,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  confirmButton: {
    backgroundColor: '#34C759',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  // Styles pour la validation en cours
  validationContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  validationLoader: {
    marginBottom: 16,
  },
  validationStepText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  validationInfoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
     // Styles pour le picker de raisons
   pickerContainer: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     padding: 16,
     borderWidth: 1,
     borderColor: '#E1E1E1',
     borderRadius: 8,
     backgroundColor: 'white',
     marginBottom: 20,
   },
   pickerText: {
     fontSize: 16,
     color: '#333',
     flex: 1,
   },
   pickerPlaceholder: {
     color: '#999',
   },
   pickerDropdown: {
     backgroundColor: 'white',
     borderWidth: 1,
     borderColor: '#E1E1E1',
     borderRadius: 8,
     marginBottom: 20,
     maxHeight: 200,
   },
   pickerItem: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     padding: 16,
     borderBottomWidth: 1,
     borderBottomColor: '#F0F0F0',
   },
   pickerItemSelected: {
     backgroundColor: '#F0F8FF',
   },
   pickerItemText: {
     fontSize: 14,
     color: '#333',
     flex: 1,
   },
   pickerItemTextSelected: {
     color: '#007AFF',
     fontWeight: '600',
   },
   disabledButton: {
     backgroundColor: '#CCCCCC',
   },
   adminFormulairesButton: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'center',
     backgroundColor: '#F0F8FF',
     borderRadius: 12,
     padding: 16,
     marginBottom: 20,
     borderWidth: 1,
     borderColor: '#007AFF',
   },
   adminFormulairesButtonText: {
     fontSize: 16,
     fontWeight: '600',
     color: '#007AFF',
     marginLeft: 8,
   },
   adminFormulairesTitle: {
     fontSize: 18,
     fontWeight: '600',
     color: '#1C1C1E',
     marginBottom: 16,
     textAlign: 'center',
   },
   adminRoleText: {
     fontSize: 14,
     color: '#8E8E93',
     fontWeight: '500',
     marginTop: 4,
   },
});
