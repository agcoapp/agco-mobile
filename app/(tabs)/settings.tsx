import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/apiService';

interface Settings {
  presidentSignature: string;
  cloudinaryUrl?: string;
  cloudinaryId?: string;
  selectedImage?: ImagePicker.ImagePickerAsset | null;
}

export default function SettingsScreen() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Settings>({
    presidentSignature: '',
    selectedImage: null
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reloading, setReloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [refreshing, setRefreshing] = useState(false);

  // Charger la signature existante au montage du composant
  useEffect(() => {
    const loadExistingSignature = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Vérifier que l'utilisateur est authentifié
        if (!user) {
          console.log('Utilisateur non authentifié, attente...');
          // Attendre un peu et réessayer
          setTimeout(() => {
            if (user) {
              loadExistingSignature();
            }
          }, 1000);
          return;
        }

        const signatureData = await apiService.getPresidentSignature();

        console.log('🔄 Signature trouvée:', signatureData);
        
        if (signatureData && signatureData.signature_url) {
          setSettings(prev => ({
            ...prev,
            presidentSignature: signatureData.signature_url,
            cloudinaryUrl: signatureData.signature_url,
            cloudinaryId: signatureData.signature_url.split('/').pop()?.split('.')[0] || '',
          }));
        } else {
          console.log('Aucune signature trouvée dans la réponse');
          setSettings(prev => ({
            ...prev,
            presidentSignature: '',
            cloudinaryUrl: '',
            cloudinaryId: '',
          }));
        }
      } catch (error) {
        console.log('Erreur lors du chargement de la signature:', error);
        
        // Gérer différents types d'erreurs
        if (error instanceof Error) {
          if (error.message.includes('404')) {
            console.log('Aucune signature enregistrée pour le moment');
            setSettings(prev => ({
              ...prev,
              presidentSignature: '',
              cloudinaryUrl: '',
              cloudinaryId: '',
            }));
          } else if (error.message.includes('401') || error.message.includes('403')) {
            setError('Erreur d\'authentification. Veuillez vous reconnecter.');
          } else if (error.message.includes('500')) {
            setError('Erreur serveur. Veuillez réessayer plus tard.');
          } else {
            setError('Erreur lors du chargement de la signature: ' + error.message);
          }
        } else {
          setError('Erreur inconnue lors du chargement de la signature');
        }
      } finally {
        setLoading(false);
      }
    };

    // Délai initial pour s'assurer que l'authentification est prête
    const timer = setTimeout(() => {
      loadExistingSignature();
    }, 500);

    return () => clearTimeout(timer);
  }, [user]);

  const handleSave = async () => {
    if (!settings.selectedImage) {
      setError('Veuillez d\'abord sélectionner une signature');
      setToastMessage('Veuillez d\'abord sélectionner une signature');
      setToastType('error');
      setShowToast(true);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // 1. D'abord uploader vers Cloudinary
      const cloudinaryData = await uploadToCloudinary(settings.selectedImage);
      
      // 2. Ensuite envoyer à l'API
      const result = await apiService.updatePresidentSignature(cloudinaryData.cloudinaryUrl, cloudinaryData.cloudinaryId);
      
      // 3. Mettre à jour les settings avec les données Cloudinary
      setSettings(prev => ({
        ...prev,
        cloudinaryUrl: cloudinaryData.cloudinaryUrl,
        cloudinaryId: cloudinaryData.cloudinaryId,
        presidentSignature: cloudinaryData.cloudinaryUrl, // Remplacer l'URI locale par l'URL Cloudinary
      }));
      
      setSaved(true);
      setToastMessage('Signature sauvegardée avec succès !');
      setToastType('success');
      setShowToast(true);
      setTimeout(() => setSaved(false), 5000);
      
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la signature:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde');
      setToastMessage(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde');
      setToastType('error');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const handleImagePicker = async () => {
    try {
      // Demander les permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Permission d\'accès à la galerie requise pour sélectionner une image.');
        return;
      }

      // Ouvrir le sélecteur d'images
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [2, 1], // Ratio 2:1 pour la signature
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        // Stocker l'image sélectionnée sans l'uploader immédiatement
        setSettings(prev => ({
          ...prev,
          selectedImage: asset,
          presidentSignature: asset.uri, // Aperçu local
        }));
        
        setToastMessage('Image sélectionnée avec succès !');
        setToastType('success');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Erreur lors de la sélection d\'image:', error);
      setToastMessage('Erreur lors de la sélection d\'image');
      setToastType('error');
      setShowToast(true);
    }
  };

  const uploadToCloudinary = async (asset: ImagePicker.ImagePickerAsset) => {
    // Configuration Cloudinary
    const cloudName = 'dtqxhyqtp';
    const uploadPreset = 'sgm_preset_signatures';
    const timestamp = Date.now();
    const fileName = `president_signature_${timestamp}`;
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;
    
    // Préparer les données de l'upload
    const formData = new FormData();
    formData.append('file', {
      uri: asset.uri,
      type: 'image/jpeg',
      name: fileName,
    } as any);
    formData.append('upload_preset', uploadPreset);
    formData.append('public_id', fileName);
    formData.append('resource_type', 'image');
    formData.append('max_width', '800');
    formData.append('max_height', '400');
    
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
    };
  };

  const showToastMessage = (message: string, type: 'success' | 'error') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    // Auto-hide après 4 secondes
    setTimeout(() => setShowToast(false), 4000);
  };

  const hideToast = () => {
    setShowToast(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Recharger la signature existante
      const signatureData = await apiService.getPresidentSignature();
      
      if (signatureData && signatureData.signature_url) {
        setSettings(prev => ({
          ...prev,
          presidentSignature: signatureData.signature_url,
          cloudinaryUrl: signatureData.signature_url,
          cloudinaryId: signatureData.signature_url.split('/').pop()?.split('.')[0] || '',
        }));
      } else {
        setSettings(prev => ({
          ...prev,
          presidentSignature: '',
          cloudinaryUrl: '',
          cloudinaryId: '',
        }));
      }
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
            <View style={styles.header}>
              <Text style={styles.title}>Signature du Président</Text>
              <Text style={styles.subtitle}>
                Cette signature sera automatiquement apposée sur tous les formulaires d'adhésion approuvés.
              </Text>
            </View>

            {error && (
              <View style={styles.errorAlert}>
                <Ionicons name="alert-circle" size={20} color="#FF3B30" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={() => setError(null)}>
                  <Ionicons name="close" size={20} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.card}>
              {/* Section d'upload */}
              <View style={styles.uploadSection}>
                <Text style={styles.sectionTitle}>Sélectionner une signature</Text>
                <TouchableOpacity 
                  style={styles.uploadButton}
                  onPress={handleImagePicker}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Ionicons name="cloud-upload-outline" size={20} color="white" />
                  )}
                  <Text style={styles.uploadButtonText}>
                    {loading ? 'Upload en cours...' : 
                     settings.presidentSignature ? 'Changer la signature' : 'Choisir une signature'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Aperçu de la signature */}
              {settings.presidentSignature ? (
                <View style={styles.previewSection}>
                  <Text style={styles.sectionTitle}>Signature actuelle du président :</Text>
                  <View style={styles.previewContainer}>
                    {reloading && (
                      <View style={styles.reloadingOverlay}>
                        <ActivityIndicator size="large" color="#007AFF" />
                      </View>
                    )}
                    <Image
                      source={{ uri: settings.presidentSignature }}
                      style={styles.signatureImage}
                      resizeMode="contain"
                    />
                  </View>
                  <Text style={styles.previewInfo}>
                    {reloading ? 'Mise à jour de la signature...' : 
                     'Cette signature sera automatiquement apposée sur tous les formulaires d\'adhésion approuvés.'}
                  </Text>
                </View>
              ) : !loading && (
                <View style={styles.noSignatureSection}>
                  <Ionicons name="create-outline" size={48} color="#E1E1E1" />
                  <Text style={styles.noSignatureText}>
                    Aucune signature enregistrée pour le moment. Veuillez en sélectionner une ci-dessus.
                  </Text>
                </View>
              )}

              {/* Bouton de sauvegarde */}
              <View style={styles.saveSection}>
                <TouchableOpacity
                  style={[styles.saveButton, (!settings.selectedImage || loading) && styles.disabledButton]}
                  onPress={handleSave}
                  disabled={!settings.selectedImage || loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Ionicons name="save-outline" size={20} color="white" />
                  )}
                  <Text style={styles.saveButtonText}>
                    {loading ? 'Sauvegarde...' : 'Sauvegarder la signature'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
        </ScrollView>
      </TouchableWithoutFeedback>

      {/* Toast de notification */}
      {showToast && (
        <View style={[styles.toast, toastType === 'success' ? styles.successToast : styles.errorToast]}>
          <Ionicons 
            name={toastType === 'success' ? 'checkmark-circle' : 'alert-circle'} 
            size={20} 
            color="white" 
          />
          <Text style={styles.toastText}>{toastMessage}</Text>
          <TouchableOpacity onPress={hideToast} style={styles.toastCloseButton}>
            <Ionicons name="close" size={18} color="white" />
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
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  card: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  uploadSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  uploadButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  previewSection: {
    marginBottom: 24,
  },
  previewContainer: {
    borderWidth: 1,
    borderColor: '#E1E1E1',
    borderRadius: 8,
    padding: 16,
    backgroundColor: 'white',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  reloadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    zIndex: 1,
  },
  signatureImage: {
    width: 300,
    height: 150,
  },
  previewInfo: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  noSignatureSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    borderWidth: 2,
    borderColor: '#E1E1E1',
    borderStyle: 'dashed',
    borderRadius: 8,
    marginBottom: 24,
  },
  noSignatureText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  saveSection: {
    marginTop: 8,
  },
  saveButton: {
    backgroundColor: '#34C759',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#8E8E93',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: 'white',
    margin: 20,
    marginTop: 0,
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
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  successAlert: {
    backgroundColor: '#E8F5E8',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    margin: 20,
    marginBottom: 0,
    borderRadius: 8,
    gap: 8,
  },
  successText: {
    color: '#34C759',
    fontSize: 14,
    flex: 1,
  },
  errorAlert: {
    backgroundColor: '#FFEBEE',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    margin: 20,
    marginBottom: 0,
    borderRadius: 8,
    gap: 8,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    flex: 1,
  },
  toast: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    zIndex: 1000,
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
  },
  toastCloseButton: {
    padding: 4,
    marginLeft: 8,
  },
});