import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/apiService';

interface AdhesionFormMember {
  id: number;
  nom_complet: string;
  email: string | null;
  telephone: string;
  statut: 'EN_ATTENTE' | 'APPROUVE' | 'REJETE';
  code_formulaire: string;
  numero_adhesion?: string;
  soumis_le: string;
  raison_rejet: string | null;
  rejete_le: string | null;
  rejete_par: string | null;
  est_actif: boolean;
  raison_retrait?: string | null;
  date_retrait?: string | null;
  formulaire_actuel: {
    id: number;
    id_utilisateur: number;
    numero_version: number;
    url_image_formulaire: string;
    donnees_snapshot: {
      nom: string;
      adresse: string;
      prenoms: string;
      telephone: string;
      profession: string;
      commentaire?: string;
      nom_conjoint?: string;
      signature_url: string;
      date_naissance: string;
      lieu_naissance: string;
      nombre_enfants: number;
      employeur_ecole: string;
      prenom_conjoint?: string;
      ville_residence: string;
      selfie_photo_url: string;
      date_entree_congo: string;
      date_emission_piece?: string;
      url_image_formulaire: string;
      numero_carte_consulaire?: string;
    };
    est_version_active: boolean;
    cree_le: string;
  } | null;
}

export default function MembresScreen() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [members, setMembers] = useState<AdhesionFormMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // 0: Actifs, 1: Retirés
  const [showRemovalModal, setShowRemovalModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<AdhesionFormMember | null>(null);
  const [removalReason, setRemovalReason] = useState('');
  const [isProcessingRemoval, setIsProcessingRemoval] = useState(false);

  // Charger les membres
  useEffect(() => {
    const loadMembers = async () => {
      setLoading(true);
      try {
        // Charger les formulaires d'adhésion pour les admins
        if (user?.role === 'PRESIDENT' || user?.role === 'SECRETAIRE_GENERALE') {
          const data = await apiService.getAdhesionForms();
          console.log("📊 Données reçues de l'API:", data);
          
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
          
          // Convertir vers notre interface
          const convertedMembers: AdhesionFormMember[] = processedData.map((apiMember: any) => ({
            id: apiMember.id,
            nom_complet: apiMember.nom_complet || 'Nom non disponible',
            email: apiMember.email,
            telephone: apiMember.telephone || '',
            statut: apiMember.statut || 'EN_ATTENTE',
            code_formulaire: apiMember.code_formulaire || '',
            numero_adhesion: '',
            soumis_le: apiMember.soumis_le || '',
            raison_rejet: apiMember.raison_rejet,
            rejete_le: apiMember.rejete_le,
            rejete_par: apiMember.rejete_par,
            est_actif: apiMember.est_actif !== undefined ? apiMember.est_actif : apiMember.statut === 'APPROUVE',
            formulaire_actuel: apiMember.formulaire_actuel
          }));
          
          setMembers(convertedMembers);
        } else {
          // Pour les membres, charger le répertoire des membres
          const memberData = await apiService.getMemberDirectory();
          console.log("📊 Données membres reçues:", memberData);
          
          let processedMemberData: any[] = [];
          
          if (memberData && typeof memberData === 'object') {
            if (memberData.donnees && Array.isArray(memberData.donnees)) {
              processedMemberData = memberData.donnees;
            } else if (Array.isArray(memberData)) {
              processedMemberData = memberData;
            }
          }
          
          // Convertir vers notre interface
          const convertedMembers: AdhesionFormMember[] = processedMemberData.map((apiMember: any) => ({
            id: apiMember.id,
            nom_complet: apiMember.nom_complet || 'Nom non disponible',
            email: apiMember.email === 'Non renseigné' ? null : apiMember.email,
            telephone: apiMember.telephone || '',
            statut: apiMember.statut || 'EN_ATTENTE',
            code_formulaire: apiMember.numero_adhesion || '',
            numero_adhesion: apiMember.numero_adhesion || '',
            soumis_le: '',
            raison_rejet: null,
            rejete_le: null,
            rejete_par: null,
            est_actif: apiMember.statut === 'APPROUVE',
            formulaire_actuel: {
              id: apiMember.id,
              id_utilisateur: apiMember.id,
              numero_version: 1,
              url_image_formulaire: '',
              donnees_snapshot: {
                nom: apiMember.nom || '',
                adresse: apiMember.adresse || '',
                prenoms: apiMember.prenoms || '',
                telephone: apiMember.telephone || '',
                profession: apiMember.profession || 'Membre',
                commentaire: '',
                nom_conjoint: '',
                signature_url: '',
                date_naissance: '',
                lieu_naissance: '',
                nombre_enfants: 0,
                employeur_ecole: '',
                prenom_conjoint: '',
                ville_residence: apiMember.ville_residence || '',
                selfie_photo_url: '',
                date_entree_congo: '',
                date_emission_piece: '',
                url_image_formulaire: '',
                numero_carte_consulaire: ''
              },
              est_version_active: true,
              cree_le: new Date().toISOString()
            }
          }));
          
          setMembers(convertedMembers);
        }
      } catch (error) {
        console.error('❌ Erreur lors du chargement des membres:', error);
        Alert.alert('Erreur', 'Erreur lors du chargement des membres');
      } finally {
        setLoading(false);
      }
    };

    loadMembers();
  }, [user?.role]);

  // Filtrer les membres selon l'onglet actif
  const getFilteredMembers = () => {
    if (user?.role === 'MEMBRE') {
      return members.filter(member => member.est_actif === true);
    }
    
    switch (activeTab) {
      case 0: // Actifs
        return members.filter(member => member.est_actif === true);
      case 1: // Retirés
        return members.filter(member => member.est_actif === false);
      default:
        return members.filter(member => member.est_actif === true);
    }
  };

  // Filtrer les membres selon le terme de recherche
  const getSearchedMembers = () => {
    const filtered = getFilteredMembers();
    if (!searchTerm) return filtered;
    
    const searchLower = searchTerm.toLowerCase();
    return filtered.filter(member => {
      const nomForm = member.formulaire_actuel?.donnees_snapshot?.nom?.toLowerCase() || '';
      const prenomsForm = member.formulaire_actuel?.donnees_snapshot?.prenoms?.toLowerCase() || '';
      const adresseForm = member.formulaire_actuel?.donnees_snapshot?.adresse?.toLowerCase() || '';
      const nomDirect = member.nom_complet?.toLowerCase() || '';
      const telephone = member.telephone?.toLowerCase() || '';
      const email = member.email?.toLowerCase() || '';
      const codeFormulaire = member.code_formulaire?.toLowerCase() || '';
      
      return nomForm.includes(searchLower) ||
             prenomsForm.includes(searchLower) ||
             adresseForm.includes(searchLower) ||
             nomDirect.includes(searchLower) ||
             telephone.includes(searchLower) ||
             email.includes(searchLower) ||
             codeFormulaire.includes(searchLower);
    });
  };

  const handleMemberRemoval = (member: AdhesionFormMember) => {
    setSelectedMember(member);
    setShowRemovalModal(true);
  };

  const handleConfirmRemoval = async () => {
    if (!selectedMember || !removalReason.trim()) return;

    try {
      setIsProcessingRemoval(true);
      
      console.log('Désactivation du membre:', selectedMember.id, 'Raison:', removalReason);
      
      // Appeler l'API pour désactiver l'utilisateur
      const result = await apiService.deactivateUser(selectedMember.id, removalReason);
      console.log('Résultat de l\'API:', result);
      
      // Mettre à jour l'état local
      setMembers(prevMembers => 
        prevMembers.map(member => 
          member.id === selectedMember.id 
            ? { ...member, est_actif: false, raison_retrait: removalReason, date_retrait: new Date().toISOString() }
            : member
        )
      );
      
      Alert.alert('Succès', 'Membre retiré avec succès');
      setShowRemovalModal(false);
      setSelectedMember(null);
      setRemovalReason('');
    } catch (error) {
      console.error('Erreur lors du retrait du membre:', error);
      Alert.alert('Erreur', 'Erreur lors du retrait du membre');
    } finally {
      setIsProcessingRemoval(false);
    }
  };

  const handleViewMember = (member: AdhesionFormMember) => {
    router.push('/(tabs)/adhesions');
  };

  const handleGenerateCard = (member: AdhesionFormMember) => {
    router.navigate({
      pathname: '/carte/[id]',
      params: { id: member.id.toString() }
    });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Date invalide';
      }
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      return 'Erreur de formatage';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement des membres...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderMemberItem = ({ item }: { item: AdhesionFormMember }) => {
    const showActions = user?.role !== 'MEMBRE' && activeTab === 0;
    
    return (
      <View style={styles.memberCard}>
        <View style={styles.memberHeader}>
          <Text style={styles.memberName}>{item.nom_complet}</Text>
          <View style={[styles.statusBadge, { backgroundColor: item.est_actif ? '#34C759' : '#FF3B30' }]}>
            <Text style={styles.statusText}>{item.est_actif ? 'Actif' : 'Retiré'}</Text>
          </View>
        </View>
        
        <View style={styles.memberDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>N° d'Adhérant:</Text>
            <Text style={styles.detailValue}>{item.code_formulaire || item.numero_adhesion || 'N/A'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Nom:</Text>
            <Text style={styles.detailValue}>
              {item.formulaire_actuel?.donnees_snapshot?.nom || item.nom_complet?.split(' ').slice(-1)[0] || 'N/A'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Prénom:</Text>
            <Text style={styles.detailValue}>
              {item.formulaire_actuel?.donnees_snapshot?.prenoms || item.nom_complet?.split(' ').slice(0, -1).join(' ') || 'N/A'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Adresse:</Text>
            <Text style={styles.detailValue}>
              {item.formulaire_actuel?.donnees_snapshot?.adresse || 'N/A'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Téléphone:</Text>
            <Text style={styles.detailValue}>{item.telephone || 'N/A'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Email:</Text>
            <Text style={styles.detailValue}>{item.email || 'N/A'}</Text>
          </View>
          
          {activeTab === 1 && item.raison_retrait && (
            <View style={styles.removalReason}>
              <Text style={styles.removalLabel}>Raison du retrait:</Text>
              <Text style={styles.removalText}>{item.raison_retrait}</Text>
              {item.date_retrait && (
                <Text style={styles.removalDate}>
                  Retiré le {formatDate(item.date_retrait)}
                </Text>
              )}
            </View>
          )}
        </View>
        
        {showActions && (
          <View style={styles.memberActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleViewMember(item)}
            >
              <Ionicons name="eye-outline" size={20} color="#007AFF" />
              <Text style={styles.actionButtonText}>Voir</Text>
            </TouchableOpacity>
            
            {item.statut === 'APPROUVE' && (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, styles.cardButton]}
                  onPress={() => handleGenerateCard(item)}
                >
                  <Ionicons name="card-outline" size={20} color="#34C759" />
                  <Text style={[styles.actionButtonText, styles.cardButtonText]}>Carte</Text>
                </TouchableOpacity>
                
                {user?.role === 'SECRETAIRE_GENERALE' && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.removeButton]}
                    onPress={() => handleMemberRemoval(item)}
                  >
                    <Ionicons name="person-remove-outline" size={20} color="white" />
                    <Text style={[styles.actionButtonText, styles.removeButtonText]}>Retirer</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        )}
      </View>
    );
  };

  const searchedMembers = getSearchedMembers();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Bouton de retour */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
        
        {/* Titre */}
        <Text style={styles.title}>Gestion des Membres</Text>

        {/* Barre de recherche */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#8E8E93" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher par nom, prénom, adresse, téléphone ou email..."
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>

        {/* Onglets */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 0 && styles.activeTab]}
            onPress={() => setActiveTab(0)}
          >
            <Text style={[styles.tabText, activeTab === 0 && styles.activeTabText]}>
              Actifs ({members.filter(m => m.est_actif === true).length})
            </Text>
          </TouchableOpacity>
          
          {user?.role !== 'MEMBRE' && (
            <TouchableOpacity
              style={[styles.tab, activeTab === 1 && styles.activeTab]}
              onPress={() => setActiveTab(1)}
            >
              <Text style={[styles.tabText, activeTab === 1 && styles.activeTabText]}>
                Retirés ({members.filter(m => m.est_actif === false).length})
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Liste des membres */}
        <View style={styles.listContainer}>
          {searchedMembers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color="#8E8E93" />
              <Text style={styles.emptyTitle}>Aucun membre trouvé</Text>
              <Text style={styles.emptyText}>
                {searchTerm 
                  ? 'Aucun membre ne correspond à votre recherche.'
                  : 'Il n\'y a actuellement aucun membre dans le système.'
                }
              </Text>
            </View>
          ) : (
            <FlatList
              data={searchedMembers}
              renderItem={renderMemberItem}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.flatListContent}
            />
          )}
        </View>
      </View>

      {/* Modal de confirmation de retrait */}
      <Modal
        visible={showRemovalModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRemovalModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirmer le retrait</Text>
            <Text style={styles.modalText}>
              Êtes-vous sûr de vouloir retirer le membre {selectedMember?.nom_complet} ?
            </Text>
            
            <Text style={styles.modalLabel}>Raison du retrait *</Text>
            <TextInput
              style={styles.reasonInput}
              placeholder="Entrez la raison du retrait..."
              value={removalReason}
              onChangeText={setRemovalReason}
              multiline
              numberOfLines={3}
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowRemovalModal(false);
                  setSelectedMember(null);
                  setRemovalReason('');
                }}
                disabled={isProcessingRemoval}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.removeButton]}
                onPress={handleConfirmRemoval}
                disabled={!removalReason.trim() || isProcessingRemoval}
              >
                {isProcessingRemoval ? (
                  <ActivityIndicator size={16} color="white" />
                ) : (
                  <Text style={styles.removeButtonText}>Retirer</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
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
  listContainer: {
    flex: 1,
  },
  flatListContent: {
    paddingBottom: 20,
  },
  memberCard: {
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
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  memberName: {
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
  memberDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    width: 100,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  removalReason: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFEAA7',
  },
  removalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 4,
  },
  removalText: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 4,
  },
  removalDate: {
    fontSize: 12,
    color: '#856404',
    fontStyle: 'italic',
  },
  memberActions: {
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
  cardButton: {
    backgroundColor: '#E8F5E8',
  },
  cardButtonText: {
    color: '#34C759',
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
   removeButton: {
     backgroundColor: '#FF3B30',
   },
   removeButtonText: {
     fontSize: 16,
     fontWeight: '600',
     color: 'white',
   },
});
