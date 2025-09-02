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

export default function SettingsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="create-outline" size={64} color="#8E8E93" />
          </View>
          <Text style={styles.title}>Signature du Président</Text>
          <Text style={styles.subtitle}>
            Gérez la signature officielle du Président de l'association.
          </Text>
          
          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <Ionicons name="add-circle-outline" size={24} color="#34C759" />
              <Text style={styles.featureText}>Ajouter une signature</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="image-outline" size={24} color="#007AFF" />
              <Text style={styles.featureText}>Importer une image</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="create-outline" size={24} color="#FF9500" />
              <Text style={styles.featureText}>Dessiner une signature</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="text-outline" size={24} color="#AF52DE" />
              <Text style={styles.featureText}>Signature textuelle</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="settings-outline" size={24} color="#8E8E93" />
              <Text style={styles.featureText}>Paramètres de signature</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="eye-outline" size={24} color="#FF3B30" />
              <Text style={styles.featureText}>Aperçu de la signature</Text>
            </View>
          </View>

          <View style={styles.signaturePreview}>
            <Text style={styles.previewTitle}>Aperçu de la signature :</Text>
            <View style={styles.previewBox}>
              <Ionicons name="create-outline" size={48} color="#E1E1E1" />
              <Text style={styles.previewText}>Aucune signature configurée</Text>
            </View>
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>Informations :</Text>
            <View style={styles.infoItem}>
              <Ionicons name="information-circle-outline" size={16} color="#007AFF" />
              <Text style={styles.infoText}>La signature sera utilisée sur tous les documents officiels</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="information-circle-outline" size={16} color="#007AFF" />
              <Text style={styles.infoText}>Formats supportés : PNG, JPG, PDF</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="information-circle-outline" size={16} color="#007AFF" />
              <Text style={styles.infoText}>Taille recommandée : 200x100 pixels</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="information-circle-outline" size={16} color="#007AFF" />
              <Text style={styles.infoText}>Seul le Président peut modifier cette signature</Text>
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
  signaturePreview: {
    width: '100%',
    marginBottom: 32,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  previewBox: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E1E1E1',
    borderStyle: 'dashed',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  previewText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  infoContainer: {
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
  comingSoonButton: {
    backgroundColor: '#8E8E93',
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
