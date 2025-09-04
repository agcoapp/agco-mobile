import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';

import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/apiService';

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
  const [tabValue, setTabValue] = useState(0);
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

  // Raisons de rejet prédéfinies
  const REJECTION_REASONS = [
    { value: 'documents_manquants', label: 'Documents Manquants Ou Incomplets' },
    { value: 'informations_incorrectes', label: 'Informations Incorrectes' },
    { value: 'photo_illisible', label: 'Photo Non Conforme' },
    { value: 'autre', label: 'Autre Raison' }
  ];

  // Charger les formulaires d'adhésion
  useEffect(() => {
    const loadAdhesionForms = async () => {
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
  }, []);

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

  const handleValidateAdhesion = async (id: number) => {
    try {
      setActionLoading(id);
      
      console.log('✅ Validation de l\'adhésion:', id);
      
      // Appeler l'API pour valider le formulaire
      const result = await apiService.approveForm({
        id_utilisateur: id
      });

      console.log('✅ Réponse API validation:', result);

      // Mettre à jour la liste locale
      const updatedAdhesions = adhesions.map(a => 
        a.id === id ? { ...a, statut: 'APPROUVE' as const } : a
      );
      
      setAdhesions(updatedAdhesions);
      
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
      Alert.alert(
        'Erreur',
        error.message || 'Erreur lors de la validation de l\'adhésion',
        [{ text: 'OK' }]
      );
      // En cas d'erreur, ne pas fermer le modal pour permettre à l'utilisateur de corriger
    } finally {
      setActionLoading(null);
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

      // Mettre à jour la liste locale
      const updatedAdhesions = adhesions.map(a => 
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
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
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
            onPress={() => router.push(`/adhesion/${item.id}` as any)}
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
        {/* Bouton de retour */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
        
        {/* Titre */}
        <Text style={styles.title}>Gestion des Adhésions</Text>

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

        {/* Onglets */}
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

        {/* Contenu des onglets */}
        <View style={styles.tabContent}>
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
                  renderItem={renderAdhesionItem}
                  keyExtractor={(item) => item.id.toString()}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.listContainer}
                />
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
        onRequestClose={() => setShowValidationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirmer l'approbation</Text>
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
                  setShowValidationModal(false);
                }}
              >
                <Text style={styles.confirmButtonText}>Approuver</Text>
              </TouchableOpacity>
            </View>
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
});
