# Écran de Connexion - SGM Mobile

## Vue d'ensemble

L'écran de connexion est une version React Native de l'interface web existante, adaptée pour les applications mobiles. Il gère l'authentification des utilisateurs avec des vérifications complètes du statut d'adhésion.

## Structure des fichiers

```
├── app/
│   ├── _layout.tsx                 # Layout principal avec AuthProvider
│   ├── index.tsx                   # Point d'entrée avec vérification auth
│   └── login.tsx                   # Écran principal de connexion
├── components/
│   ├── forms/
│   │   └── LoginForm.tsx           # Formulaire de connexion
│   └── ui/
│       ├── AdhesionStatusModal.tsx # Modal pour statut d'adhésion
│       ├── ForcePasswordChangeModal.tsx # Modal changement mot de passe
│       ├── AdhesionPendingModal.tsx # Modal adhésion en attente
│       └── LoadingScreen.tsx       # Écran de chargement
├── hooks/
│   └── useAuth.tsx                 # Hook d'authentification (Context API)
└── services/
    └── apiService.ts              # Service API (mis à jour pour AsyncStorage)
```

## Fonctionnalités

### 1. Vérification d'authentification au démarrage
- **Vérification automatique** : Au lancement de l'app, vérification du statut d'authentification
- **Redirection intelligente** : 
  - Si connecté → Redirection vers Home (`/(tabs)`)
  - Si non connecté → Affichage de l'écran de connexion
- **Écran de chargement** : Affichage pendant la vérification

### 2. Authentification
- Connexion avec nom d'utilisateur et mot de passe
- Validation des champs en temps réel
- Gestion des erreurs de connexion
- Affichage du mot de passe (toggle)

### 3. Vérifications post-connexion
- **Changement de mot de passe forcé** : Si l'utilisateur doit changer son mot de passe temporaire
- **Statut d'adhésion** : Vérification du statut du formulaire d'adhésion
- **Redirections intelligentes** : Selon le statut de l'utilisateur

### 4. Modals informatifs
- **AdhesionStatusModal** : Affiche le statut d'adhésion (en attente/rejeté)
- **ForcePasswordChangeModal** : Force le changement de mot de passe temporaire
- **AdhesionPendingModal** : Informe que l'adhésion est en attente

### 5. Gestion des états
- **En attente** : L'utilisateur voit un message d'attente
- **Rejeté** : L'utilisateur est redirigé vers le formulaire d'adhésion avec la raison du rejet
- **Approuvé** : L'utilisateur accède au dashboard
- **Pas de formulaire** : L'utilisateur est redirigé vers le formulaire d'adhésion

## Architecture Context API

### AuthProvider
Le `AuthProvider` utilise React Context API pour gérer l'état d'authentification global :

```typescript
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<LoginResult>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  checkAuth: () => Promise<void>;
  updateUserProfile: () => Promise<void>;
}
```

### Hook useAuth
```typescript
const { user, isLoading, login, logout, isAuthenticated } = useAuth();
```

## Flux d'authentification

### 1. Démarrage de l'application
```typescript
// app/index.tsx
export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace('/(tabs)'); // Redirection vers Home
      } else {
        router.replace('/(tabs)'); // Redirection vers login (temporaire)
      }
    }
  }, [isAuthenticated, isLoading]);

  return <LoadingScreen message="Démarrage de l'application..." />;
}
```

### 2. Vérification automatique
```typescript
// hooks/useAuth.tsx
useEffect(() => {
  checkAuth(); // Vérification au montage du composant
}, []);

const checkAuth = async () => {
  // Vérification AsyncStorage + API
  // Mise à jour de l'état d'authentification
};
```

## Utilisation

### Navigation
```typescript
import { router } from 'expo-router';

// Redirection vers le dashboard
router.push('/(tabs)');

// Redirection vers l'inscription (à implémenter)
router.push('/register');
```

### Hook useAuth
```typescript
import { useAuth } from '../hooks/useAuth';

const { login, isAuthenticated, user } = useAuth();

const handleLogin = async () => {
  const result = await login({
    nom_utilisateur: 'username',
    mot_passe: 'password'
  });
  
  // Gérer le résultat selon les propriétés retournées
  if (result.showPasswordChangeModal) {
    // Afficher le modal de changement de mot de passe
  }
};
```

### Structure de retour du login
```typescript
interface LoginResult {
  shouldRedirect: boolean;
  redirectPath: string;
  showPendingModal: boolean;
  showPasswordChangeModal?: boolean;
  message?: string;
  rejectionReason?: string;
}
```

## Dépendances

- `@react-native-async-storage/async-storage` : Stockage local des tokens
- `expo-router` : Navigation entre les écrans
- `@expo/vector-icons` : Icônes pour l'interface
- `axios` : Appels API

## Configuration

### Variables d'environnement
```env
NEXT_PUBLIC_API_URL=https://api.example.com
```

### AsyncStorage Keys
- `sgm_token` : Token d'authentification
- `sgm_user` : Données utilisateur complètes

## Gestion des erreurs

L'écran gère plusieurs types d'erreurs :
- **401** : Identifiants incorrects
- **403** : Accès refusé
- **429** : Trop de tentatives
- **500** : Erreur serveur
- **Erreurs réseau** : Problèmes de connexion

## Sécurité

- Validation côté client et serveur
- Tokens JWT sécurisés
- Stockage sécurisé avec AsyncStorage
- Validation des mots de passe forts
- Protection contre les attaques par force brute

## Tests

Pour tester l'écran de connexion :

1. **Démarrage de l'app** : Vérifiez la redirection selon l'état d'authentification
2. **Connexion normale** : Utilisez des identifiants valides
3. **Mot de passe temporaire** : Testez le changement forcé
4. **Adhésion en attente** : Vérifiez les messages d'attente
5. **Adhésion rejetée** : Testez la redirection avec raison
6. **Erreurs réseau** : Simulez des problèmes de connexion

## Maintenance

- Vérifiez régulièrement les tokens d'authentification
- Surveillez les logs d'erreur
- Mettez à jour les dépendances de sécurité
- Testez les différents scénarios d'utilisation

## Changements majeurs depuis la version web

### 1. Context API
- Remplacement du hook simple par un Context Provider
- Gestion d'état global pour l'authentification
- Persistance automatique des données utilisateur

### 2. AsyncStorage
- Remplacement de localStorage par AsyncStorage
- Gestion asynchrone du stockage local
- Compatibilité avec React Native

### 3. Navigation
- Utilisation d'expo-router au lieu de Next.js router
- Routes adaptées pour React Native
- Gestion des redirections simplifiée

### 4. Interface utilisateur
- Composants natifs React Native
- Modals adaptés pour mobile
- Styles optimisés pour les écrans tactiles

### 5. Vérification au démarrage
- Point d'entrée avec vérification automatique
- Écran de chargement pendant la vérification
- Redirection intelligente selon l'état d'authentification
