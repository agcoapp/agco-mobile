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

export default function AdhesionsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="person-add-outline" size={64} color="#34C759" />
          </View>
          <Text style={styles.title}>Gestion des Adhésions</Text>
          <Text style={styles.subtitle}>
            Gérez les demandes d'adhésion et suivez leur statut.
          </Text>
          
          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <Ionicons name="list-outline" size={24} color="#007AFF" />
              <Text style={styles.featureText}>Voir toutes les adhésions</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="time-outline" size={24} color="#FF9500" />
              <Text style={styles.featureText}>Adhésions en attente</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle-outline" size={24} color="#34C759" />
              <Text style={styles.featureText}>Adhésions approuvées</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="close-circle-outline" size={24} color="#FF3B30" />
              <Text style={styles.featureText}>Adhésions rejetées</Text>
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
  comingSoonButton: {
    backgroundColor: '#34C759',
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
