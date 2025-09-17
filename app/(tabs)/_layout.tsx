import { Ionicons } from '@expo/vector-icons';
import { Drawer } from 'expo-router/drawer';
import { useState } from 'react';
import { Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CustomDrawerContent from '../../components/ui/CustomDrawerContent';
import { useAuth } from '../../hooks/useAuth';

export default function TabLayout() {
  const { user, userStatus } = useAuth();
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);

  // Définir les liens selon le rôle de manière exclusive
  const getDrawerScreens = () => {
    const role = user?.role;
    
    // Base: Tableau de bord pour tous
    const baseScreens = [
      <Drawer.Screen
        key="index"
        name="index"
        options={{
          title: 'Tableau De Bord',
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
          key="adhesion/[id]"
          name="adhesion/[id]"
          options={{
            title: "Ma Fiche D'adhésion",
            drawerIcon: ({ color, size }: { color: string; size: number }) => (
              <Ionicons name="people-outline" size={size} color={color} />
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
          key="documents"
          name="documents"
          options={{
            title: 'Textes Officiels',
            drawerIcon: ({ color, size }: { color: string; size: number }) => (
              <Ionicons name="document-text-outline" size={size} color={color} />
            ),
          }}
        />,
        <Drawer.Screen
          key="change-password"
          name="change-password"
          options={{
            title: 'Changer Mon Mot De Passe',
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
            title: 'Cartes De Membres',
            drawerIcon: ({ color, size }: { color: string; size: number }) => (
              <Ionicons name="card-outline" size={size} color={color} />
            ),
          }}
        />,
        <Drawer.Screen
          key="documents"
          name="documents"
          options={{
            title: 'Textes Officiels',
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
              title: 'Codes D\'Accès',
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
            title: 'Signature Du Président',
            drawerIcon: ({ color, size }: { color: string; size: number }) => (
              <Ionicons name="create-outline" size={size} color={color} />
            ),
          }}
        />
      );

      adminScreens.push(
        <Drawer.Screen
          key="change-password"
          name="change-password"
          options={{
            title: 'Changer Mon Mot De Passe',
            drawerIcon: ({ color, size }: { color: string; size: number }) => (
              <Ionicons name="key-outline" size={size} color={color} />
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

  // Fonction pour gérer le clic sur la photo/initiales
  const handleProfileClick = () => {
    setIsProfileModalVisible(true);
  };

  const closeProfileModal = () => {
    setIsProfileModalVisible(false);
  };


  return (
    <View style={{ flex: 1 }}>
    <Drawer
      screenOptions={{
        headerStyle: {
          backgroundColor: '#007AFF',
          height: 100,
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
                style={styles.profileContainer}
              onPress={handleProfileClick}
              activeOpacity={0.7}
            >
                {userStatus?.images?.selfie_photo && userStatus.utilisateur.numero_adhesion ? (
                  <Image
                    source={{ uri: userStatus.images.selfie_photo }}
                    style={styles.profileImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.initialsContainer}>
              <Text style={styles.initialsText}>{getInitials()}</Text>
                  </View>
                )}
            </TouchableOpacity>
          </View>
        ),
      }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      {getDrawerScreens()}
    </Drawer>
      
      {/* Modal de profil */}
      <Modal
        visible={isProfileModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeProfileModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={closeProfileModal}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
            
            {/* Photo de profil ou initiales dans le modal */}
            <View style={styles.modalProfileContainer}>
              {userStatus?.images?.selfie_photo && userStatus.utilisateur.numero_adhesion ? (
                <TouchableOpacity activeOpacity={0.8}>
                  <Image
                    source={{ uri: userStatus.images.selfie_photo }}
                    style={styles.modalProfileImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ) : (
                <View style={styles.modalInitialsContainer}>
                  <Text style={styles.modalInitialsText}>{getInitials()}</Text>
                </View>
              )}
            </View>
            
            {/* Informations du membre */}
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>
                {userStatus?.utilisateur?.prenoms} {userStatus?.utilisateur?.nom}
              </Text>
              <Text style={styles.memberRole}>
                {userStatus?.utilisateur?.role === 'MEMBRE' ? 'Membre' : userStatus?.utilisateur?.role}
              </Text>
              <Text style={styles.memberUsername}>
                @{userStatus?.utilisateur?.nom_utilisateur}
              </Text>
              
              {userStatus?.utilisateur && (
                <View style={styles.memberDetails}>
                  {userStatus.utilisateur.numero_adhesion && (
                    <View style={styles.detailRow}>
                      <Ionicons name="card-outline" size={16} color="#666" />
                      <Text style={styles.detailText}>N° {userStatus.utilisateur.numero_adhesion}</Text>
                    </View>
                  )}

                  {userStatus.utilisateur.prenoms && userStatus.utilisateur.nom && (
                    <View style={styles.detailRow}>
                      <Ionicons name="person-outline" size={16} color="#666" />
                      <Text style={styles.detailText}>{userStatus.utilisateur.prenoms} {userStatus.utilisateur.nom}</Text>
                    </View>
                  )}

                  {userStatus.utilisateur.adresse && (
                    <View style={styles.detailRow}>
                      <Ionicons name="location-outline" size={16} color="#666" />
                      <Text style={styles.detailText}>{userStatus.utilisateur.adresse}</Text>
                    </View>
                  )}
                  
                  {userStatus.utilisateur.telephone && (
                    <View style={styles.detailRow}>
                      <Ionicons name="call-outline" size={16} color="#666" />
                      <Text style={styles.detailText}>{userStatus.utilisateur.telephone}</Text>
                    </View>
                  )}

                  {userStatus.utilisateur.email && (
                    <View style={styles.detailRow}>
                      <Ionicons name="mail-outline" size={16} color="#666" />
                      <Text style={styles.detailText}>{userStatus.utilisateur.email}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
  profileContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImage: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    borderWidth: 2,
    borderColor: 'white',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: '90%',
    maxWidth: 400,
  },
  modalCloseButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    padding: 5,
  },
  modalProfileContainer: {
    marginBottom: 20,
  },
  modalProfileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#007AFF',
  },
  modalInitialsContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#007AFF',
  },
  modalInitialsText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
  },
  memberInfo: {
    alignItems: 'center',
  },
  memberName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  memberRole: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  memberUsername: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  memberStatus: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  memberDetails: {
    marginTop: 15,
    width: '100%',
    alignItems: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    paddingHorizontal: 10,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    textAlign: 'center',
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 10,
  },
  fullScreenImage: {
    width: '90%',
    height: '80%',
  },
});
