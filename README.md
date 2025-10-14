# SGM Mobile - Système de Gestion des Membres

[![React Native](https://img.shields.io/badge/React%20Native-0.81.4-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54.0.8-000020.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-Private-red.svg)]()

Application mobile cross-platform pour la gestion des membres de l'Association des Gabonais du Congo (AGCO). Cette application permet la gestion complète des adhésions, la génération de cartes de membres, et l'administration des membres de l'association.

---

## 📋 Table des matières

- [Aperçu du projet](#-aperçu-du-projet)
- [Fonctionnalités principales](#-fonctionnalités-principales)
- [Architecture](#-architecture)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Structure du projet](#-structure-du-projet)
- [Guide de développement](#-guide-de-développement)
- [Gestion des utilisateurs](#-gestion-des-utilisateurs)
- [API Backend](#-api-backend)
- [Authentification](#-authentification)
- [Navigation](#-navigation)
- [Gestion d'état](#-gestion-détat)
- [Composants clés](#-composants-clés)
- [Scripts disponibles](#-scripts-disponibles)
- [Tests](#-tests)
- [Déploiement](#-déploiement)
---

## 🎯 Aperçu du projet

**SGM Mobile** est une application mobile développée avec **React Native** et **Expo** pour gérer les membres d'une association. Elle offre une interface intuitive et des fonctionnalités complètes pour:

- **Membres**: Consultation de leur carte d'adhésion, annuaire des membres, changement de mot de passe
- **Secrétaire Générale**: Gestion complète des adhésions, génération de cartes, gestion des codes d'accès
- **Président**: Consultation des statistiques et validation des décisions importantes

### Technologies principales

- **React Native 0.81.4** - Framework mobile cross-platform
- **Expo SDK 54** - Plateforme de développement React Native
- **TypeScript 5.9.2** - Typage statique
- **Expo Router 6.0.6** - Navigation file-based
- **AsyncStorage** - Stockage local persistant
- **Axios** - Client HTTP pour les appels API
- **React Context API** - Gestion d'état global

---

## ✨ Fonctionnalités principales

### Pour tous les utilisateurs

- ✅ **Authentification sécurisée** avec tokens JWT
- ✅ **Gestion du profil** et changement de mot de passe
- ✅ **Annuaire des membres** avec recherche
- ✅ **Interface responsive** pour tous les types d'écrans

### Pour les membres

- 📱 **Consultation de la carte de membre** (recto/verso)
- 💾 **Téléchargement de la carte** en PNG ou PDF
- 📋 **Consultation de la fiche d'adhésion**
- 👥 **Accès à l'annuaire** des membres
- 🔒 **Sécurité du compte** avec changement de mot de passe

### Pour la Secrétaire Générale

- 📊 **Tableau de bord** avec statistiques en temps réel
- ✅ **Gestion des adhésions**: validation, rejet, modification
- 🃏 **Génération automatique** des cartes de membre
- 👤 **Création de nouveaux membres** avec identifiants
- 🔑 **Gestion des codes d'accès** temporaires
- 📄 **Gestion des documents** officiels et textes
- 📈 **Statistiques détaillées** par statut
- 🖊️ **Signature numérique** du président

### Pour le Président

- 📊 **Consultation des statistiques** globales
- 👁️ **Visualisation des adhésions** en attente
- 📋 **Consultation de l'annuaire** complet

---

## 🏗️ Architecture

### Architecture générale

```
┌─────────────────────────────────────────────┐
│           Application Mobile                │
│         (React Native + Expo)               │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────┐      ┌──────────────┐    │
│  │   Screens    │      │  Components  │    │
│  │   (Pages)    │◄────►│   (UI/UX)    │    │
│  └──────────────┘      └──────────────┘    │
│         │                      │            │
│         │                      │            │
│  ┌──────▼──────────────────────▼──────┐    │
│  │         Hooks & Contexts           │    │
│  │   (useAuth, LastTabContext)        │    │
│  └──────┬────────────────────────────┬┘    │
│         │                            │     │
│  ┌──────▼──────┐            ┌────────▼───┐ │
│  │ ApiService  │            │AsyncStorage│ │
│  │  (Axios)    │            │  (Local)   │ │
│  └──────┬──────┘            └────────────┘ │
│         │                                   │
└─────────┼───────────────────────────────────┘
          │
          │ HTTPS/REST API
          │
┌─────────▼───────────────────────────────────┐
│         Backend API (Railway)               │
│   https://sgm-backend-production.up        │
│          .railway.app                       │
└─────────────────────────────────────────────┘
```

### Architecture des composants

- **Screens (Pages)**: Écrans principaux de l'application (tabs)
- **Components**: Composants réutilisables (UI, Forms, Modals)
- **Hooks**: Logique métier réutilisable (useAuth, useNavigationHistory)
- **Contexts**: État global partagé (AuthProvider, LastTabContext)
- **Services**: Communication avec le backend (apiService)
- **Utils**: Fonctions utilitaires et constantes

### Flux d'authentification

```
┌──────────┐
│  Login   │
└────┬─────┘
     │
     ▼
┌──────────────────┐
│ Vérification     │
│ Identifiants     │
└────┬─────────────┘
     │
     ▼
┌──────────────────┐    Non    ┌──────────────────┐
│ Changement mot   ├──────────►│  Dashboard ou    │
│ de passe requis? │           │  Registration    │
└────┬─────────────┘           └──────────────────┘
     │ Oui
     ▼
┌──────────────────┐
│ ForcePassword    │
│ ChangeModal      │
└────┬─────────────┘
     │
     ▼
┌──────────────────┐    EN_ATTENTE   ┌──────────────────┐
│ Statut Adhésion? ├───────────────►│ AdhesionPending  │
│                  │                 │     Modal        │
└────┬─────────────┘                 └──────────────────┘
     │
     │ APPROUVE
     ▼
┌──────────────────┐
│   Dashboard      │
└──────────────────┘
     │ REJETE
     ▼
┌──────────────────┐
│  Registration    │
└──────────────────┘
```

---

## 📦 Prérequis

Avant de commencer, assurez-vous d'avoir installé:

### Logiciels requis

- **Node.js** >= 18.x ([Télécharger](https://nodejs.org/))
- **npm** >= 9.x ou **yarn** >= 1.22.x
- **Git** ([Télécharger](https://git-scm.com/))
- **Expo CLI** (sera installé automatiquement)

### Pour le développement iOS

- **macOS** (obligatoire pour iOS)
- **Xcode** >= 14.x ([Mac App Store](https://apps.apple.com/app/xcode/id497799835))
- **CocoaPods** >= 1.12.x

### Pour le développement Android

- **Android Studio** ([Télécharger](https://developer.android.com/studio))
- **Java Development Kit (JDK)** >= 17
- **Android SDK** >= 33
- **Émulateur Android** ou appareil physique

### Outils recommandés

- **VS Code** avec les extensions:
  - React Native Tools
  - ES7+ React/Redux/React-Native snippets
  - TypeScript Vue Plugin (Volar)
  - Prettier - Code formatter
  - ESLint

---

## 🚀 Installation

### 1. Cloner le repository

```bash
git clone https://github.com/agcoapp/agco-mobile.git
cd agco-mobile
```

### 2. Installer les dépendances

```bash
npm install
# ou
yarn install
```

### 3. Configuration des variables d'environnement

Créez un fichier `.env` à la racine du projet (si nécessaire):

```env
# API Backend URL (actuellement hardcodé dans apiService.ts)
API_BASE_URL=https://sgm-backend-production.up.railway.app

# Cloudinary (pour l'upload d'images)
CLOUDINARY_CLOUD_NAME=votre_cloud_name
CLOUDINARY_API_KEY=votre_api_key
```

> ⚠️ **Note**: L'URL de l'API est actuellement codée en dur dans `services/apiService.ts` à la ligne 6. Pour la production, il est recommandé d'utiliser des variables d'environnement.

### 4. Démarrer l'application

```bash
# Démarrage avec Expo
npm start
# ou
npx expo start

# Démarrage sur Android
npm run android

# Démarrage sur iOS (macOS uniquement)
npm run ios

# Démarrage sur Web
npm run web
```

### 5. Scanner le QR Code

- **Android**: Utilisez l'application **Expo Go** depuis le Play Store
- **iOS**: Utilisez l'application **Expo Go** depuis l'App Store ou scannez avec l'appareil photo

---

## ⚙️ Configuration

### Configuration de l'API

L'URL de l'API backend est configurée dans `services/apiService.ts`:

```typescript
const API_BASE_URL = "https://sgm-backend-production.up.railway.app";
```

Pour modifier l'URL (développement local, staging, production):

```typescript
// Développement local
const API_BASE_URL = "http://localhost:3000";

// Staging
const API_BASE_URL = "https://sgm-backend-staging.up.railway.app";

// Production
const API_BASE_URL = "https://sgm-backend-production.up.railway.app";
```

### Configuration Expo

Le fichier `app.json` contient la configuration de l'application:

```json
{
  "expo": {
    "name": "sgm-mobile",
    "slug": "sgm-mobile",
    "version": "1.0.0",
    "scheme": "sgmmobile",
    "orientation": "portrait",
    "userInterfaceStyle": "automatic"
  }
}
```

### Permissions

#### iOS (`app.json`)
```json
"ios": {
  "infoPlist": {
    "NSCameraUsageDescription": "Cette application nécessite l'accès à la caméra pour prendre des photos d'identité et des signatures.",
    "NSPhotoLibraryUsageDescription": "Cette application nécessite l'accès à la galerie pour sélectionner des photos d'identité et des signatures."
  }
}
```

#### Android (`app.json`)
```json
"android": {
  "permissions": [
    "android.permission.CAMERA",
    "android.permission.READ_EXTERNAL_STORAGE",
    "android.permission.WRITE_EXTERNAL_STORAGE"
  ]
}
```

---

## 📁 Structure du projet

```
sgm-mobile/
├── app/                          # Écrans et navigation (Expo Router)
│   ├── (tabs)/                   # Écrans avec navigation par onglets
│   │   ├── _layout.tsx           # Layout des tabs avec drawer
│   │   ├── index.tsx             # Dashboard/Accueil
│   │   ├── adhesions.tsx         # Gestion des adhésions
│   │   ├── membres.tsx           # Liste des membres
│   │   ├── cartes.tsx            # Cartes de membres
│   │   ├── codes.tsx             # Codes d'accès (Secrétaire)
│   │   ├── documents.tsx         # Documents officiels
│   │   ├── settings.tsx          # Paramètres
│   │   └── change-password.tsx   # Changement de mot de passe
│   ├── adhesion/                 # Détails d'adhésion
│   │   ├── _layout.tsx
│   │   └── [id].tsx              # Fiche d'adhésion par ID
│   ├── carte/                    # Détails de carte
│   │   ├── _layout.tsx
│   │   └── [id].tsx              # Carte de membre par ID
│   ├── membre/                   # Espace membre
│   │   └── mon-adhesion.tsx      # Ma fiche d'adhésion
│   ├── _layout.tsx               # Layout racine avec AuthProvider
│   ├── index.tsx                 # Point d'entrée (vérif auth)
│   ├── login.tsx                 # Écran de connexion
│   ├── register.tsx              # Écran d'inscription
│   └── +not-found.tsx            # Page 404
│
├── components/                   # Composants réutilisables
│   ├── forms/                    # Formulaires
│   │   └── LoginForm.tsx         # Formulaire de connexion
│   ├── ui/                       # Composants UI
│   │   ├── AdhesionPendingModal.tsx      # Modal adhésion en attente
│   │   ├── AdhesionStatusModal.tsx       # Modal statut adhésion
│   │   ├── CustomDrawerContent.tsx       # Contenu du drawer
│   │   ├── ForcePasswordChangeModal.tsx  # Modal changement MDP
│   │   ├── IconSymbol.tsx                # Icônes système
│   │   ├── ImageViewer.tsx               # Visionneuse d'images
│   │   ├── LoadingScreen.tsx             # Écran de chargement
│   │   └── TabBarBackground.tsx          # Fond de la barre d'onglets
│   ├── AdhesionFormGenerator.tsx # Générateur de formulaire
│   ├── CarteRectoGenerator.tsx   # Générateur carte recto
│   ├── CarteVersoGenerator.tsx   # Générateur carte verso
│   └── ...                       # Autres composants
│
├── hooks/                        # Hooks personnalisés
│   ├── useAuth.tsx               # Hook d'authentification (Context)
│   ├── useNavigationHistory.tsx  # Historique de navigation
│   ├── useRouterWithHistory.tsx  # Router avec historique
│   ├── useColorScheme.ts         # Détection du thème
│   └── useThemeColor.ts          # Couleurs du thème
│
├── contexts/                     # Contexts React
│   └── LastTabContext.tsx        # Mémorisation du dernier onglet
│
├── services/                     # Services backend
│   └── apiService.ts             # Service API (1300+ lignes)
│
├── utils/                        # Utilitaires
│   ├── fonctions.ts              # Fonctions utilitaires
│   └── apiDoc.json               # Documentation API
│
├── constants/                    # Constantes
│   └── Colors.ts                 # Palettes de couleurs
│
├── assets/                       # Ressources statiques
│   ├── images/                   # Images
│   └── fonts/                    # Polices personnalisées
│
├── scripts/                      # Scripts utilitaires
│   └── reset-project.js          # Script de réinitialisation
│
├── app.json                      # Configuration Expo
├── package.json                  # Dépendances npm
├── tsconfig.json                 # Configuration TypeScript
├── eslint.config.js              # Configuration ESLint
└── README.md                     # Documentation (ce fichier)
```

### Description des dossiers principaux

#### `app/`
Contient tous les écrans de l'application utilisant le système de **file-based routing** d'Expo Router. Chaque fichier correspond à une route.

#### `components/`
Composants React réutilisables, organisés par type (forms, ui, etc.). Suivent le principe de **composition** et sont **indépendants**.

#### `hooks/`
Hooks personnalisés pour extraire et réutiliser la logique métier. Le plus important est `useAuth.tsx` qui gère toute l'authentification.

#### `services/`
Contient `apiService.ts`, un service complet pour communiquer avec le backend. Plus de 1300 lignes avec:
- Gestion automatique des tokens JWT
- Retry automatique en cas d'erreur 429
- Throttling des requêtes
- Gestion des erreurs HTTP
- Interfaces TypeScript pour toutes les réponses API

#### `contexts/`
Contexts React pour l'état global partagé entre composants sans prop drilling.

---

## 👨‍💻 Guide de développement

### Conventions de code

#### Nommage

- **Fichiers de composants**: PascalCase (`MyComponent.tsx`)
- **Fichiers utilitaires**: camelCase (`myHelper.ts`)
- **Fichiers de pages**: camelCase ou kebab-case (`my-page.tsx`)
- **Dossiers**: kebab-case (`my-folder/`)

#### Structure d'un composant React

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MyComponentProps {
  title: string;
  onPress?: () => void;
}

export default function MyComponent({ title, onPress }: MyComponentProps) {
  const [state, setState] = useState<string>('');

  useEffect(() => {
    // Effet de montage
    return () => {
      // Nettoyage
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
```

### Gestion des erreurs

```typescript
try {
  const response = await apiService.getMembers();
  // Traiter la réponse
} catch (error) {
  if (error instanceof Error) {
    console.error('Erreur:', error.message);
    Alert.alert('Erreur', error.message);
  } else {
    console.error('Erreur inconnue:', error);
    Alert.alert('Erreur', 'Une erreur inattendue s\'est produite');
  }
}
```

### Ajout d'une nouvelle page

1. Créer le fichier dans `app/` (ex: `app/ma-page.tsx`)
2. Créer le composant de page
3. Le routage est automatique grâce à Expo Router

```typescript
// app/ma-page.tsx
import { View, Text } from 'react-native';

export default function MaPage() {
  return (
    <View>
      <Text>Ma nouvelle page</Text>
    </View>
  );
}
```

4. Naviguer vers cette page:

```typescript
import { router } from 'expo-router';

router.push('/ma-page');
```

### Ajout d'un nouvel endpoint API

1. Ajouter l'interface TypeScript dans `services/apiService.ts`:

```typescript
export interface MonNouvelEndpointResponse {
  message: string;
  data: any;
}
```

2. Ajouter la méthode dans la classe `ApiService`:

```typescript
async monNouvelEndpoint(params: any): Promise<MonNouvelEndpointResponse> {
  const response = await this.axiosInstance.get(`/api/mon-endpoint`, { params });
  return response.data;
}
```

3. Utiliser dans un composant:

```typescript
const data = await apiService.monNouvelEndpoint({ id: 123 });
```

---

## 👥 Gestion des utilisateurs

### Rôles disponibles

L'application supporte trois rôles d'utilisateur:

#### 1. **MEMBRE** (Membre standard)

- Consultation de sa carte de membre
- Téléchargement de sa carte (PNG/PDF)
- Consultation de sa fiche d'adhésion
- Accès à l'annuaire des membres
- Changement de mot de passe

#### 2. **SECRETAIRE_GENERALE** (Secrétaire Générale)

- Toutes les permissions du membre
- Gestion complète des adhésions:
  - Validation des demandes
  - Rejet avec motif
  - Modification des informations
- Génération des cartes de membre
- Création de nouveaux membres
- Gestion des codes d'accès temporaires
- Téléchargement en masse des cartes
- Statistiques détaillées
- Gestion de la signature du président
- Gestion des documents officiels

#### 3. **PRESIDENT** (Président)

- Consultation du tableau de bord
- Visualisation des statistiques
- Consultation de l'annuaire
- Consultation des adhésions

### Statuts d'adhésion

- **EN_ATTENTE**: Adhésion soumise, en attente de validation
- **APPROUVE**: Adhésion validée, accès complet
- **REJETE**: Adhésion rejetée, doit soumettre à nouveau

### Flux d'inscription d'un nouveau membre

```
┌─────────────────────────┐
│ Création par Secrétaire │
│  (nom, prénom, tel)     │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Identifiants générés   │
│  (username + password)  │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Membre reçoit codes     │
│ (hors de l'app)         │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Première connexion     │
│  (doit_changer_mdp)     │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Changement MDP forcé    │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Remplissage formulaire  │
│   d'adhésion complet    │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Statut: EN_ATTENTE      │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Validation Secrétaire   │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Statut: APPROUVE        │
│ Carte générée           │
└─────────────────────────┘
```

---

## 🔌 API Backend

### URL de base

```
https://sgm-backend-production.up.railway.app
```

### Authentification

Toutes les requêtes nécessitent un token JWT dans le header `Authorization`:

```
Authorization: Bearer <token>
```

### Principaux endpoints

#### Authentification
- `POST /api/auth/connexion` - Connexion
- `POST /api/auth/deconnexion` - Déconnexion
- `GET /api/auth/profil` - Profil utilisateur
- `GET /api/auth/statut` - Statut complet de l'utilisateur
- `POST /api/auth/change-password` - Changement de mot de passe
- `POST /api/auth/change-temporary-password` - Changement MDP temporaire

#### Membres
- `GET /api/membre/carte-membre` - Carte du membre connecté
- `GET /api/membre/formulaire-adhesion` - Formulaire d'adhésion
- `GET /api/membre/annuaire` - Annuaire des membres
- `GET /api/membre/president-signature` - Signature du président

#### Secrétaire
- `GET /api/secretaire/tableau-bord` - Tableau de bord avec stats
- `POST /api/secretaire/creer-nouveau-membre` - Créer un membre
- `GET /api/secretaire/membres` - Liste des membres
- `GET /api/secretaire/formulaires` - Formulaires d'adhésion
- `POST /api/secretaire/approuver-formulaire` - Approuver
- `POST /api/secretaire/rejeter-formulaire` - Rejeter
- `GET /api/secretaire/cartes-membres` - Cartes générées
- `POST /api/secretaire/creer-identifiants` - Créer identifiants
- `GET /api/secretaire/nouveaux-utilisateurs-credentials` - Codes d'accès

#### Documents
- `GET /api/categories-texte-officiel` - Catégories de documents
- `POST /api/categories-texte-officiel` - Créer catégorie
- `GET /api/textes-officiels` - Liste des documents
- `POST /api/textes-officiels` - Ajouter document

#### Cloudinary
- `GET /api/signature` - Signature pour upload Cloudinary

### Gestion des erreurs API

Le service API gère automatiquement:

- **401**: Identifiants incorrects → Message personnalisé
- **403**: Accès refusé → Message personnalisé
- **404**: Service non trouvé → Message personnalisé
- **429**: Rate limit → Retry automatique avec backoff exponentiel (3 tentatives)
- **500**: Erreur serveur → Message personnalisé
- **Network error**: Problème de connexion → Message personnalisé

```typescript
// Exemple d'appel avec gestion d'erreur
try {
  const members = await apiService.getMembers();
  // Succès
} catch (error) {
  // L'erreur a déjà été transformée en message lisible
  if (error instanceof Error) {
    Alert.alert('Erreur', error.message);
  }
}
```

### Throttling des requêtes

Certaines requêtes sont throttlées pour éviter les abus:

```typescript
// Exemple: getMembers a un throttle de 2 secondes
const members = await apiService.getMembers();
// Si appelé à nouveau dans les 2 secondes, attend automatiquement
```

---

## 🔐 Authentification

### Système d'authentification

L'application utilise un système complet d'authentification avec:

- **JWT tokens** stockés dans AsyncStorage
- **Context API** pour l'état global
- **Vérification automatique** au démarrage
- **Redirections intelligentes** selon le rôle et le statut

### Hook useAuth

Le hook `useAuth` expose les méthodes suivantes:

```typescript
const {
  user,              // Utilisateur connecté (ou null)
  userStatus,        // Statut complet de l'utilisateur
  isLoading,         // Chargement en cours
  login,             // Fonction de connexion
  logout,            // Fonction de déconnexion
  isAuthenticated,   // Boolean: connecté ou non
  checkAuth,         // Vérifier l'authentification
  updateUserProfile, // Mettre à jour le profil
} = useAuth();
```

### Exemple d'utilisation

```typescript
import { useAuth } from '../hooks/useAuth';

function MonComposant() {
  const { user, login, logout, isAuthenticated } = useAuth();

  const handleLogin = async () => {
    try {
      const result = await login({
        nom_utilisateur: 'username',
        mot_passe: 'password',
      });

      if (result.shouldRedirect) {
        router.replace(result.redirectPath);
      }

      if (result.showPasswordChangeModal) {
        // Afficher modal de changement de mot de passe
      }

      if (result.showPendingModal) {
        // Afficher modal d'adhésion en attente
      }
    } catch (error) {
      Alert.alert('Erreur', error.message);
    }
  };

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <View>
      <Text>Bonjour {user?.prenoms}</Text>
      <Button onPress={logout} title="Déconnexion" />
    </View>
  );
}
```

### Protection des routes

Les routes sont automatiquement protégées grâce au `_layout.tsx` racine:

```typescript
// app/_layout.tsx
export default function RootLayout() {
  return (
    <AuthProvider>
      {/* L'app est wrappée dans AuthProvider */}
      <Stack>
        {/* Routes */}
      </Stack>
    </AuthProvider>
  );
}
```

Vérification au démarrage:

```typescript
// app/index.tsx
export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace('/(tabs)');
      } else {
        router.replace('/login');
      }
    }
  }, [isAuthenticated, isLoading]);

  return <LoadingScreen />;
}
```

### Stockage des tokens

Les tokens sont stockés dans AsyncStorage:

```typescript
// Clés utilisées
- 'sgm_token'  // Token JWT
- 'sgm_user'   // Données utilisateur complètes (UserStatusResponse)
```

---

## 🧭 Navigation

### Système de navigation

L'application utilise **Expo Router** qui offre:

- **File-based routing**: Chaque fichier dans `app/` est une route
- **Type-safe routing**: Routes typées automatiquement
- **Deep linking**: Support natif des liens profonds
- **Layout nesting**: Layouts imbriqués pour partager UI

### Structure de navigation

```
app/
├── _layout.tsx              # Layout racine (AuthProvider)
├── index.tsx                # Point d'entrée (/)
├── login.tsx                # /login
├── register.tsx             # /register
├── (tabs)/                  # Groupe de routes avec tabs
│   ├── _layout.tsx          # Layout avec drawer + tabs
│   ├── index.tsx            # /(tabs)/ - Dashboard
│   ├── adhesions.tsx        # /(tabs)/adhesions
│   ├── membres.tsx          # /(tabs)/membres
│   └── ...
├── adhesion/
│   └── [id].tsx             # /adhesion/123
└── carte/
    └── [id].tsx             # /carte/456
```

### Navigation programmatique

```typescript
import { router } from 'expo-router';

// Navigation simple
router.push('/login');

// Navigation avec paramètres
router.push(`/adhesion/${userId}`);

// Remplacer l'écran (pas de retour)
router.replace('/(tabs)');

// Retour arrière
router.back();

// Navigation avec query params
router.push('/adhesions?tab=pending');
```

### Récupération des paramètres

```typescript
import { useLocalSearchParams } from 'expo-router';

export default function AdhesionDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  
  return <Text>Adhésion ID: {id}</Text>;
}
```

### Navigation entre tabs

La navigation entre tabs est gérée par le `_layout.tsx` dans `(tabs)/`:

```typescript
// app/(tabs)/_layout.tsx
<Tabs>
  <Tabs.Screen
    name="index"
    options={{
      title: 'Accueil',
      tabBarIcon: ({ color }) => <IconSymbol name="house" color={color} />,
    }}
  />
  {/* Autres tabs */}
</Tabs>
```

### Drawer Navigation

Le drawer est également configuré dans le `_layout.tsx` des tabs:

```typescript
<Drawer
  drawerContent={(props) => <CustomDrawerContent {...props} />}
  screenOptions={{
    drawerPosition: 'left',
    headerShown: true,
  }}
>
  {/* Tabs */}
</Drawer>
```

### Historique de navigation

L'app utilise un hook personnalisé pour gérer l'historique:

```typescript
import { useRouterWithHistory } from '../hooks/useRouterWithHistory';

const router = useRouterWithHistory();

// Utilisation normale
router.push('/ma-page');

// Retour avec historique
router.back(); // Utilise l'historique personnalisé si disponible
```

### Mémorisation du dernier onglet

```typescript
import { useLastTab } from '../contexts/LastTabContext';

const { lastTab, setLastTab } = useLastTab();

// Sauvegarder l'onglet actuel
setLastTab('membres');

// Revenir au dernier onglet
router.push(`/(tabs)/${lastTab}`);
```

---

## 🔄 Gestion d'état

### Context API

L'application utilise React Context pour l'état global:

#### AuthContext (useAuth)

Gère l'authentification globale:

```typescript
interface AuthContextType {
  user: User | null;
  userStatus: UserStatusResponse | null;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<LoginResult>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  checkAuth: () => Promise<void>;
  updateUserProfile: () => Promise<void>;
}
```

**Utilisation:**

```typescript
const { user, login, logout, isAuthenticated } = useAuth();
```

#### LastTabContext

Mémorise le dernier onglet visité:

```typescript
const { lastTab, setLastTab } = useLastTab();
```

### État local (useState)

Pour l'état local d'un composant:

```typescript
const [isLoading, setIsLoading] = useState(false);
const [data, setData] = useState<MyType[]>([]);
const [error, setError] = useState<string | null>(null);
```

### Effet de bord (useEffect)

```typescript
useEffect(() => {
  // Code exécuté au montage et aux mises à jour
  fetchData();

  // Cleanup au démontage
  return () => {
    cleanup();
  };
}, [dependency]); // Dépendances
```

### AsyncStorage

Pour la persistance des données:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Sauvegarder
await AsyncStorage.setItem('key', JSON.stringify(data));

// Récupérer
const data = await AsyncStorage.getItem('key');
const parsed = JSON.parse(data);

// Supprimer
await AsyncStorage.removeItem('key');

// Supprimer plusieurs
await AsyncStorage.multiRemove(['key1', 'key2']);

// Vider tout
await AsyncStorage.clear();
```

---

## 🎨 Composants clés

### LoadingScreen

Écran de chargement réutilisable:

```typescript
import LoadingScreen from '../components/ui/LoadingScreen';

<LoadingScreen message="Chargement en cours..." />
```

### ForcePasswordChangeModal

Modal pour forcer le changement de mot de passe:

```typescript
<ForcePasswordChangeModal
  visible={showModal}
  onClose={() => setShowModal(false)}
  userEmail={user?.email}
/>
```

### AdhesionStatusModal

Modal pour afficher le statut d'adhésion:

```typescript
<AdhesionStatusModal
  visible={showModal}
  onClose={() => setShowModal(false)}
  status="EN_ATTENTE"
  message="Votre adhésion est en cours de traitement"
/>
```

### AdhesionPendingModal

Modal pour les adhésions en attente:

```typescript
<AdhesionPendingModal
  visible={showModal}
  onClose={() => setShowModal(false)}
/>
```

### ImageViewer

Visionneuse d'images avec zoom:

```typescript
import ImageViewer from '../components/ui/ImageViewer';

<ImageViewer
  imageUri="https://example.com/image.jpg"
  onClose={() => setModalVisible(false)}
/>
```

### CustomDrawerContent

Contenu personnalisé du drawer avec menu de navigation:

```typescript
// Utilisé automatiquement dans app/(tabs)/_layout.tsx
<Drawer
  drawerContent={(props) => <CustomDrawerContent {...props} />}
>
  {/* Routes */}
</Drawer>
```

### CarteRectoGenerator / CarteVersoGenerator

Générateurs de cartes de membre:

```typescript
import CarteRectoGenerator from '../components/CarteRectoGenerator';

<CarteRectoGenerator
  userData={userData}
  onCardGenerated={(imageUri) => {
    console.log('Carte générée:', imageUri);
  }}
/>
```

### AdhesionFormGenerator

Générateur de formulaire d'adhésion:

```typescript
import AdhesionFormGenerator from '../components/AdhesionFormGenerator';

<AdhesionFormGenerator
  formData={formData}
  onFormGenerated={(imageUri) => {
    console.log('Formulaire généré:', imageUri);
  }}
/>
```

---

## 📜 Scripts disponibles

### Développement

```bash
# Démarrer le serveur de développement
npm start
npx expo start

# Démarrer sur Android
npm run android

# Démarrer sur iOS (macOS uniquement)
npm run ios

# Démarrer sur Web
npm run web

# Lancer en mode tunnel (pour tests sur autre réseau)
npx expo start --tunnel

# Lancer en mode LAN
npx expo start --lan

# Lancer en mode localhost
npx expo start --localhost
```

### Linting

```bash
# Vérifier le code
npm run lint
npx expo lint

# Corriger automatiquement les erreurs
npx expo lint --fix
```

### Build & Déploiement

```bash
# Build Android (APK)
npx eas build --platform android --profile preview

# Build iOS (IPA)
npx eas build --platform ios --profile preview

# Build production (les deux)
npx eas build --platform all --profile production

# Publier une mise à jour OTA
npx eas update --branch production --message "Mise à jour importante"
```

### Utilitaires

```bash
# Réinitialiser le projet (nettoyer le cache)
npm run reset-project

# Nettoyer le cache Metro
npx expo start -c

# Nettoyer complètement node_modules
rm -rf node_modules package-lock.json
npm install
```

## 🚀 Déploiement

### Déploiement avec EAS (Expo Application Services)

#### 1. Installation d'EAS CLI

```bash
npm install -g eas-cli
eas login
```

#### 2. Configuration du projet

```bash
eas build:configure
```

Cela créera un fichier `eas.json`:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      },
      "ios": {
        "buildType": "archive"
      }
    }
  }
}
```

#### 3. Build Android

```bash
# Build pour test (APK)
eas build --platform android --profile preview

# Build production (AAB pour Google Play)
eas build --platform android --profile production
```

#### 4. Build iOS

```bash
# Build pour test
eas build --platform ios --profile preview

# Build production (pour App Store)
eas build --platform ios --profile production
```