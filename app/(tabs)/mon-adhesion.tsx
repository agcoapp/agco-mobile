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

export default function MonAdhesionScreen() {
  const { user } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="person-outline" size={64} color="#007AFF" />
          </View>
          <Text style={styles.title}>Ma Fiche d'Adhésion</Text>
          <Text style={styles.subtitle}>
            Consultez les détails de votre adhésion à l'association.
          </Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={20} color="#8E8E93" />
              <Text style={styles.infoLabel}>Nom complet :</Text>
              <Text style={styles.infoValue}>
                {user?.prenoms} {user?.nom}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="at-outline" size={20} color="#8E8E93" />
              <Text style={styles.infoLabel}>Nom d'utilisateur :</Text>
              <Text style={styles.infoValue}>{user?.nom_utilisateur}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="shield-outline" size={20} color="#8E8E93" />
              <Text style={styles.infoLabel}>Rôle :</Text>
              <Text style={styles.infoValue}>
                {user?.role === 'MEMBRE' ? 'Membre' : user?.role}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#34C759" />
              <Text style={styles.infoLabel}>Statut :</Text>
              <Text style={[styles.infoValue, styles.statusActive]}>
                {user?.a_soumis_formulaire ? 'Adhésion soumise' : 'Adhésion en cours'}
              </Text>
            </View>
          </View>

          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <Ionicons name="document-outline" size={24} color="#007AFF" />
              <Text style={styles.featureText}>Voir ma demande d'adhésion</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="time-outline" size={24} color="#FF9500" />
              <Text style={styles.featureText}>Suivre l'état de ma demande</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="card-outline" size={24} color="#34C759" />
              <Text style={styles.featureText}>Ma carte de membre</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="settings-outline" size={24} color="#AF52DE" />
              <Text style={styles.featureText}>Modifier mes informations</Text>
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
  infoCard: {
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  statusActive: {
    color: '#34C759',
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
  comingSoonButton: {
    backgroundColor: '#007AFF',
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
