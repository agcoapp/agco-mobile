import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/apiService';

interface ForcePasswordChangeModalProps {
  open: boolean;
  username: string;
  onPasswordChanged: () => void;
}

export default function ForcePasswordChangeModal({
  open,
  username,
  onPasswordChanged,
}: ForcePasswordChangeModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { login } = useAuth();

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return 'Le mot de passe doit contenir au moins 8 caractères';
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Le mot de passe doit contenir au moins une lettre minuscule';
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Le mot de passe doit contenir au moins une lettre majuscule';
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Le mot de passe doit contenir au moins un chiffre';
    }
    if (!/(?=.*[!@#$%^&*])/.test(password)) {
      return 'Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*)';
    }
    return null;
  };

  const handleSubmit = async () => {
    setError('');

    // Validation du mot de passe
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    // Vérification de la confirmation
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setIsLoading(true);

    try {
      await apiService.changeTemporaryPassword({
        nouveau_mot_passe: newPassword,
        email: username, // Utiliser le nom d'utilisateur comme email
      });

      Alert.alert(
        'Succès',
        'Votre mot de passe a été changé avec succès !',
        [
          {
            text: 'OK',
            onPress: () => {
              setNewPassword('');
              setConfirmPassword('');
              setError('');
              onPasswordChanged();
            },
          },
        ]
      );
    } catch (error: any) {
      setError(error.message || 'Une erreur s\'est produite lors du changement de mot de passe');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setNewPassword('');
      setConfirmPassword('');
      setError('');
    }
  };

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Ionicons
              name="lock-closed"
              size={48}
              color="#007AFF"
            />
            <Text style={styles.title}>Changement de mot de passe requis</Text>
          </View>

          <View style={styles.content}>
            <Text style={styles.message}>
              Pour des raisons de sécurité, vous devez changer votre mot de passe temporaire.
            </Text>

            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color="#FF0000" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Nouveau mot de passe</Text>
              <View style={styles.passwordInput}>
                <TextInput
                  style={styles.textInput}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Entrez votre nouveau mot de passe"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirmer le mot de passe</Text>
              <View style={styles.passwordInput}>
                <TextInput
                  style={styles.textInput}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirmez votre nouveau mot de passe"
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
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

            <View style={styles.requirementsContainer}>
              <Text style={styles.requirementsTitle}>Exigences du mot de passe :</Text>
              <Text style={styles.requirement}>• Au moins 8 caractères</Text>
              <Text style={styles.requirement}>• Au moins une lettre minuscule</Text>
              <Text style={styles.requirement}>• Au moins une lettre majuscule</Text>
              <Text style={styles.requirement}>• Au moins un chiffre</Text>
              <Text style={styles.requirement}>• Au moins un caractère spécial (!@#$%^&*)</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.primaryButton, isLoading && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  Changer le mot de passe
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    margin: 20,
    maxWidth: 400,
    width: '100%',
    maxHeight: '90%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 12,
    textAlign: 'center',
    color: '#333',
  },
  content: {
    marginBottom: 24,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF0000',
  },
  errorText: {
    color: '#FF0000',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  passwordInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E1E1E1',
    borderRadius: 8,
    backgroundColor: '#F9F9F9',
  },
  textInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
  },
  eyeButton: {
    padding: 12,
  },
  requirementsContainer: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  requirement: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
