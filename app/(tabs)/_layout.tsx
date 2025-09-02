import { Ionicons } from '@expo/vector-icons';
import { Drawer } from 'expo-router/drawer';
import React from 'react';
import { useAuth } from '../../hooks/useAuth';

export default function TabLayout() {
  const { user } = useAuth();

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'MEMBRE':
        return 'Membre';
      case 'PRESIDENT':
        return 'Président';
      case 'SECRETAIRE_GENERALE':
        return 'Secrétaire Général';
      default:
        return role;
    }
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
        },
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          title: 'Dashboard',
          drawerIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="membres"
        options={{
          title: 'Membres',
          drawerIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="adhesions"
        options={{
          title: 'Adhésions',
          drawerIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="person-add-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="documents"
        options={{
          title: 'Documents',
          drawerIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="document-text-outline" size={size} color={color} />
          ),
        }}
      />
      
      {/* Pages supplémentaires selon le rôle */}
      {user?.role === 'MEMBRE' && (
        <>
          <Drawer.Screen
            name="mon-adhesion"
            options={{
              title: 'Ma fiche d\'adhésion',
              drawerIcon: ({ color, size }: { color: string; size: number }) => (
                <Ionicons name="person-outline" size={size} color={color} />
              ),
            }}
          />
          <Drawer.Screen
            name="change-password"
            options={{
              title: 'Changer mot de passe',
              drawerIcon: ({ color, size }: { color: string; size: number }) => (
                <Ionicons name="key-outline" size={size} color={color} />
              ),
            }}
          />
        </>
      )}
      
      {(user?.role === 'PRESIDENT' || user?.role === 'SECRETAIRE_GENERALE') && (
        <>
          <Drawer.Screen
            name="cartes"
            options={{
              title: 'Cartes de membres',
              drawerIcon: ({ color, size }: { color: string; size: number }) => (
                <Ionicons name="card-outline" size={size} color={color} />
              ),
            }}
          />
          {user?.role === 'SECRETAIRE_GENERALE' && (
            <Drawer.Screen
              name="codes"
              options={{
                title: 'Codes d\'accès',
                drawerIcon: ({ color, size }: { color: string; size: number }) => (
                  <Ionicons name="key-outline" size={size} color={color} />
                ),
              }}
            />
          )}
          <Drawer.Screen
            name="settings"
            options={{
              title: 'Signature du Président',
              drawerIcon: ({ color, size }: { color: string; size: number }) => (
                <Ionicons name="create-outline" size={size} color={color} />
              ),
            }}
          />
        </>
      )}
    </Drawer>
  );
}
