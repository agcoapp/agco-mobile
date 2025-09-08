import { Ionicons } from '@expo/vector-icons';
import { Drawer } from 'expo-router/drawer';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CustomDrawerContent from '../../components/ui/CustomDrawerContent';
import { useAuth } from '../../hooks/useAuth';

export default function TabLayout() {
  const { user, logout } = useAuth();

  // Définir les liens selon le rôle de manière exclusive
  const getDrawerScreens = () => {
    const role = user?.role;
    
    // Base: Tableau de bord pour tous
    const baseScreens = [
      <Drawer.Screen
        key="index"
        name="index"
        options={{
          title: 'Tableau de bord',
          drawerIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />
    ];

    // Liens spécifiques selon le rôle
    if (role === 'MEMBRE') {
      return [
        ...baseScreens,
        <Drawer.Screen
          key="membre/mon-adhesion"
          name="membre/mon-adhesion"
          options={{
            title: 'Ma fiche d\'adhésion',
            drawerIcon: ({ color, size }: { color: string; size: number }) => (
              <Ionicons name="person-add-outline" size={size} color={color} />
            ),
          }}
        />,
        <Drawer.Screen
          key="membres"
          name="membres"
          options={{
            title: 'Les membres',
            drawerIcon: ({ color, size }: { color: string; size: number }) => (
              <Ionicons name="people-outline" size={size} color={color} />
            ),
          }}
        />,
        <Drawer.Screen
          key="documents"
          name="documents"
          options={{
            title: 'Textes officiels',
            drawerIcon: ({ color, size }: { color: string; size: number }) => (
              <Ionicons name="document-text-outline" size={size} color={color} />
            ),
          }}
        />,
        <Drawer.Screen
          key="membre/change-password"
          name="membre/change-password"
          options={{
            title: 'Changer mot de passe',
            drawerIcon: ({ color, size }: { color: string; size: number }) => (
              <Ionicons name="key-outline" size={size} color={color} />
            ),
          }}
        />
      ];
    }

    if (role === 'PRESIDENT' || role === 'SECRETAIRE_GENERALE') {
      const adminScreens = [
        ...baseScreens,
        <Drawer.Screen
          key="adhesions"
          name="adhesions"
          options={{
            title: 'Adhésions',
            drawerIcon: ({ color, size }: { color: string; size: number }) => (
              <Ionicons name="person-add-outline" size={size} color={color} />
            ),
          }}
        />,
        <Drawer.Screen
          key="membres"
          name="membres"
          options={{
            title: 'Membres',
            drawerIcon: ({ color, size }: { color: string; size: number }) => (
              <Ionicons name="people-outline" size={size} color={color} />
            ),
          }}
        />,
        <Drawer.Screen
          key="cartes"
          name="cartes"
          options={{
            title: 'Cartes de membres',
            drawerIcon: ({ color, size }: { color: string; size: number }) => (
              <Ionicons name="card-outline" size={size} color={color} />
            ),
          }}
        />,
        <Drawer.Screen
          key="documents"
          name="documents"
          options={{
            title: 'Textes officiels',
            drawerIcon: ({ color, size }: { color: string; size: number }) => (
              <Ionicons name="document-text-outline" size={size} color={color} />
            ),
          }}
        />
      ];

      // Ajouter Codes d'accès seulement pour SECRETAIRE_GENERALE
      if (role === 'SECRETAIRE_GENERALE') {
        adminScreens.push(
          <Drawer.Screen
            key="codes"
            name="codes"
            options={{
              title: 'Codes d\'accès',
              drawerIcon: ({ color, size }: { color: string; size: number }) => (
                <Ionicons name="key-outline" size={size} color={color} />
              ),
            }}
          />
        );
      }

      // Ajouter Signature du Président pour tous les admins
      adminScreens.push(
        <Drawer.Screen
          key="settings"
          name="settings"
        options={{
            title: 'Signature du Président',
            drawerIcon: ({ color, size }: { color: string; size: number }) => (
              <Ionicons name="create-outline" size={size} color={color} />
            ),
          }}
        />
      );

      return adminScreens;
    }

    // Par défaut, retourner seulement le tableau de bord
    return baseScreens;
  };

  // Fonction pour obtenir les initiales
  const getInitials = () => {
    if (!user?.prenoms || !user?.nom) return '?';
    const prenomInitial = user.prenoms.charAt(0).toUpperCase();
    const nomInitial = user.nom.charAt(0).toUpperCase();
    return `${prenomInitial}${nomInitial}`;
  };

  // Fonction pour gérer le clic sur les initiales
  const handleProfileClick = () => {
    Alert.alert(
      'Profil utilisateur',
      `Nom: ${user?.prenoms} ${user?.nom}\nNom d'utilisateur: ${user?.nom_utilisateur}\nRôle: ${user?.role}`,
      [
        { text: 'Fermer', style: 'cancel' },
        { 
          text: 'Déconnexion', 
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Déconnexion',
              'Êtes-vous sûr de vouloir vous déconnecter ?',
              [
                {
                  text: 'Annuler',
                  style: 'cancel',
                },
                {
                  text: 'Déconnexion',
                  style: 'destructive',
                  onPress: () => logout(),
                },
              ],
              { cancelable: true }
            );
          }
        }
      ]
    );
  };

  return (
    <Drawer
      screenOptions={{
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        drawerActiveTintColor: '#007AFF',
        drawerInactiveTintColor: '#666',
        drawerStyle: {
          backgroundColor: '#F5F5F5',
        },
        drawerLabelStyle: {
          fontWeight: '600',
          fontSize: 16,
        },
        // Photo de profil à côté du titre
        headerRight: () => (
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.initialsContainer}
              onPress={handleProfileClick}
              activeOpacity={0.7}
            >
              <Text style={styles.initialsText}>{getInitials()}</Text>
            </TouchableOpacity>
          </View>
        ),
      }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      {getDrawerScreens()}
    </Drawer>
  );
}

const styles = StyleSheet.create({
  headerRight: {
    marginRight: 15,
  },
  initialsContainer: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  initialsText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
