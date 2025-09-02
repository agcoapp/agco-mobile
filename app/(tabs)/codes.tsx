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

export default function CodesScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="key-outline" size={64} color="#FF3B30" />
          </View>
          <Text style={styles.title}>Codes d'Accès</Text>
          <Text style={styles.subtitle}>
            Gérez les codes d'accès des membres de l'association.
          </Text>
          
          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <Ionicons name="add-circle-outline" size={24} color="#34C759" />
              <Text style={styles.featureText}>Créer un nouveau code</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="search-outline" size={24} color="#007AFF" />
              <Text style={styles.featureText}>Rechercher un code</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="refresh-outline" size={24} color="#FF9500" />
              <Text style={styles.featureText}>Réinitialiser un code</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="close-circle-outline" size={24} color="#FF3B30" />
              <Text style={styles.featureText}>Désactiver un code</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="mail-outline" size={24} color="#AF52DE" />
              <Text style={styles.featureText}>Envoyer un code par email</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="stats-chart-outline" size={24} color="#8E8E93" />
              <Text style={styles.featureText}>Historique des codes</Text>
            </View>
          </View>

          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>Statistiques :</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="key-outline" size={32} color="#007AFF" />
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>Codes actifs</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="time-outline" size={32} color="#FF9500" />
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>En attente</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="close-circle-outline" size={32} color="#FF3B30" />
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>Désactivés</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="refresh-outline" size={32} color="#AF52DE" />
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>À réinitialiser</Text>
              </View>
            </View>
          </View>

          <View style={styles.securityInfo}>
            <Text style={styles.securityTitle}>Sécurité :</Text>
            <View style={styles.securityItem}>
              <Ionicons name="shield-checkmark-outline" size={16} color="#34C759" />
              <Text style={styles.securityText}>Tous les codes sont chiffrés</Text>
            </View>
            <View style={styles.securityItem}>
              <Ionicons name="shield-checkmark-outline" size={16} color="#34C759" />
              <Text style={styles.securityText}>Historique des modifications</Text>
            </View>
            <View style={styles.securityItem}>
              <Ionicons name="shield-checkmark-outline" size={16} color="#34C759" />
              <Text style={styles.securityText}>Notifications de connexion</Text>
            </View>
            <View style={styles.securityItem}>
              <Ionicons name="shield-checkmark-outline" size={16} color="#34C759" />
              <Text style={styles.securityText}>Expiration automatique</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.comingSoonButton}
            onPress={() => Alert.alert('En développement', 'Cette fonctionnalité sera bientôt disponible.')}
          >
            <Text style={styles.comingSoonText}>Bientôt disponible</Text>
          </TouchableOpacity>
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
  content: {
    padding: 20,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 20,
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
    marginBottom: 32,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
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
  featureText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 16,
    flex: 1,
  },
  statsContainer: {
    width: '100%',
    marginBottom: 32,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
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
  securityInfo: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  securityText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  comingSoonButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  comingSoonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
