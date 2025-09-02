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

export default function CartesScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="card-outline" size={64} color="#AF52DE" />
          </View>
          <Text style={styles.title}>Cartes de Membres</Text>
          <Text style={styles.subtitle}>
            Gérez les cartes de membres de l'association.
          </Text>
          
          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <Ionicons name="add-circle-outline" size={24} color="#34C759" />
              <Text style={styles.featureText}>Créer une nouvelle carte</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="search-outline" size={24} color="#007AFF" />
              <Text style={styles.featureText}>Rechercher une carte</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="print-outline" size={24} color="#FF9500" />
              <Text style={styles.featureText}>Imprimer des cartes</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="refresh-outline" size={24} color="#AF52DE" />
              <Text style={styles.featureText}>Renouveler une carte</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="close-circle-outline" size={24} color="#FF3B30" />
              <Text style={styles.featureText}>Révoquer une carte</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="stats-chart-outline" size={24} color="#8E8E93" />
              <Text style={styles.featureText}>Statistiques des cartes</Text>
            </View>
          </View>

          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>Statistiques :</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="card-outline" size={32} color="#007AFF" />
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>Cartes actives</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="time-outline" size={32} color="#FF9500" />
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>En attente</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="close-circle-outline" size={32} color="#FF3B30" />
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>Révoquées</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="refresh-outline" size={32} color="#AF52DE" />
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>À renouveler</Text>
              </View>
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
  comingSoonButton: {
    backgroundColor: '#AF52DE',
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
