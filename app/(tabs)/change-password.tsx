import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/apiService';

export default function ChangePasswordScreen() {
  const { user, updateUserProfile, logout } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setSuccess(null);

    try {
      // Validation des champs
      if (!oldPassword || !newPassword || !confirmPassword) {
        Alert.alert('Erreur', 'Tous les champs sont obligatoires');
        setLoading(false);
        return;
      }

      if (newPassword.length < 8) {
        Alert.alert('Erreur', 'Le nouveau mot de passe doit contenir au minimum 8 caractères');
        setLoading(false);
        return;
      }

      if (newPassword !== confirmPassword) {
        Alert.alert('Erreur', 'Les nouveaux mots de passe ne correspondent pas');
        setLoading(false);
        return;
      }

      if (oldPassword === newPassword) {
        Alert.alert('Erreur', 'Le nouveau mot de passe doit être différent de l\'actuel');
        setLoading(false);
        return;
      }

      // Utiliser l'API pour changer le mot de passe
      const response = await apiService.changePassword({
        ancien_mot_passe: oldPassword,
        nouveau_mot_passe: newPassword,
        confirmer_mot_passe: confirmPassword
      });

      console.log('🔍 Réponse de l\'API:', response);

      // Mettre à jour le profil utilisateur
      try {
        await updateUserProfile();
        console.log('✅ Profil utilisateur mis à jour après le changement de mot de passe');
      } catch (updateError) {
        console.error('⚠️ Erreur lors de la mise à jour du profil utilisateur:', updateError);
        // Continuer même si la mise à jour échoue
      }

      setSuccess('Mot de passe changé avec succès. Déconnexion en cours...');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Déconnecter l'utilisateur après 2 secondes
      setTimeout(async () => {
        try {
          await logout();
          console.log('✅ Utilisateur déconnecté après changement de mot de passe');
        } catch (logoutError) {
          console.error('⚠️ Erreur lors de la déconnexion:', logoutError);
          // Rediriger vers la page de connexion même si la déconnexion échoue
          router.replace('/login');
        }
      }, 2000);

    } catch (error: any) {
      console.error('Erreur lors du changement de mot de passe:', error);
      Alert.alert(
        'Erreur',
        error.response?.data?.message || 'Votre Ancien Mot De Passe Est Incorrect'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

    return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <View style={styles.container}>
          {/* Header */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.form}>
              <Text style={styles.title}>Changer Mon Mot De Passe</Text>

              {/* Message de succès */}
              {success && (
                <View style={styles.successAlert}>
                  <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                  <Text style={styles.successText}>{success}</Text>
          </View>
              )}

              {/* Ancien mot de passe */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Ancien Mot De Passe</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={oldPassword}
                    onChangeText={setOldPassword}
                    placeholder="Saisissez Votre Ancien Mot De Passe"
                    secureTextEntry={!showOldPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowOldPassword(!showOldPassword)}
                  >
                    <Ionicons
                      name={showOldPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
            </View>
          </View>

              {/* Nouveau mot de passe */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Nouveau Mot De Passe</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Saisissez Votre Nouveau Mot De Passe"
                    secureTextEntry={!showNewPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowNewPassword(!showNewPassword)}
                  >
                    <Ionicons
                      name={showNewPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
            </View>
                <Text style={styles.helperText}>
                  Le mot de passe doit contenir au minimum 8 caractères et être sécurisé.
                </Text>
            </View>


              {/* Confirmation du nouveau mot de passe */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirmer Le Nouveau Mot De Passe</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirmez Votre Nouveau Mot De Passe"
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Ionicons
                      name={showConfirmPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
            </View>
          </View>

              {/* Bouton de validation */}
          <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
          >
                <Text style={styles.submitButtonText}>
                  {loading ? 'Changement En Cours...' : 'Changer Le Mot De Passe'}
                </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 5,
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 15,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 15,
  },
  eyeButton: {
    padding: 5,
  },
  helperText: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    fontStyle: 'italic',
  },
  successAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
  },
  successText: {
    fontSize: 14,
    color: '#34C759',
    marginLeft: 10,
    flex: 1,
  },
  warningAlert: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF3E0',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  warningContent: {
    flex: 1,
    marginLeft: 10,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9500',
    marginBottom: 5,
  },
  warningText: {
    fontSize: 14,
    color: '#FF9500',
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
