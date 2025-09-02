import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';

export default function DashboardScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
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
          onPress: logout,
        },
      ]
    );
  };

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'MEMBRE':
        return 'Membre';
      case 'PRESIDENT':
        return 'Président';
      case 'SECRETAIRE_GENERALE':
        return 'Secrétaire Général';
      default:
        return role;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* En-tête */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeText}>
                {getWelcomeMessage()}, {user?.prenoms} !
              </Text>
              <Text style={styles.roleText}>
                {getRoleDisplayName(user?.role || '')}
              </Text>
            </View>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Statistiques rapides */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Aperçu</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="people-outline" size={32} color="#007AFF" />
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Membres</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="person-add-outline" size={32} color="#34C759" />
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Nouvelles adhésions</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="document-outline" size={32} color="#FF9500" />
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Documents</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="card-outline" size={32} color="#AF52DE" />
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Cartes membres</Text>
            </View>
          </View>
        </View>

        {/* Actions rapides */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard}>
              <Ionicons name="people-outline" size={24} color="#007AFF" />
              <Text style={styles.actionText}>Voir les membres</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <Ionicons name="person-add-outline" size={24} color="#34C759" />
              <Text style={styles.actionText}>Nouvelle adhésion</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <Ionicons name="document-outline" size={24} color="#FF9500" />
              <Text style={styles.actionText}>Documents</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <Ionicons name="settings-outline" size={24} color="#8E8E93" />
              <Text style={styles.actionText}>Paramètres</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Informations utilisateur */}
        <View style={styles.userInfoContainer}>
          <Text style={styles.sectionTitle}>Mes informations</Text>
          <View style={styles.userInfoCard}>
            <View style={styles.userInfoRow}>
              <Ionicons name="person-outline" size={20} color="#8E8E93" />
              <Text style={styles.userInfoLabel}>Nom complet :</Text>
              <Text style={styles.userInfoValue}>
                {user?.prenoms} {user?.nom}
              </Text>
            </View>
            <View style={styles.userInfoRow}>
              <Ionicons name="at-outline" size={20} color="#8E8E93" />
              <Text style={styles.userInfoLabel}>Nom d'utilisateur :</Text>
              <Text style={styles.userInfoValue}>{user?.nom_utilisateur}</Text>
            </View>
            <View style={styles.userInfoRow}>
              <Ionicons name="shield-outline" size={20} color="#8E8E93" />
              <Text style={styles.userInfoLabel}>Rôle :</Text>
              <Text style={styles.userInfoValue}>
                {getRoleDisplayName(user?.role || '')}
              </Text>
            </View>
            {user?.a_soumis_formulaire && (
              <View style={styles.userInfoRow}>
                <Ionicons name="checkmark-circle-outline" size={20} color="#34C759" />
                <Text style={styles.userInfoLabel}>Statut :</Text>
                <Text style={[styles.userInfoValue, styles.statusActive]}>
                  Adhésion soumise
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
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
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeSection: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  roleText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  logoutButton: {
    padding: 8,
  },
  statsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    alignItems: 'center',
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
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  actionsContainer: {
    padding: 20,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    alignItems: 'center',
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
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
  userInfoContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  userInfoCard: {
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
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  userInfoLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  userInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  statusActive: {
    color: '#34C759',
  },
});
