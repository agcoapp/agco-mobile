import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
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
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { updateUserProfile } = useAuth();

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

  const handlePasswordChange = (password: string) => {
    setNewPassword(password);
    setError('');
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

    // Validation basique de l'email si fourni
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Veuillez saisir une adresse email valide');
      return;
    }

    setIsLoading(true);

    try {
      // Utiliser l'API pour changer le mot de passe temporaire
      const request: any = {
        nouveau_mot_passe: newPassword
      };
      
      // Ajouter l'email si fourni
      if (email.trim()) {
        request.email = email.trim();
      }
      
      await apiService.changeTemporaryPassword(request);
      
      // Mettre à jour le localStorage et l'état avec les nouvelles informations utilisateur
      try {
        await updateUserProfile();
        console.log('✅ localStorage et état utilisateur mis à jour après le changement de mot de passe');
      } catch (updateError) {
        console.error('⚠️ Erreur lors de la mise à jour du profil utilisateur:', updateError);
        // Continuer même si la mise à jour échoue
      }
      
      // Vérifier le statut complet de l'utilisateur après le changement de mot de passe
      try {
        const userStatus = await apiService.getUserStatus();
        
        if (userStatus?.statut_formulaire?.soumis) {
          // L'utilisateur a déjà soumis un formulaire, vérifier le statut de son adhésion
          try {
            const adhesionForm = await apiService.getMemberAdhesionForm();
            
            if (adhesionForm && adhesionForm.statut === 'EN_ATTENTE') {
              // Statut en attente : afficher modal et rester sur la page de connexion
              // On appelle onPasswordChanged() qui sera géré par le composant parent pour afficher le modal
              onPasswordChanged();
            } else if (adhesionForm && adhesionForm.statut === 'APPROUVE') {
              // Statut approuvé : rediriger vers le dashboard
              onPasswordChanged();
            } else if (adhesionForm && adhesionForm.statut === 'REJETE') {
              // Statut rejeté : rediriger vers le formulaire d'adhésion
              onPasswordChanged();
            } else {
              // Statut inconnu, rediriger vers le dashboard par défaut
              onPasswordChanged();
            }
          } catch (adhesionError) {
            console.error('Erreur lors de la vérification du statut d\'adhésion:', adhesionError);
            // En cas d'erreur, rediriger vers le dashboard par défaut
            onPasswordChanged();
          }
        } else {
          // L'utilisateur n'a pas encore soumis de formulaire, rediriger vers /register
          onPasswordChanged();
        }
      } catch (statusError) {
        console.error('Erreur lors de la vérification du statut utilisateur:', statusError);
        // En cas d'erreur, rediriger vers /register par défaut
        onPasswordChanged();
      }
      
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
      setEmail('');
      setError('');
      setShowPassword(false);
      setShowConfirmPassword(false);
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
            <Text style={styles.title}>Changement de mot de passe obligatoire</Text>
          </View>

          <View style={styles.content}>
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
                  onChangeText={handlePasswordChange}
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

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Adresse email (optionnelle)</Text>
              <View style={styles.passwordInput}>
                <TextInput
                  style={styles.textInput}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="exemple@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>
              <Text style={styles.helperText}>
                Votre adresse email sera utilisée pour les communications importantes de l'association
              </Text>
            </View>

            <View style={styles.requirementsContainer}>
              <Text style={styles.requirementsTitle}>Exigences du mot de passe :</Text>
              <Text style={styles.requirement}>• Au moins 8 caractères</Text>
              <Text style={styles.requirement}>• Au moins une lettre minuscule</Text>
              <Text style={styles.requirement}>• Au moins une lettre majuscule</Text>
              <Text style={styles.requirement}>• Au moins un chiffre</Text>
              <Text style={styles.requirement}>• Au moins un caractère spécial (!@#$%^&*)</Text>
              
              <View style={styles.securityWarning}>
                <Ionicons name="shield-checkmark" size={16} color="#FF6B35" />
                <Text style={styles.securityText}>
                  ⚠️ Important : Gardez votre nouveau mot de passe en lieu sûr. Il ne pourra pas être récupéré.
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.primaryButton, (isLoading || !newPassword || !confirmPassword) && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={isLoading || !newPassword || !confirmPassword}
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
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  successText: {
    color: '#2E7D32',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  warningText: {
    color: '#856404',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
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
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
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
  securityWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B35',
  },
  securityText: {
    fontSize: 12,
    color: '#856404',
    marginLeft: 8,
    flex: 1,
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
