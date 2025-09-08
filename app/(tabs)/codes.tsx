import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Clipboard,
  FlatList,
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
  View
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { apiService, UtilisateurCredentials } from '../../services/apiService';

export default function CodesScreen() {
  const { user, isLoading: authLoading } = useAuth();
  const [codes, setCodes] = useState<UtilisateurCredentials[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [passwordVisibility, setPasswordVisibility] = useState<{[key: string]: boolean}>({});
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [highlightedCodeId, setHighlightedCodeId] = useState<string | null>(null);
  const [deletedCodeId, setDeletedCodeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreatingCode, setIsCreatingCode] = useState(false);
  const [newlyCreatedCode, setNewlyCreatedCode] = useState<{nom_utilisateur: string, mot_passe_temporaire: string} | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [codeToDelete, setCodeToDelete] = useState<UtilisateurCredentials | null>(null);
  const [isDeletingCode, setIsDeletingCode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadCodes = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      // Vérifier que l'utilisateur est authentifié
      if (!user || !user.role) {
        console.log('Utilisateur non authentifié, attente...');
        return;
      }

      // Récupérer les données depuis l'API via apiService
      const response = await apiService.getNouveauxUtilisateursCredentials();
      console.log(response.donnees.utilisateurs);
      setCodes(response.donnees.utilisateurs);
    } catch (error) {
      console.error('Erreur lors du chargement des codes:', error);
      setToastMessage(error instanceof Error ? error.message : 'Erreur lors du chargement des données');
      setToastType('error');
      setShowToast(true);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [user]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Vérifier que l'utilisateur est authentifié
      if (!user || !user.role) {
        console.log('Utilisateur non authentifié, attente...');
        return;
      }

      // Récupérer les données depuis l'API via apiService
      const response = await apiService.getNouveauxUtilisateursCredentials();
      console.log('📊 Codes rechargés:', response.donnees.utilisateurs);
      setCodes(response.donnees.utilisateurs);
      console.log(`📋 ${response.donnees.utilisateurs.length} codes rechargés avec succès`);
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des codes:', error);
      setToastMessage(error instanceof Error ? error.message : 'Erreur lors du rafraîchissement des données');
      setToastType('error');
      setShowToast(true);
    } finally {
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    // Attendre que l'utilisateur soit authentifié avant de charger les codes
    if (user && user.role && !authLoading) {
      loadCodes();
    }
  }, [user, authLoading, loadCodes]);

  // Effet pour gérer la surbrillance du nouveau code créé
  useEffect(() => {
    if (newlyCreatedCode && codes.length > 0) {
      // Identifier le nouveau code créé
      const newCode = codes.find(code => 
        code.nom_utilisateur === newlyCreatedCode.nom_utilisateur &&
        code.mot_passe_temporaire === newlyCreatedCode.mot_passe_temporaire
      );
      
      if (newCode) {
        setHighlightedCodeId(newCode.id.toString());
        
        // Afficher un message informatif sur la surbrillance
        setToastMessage(`Nouveau code créé ! La ligne est mise en surbrillance en vert.`);
        setToastType('success');
        setShowToast(true);
        
        // Retirer la surbrillance après 5 secondes
        setTimeout(() => {
          setHighlightedCodeId(null);
          setNewlyCreatedCode(null); // Nettoyer l'état
        }, 5000);
      }
    }
  }, [codes, newlyCreatedCode]);

  const handleCreateCode = async (): Promise<void> => {
    if (!firstName || !lastName) {
      setToastMessage('Veuillez remplir au moins le prénom et le nom');
      setToastType('error');
      setShowToast(true);
      return;
    }

    try {
      setIsCreatingCode(true);
      // Appeler l'API pour créer le nouveau membre
      const response = await apiService.creerNouveauMembre({
        prenoms: firstName,
        nom: lastName,
        a_paye: true,
      });

      // Réinitialiser les champs
      setFirstName('');
      setLastName('');
    
      // Stocker les informations du nouveau code pour la surbrillance
      setNewlyCreatedCode({
        nom_utilisateur: response.membre.nom_utilisateur,
        mot_passe_temporaire: response.membre.mot_passe_temporaire
      });
      
      // Copier automatiquement les identifiants dans le presse-papiers
      const credentialsText = `Nom d'utilisateur: ${response.membre.nom_utilisateur}\nCode d'accès: ${response.membre.mot_passe_temporaire}`;
      
      try {
        await Clipboard.setString(credentialsText);
        setToastMessage(`Identifiants créés et copiés dans le presse-papiers !`);
      } catch (clipboardError) {
        setToastMessage(`Identifiants créés avec succès ! (Erreur lors de la copie automatique)`);
      }
      setToastType('success');
      setShowToast(true);
      
      // Fermer le modal
      setShowCreateModal(false);
      
      // Recharger les codes sans afficher le loader
      await loadCodes(false);
      
    } catch (error) {
      console.error('Erreur lors de la création du membre:', error);
      setToastMessage(error instanceof Error ? error.message : 'Erreur lors de la création du membre');
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsCreatingCode(false);
    }
  };

  const copyToClipboard = async (item: UtilisateurCredentials) => {
    try {
      const credentialsText = `𝗡𝗼𝗺 𝗱'𝘂𝘁𝗶𝗹𝗶𝘀𝗮𝘁𝗲𝘂𝗿: ${item.nom_utilisateur}\n𝗖𝗼𝗱𝗲 𝗱'𝗮𝗰𝗰𝗲̀𝘀: ${item.mot_passe_temporaire}\n𝗟𝗶𝗲𝗻 𝗱𝗲 𝗰𝗼𝗻𝗻𝗲𝘅𝗶𝗼𝗻: https://agco-psi.vercel.app?code=${item.mot_passe_temporaire}&username=${item.nom_utilisateur}`;
      await Clipboard.setString(credentialsText);
      setToastMessage('Identifiants et lien copiés dans le presse-papier');
      setToastType('success');
      setShowToast(true);
    } catch (error) {
      setToastMessage('Erreur lors de la copie');
      setToastType('error');
      setShowToast(true);
    }
  };

  const handleDeleteCode = (code: UtilisateurCredentials) => {
    setCodeToDelete(code);
    setShowDeleteModal(true);
  };

  const confirmDeleteCode = async () => {
    if (!codeToDelete) return;

    try {
      setIsDeletingCode(true);
      
      // Marquer le code comme supprimé pour la surbrillance
      setDeletedCodeId(codeToDelete.id.toString());
      
      // Attendre un peu pour que l'utilisateur voie la surbrillance
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await apiService.supprimerMotPasseTemporaire({ id_utilisateur: codeToDelete.id });
      
      // Fermer le modal et réinitialiser
      setShowDeleteModal(false);
      setCodeToDelete(null);
      
      // Afficher le message de succès
      setToastMessage('Code d\'accès supprimé avec succès !');
      setToastType('success');
      setShowToast(true);
      
      // Recharger la liste des codes après un délai pour laisser voir la surbrillance
      setTimeout(async () => {
        await loadCodes(false);
        // Retirer la surbrillance après le rechargement
        setDeletedCodeId(null);
      }, 500);
      
    } catch (error) {
      console.error('Erreur lors de la suppression du code:', error);
      setToastMessage(error instanceof Error ? error.message : 'Erreur lors de la suppression du code');
      setToastType('error');
      setShowToast(true);
      // En cas d'erreur, retirer la surbrillance
      setDeletedCodeId(null);
    } finally {
      setIsDeletingCode(false);
    }
  };

  const cancelDeleteCode = () => {
    setShowDeleteModal(false);
    setCodeToDelete(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  if (!user || !['PRESIDENT', 'SECRETAIRE_GENERALE', 'MEMBRE'].includes(user.role)) {
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

  // Afficher un indicateur de chargement
  if (authLoading || loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement des codes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderCodeItem = ({ item }: { item: UtilisateurCredentials }) => {
    const isHighlighted = highlightedCodeId === item.id.toString();
    const isDeleted = deletedCodeId === item.id.toString();
    
    return (
      <View 
        style={[
          styles.codeItem,
          isHighlighted && styles.highlightedItem,
          isDeleted && styles.deletedItem
        ]}
      >
        <View style={styles.codeHeader}>
          <Text style={styles.codeTitle}>Code d'accès</Text>
          <View style={styles.codeActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setPasswordVisibility(prev => ({ 
                ...prev, 
                [item.id.toString()]: !prev[item.id.toString()] 
              }))}
            >
              <Ionicons 
                name={passwordVisibility[item.id.toString()] ? "eye-off" : "eye"} 
                size={20} 
                color="#007AFF" 
              />
            </TouchableOpacity>
            <TouchableOpacity
               style={styles.actionButton}
               onPress={() => copyToClipboard(item)}
             >
               <Ionicons name="copy-outline" size={20} color="#007AFF" />
               <Text style={styles.copyButtonText}>Copier tout</Text>
             </TouchableOpacity>
          </View>
        </View>
        
        <Text style={styles.codeValue}>
          {passwordVisibility[item.id.toString()] ? item.mot_passe_temporaire : '••••••••••••'}
        </Text>

                 <View style={styles.codeHeader}>
           <Text style={styles.codeTitle}>Username</Text>
         </View>
        
        <Text style={styles.usernameValue}>{item.nom_utilisateur}</Text>

        <View style={styles.codeInfo}>
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusBadge,
              item.doit_changer_mot_passe ? styles.statusPending : styles.statusUsed
            ]}>
              <Text style={styles.statusText}>
                {item.doit_changer_mot_passe ? 'Pas encore utilisé' : 'Utilisé'}
              </Text>
            </View>
          </View>
          
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>{formatDate(item.date_creation)}</Text>
            <Text style={styles.timeText}>{formatTime(item.date_creation)}</Text>
          </View>
        </View>

        {['PRESIDENT', 'SECRETAIRE_GENERALE'].includes(user.role) && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteCode(item)}
          >
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            <Text style={styles.deleteButtonText}>Supprimer</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>

        {['PRESIDENT', 'SECRETAIRE_GENERALE'].includes(user.role) && (
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add" size={24} color="white" />
            <Text style={styles.createButtonText}>Créer</Text>
          </TouchableOpacity>
        )}
      </View>

      {codes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="key-outline" size={64} color="#8E8E93" />
          <Text style={styles.emptyTitle}>Aucun code d'accès</Text>
          <Text style={styles.emptyText}>
            Il n'y a actuellement aucun code d'accès temporaire généré.
          </Text>
        </View>
      ) : (
        <FlatList
          data={codes}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={renderCodeItem}
          keyExtractor={(item) => item.id.toString()}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Modal de création */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => !isCreatingCode && setShowCreateModal(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView 
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Créer un nouveau code d'accès</Text>
              
              <TextInput
                style={styles.input}
                placeholder="Prénom"
                placeholderTextColor="#999"
                value={firstName}
                onChangeText={setFirstName}
                editable={!isCreatingCode}
                returnKeyType="next"
              />
              
              <TextInput
                style={styles.input}
                placeholder="Nom de famille"
                placeholderTextColor="#999"
                value={lastName}
                onChangeText={setLastName}
                editable={!isCreatingCode}
                returnKeyType="done"
                onSubmitEditing={handleCreateCode}
              />

              <View style={styles.infoAlert}>
                <Ionicons name="information-circle-outline" size={20} color="#007AFF" />
                <Text style={styles.infoText}>
                  Le système va créer automatiquement un nom d'utilisateur et un mot de passe temporaire.
                  Le membre devra changer ce mot de passe lors de sa première connexion.
                </Text>
              </View>
              
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowCreateModal(false)}
                  disabled={isCreatingCode}
                >
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handleCreateCode}
                  disabled={isCreatingCode}
                >
                  {isCreatingCode ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.confirmButtonText}>Créer</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal de confirmation de suppression */}
      <Modal
        visible={showDeleteModal}
        animationType="slide"
        transparent={true}
        onRequestClose={cancelDeleteCode}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirmer la suppression</Text>
            
            <Text style={styles.deleteMessage}>
              Êtes-vous sûr de vouloir supprimer le code d'accès pour "{codeToDelete?.nom_utilisateur}" ?
            </Text>
            
            <Text style={styles.deleteWarning}>
              Cette action est irréversible et supprimera définitivement le code d'accès.
            </Text>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={cancelDeleteCode}
                disabled={isDeletingCode}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteConfirmButton]}
                onPress={confirmDeleteCode}
                disabled={isDeletingCode}
              >
                {isDeletingCode ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.deleteConfirmButtonText}>Supprimer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Toast */}
      {showToast && (
        <View style={[
          styles.toast,
          toastType === 'success' ? styles.toastSuccess : styles.toastError
        ]}>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 80,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 20,
  },
  codeItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
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
  highlightedItem: {
    backgroundColor: '#E8F5E9',
    borderWidth: 2,
    borderColor: '#2E7D32',
  },
  deletedItem: {
    backgroundColor: '#FFEBEE',
    borderWidth: 2,
    borderColor: '#F44336',
  },
  codeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  codeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  codeActions: {
    flexDirection: 'row',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginLeft: 8,
    backgroundColor: '#F0F8FF',
    borderRadius: 6,
  },
  copyButtonText: {
    fontSize: 12,
    color: '#007AFF',
    marginLeft: 4,
    fontWeight: '500',
  },
  codeValue: {
    fontSize: 16,
    fontFamily: 'monospace',
    color: '#333',
    marginBottom: 16,
  },
  usernameValue: {
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
  },
  codeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusContainer: {
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusPending: {
    backgroundColor: '#E3F2FD',
  },
  statusUsed: {
    backgroundColor: '#E8F5E9',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  dateContainer: {
    alignItems: 'flex-end',
  },
  dateText: {
    fontSize: 14,
    color: '#666',
  },
  timeText: {
    fontSize: 12,
    color: '#999',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFEBEE',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  deleteButtonText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
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
    width: '100%',
    maxWidth: 500,
    minHeight: 400,
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#FAFAFA',
    color: '#333',
  },
  infoAlert: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#1976D2',
    marginLeft: 8,
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteConfirmButton: {
    backgroundColor: '#FF3B30',
  },
  deleteConfirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteMessage: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  deleteWarning: {
    fontSize: 14,
    color: '#FF3B30',
    marginBottom: 20,
    textAlign: 'center',
  },
  toast: {
    position: 'absolute',
    top: 100,
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
  toastSuccess: {
    backgroundColor: '#4CAF50',
  },
  toastError: {
    backgroundColor: '#F44336',
  },
  toastText: {
    color: 'white',
    fontSize: 14,
    flex: 1,
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});
