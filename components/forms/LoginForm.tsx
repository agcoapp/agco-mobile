import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/apiService';
import AdhesionPendingModal from '../ui/AdhesionPendingModal';
import AdhesionStatusModal from '../ui/AdhesionStatusModal';
import ForcePasswordChangeModal from '../ui/ForcePasswordChangeModal';

interface LoginFormProps {
  onSuccess: () => void;
  onRedirect: (path: string, message: string, rejectionReason?: string) => void;
}

export default function LoginForm({ 
  onSuccess, 
  onRedirect
}: LoginFormProps) {
  const [formData, setFormData] = useState({
    nom_utilisateur: '',
    mot_passe: '',
  });

  const [error, setError] = useState('');
  const [showAdhesionModal, setShowAdhesionModal] = useState(false);
  const [adhesionStatus, setAdhesionStatus] = useState<'pending' | 'rejected' | null>(null);
  const [adhesionMessage, setAdhesionMessage] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [pendingMessage, setPendingMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();

  const handleSubmit = async () => {
    if (!formData.nom_utilisateur.trim() || !formData.mot_passe.trim()) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const loginResult = await login({
        nom_utilisateur: formData.nom_utilisateur,
        mot_passe: formData.mot_passe
      });

      console.log("loginResult", loginResult);

      if (loginResult.showPasswordChangeModal) {
        setShowPasswordChangeModal(true);
        return;
      }

      if (loginResult.showPendingModal) {
        setPendingMessage(loginResult.message || '');
        setShowPendingModal(true);
        return;
      }

      if (loginResult.shouldRedirect) {
        console.log('🔍 Redirection vers:', loginResult.redirectPath);
        console.log('🔍 rejectionReason reçue:', loginResult.rejectionReason);
        
        if (loginResult.redirectPath === '/(tabs)') {
          onSuccess();
        } else {
          console.log('🔍 Appel de onRedirect avec:', {
            path: loginResult.redirectPath,
            message: loginResult.message || '',
            rejectionReason: loginResult.rejectionReason
          });
          
          try {
            onRedirect(loginResult.redirectPath, loginResult.message || '', loginResult.rejectionReason);
            console.log('✅ onRedirect appelé avec succès');
          } catch (error) {
            console.error('❌ Erreur lors de l\'appel à onRedirect:', error);
          }
        }
      }
      
    } catch (err: any) {
      let errorMessage = 'Une erreur inattendue s\'est produite.';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.response?.status) {
        switch (err.response.status) {
          case 401:
            errorMessage = 'Identifiants incorrects.';
            break;
          case 403:
            errorMessage = 'Accès refusé. Votre compte pourrait être désactivé.';
            break;
          case 429:
            errorMessage = 'Trop de tentatives de connexion. Veuillez attendre quelques minutes avant de réessayer.';
            break;
          case 500:
            errorMessage = 'Erreur du serveur. Veuillez réessayer plus tard.';
            break;
          default:
            errorMessage = `Erreur ${err.response.status}: ${err.response.statusText || 'Erreur de connexion'}`;
        }
      } else if (err.request) {
        errorMessage = 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.';
      } else if (err.code === 'NETWORK_ERROR') {
        errorMessage = 'Erreur de connexion réseau. Vérifiez votre connexion internet.';
      } else if (err.code === 'TIMEOUT') {
        errorMessage = 'La connexion a pris trop de temps. Veuillez réessayer.';
      }
      
      setError(errorMessage);
      console.error('Erreur de connexion détaillée:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    if (error) {
      setError('');
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color="#FF0000" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Nom d'utilisateur</Text>
          <TextInput
            style={styles.textInput}
            value={formData.nom_utilisateur}
            onChangeText={(value) => handleChange('nom_utilisateur', value)}
            placeholder="Entrez votre nom d'utilisateur"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
            returnKeyType="next"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Code d'accès</Text>
          <View style={styles.passwordInput}>
            <TextInput
              style={[styles.textInput, styles.passwordTextInput]}
              value={formData.mot_passe}
              onChangeText={(value) => handleChange('mot_passe', value)}
              placeholder="Entrez votre code d'accès"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
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

        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>Se connecter</Text>
          )}
        </TouchableOpacity>

        {/* Modal pour statut d'adhésion */}
        <AdhesionStatusModal
          open={showAdhesionModal}
          onClose={() => setShowAdhesionModal(false)}
          status={adhesionStatus}
          rejectionReason={rejectionReason}
          onGoToRegister={() => {
            setShowAdhesionModal(false);
            onRedirect('/(tabs)', 'Vous pouvez maintenant soumettre une nouvelle demande d\'adhésion.');
          }}
        />

        {/* Modal de changement de mot de passe forcé */}
        <ForcePasswordChangeModal
          open={showPasswordChangeModal}
          username={formData.nom_utilisateur}
          onPasswordChanged={async () => {
            setShowPasswordChangeModal(false);
            
            try {
              const userStatus = await apiService.getUserStatus();
              
              if (userStatus.statut_formulaire.soumis) {
                try {
                  if (userStatus.statut_formulaire.statut === 'EN_ATTENTE') {
                    setPendingMessage('Votre adhésion est en attente d\'approbation. Vous serez notifié une fois qu\'elle sera validée.');
                    setShowPendingModal(true);
                  } else if (userStatus.statut_formulaire.statut === 'APPROUVE') {
                    onSuccess();
                  } else if (userStatus.statut_formulaire.statut === 'REJETE') {
                    onRedirect('/(tabs)', 'Votre adhésion précédente a été rejetée. Vous pouvez soumettre une nouvelle demande.');
                  } else {
                    onSuccess();
                  }
                } catch (adhesionError) {
                  console.error('Erreur lors de la vérification du statut d\'adhésion:', adhesionError);
                  onSuccess();
                }
              } else {
                onRedirect('/(tabs)', 'Mot de passe changé avec succès ! Vous pouvez maintenant remplir le formulaire d\'adhésion.');
              }
            } catch (error) {
              console.error('Erreur lors de la vérification du statut utilisateur:', error);
              onRedirect('/(tabs)', 'Mot de passe changé avec succès ! Vous pouvez maintenant remplir le formulaire d\'adhésion.');
            }
          }}
        />

        {/* Modal pour adhésion en attente */}
        <AdhesionPendingModal
          open={showPendingModal}
          onClose={() => setShowPendingModal(false)}
          message={pendingMessage}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 20,
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
  textInput: {
    borderWidth: 1,
    borderColor: '#E1E1E1',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
    color: '#333',
  },
  passwordInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E1E1E1',
    borderRadius: 8,
    backgroundColor: '#F9F9F9',
    minHeight: 48,
  },
  passwordTextInput: {
    flex: 1,
    paddingRight: 40,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  eyeButton: {
    padding: 12,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
