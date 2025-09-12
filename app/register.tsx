import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';

import AdhesionFormGenerator, { AdhesionFormGeneratorRef } from '../components/AdhesionFormGenerator';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';

const { width, height } = Dimensions.get('window');

export default function RegisterScreen() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showBirthDatePicker, setShowBirthDatePicker] = useState(false);
  const [showIdIssueDatePicker, setShowIdIssueDatePicker] = useState(false);
  const [showEntryDatePicker, setShowEntryDatePicker] = useState(false);
  const scrollViewRef = React.useRef<ScrollView>(null);
  const formGeneratorRef = React.useRef<AdhesionFormGeneratorRef>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
    birthPlace: '',
    address: '',
    profession: '',
    idNumber: '',
    idIssueDate: '',
    city: '',
    entryDate: '',
    employer: '',
    phone: '',
    spouseName: '',
    childrenCount: '',
    comment: ''
  });

  // Fonction pour charger toutes les données depuis AsyncStorage
  const loadDataFromStorage = async () => {
    try {
      console.log('Chargement des données depuis AsyncStorage...');
      
      // Charger les données du formulaire
      const savedFormData = await AsyncStorage.getItem('adhesion_form_data');
      if (savedFormData) {
        const formDataFromStorage = JSON.parse(savedFormData);
        console.log('📋 Données du formulaire chargées depuis AsyncStorage:', formDataFromStorage);
        setFormData(formDataFromStorage);
      }
      
      // Charger la photo
      const savedPhoto = await AsyncStorage.getItem('adhesion_photo');
      if (savedPhoto) {
        const photoData = JSON.parse(savedPhoto);
        console.log('📸 Photo chargée depuis AsyncStorage:', photoData.uri);
        setPhotoPreview(photoData.uri);
      }
      
      // Charger la signature
      const savedSignature = await AsyncStorage.getItem('adhesion_signature');
      if (savedSignature) {
        const signatureData = JSON.parse(savedSignature);
        console.log('✍️ Signature chargée depuis AsyncStorage:', signatureData.uri);
        setSignatureImage(signatureData.uri);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    }
  };

  // Nettoyer les images temporaires lors du démontage du composant
  useEffect(() => {
    return () => {
      cleanupTempImages();
    };
  }, []);

  // Vérifier le statut utilisateur et préremplir le formulaire si rejeté
  useEffect(() => {
    const checkUserStatusAndPreFill = async () => {
      try {
        const userStatus = await apiService.getUserStatus();
        console.log('🔍 Statut utilisateur récupéré:', userStatus);
        
        if (userStatus.statut_formulaire.statut === 'REJETE') {
          console.log('✅ Utilisateur rejeté, préremplissage du formulaire');
          setRejectionReason(userStatus.statut_formulaire.raison_rejet || 'Aucune raison spécifiée');
          
          // Préremplir le formulaire avec les données du snapshot
          if (userStatus.formulaire_adhesion?.donnees_snapshot) {
            const snapshot = userStatus.formulaire_adhesion.donnees_snapshot;
            console.log('Date de naissance : ', snapshot.date_naissance)
            
            // Fonction pour convertir DD-MM-YYYY vers YYYY-MM-DD
            const convertDateFromDDMMYYYY = (dateString: string): string => {
              if (!dateString) return '';
              const parts = dateString.split('-');
              if (parts.length === 3) {
                const [day, month, year] = parts;
                return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
              }
              return '';
            };
            
            console.log('Date de naissance Convertie : ', convertDateFromDDMMYYYY(snapshot.date_naissance));
            
            const preFilledData = {
              firstName: snapshot.prenoms || '',
              lastName: snapshot.nom || '',
              birthDate: convertDateFromDDMMYYYY(snapshot.date_naissance),
              birthPlace: snapshot.lieu_naissance || '',
              address: snapshot.adresse || '',
              profession: snapshot.profession || '',
              idNumber: snapshot.numero_carte_consulaire || '',
              idIssueDate: convertDateFromDDMMYYYY(snapshot.date_emission_piece),
              city: snapshot.ville_residence || '',
              entryDate: convertDateFromDDMMYYYY(snapshot.date_entree_congo),
              employer: snapshot.employeur_ecole || '',
              phone: snapshot.telephone || '',
              spouseName: snapshot.prenom_conjoint && snapshot.nom_conjoint ? `${snapshot.prenom_conjoint} ${snapshot.nom_conjoint}` : '',
              childrenCount: snapshot.nombre_enfants?.toString() || '',
              comment: snapshot.commentaire || ''
            };
            
            console.log('✅ Formulaire prérempli avec:', preFilledData);
            setFormData(preFilledData);
            
            // Préremplir la photo et la signature si disponibles
            if (snapshot.selfie_photo_url) {
              console.log('📸 Photo préremplie avec:', snapshot.selfie_photo_url);
              setPhotoPreview(snapshot.selfie_photo_url);
            }
            
            if (snapshot.signature_url) {
              console.log('✍️ Signature préremplie avec:', snapshot.signature_url);
              setSignatureImage(snapshot.signature_url);
            }
            
            // Marquer comme mode édition
            setIsEditing(true);
          }
        } else {
          console.log('ℹ️ Utilisateur non rejeté, pas de préremplissage');
          // Charger les données depuis AsyncStorage même si pas de préremplissage
          await loadDataFromStorage();
        }
      } catch (error) {
        console.error('❌ Erreur lors de la vérification du statut utilisateur:', error);
        // Charger les données depuis AsyncStorage en cas d'erreur
        await loadDataFromStorage();
      }
    };

    // Vérifier seulement si l'utilisateur est connecté
    if (user) {
      checkUserStatusAndPreFill();
    }
  }, [user]);

  const handleLogout = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.logout();
              router.replace('/login');
            } catch (error) {
              console.error('Erreur lors de la déconnexion:', error);
              router.replace('/login');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Fonction pour convertir une image en base64 avec optimisation
  const convertImageToBase64 = async (imageUri: string, maxWidth: number = 300, quality: number = 0.8): Promise<string> => {
    try {
      // Validation de l'URI
      if (!imageUri || typeof imageUri !== 'string') {
        throw new Error('URI invalide: doit être une chaîne de caractères');
      }
      
      console.log('Conversion de l\'image:', imageUri.substring(0, 50) + '...');
      
      // Utiliser expo-image-manipulator pour traiter l'image
      const processedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          {
            resize: {
              width: maxWidth,
              // Ne pas forcer la hauteur - préserver l'aspect ratio original
            },
          },
        ],
        {
          compress: quality,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        }
      );
      
      if (processedImage.base64) {
        return `data:image/jpeg;base64,${processedImage.base64}`;
      } else {
        throw new Error('Impossible de générer le base64');
      }
    } catch (error) {
      console.error('Erreur lors de la conversion en base64:', error);
      throw error;
    }
  };

  // Fonction pour uploader le fichier JSON vers Cloudinary avec preset signed
  const uploadPNGToCloudinary = async (base64Image: string, firstName: string, lastName: string): Promise<string> => {
    try {
      // Validation de l'image base64 avant l'upload
      if (!base64Image || base64Image.length === 0) {
        throw new Error('L\'image base64 est vide ou invalide');
      }      
      
      // L'image est déjà en base64, pas besoin de conversion
      const base64String = base64Image;
      
      // 1. Obtenir la signature Cloudinary via l'API
      console.log('Obtention de la signature Cloudinary...');
      const signatureResponse = await apiService.generateCloudinarySignature({
        folder: 'formulaires_adhesion',
        resource_type: 'image',
        format: 'png'
      });
      const { signature, timestamp, api_key, cloud_name, upload_preset } = signatureResponse;
      console.log('Signature Cloudinary obtenue avec succès');
      
             // 2. Créer un FormData pour l'upload avec le preset signed
       const formData = new FormData();
       formData.append('file', `data:image/png;base64,${base64String}`);
       formData.append('upload_preset', upload_preset); // Utiliser le preset signed
       formData.append('signature', signature);
       formData.append('timestamp', timestamp.toString());
       formData.append('api_key', api_key);
       
       // 3. Uploader vers Cloudinary avec la signature
       console.log('Upload vers Cloudinary avec signature...');
        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`, {
          method: 'POST',
          body: formData,
        });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Réponse d\'erreur Cloudinary:', errorText);
        throw new Error(`Erreur HTTP: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      
      if (result.secure_url) {
        console.log('Upload Cloudinary réussi:', result.secure_url);
        return result.secure_url;
      } else {
        throw new Error('Réponse invalide de Cloudinary: ' + JSON.stringify(result));
      }
    } catch (error) {
      console.error('Erreur détaillée Cloudinary:', error);
      throw new Error(`Erreur lors de l'upload vers Cloudinary: ${error}`);
    }
  };

  // Fonction pour uploader une image vers Cloudinary
  const uploadToCloudinary = async (imageUri: string, publicId: string, type: 'photo' | 'signature'): Promise<string> => {
    try {
      console.log('Début upload Cloudinary:', { imageUri, publicId, type });
      
      // Créer un FormData avec l'image
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: `${publicId}.jpg`
      } as any);
      
      // Utiliser le bon preset selon le type d'image
      const uploadPreset = type === 'signature' ? 'sgm_preset_signatures' : 'sgm_preset_photos_profil';
      formData.append('upload_preset', uploadPreset);
      formData.append('public_id', publicId);

      console.log('FormData créé, envoi vers Cloudinary avec preset:', uploadPreset);

      // Upload vers Cloudinary
      const response = await fetch('https://api.cloudinary.com/v1_1/dtqxhyqtp/image/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Réponse Cloudinary:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erreur réponse Cloudinary:', errorText);
        throw new Error(`Erreur upload: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Résultat Cloudinary:', result);
      
      if (!result.secure_url) {
        throw new Error('URL sécurisée non trouvée dans la réponse');
      }
      
      return result.secure_url;
    } catch (error) {
      console.error('Erreur upload Cloudinary:', error);
      throw error;
    }
  };

  // Fonction pour afficher les options de sélection d'image
  const showImageOptions = (type: 'photo' | 'signature') => {
    Alert.alert(
      `Sélectionner une ${type === 'photo' ? 'photo' : 'signature'}`,
      'Choisissez une option',
      [
        {
          text: 'Prendre une photo',
          onPress: () => takePhoto(type),
        },
        {
          text: 'Choisir depuis la galerie',
          onPress: () => pickFromGallery(type),
        },
        {
          text: 'Annuler',
          style: 'cancel',
        },
      ]
    );
  };

  // Fonction pour prendre une photo avec la caméra
  const takePhoto = async (type: 'photo' | 'signature') => {
    try {
      // Demander les permissions caméra
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Permission d\'accès à la caméra requise');
        return;
      }

      // Utiliser expo-image-picker avec rognage avancé
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.9,
        base64: false,
        exif: false,
        presentationStyle: ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN,
      });

      console.log('Résultat caméra:', result);
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        console.log('Image sélectionnée (caméra):', imageUri);
        
        // Post-traitement avancé avec ImageManipulator
        const processedImage = await ImageManipulator.manipulateAsync(
          imageUri,
          [
            {
              resize: {
                width: 300,
                height: 400,
              },
            },

          ],
          {
            compress: 0.85,
            format: ImageManipulator.SaveFormat.JPEG,
          }
        );
        
        await processImage(processedImage.uri, type);
      }
    } catch (error: any) {
      console.error('Erreur prise de photo:', error);
      Alert.alert('Erreur', 'Erreur lors de la prise de photo');
    }
  };

  // Fonction pour choisir une image depuis la galerie
  const pickFromGallery = async (type: 'photo' | 'signature') => {
    try {
      // Demander les permissions galerie
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Permission d\'accès à la galerie requise');
        return;
      }

      // Utiliser expo-image-picker avec rognage avancé
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.9,
        base64: false,
        exif: false,
        presentationStyle: ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN,
        allowsMultipleSelection: false,
      });

      console.log('Résultat galerie:', result);
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        console.log('Image sélectionnée (galerie):', imageUri);
        
        // Post-traitement avancé avec ImageManipulator
        const processedImage = await ImageManipulator.manipulateAsync(
          imageUri,
          [
            {
              resize: {
                width: 300,
                height: 400,
              },
            },
          ],
          {
            compress: 0.85,
            format: ImageManipulator.SaveFormat.JPEG,
          }
        );
        
        await processImage(processedImage.uri, type);
      }
    } catch (error: any) {
      console.error('Erreur sélection galerie:', error);
      Alert.alert('Erreur', 'Erreur lors de la sélection depuis la galerie');
    }
  };

  // Fonction pour nettoyer les images temporaires
  const cleanupTempImages = async () => {
    try {
      // Avec expo-image-picker, le nettoyage est automatique
      console.log('Images temporaires nettoyées automatiquement par Expo');
    } catch (error: any) {
      console.log('Erreur lors du nettoyage des images temporaires:', error);
    }
  };

  // Fonction pour ouvrir le modal d'image en grand
  const openImageModal = (imageUri: string) => {
    setSelectedImage(imageUri);
    setShowImageModal(true);
  };

  // Fonction pour fermer tous les DatePickers
  const closeAllDatePickers = () => {
    setShowBirthDatePicker(false);
    setShowIdIssueDatePicker(false);
    setShowEntryDatePicker(false);
  };

  // Fonction pour confirmer la sélection de date et fermer le DatePicker
  const confirmDateSelection = () => {
    setShowBirthDatePicker(false);
    setShowIdIssueDatePicker(false);
    setShowEntryDatePicker(false);
  };

  // Fonction pour gérer les changements de date
  const handleDateChange = (event: any, selectedDate: Date | undefined, field: string) => {
    // Fermer le DatePicker sur Android
    if (Platform.OS === 'android') {
      setShowBirthDatePicker(false);
      setShowIdIssueDatePicker(false);
      setShowEntryDatePicker(false);
    }
    
    // Sur iOS, vérifier si l'utilisateur a appuyé sur "Done" ou "Cancel"
    if (Platform.OS === 'ios') {
      if (event.type === 'dismissed') {
        setShowBirthDatePicker(false);
        setShowIdIssueDatePicker(false);
        setShowEntryDatePicker(false);
        return;
      }
    }
    
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      handleChange(field, dateString);
      
      // Ne pas fermer automatiquement le DatePicker sur iOS
      // Il ne se fermera que quand l'utilisateur clique sur "Terminer"
    }
  };

  // Fonction pour traiter l'image sélectionnée (sauvegarde dans AsyncStorage)
  const processImage = async (imageUri: string, type: 'photo' | 'signature') => {
    console.log(`Traitement de l'image ${type}:`, imageUri);
    
    if (!imageUri) {
      Alert.alert('Erreur', 'Aucune image sélectionnée');
      return;
    }

    if (type === 'photo') {
      setIsUploadingPhoto(true);
      try {
        // Sauvegarder l'image dans AsyncStorage
        console.log('Sauvegarde de la photo dans AsyncStorage...');
        const photoData = {
          uri: imageUri,
          timestamp: Date.now(),
          type: 'photo'
        };
        await AsyncStorage.setItem('adhesion_photo', JSON.stringify(photoData));
        setPhotoPreview(imageUri);
      } catch (error: any) {
        console.error('Erreur sauvegarde photo:', error);
        Alert.alert('Erreur', 'Erreur lors de la sauvegarde de la photo');
      } finally {
        setIsUploadingPhoto(false);
      }
    } else {
      setIsUploadingSignature(true);
      try {
        // Sauvegarder l'image dans AsyncStorage
        console.log('Sauvegarde de la signature dans AsyncStorage...');
        const signatureData = {
          uri: imageUri,
          timestamp: Date.now(),
          type: 'signature'
        };
        
        await AsyncStorage.setItem('adhesion_signature', JSON.stringify(signatureData));
        setSignatureImage(imageUri);
      } catch (error: any) {
        console.error('Erreur sauvegarde signature:', error);
        Alert.alert('Erreur', 'Erreur lors de la sauvegarde de la signature');
      } finally {
        setIsUploadingSignature(false);
      }
    }
  };

  // Validation des champs
  const validateField = (field: string, value: string): string => {
    switch (field) {
      case 'birthDate':
        if (!value) return 'La date de naissance est obligatoire';
        const birthDate = new Date(value);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        if (age < 18) return 'Vous devez avoir au moins 18 ans';
        return '';
      
      case 'phone':
        if (!value) return 'Le téléphone est obligatoire';
        const phoneRegex = /^(?:\+242)?(0[456]\d{7})$/;
        if (!phoneRegex.test(value)) {
          return 'Format accepté : 06XXXXXXX, 04XXXXXXX, 05XXXXXXX';
        }
        return '';
      
      case 'childrenCount':
        if (!value) return 'Le nombre d\'enfants est obligatoire';
        const count = parseInt(value);
        if (isNaN(count) || count < 0) return 'Le nombre d\'enfants ne peut pas être négatif';
        return '';
      
      case 'entryDate':
        if (!value) return 'La date d\'entrée au Congo est obligatoire';
        return '';
      
             default:
         if (!value || value.trim() === '') {
           const labels: Record<string, string> = {
             lastName: 'Nom(s)',
             firstName: 'Prénom(s)',
             birthPlace: 'Lieu de naissance',
             address: 'Adresse',
             profession: 'Profession',
             city: 'Ville de Résidence',
             employer: 'Employeur / Université / École'
           };
           // Les champs spouseName, idNumber et comment ne sont pas obligatoires
           if (field === 'spouseName' || field === 'idNumber' || field === 'comment') {
             return '';
           }
           return `Le champ "${labels[field] || field}" est obligatoire`;
         }
         return '';
    }
  };

  const handleChange = async (field: string, value: string) => {
    const newFormData = {
      ...formData,
      [field]: value
    };
    
    setFormData(newFormData);
    
    // Sauvegarder les données dans AsyncStorage
    try {
      await AsyncStorage.setItem('adhesion_form_data', JSON.stringify(newFormData));
      console.log('💾 Données sauvegardées dans AsyncStorage:', newFormData);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des données:', error);
    }
    
    // Valider le champ en temps réel
    const error = validateField(field, value);
    if (error) {
      setFieldErrors(prev => ({ ...prev, [field]: error }));
    } else {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Fonction utilitaire pour formater les dates au format DD-MM-YYYY
  const formatDateToDDMMYYYY = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}-${month}-${year}`;
  };

  const getStepText = (step: number) => {
    const steps = [
      "(1/5) Envoi de la photo de profil",
      "(2/5) Envoi de la photo de la signature",
      "(3/5) Génération de l'image de la fiche d'adhésion",
      "(4/5) Envoi de l'image de la fiche d'adhésion",
      "(5/5) Finalisation"
    ];
    return steps[step] || "";
  };

  const handleSubmit = async () => {
    setFieldErrors({});
    setIsLoading(true);
    setCurrentStep(0);

    // Validation de tous les champs
    const newFieldErrors: Record<string, string> = {};
    
    // Valider chaque champ du formulaire
    Object.keys(formData).forEach(field => {
      const error = validateField(field, formData[field as keyof typeof formData]);
      if (error) {
        newFieldErrors[field] = error;
      }
    });

    // Validation de la photo
    if (!photoPreview) {
      newFieldErrors.photo = 'Veuillez ajouter une photo d\'identité';
    }

    // Validation de la signature
    if (!signatureImage) {
      newFieldErrors.signature = 'Veuillez téléverser une image de signature';
    }

    // S'il y a des erreurs, les afficher et arrêter
    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      setIsLoading(false);
      setCurrentStep(0); // Réinitialiser l'étape en cas d'erreur de validation
      return;
    }

    try {
      console.log('Début de la soumission avec upload des images...');
      
      // 1. Upload des images vers Cloudinary EN PREMIER
      let cloudinaryPhotoUrl = photoPreview;
      let cloudinarySignatureUrl = signatureImage;

      // Upload de la photo si elle n'est pas déjà une URL Cloudinary
      if (photoPreview && !photoPreview.includes('cloudinary.com')) {
        setCurrentStep(0); // Étape 1: Envoi de la photo de profil
        console.log('Upload de la photo vers Cloudinary...');
        try {
          cloudinaryPhotoUrl = await uploadToCloudinary(
            photoPreview,
            `photo_${user?.nom_utilisateur}_${Date.now()}`,
            'photo'
          );
          console.log('Photo uploadée avec succès:', cloudinaryPhotoUrl);
        } catch (error) {
          console.error('Erreur upload photo:', error);
          Alert.alert('Erreur', 'Erreur lors de l\'upload de la photo');
          setIsLoading(false);
          return;
        }
      }

      // Upload de la signature si elle n'est pas déjà une URL Cloudinary
      if (signatureImage && !signatureImage.includes('cloudinary.com')) {
        setCurrentStep(1); // Étape 2: Envoi de la photo de la signature
        console.log('Upload de la signature vers Cloudinary...');
        try {
          cloudinarySignatureUrl = await uploadToCloudinary(
            signatureImage,
            `signature_${user?.nom_utilisateur}_${Date.now()}`,
            'signature'
          );
          console.log('Signature uploadée avec succès:', cloudinarySignatureUrl);
        } catch (error) {
          console.error('Erreur upload signature:', error);
          Alert.alert('Erreur', 'Erreur lors de l\'upload de la signature');
          setIsLoading(false);
          return;
        }
      }

      // 2. Préparer les données de l'adhésion avec les URLs Cloudinary
      const adhesionData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        birthDate: formatDateToDDMMYYYY(formData.birthDate),
        birthPlace: formData.birthPlace,
        address: formData.address,
        profession: formData.profession,
        idNumber: formData.idNumber,
        idIssueDate: formatDateToDDMMYYYY(formData.idIssueDate),
        city: formData.city,
        entryDate: formatDateToDDMMYYYY(formData.entryDate),
        employer: formData.employer,
        phone: formData.phone,
        spouseName: formData.spouseName,
        childrenCount: parseInt(formData.childrenCount) || 0,
        comment: formData.comment,
        photo: cloudinaryPhotoUrl, // Utiliser l'URL Cloudinary
        signature: cloudinarySignatureUrl, // Utiliser l'URL Cloudinary
        status: 'pending' as const,
        submissionDate: new Date().toISOString(),
        updatedDate: new Date().toISOString()
      };

      // 3. Générer l'image PNG de la fiche d'adhésion avec les URLs Cloudinary
      setCurrentStep(2); // Étape 3: Génération de l'image de la fiche d'adhésion
      console.log('=== DÉBUT GÉNÉRATION FORMULAIRE PNG ===');
      
      // Utiliser l'AdhesionFormGenerator pour générer le PNG
      if (!formGeneratorRef.current) {
        throw new Error('Référence du générateur de formulaire non disponible');
      }

      // Convertir le logo en base64 pour le WebView
      let logoBase64 = '';
      try {
        const logoUri = Image.resolveAssetSource(require('../assets/images/logo.png')).uri;
        logoBase64 = await convertImageToBase64(logoUri, 150, 0.9);
        console.log('✅ Logo converti en base64');
      } catch (error) {
        console.warn('⚠️ Erreur conversion logo:', error);
      }

      // Générer le PNG avec l'AdhesionFormGenerator en utilisant les URLs Cloudinary
      const base64Image = await formGeneratorRef.current.generatePNG(logoBase64, cloudinaryPhotoUrl || undefined, cloudinarySignatureUrl || undefined);
      console.log('Image PNG générée avec succès !');
      console.log('Taille de l\'image base64:', base64Image.length, 'caractères');

      // 4. Uploader l'image PNG vers Cloudinary avec le preset signed
      setCurrentStep(3); // Étape 4: Envoi de l'image de la fiche d'adhésion
      console.log('=== DÉBUT UPLOAD FORMULAIRE VERS CLOUDINARY ===');
      const cloudinaryFormUrl = await uploadPNGToCloudinary(base64Image, adhesionData.firstName, adhesionData.lastName);
      console.log('Image PNG uploadée vers Cloudinary avec succès !');
      console.log('Lien Cloudinary formulaire:', cloudinaryFormUrl);
      console.log('=== FIN UPLOAD FORMULAIRE ===');

             // Préparer les données pour l'API avec les URLs Cloudinary
       const adhesionRequest = {
         prenoms: formData.firstName,
         nom: formData.lastName,
         telephone: formData.phone,
         adresse: formData.address,
         date_naissance: formatDateToDDMMYYYY(formData.birthDate),
         lieu_naissance: formData.birthPlace,
         profession: formData.profession,
         ville_residence: formData.city,
         date_entree_congo: formatDateToDDMMYYYY(formData.entryDate),
         employeur_ecole: formData.employer,
         numero_carte_consulaire: formData.idNumber || '',
         date_emission_piece: formData.idIssueDate ? formatDateToDDMMYYYY(formData.idIssueDate) : '',
         prenom_conjoint: formData.spouseName ? formData.spouseName.split(' ')[0] : '',
         nom_conjoint: formData.spouseName ? formData.spouseName.split(' ').slice(1).join(' ') : '',
         nombre_enfants: parseInt(formData.childrenCount) || 0,
         selfie_photo_url: cloudinaryPhotoUrl,
         signature_url: cloudinarySignatureUrl || '',
         commentaire: formData.comment || '',
         url_image_formulaire: cloudinaryFormUrl,
         nom_utilisateur: user?.nom_utilisateur
       };

      // opéer un objet JSON pour l'envoi - exclure les champs vides
      const jsonDataToSend: Record<string, any> = {};

      Object.entries(adhesionRequest).forEach(([key, value]) => {
        // Ne pas inclure les champs vides ou undefined/null
        if (value !== undefined && value !== null && value !== '') {
          jsonDataToSend[key] = value;
        }
      });

      setCurrentStep(4); // Étape 5: Finalisation
      setIsLoading(false);

      // Soumettre l'adhésion via l'API
      const response = await apiService.submitAdhesion(jsonDataToSend);

      console.log('Réponse de l\'API:', response);

      // Définir le message selon le mode
      const message = isEditing 
        ? "La fiche d'adhésion a été mise à jour avec succès"
        : "L'adhésion est bel et bien soumise";
      
             Alert.alert('Succès', message, [
         {
           text: 'OK',
           onPress: async () => {
             try {
                               // Nettoyer les images temporaires
                await cleanupTempImages();
                
                // Vider complètement AsyncStorage
                await AsyncStorage.clear();
                console.log('🧹 AsyncStorage complètement vidé');
                
                // Déconnecter l'utilisateur
                await apiService.logout();
                console.log('👋 Utilisateur déconnecté');
                
                // Rediriger vers l'écran de login
                router.replace('/login');
             } catch (error) {
               console.error('Erreur lors de la déconnexion:', error);
               // En cas d'erreur, rediriger quand même vers login
               router.replace('/login');
             }
           }
         }
       ]);
      
    } catch (err: any) {
      console.error('Erreur lors de la soumission:', err);
      let errorMessage = 'Erreur lors de la soumission';
      Alert.alert('Erreur', errorMessage);
      setIsLoading(false);
      setCurrentStep(0); // Réinitialiser l'étape en cas d'erreur
    }
  };

  const renderField = (label: string, field: keyof typeof formData, placeholder?: string, type: 'text' | 'date' | 'number' | 'textarea' = 'text', fullWidth: boolean = false) => (
    <View style={[styles.fieldContainer, fullWidth && styles.fullWidthField]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      
      {type === 'date' ? (
        <TouchableOpacity
          style={[styles.dateInput, fieldErrors[field] && styles.errorInput]}
          onPress={() => {
            if (field === 'birthDate') setShowBirthDatePicker(true);
            else if (field === 'idIssueDate') setShowIdIssueDatePicker(true);
            else if (field === 'entryDate') setShowEntryDatePicker(true);
          }}
          disabled={isLoading}
        >
          <Text style={[styles.dateInputText, !formData[field] && styles.placeholderText]}>
            {formData[field] ? new Date(formData[field]).toLocaleDateString('fr-FR') : placeholder || 'Sélectionner une date'}
          </Text>
        </TouchableOpacity>
      ) : type === 'textarea' ? (
        <TextInput
          style={[styles.textArea, fieldErrors[field] && styles.errorInput]}
          value={formData[field]}
          onChangeText={(value) => handleChange(field, value)}
          placeholder={placeholder}
          editable={!isLoading}
          multiline={true}
          numberOfLines={4}
          textAlignVertical="top"
        />
      ) : (
        <TextInput
          style={[styles.textInput, fieldErrors[field] && styles.errorInput]}
          value={formData[field]}
          onChangeText={(value) => handleChange(field, value)}
          placeholder={placeholder}
          editable={!isLoading}
          keyboardType={type === 'number' ? 'numeric' : 'default'}
        />
      )}
      
      {fieldErrors[field] && (
        <Text style={styles.errorText}>{fieldErrors[field]}</Text>
      )}
    </View>
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
                     <ScrollView 
             ref={scrollViewRef}
             style={styles.scrollView}
             showsVerticalScrollIndicator={true}
             keyboardShouldPersistTaps="handled"
             contentContainerStyle={styles.scrollViewContent}
             bounces={true}
             alwaysBounceVertical={true}
             overScrollMode="always"
             onScrollBeginDrag={() => {
               // Améliorer l'expérience tactile
               Keyboard.dismiss();
             }}
           >
                     {/* Header avec bouton déconnexion */}
           <View style={styles.header}>
             <TouchableOpacity style={styles.backButton} onPress={handleLogout}>
               <Ionicons name="log-out-outline" size={16} color="white" />
               <Text style={styles.backButtonText}>Déconnexion</Text>
             </TouchableOpacity>
           </View>

          {/* Affichage de la raison du rejet pour les adhésions rejetées */}
          {rejectionReason && (
            <View style={styles.rejectionContainer}>
              <Text style={styles.rejectionTitle}>⚠️ VOTRE ADHÉSION A ÉTÉ REJETÉE</Text>
              <Text style={styles.rejectionReason}>
                <Text style={styles.boldText}>Raison du rejet :</Text>{'\n'}
                {rejectionReason}
              </Text>
              <Text style={styles.rejectionInstruction}>
                🔧 Veuillez prendre en compte les éléments mentionnés ci-dessus, afin de soumettre à nouveau votre demande.
              </Text>
            </View>
          )}

          {/* Logo et titre */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.associationName}>ASSOCIATION DES GABONAIS DU CONGO</Text>
            <Text style={styles.associationMotto}>ENGAGEMENT * SOLIDARITÉ * ENTRAIDE</Text>
            <Text style={styles.associationDetails}>
              Adresse : 5 Rue Louis TRECHO, Immeuble OTTA Brazzaville (Congo){'\n'}
              Téléphone : (+242) 05 337 00 14 / 06 692 31 00
            </Text>
          </View>

          {/* Titre du formulaire */}
          <View style={styles.titleContainer}>
            <Text style={styles.formTitle}>FICHE D'ADHÉSION</Text>
          </View>

          {/* Photo d'identité - Premier champ centré */}
          <View style={styles.photoSection}>
            <Text style={styles.photoTitle}>Photo d'identité</Text>
            <View style={styles.photoContainer}>
                             {photoPreview ? (
                 <View style={styles.photoPreview}>
                   <TouchableOpacity onPress={() => openImageModal(photoPreview)}>
                     <Image source={{ uri: photoPreview }} style={styles.photoImage} />
                   </TouchableOpacity>
                   <TouchableOpacity 
                     style={styles.removeButton}
                     onPress={async () => {
                       setPhotoPreview(null);
                       try {
                         await AsyncStorage.removeItem('adhesion_photo');
                         console.log('🗑️ Photo supprimée d\'AsyncStorage');
                       } catch (error) {
                         console.error('Erreur lors de la suppression de la photo:', error);
                       }
                     }}
                   >
                     <Ionicons name="close" size={16} color="white" />
                   </TouchableOpacity>
                 </View>
              ) : (
                <TouchableOpacity 
                   style={styles.photoUploadButton}
                   onPress={() => showImageOptions('photo')}
                   disabled={isUploadingPhoto}
                 >
                                     {isUploadingPhoto ? (
                     <ActivityIndicator color="#007AFF" />
                   ) : (
                     <>
                       <Ionicons name="camera" size={32} color="#007AFF" />
                       <Text style={styles.photoUploadText}>Prendre/Choisir une photo</Text>
                     </>
                   )}
                </TouchableOpacity>
              )}
            </View>
            {fieldErrors.photo && (
              <Text style={styles.errorText}>{fieldErrors.photo}</Text>
            )}
          </View>

          {/* Formulaire */}
          <View style={styles.formContainer}>
            {renderField('Nom(s)', 'lastName')}
            {renderField('Prénom(s)', 'firstName')}
            
               {renderField('Date de naissance', 'birthDate', '', 'date')}
               {renderField('Lieu de naissance', 'birthPlace')}
            

             {renderField('Adresse', 'address')}
             {renderField('Profession', 'profession')}
             
             {renderField('N° Carte consulaire', 'idNumber', 'Optionnel', 'text', true)}
             
             {renderField('Date délivrance', 'idIssueDate', '', 'date')}

             {renderField('Ville de résidence', 'city')}
             {renderField('Date d\'entrée au Congo', 'entryDate', '', 'date')}
             {renderField('Employeur/Université/École', 'employer')}
             {renderField('Téléphone', 'phone')}
             {renderField('Nom et Prénom du conjoint(e)', 'spouseName', 'Optionnel')}
             {renderField('Nombre d\'enfants', 'childrenCount', '', 'number')}
             {renderField('Commentaire', 'comment', 'Optionnel', 'textarea')}

          </View>

           {/* Signature - Section séparée comme la photo */}
           <View style={styles.photoSection}>
             <Text style={styles.photoTitle}>Signature</Text>
             <View style={styles.signatureContainer}>
               {signatureImage ? (
                 <View style={styles.signaturePreview}>
                   <TouchableOpacity onPress={() => openImageModal(signatureImage)}>
                     <Image source={{ uri: signatureImage }} style={styles.signatureImage} />
                   </TouchableOpacity>
                   <TouchableOpacity 
                     style={styles.removeButton}
                     onPress={async () => {
                       setSignatureImage(null);
                       try {
                         await AsyncStorage.removeItem('adhesion_signature');
                         console.log('🗑️ Signature supprimée d\'AsyncStorage');
                       } catch (error) {
                         console.error('Erreur lors de la suppression de la signature:', error);
                       }
                     }}
                   >
                     <Ionicons name="close" size={16} color="white" />
                   </TouchableOpacity>
                 </View>
               ) : (
                 <TouchableOpacity 
                   style={styles.signatureUploadButton}
                   onPress={() => showImageOptions('signature')}
                   disabled={isUploadingSignature}
                 >
                   {isUploadingSignature ? (
                     <ActivityIndicator color="#007AFF" />
                   ) : (
                     <>
                       <Ionicons name="create" size={32} color="#007AFF" />
                       <Text style={styles.photoUploadText}>Prendre/Choisir une signature</Text>
                     </>
                   )}
                 </TouchableOpacity>
               )}
             </View>
             {fieldErrors.signature && (
               <Text style={styles.errorText}>{fieldErrors.signature}</Text>
             )}
           </View>

           {/* Formulaire */}
           <View style={styles.formContainer}>

            {/* Déclaration */}
            <View style={styles.declarationContainer}>
              <Text style={styles.declarationText}>
                "Je reconnais avoir reçu et pris connaissance des{'\n'}
                Statuts et du Règlement intérieur de l'Association"
              </Text>
            </View>

            {/* Bouton de soumission */}
            <TouchableOpacity 
              style={[styles.submitButton, isLoading && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="white" />
                  <Text style={styles.stepText}>
                    {getStepText(currentStep)}
                  </Text>
                </View>
              ) : (
                <Text style={styles.submitButtonText}>
                  {isEditing ? 'Soumettre à nouveau' : 'Soumettre l\'adhésion'}
                </Text>
              )}
            </TouchableOpacity>
                     </View>
                   </ScrollView>
        </KeyboardAvoidingView>

        {/* Modal pour afficher l'image en grand */}
        {showImageModal && selectedImage && (
          <View style={styles.imageModal}>
            <View style={styles.imageModalContent}>
              <TouchableOpacity 
                style={styles.closeModalButton}
                onPress={() => {
                  setShowImageModal(false);
                  setSelectedImage(null);
                }}
              >
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
              <Image 
                source={{ uri: selectedImage }} 
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            </View>
          </View>
        )}

        {/* DatePickers */}
        {(showBirthDatePicker || showIdIssueDatePicker || showEntryDatePicker) && (
          <View style={styles.datePickerOverlay}>
            <TouchableOpacity 
              style={styles.datePickerOverlayTouchable}
              onPress={closeAllDatePickers}
              activeOpacity={1}
            />
          </View>
        )}
        
        {showBirthDatePicker && (
           <View style={styles.datePickerContainer}>
             {Platform.OS === 'ios' && (
               <View style={styles.datePickerHeader}>
                 <TouchableOpacity onPress={closeAllDatePickers}>
                   <Text style={styles.datePickerButton}>Annuler</Text>
                 </TouchableOpacity>
                 <TouchableOpacity onPress={confirmDateSelection}>
                   <Text style={styles.datePickerButton}>Terminer</Text>
                 </TouchableOpacity>
               </View>
             )}
             <DateTimePicker
               value={formData.birthDate ? new Date(formData.birthDate) : new Date()}
               mode="date"
               display={Platform.OS === 'ios' ? 'spinner' : 'default'}
               onChange={(event, date) => handleDateChange(event, date, 'birthDate')}
               maximumDate={new Date()}
               textColor="#000000"
               style={styles.datePicker}
             />
           </View>
         )}

                 {showIdIssueDatePicker && (
           <View style={styles.datePickerContainer}>
             {Platform.OS === 'ios' && (
               <View style={styles.datePickerHeader}>
                 <TouchableOpacity onPress={closeAllDatePickers}>
                   <Text style={styles.datePickerButton}>Annuler</Text>
                 </TouchableOpacity>
                 <TouchableOpacity onPress={confirmDateSelection}>
                   <Text style={styles.datePickerButton}>Terminer</Text>
                 </TouchableOpacity>
               </View>
             )}
             <DateTimePicker
               value={formData.idIssueDate ? new Date(formData.idIssueDate) : new Date()}
               mode="date"
               display={Platform.OS === 'ios' ? 'spinner' : 'default'}
               onChange={(event, date) => handleDateChange(event, date, 'idIssueDate')}
               maximumDate={new Date()}
               textColor="#000000"
               style={styles.datePicker}
             />
           </View>
         )}

                 {showEntryDatePicker && (
           <View style={styles.datePickerContainer}>
             {Platform.OS === 'ios' && (
               <View style={styles.datePickerHeader}>
                 <TouchableOpacity onPress={closeAllDatePickers}>
                   <Text style={styles.datePickerButton}>Annuler</Text>
                 </TouchableOpacity>
                 <TouchableOpacity onPress={confirmDateSelection}>
                   <Text style={styles.datePickerButton}>Terminer</Text>
                 </TouchableOpacity>
               </View>
             )}
             <DateTimePicker
               value={formData.entryDate ? new Date(formData.entryDate) : new Date()}
               mode="date"
               display={Platform.OS === 'ios' ? 'spinner' : 'default'}
               onChange={(event, date) => handleDateChange(event, date, 'entryDate')}
               maximumDate={new Date()}
               textColor="#000000"
               style={styles.datePicker}
             />
           </View>
         )}

        {/* Générateur de formulaire PNG (caché) */}
        <AdhesionFormGenerator
          ref={formGeneratorRef}
          adhesionData={{
            firstName: formData.firstName,
            lastName: formData.lastName,
            birthDate: formData.birthDate,
            birthPlace: formData.birthPlace,
            address: formData.address,
            profession: formData.profession,
            idNumber: formData.idNumber,
            idIssueDate: formData.idIssueDate,
            city: formData.city,
            entryDate: formData.entryDate,
            employer: formData.employer,
            phone: formData.phone,
            spouseName: formData.spouseName,
            childrenCount: formData.childrenCount,
            comment: formData.comment,
            status: 'pending'
          }}
          logoImage={require('../assets/images/logo.png')}
          photoImage={photoPreview || undefined}
          signatureImage={signatureImage || undefined}
          onImageGenerated={(base64Image) => {
            console.log('🖼️ Image générée par le composant:', base64Image.length, 'caractères');
          }}
          onError={(error) => {
            console.error('❌ Erreur du générateur:', error);
          }}
        />
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
     scrollView: {
     flex: 1,
   },
   scrollViewContent: {
     paddingTop: 20, // Espace en haut pour faciliter le défilement
     paddingBottom: 120, // Espace supplémentaire en bas pour faciliter le défilement
     minHeight: '100%',
   },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
  },
  backButtonText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  rejectionContainer: {
    backgroundColor: '#FFF3CD',
    borderWidth: 2,
    borderColor: '#FFC107',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  rejectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    textAlign: 'center',
    marginBottom: 12,
  },
  rejectionReason: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
    marginBottom: 12,
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    padding: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.3)',
  },
  rejectionInstruction: {
    fontSize: 12,
    color: '#856404',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  boldText: {
    fontWeight: 'bold',
  },
  logoContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  associationName: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  associationMotto: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  associationDetails: {
    fontSize: 12,
    textAlign: 'center',
    color: '#666',
    lineHeight: 18,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    borderWidth: 1,
    borderColor: '#000',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 4,
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E1E1E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: 'white',
  },
  errorInput: {
    borderColor: '#FF0000',
  },
  errorText: {
    color: '#FF0000',
    fontSize: 12,
    marginTop: 4,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  photoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
    textAlign: 'center',
  },
  photoContainer: {
    borderRadius: 12,
    padding: 10,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  photoUploadButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  photoUploadText: {
    marginTop: 12,
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  photoPreview: {
    position: 'relative',
  },
  photoImage: {
    width: 170,
    height: 200,
    borderRadius: 8,
  },
  signatureContainer: {
    borderRadius: 12,
    padding: 10,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
     signatureUploadButton: {
     alignItems: 'center',
     justifyContent: 'center',
     padding: 20,
   },
   signatureUploadText: {
     marginTop: 12,
     fontSize: 16,
     color: '#007AFF',
     fontWeight: '600',
     textAlign: 'center',
   },
  signaturePreview: {
    position: 'relative',
  },
  signatureImage: {
    width: 170,
    height: 200,
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF0000',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declarationContainer: {
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  declarationText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
   submitButtonText: {
     color: 'white',
     fontSize: 16,
     fontWeight: 'bold',
   },
   loadingContainer: {
     alignItems: 'center',
     justifyContent: 'center',
   },
   stepText: {
     color: 'white',
     fontSize: 12,
     fontWeight: '600',
     textAlign: 'center',
     marginTop: 8,
     paddingHorizontal: 10,
   },
   imageModal: {
     position: 'absolute',
     top: 0,
     left: 0,
     right: 0,
     bottom: 0,
     backgroundColor: 'rgba(0, 0, 0, 0.9)',
     justifyContent: 'center',
     alignItems: 'center',
     zIndex: 1000,
   },
   imageModalContent: {
     flex: 1,
     justifyContent: 'center',
     alignItems: 'center',
     position: 'relative',
   },
   closeModalButton: {
     position: 'absolute',
     top: 50,
     right: 20,
     backgroundColor: 'rgba(0, 0, 0, 0.7)',
     borderRadius: 20,
     width: 40,
     height: 40,
     justifyContent: 'center',
     alignItems: 'center',
     zIndex: 1001,
   },
       fullScreenImage: {
      width: width,
      height: height * 0.8,
    },
    fullWidthField: {
      width: '100%',
    },
    dateInput: {
      borderWidth: 1,
      borderColor: '#E1E1E1',
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: 'white',
      minHeight: 44,
      justifyContent: 'center',
    },
    dateInputText: {
      fontSize: 16,
      color: '#333',
    },
    placeholderText: {
      color: '#999',
    },
         textArea: {
       borderWidth: 1,
       borderColor: '#E1E1E1',
       borderRadius: 8,
       paddingHorizontal: 12,
       paddingVertical: 10,
       fontSize: 16,
       backgroundColor: 'white',
       minHeight: 100,
     },
           datePickerContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#E1E1E1',
        zIndex: 1000,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: -2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
     datePickerHeader: {
       flexDirection: 'row',
       justifyContent: 'space-between',
       paddingHorizontal: 20,
       paddingVertical: 12,
       borderBottomWidth: 1,
       borderBottomColor: '#E1E1E1',
       backgroundColor: '#F8F8F8',
     },
           datePickerButton: {
        fontSize: 16,
        color: '#007AFF',
        fontWeight: '600',
      },
      datePickerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 999,
      },
             datePickerOverlayTouchable: {
         flex: 1,
       },
       datePicker: {
         backgroundColor: 'white',
         color: '#000000',
       },
   });
