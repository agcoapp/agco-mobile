import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { apiService, LoginRequest, LoginResponse, User } from '../services/apiService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<{
    shouldRedirect: boolean;
    redirectPath: string;
    showPendingModal: boolean;
    showPasswordChangeModal?: boolean;
    message?: string;
    rejectionReason?: string;
  }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  checkAuth: () => Promise<void>;
  updateUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

    const checkAuth = async () => {
    try {
      console.log('🔍 Début de la vérification d\'authentification...');
      
      const savedUser = await AsyncStorage.getItem('sgm_user');
      const savedToken = await AsyncStorage.getItem('sgm_token');
      
      console.log('📱 Données AsyncStorage:', { savedUser: !!savedUser, savedToken: !!savedToken });
      
      if (savedUser && savedToken) {
        console.log('✅ Données AsyncStorage trouvées, configuration du token...');
        await apiService.setToken(savedToken);
        
        try {
          // Utiliser les informations du user stockées dans AsyncStorage
          const parsedUserStatus = JSON.parse(savedUser);

          console.log("📋 parsedUserStatus complet:", parsedUserStatus);
          
          const user: User = {
            id: parsedUserStatus.utilisateur.id,
            nom_utilisateur: parsedUserStatus.utilisateur.nom_utilisateur,
            role: parsedUserStatus.utilisateur.role,
            statut: parsedUserStatus.utilisateur.statut,
            est_actif: parsedUserStatus.utilisateur.est_actif,
            a_soumis_formulaire: parsedUserStatus.statut_formulaire.soumis,
            prenoms: parsedUserStatus.utilisateur.nom_complet.split(' ')[0] || '',
            nom: parsedUserStatus.utilisateur.nom_complet.split(' ').slice(1).join(' ') || '',
            email: '',
            telephone: ''
          };
          
          setUser(user);
          
          // Vérifier le statut d'adhésion depuis AsyncStorage et rediriger selon la logique
          console.log('🔍 Vérification du statut d\'adhésion:');
          console.log('- Formulaire soumis:', parsedUserStatus.statut_formulaire.soumis);
          console.log('- Statut:', parsedUserStatus.statut_formulaire.statut);
          
          if (parsedUserStatus.statut_formulaire.soumis) {
            const statutAdhesion = parsedUserStatus.statut_formulaire.statut;
            
            console.log('📋 Statut d\'adhésion détecté:', statutAdhesion);
            
            if (statutAdhesion === 'APPROUVE') {
              // Seuls les membres APPROUVE peuvent accéder aux (tabs)
              console.log('✅ Statut APPROUVE - Redirection vers (tabs)');
              router.replace('/(tabs)');
            } else if (statutAdhesion === 'EN_ATTENTE') {
              // Statut en attente : rester sur la page actuelle
              console.log('⏳ Statut EN_ATTENTE - Reste sur la page actuelle');
            } else if (statutAdhesion === 'REJETE') {
              // Statut rejeté : rediriger vers /register
              console.log('❌ Statut REJETE - Redirection vers /register');
              router.replace('/register');
            } else {
              // Statut inconnu ou autre : rediriger vers /register par sécurité
              console.log('⚠️ Statut inconnu:', statutAdhesion, '- Redirection vers /register par sécurité');
              router.replace('/register');
            }
          } else {
            // L'utilisateur n'a pas encore soumis de formulaire, rediriger vers /register
            console.log('📝 Pas de formulaire soumis - Redirection vers /register');
            router.replace('/register');
          }
          
          setIsLoading(false);
          return;
        } catch (parseError) {
          console.error('❌ Erreur lors du parsing d\'AsyncStorage:', parseError);
          await AsyncStorage.multiRemove(['sgm_user', 'sgm_token']);
          router.replace('/login');
        }
      } else {
        console.log('⚠️ Pas de données AsyncStorage trouvées');
      }

      // Fallback : vérifier le token et récupérer les infos depuis l'API
      console.log('🔄 Tentative de récupération via API...');
      const token = await apiService.getToken();
      if (token) {
        console.log('✅ Token trouvé, récupération du statut utilisateur...');
        const userStatus = await apiService.getUserStatus();
        
        const user: User = {
          id: userStatus.utilisateur.id,
          nom_utilisateur: userStatus.utilisateur.nom_utilisateur,
          role: userStatus.utilisateur.role,
          statut: userStatus.utilisateur.statut,
          est_actif: userStatus.utilisateur.est_actif,
          a_soumis_formulaire: userStatus.statut_formulaire.soumis,
          prenoms: userStatus.utilisateur.nom_complet.split(' ')[0] || '',
          nom: userStatus.utilisateur.nom_complet.split(' ').slice(1).join(' ') || '',
          email: '',
          telephone: ''
        };
        
        setUser(user);
        await AsyncStorage.setItem('sgm_user', JSON.stringify(userStatus));
        
        // Appliquer la même logique de redirection (fallback)
        console.log('🔍 Vérification du statut d\'adhésion (fallback):');
        console.log('- Formulaire soumis:', userStatus.statut_formulaire.soumis);
        console.log('- Statut:', userStatus.statut_formulaire.statut);
        
        if (userStatus.statut_formulaire.soumis) {
          const statutAdhesion = userStatus.statut_formulaire.statut;
          
          console.log('📋 Statut d\'adhésion détecté (fallback):', statutAdhesion);
          
          if (statutAdhesion === 'APPROUVE') {
            console.log('✅ Statut APPROUVE (fallback) - Redirection vers (tabs)');
            router.replace('/(tabs)');
          } else if (statutAdhesion === 'EN_ATTENTE') {
            console.log('⏳ Statut EN_ATTENTE (fallback) - Reste sur la page actuelle');
          } else {
            console.log('❌ Statut non-APPROUVE (fallback):', statutAdhesion, '- Redirection vers /register');
            router.replace('/register');
          }
        } else {
          console.log('📝 Pas de formulaire soumis (fallback) - Redirection vers /register');
          router.replace('/register');
        }
      } else {
        console.log('❌ Aucun token trouvé, redirection vers login');
        router.replace('/login');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la vérification de l\'authentification:', error);
      await apiService.clearToken();
      await AsyncStorage.multiRemove(['sgm_user', 'sgm_token']);
      router.replace('/login');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginRequest) => {
    try {
      setIsLoading(true);
      const response: LoginResponse = await apiService.login(credentials);
      
      const userStatus = await apiService.getUserStatus();
      
      console.log("userStatus", userStatus);
      
      const user: User = {
        id: userStatus.utilisateur.id,
        nom_utilisateur: userStatus.utilisateur.nom_utilisateur,
        role: userStatus.utilisateur.role,
        statut: userStatus.utilisateur.statut,
        est_actif: userStatus.utilisateur.est_actif,
        a_soumis_formulaire: userStatus.statut_formulaire.soumis,
        prenoms: userStatus.utilisateur.nom_complet.split(' ')[0] || '',
        nom: userStatus.utilisateur.nom_complet.split(' ').slice(1).join(' ') || '',
        email: '',
        telephone: ''
      };
      
      setUser(user);
      
      await AsyncStorage.setItem('sgm_user', JSON.stringify(userStatus));
      
      const token = await apiService.getToken();
      if (token) {
        await AsyncStorage.setItem('sgm_token', token);
      }

      if (userStatus.doit_changer_mot_passe) {
        if (userStatus.utilisateur.role === 'MEMBRE') {
          return {
            shouldRedirect: false,
            redirectPath: '',
            showPendingModal: false,
            showPasswordChangeModal: true,
            message: 'Vous devez changer votre mot de passe temporaire.'
          };
        } else {
          return {
            shouldRedirect: true,
            redirectPath: '/(tabs)',
            showPendingModal: false,
            showPasswordChangeModal: false,
          };
        }
      }

      if (userStatus.statut_formulaire.soumis) {
        const statutAdhesion = userStatus.statut_formulaire.statut;
        if (statutAdhesion === 'EN_ATTENTE') {
          return {
            shouldRedirect: false,
            redirectPath: '',
            showPendingModal: true,
            showPasswordChangeModal: false,
            message: 'Votre adhésion est en attente d\'approbation.'
          };
        } else if (statutAdhesion === 'APPROUVE') {
          // Seuls les membres APPROUVE peuvent accéder aux (tabs)
          return {
            shouldRedirect: true,
            redirectPath: '/(tabs)',
            showPendingModal: false,
            showPasswordChangeModal: false,
            message: 'Connexion réussie ! Redirection vers votre tableau de bord.'
          };
        } else if (statutAdhesion === 'REJETE') {
          // Statut rejeté : rediriger vers /register
          return {
            shouldRedirect: true,
            redirectPath: '/register',
            showPendingModal: false,
            showPasswordChangeModal: false,
            message: 'Votre adhésion précédente a été rejetée. Vous pouvez soumettre une nouvelle demande.',
            rejectionReason: userStatus.statut_formulaire.raison_rejet || 'Aucune raison spécifiée'
          };
        } else {
          // Statut inconnu ou autre : rediriger vers /register par sécurité
          return {
            shouldRedirect: true,
            redirectPath: '/register',
            showPendingModal: false,
            showPasswordChangeModal: false,
            message: 'Statut d\'adhésion non reconnu. Veuillez compléter votre formulaire d\'adhésion.'
          };
        }
      } else {
        // L'utilisateur n'a pas encore soumis de formulaire, rediriger vers /register
        return {
          shouldRedirect: true,
          redirectPath: '/register',
          showPendingModal: false,
          showPasswordChangeModal: false,
          message: 'Vous devez d\'abord remplir le formulaire d\'adhésion.'
        };
      }


    } catch (error) {
      console.error('Erreur de connexion:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
      setUser(null);
      await AsyncStorage.multiRemove(['sgm_user', 'sgm_token']);
      router.replace('/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      setUser(null);
      await AsyncStorage.multiRemove(['sgm_user', 'sgm_token']);
      router.replace('/login');
    }
  };

  const updateUserProfile = async () => {
    try {
      const updatedUserStatus = await apiService.getUserStatus();
      
      const user: User = {
        id: updatedUserStatus.utilisateur.id,
        nom_utilisateur: updatedUserStatus.utilisateur.nom_utilisateur,
        role: updatedUserStatus.utilisateur.role,
        statut: updatedUserStatus.utilisateur.statut,
        est_actif: updatedUserStatus.utilisateur.est_actif,
        a_soumis_formulaire: updatedUserStatus.statut_formulaire.soumis,
        prenoms: updatedUserStatus.utilisateur.nom_complet.split(' ')[0] || '',
        nom: updatedUserStatus.utilisateur.nom_complet.split(' ').slice(1).join(' ') || '',
        email: '',
        telephone: ''
      };
      
      setUser(user);
      await AsyncStorage.setItem('sgm_user', JSON.stringify(updatedUserStatus));
      console.log('✅ Profil utilisateur mis à jour dans AsyncStorage et l\'état');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil utilisateur:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user,
    checkAuth,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
}
