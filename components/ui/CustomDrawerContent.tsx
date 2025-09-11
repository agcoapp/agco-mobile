import { Ionicons } from '@expo/vector-icons';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { router } from 'expo-router';
import React from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLastTab } from '../../contexts/LastTabContext';
import { useAuth } from '../../hooks/useAuth';

interface CustomDrawerContentProps {
  state: any;
  navigation: any;
  descriptors: any;
}

export default function CustomDrawerContent(props: CustomDrawerContentProps) {
  const { logout, user } = useAuth();
  const { addToHistory } = useLastTab();

  const handleLogout = () => {
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
  };

  return (
    <View style={styles.container}>
      {/* Section Logo */}
      <View style={styles.logoSection}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      
      {/* Contenu du Drawer */}
      <DrawerContentScrollView {...props} style={styles.drawerContent} contentContainerStyle={styles.drawerContentContainer}>
        <DrawerItemList 
          {...props} 
          state={{
            ...props.state,
            routes: props.state.routes.filter((route: any) => {
              // Si l'utilisateur est un membre, masquer certains liens
              if (user?.role === 'MEMBRE') {
                const hiddenRoutes = ['codes', 'cartes', 'settings', 'adhesions'];
                return !hiddenRoutes.includes(route.name);
              }
              // Pour les autres rôles, afficher tous les liens
              return true;
            })
          }}
        />
        {/* Lien spécifique pour les membres */}
        {user?.role === 'MEMBRE' && (
           <TouchableOpacity
             style={styles.memberLink}
             onPress={() => {
               console.log('🎯 Clic sur Ma fiche d\'adhésion');
               addToHistory('adhesion');
               router.push(`/adhesion/${user.id}`);
             }}
             activeOpacity={0.7}
           >
             <Ionicons name="person-outline" size={24} color="#666" />
             <Text style={styles.memberLinkText}>Ma fiche d'adhésion</Text>
           </TouchableOpacity>
         )}
        
        {/* Bouton de déconnexion */}
        <View style={styles.logoutSection}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
            <Text style={styles.logoutText}>Déconnexion</Text>
          </TouchableOpacity>
        </View>
      </DrawerContentScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  logoSection: {
    padding: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 140,
    height: 140,
  },
  drawerContent: {
    flex: 1,
  },
  drawerContentContainer: {
    paddingTop: 0,
    flexGrow: 1,
  },
  memberLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  memberLinkText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginLeft: 12,
  },
  logoutSection: {
    marginTop: 'auto',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: 'white',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
    marginLeft: 12,
  },
});
