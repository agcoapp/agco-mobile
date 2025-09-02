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

export default function ChangePasswordScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="key-outline" size={64} color="#FF9500" />
          </View>
          <Text style={styles.title}>Changer le Mot de Passe</Text>
          <Text style={styles.subtitle}>
            Modifiez votre mot de passe pour sécuriser votre compte.
          </Text>
          
          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <Ionicons name="shield-outline" size={24} color="#007AFF" />
              <Text style={styles.featureText}>Mot de passe actuel</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="lock-closed-outline" size={24} color="#34C759" />
              <Text style={styles.featureText}>Nouveau mot de passe</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle-outline" size={24} color="#FF9500" />
              <Text style={styles.featureText}>Confirmer le nouveau mot de passe</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="eye-outline" size={24} color="#AF52DE" />
              <Text style={styles.featureText}>Afficher/masquer le mot de passe</Text>
            </View>
          </View>

          <View style={styles.securityInfo}>
            <Text style={styles.securityTitle}>Exigences de sécurité :</Text>
            <View style={styles.securityItem}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#34C759" />
              <Text style={styles.securityText}>Au moins 8 caractères</Text>
            </View>
            <View style={styles.securityItem}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#34C759" />
              <Text style={styles.securityText}>Au moins une lettre majuscule</Text>
            </View>
            <View style={styles.securityItem}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#34C759" />
              <Text style={styles.securityText}>Au moins un chiffre</Text>
            </View>
            <View style={styles.securityItem}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#34C759" />
              <Text style={styles.securityText}>Au moins un caractère spécial</Text>
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
    backgroundColor: '#FF9500',
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
