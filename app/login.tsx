import { router } from 'expo-router';
import React from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import LoginForm from '../components/forms/LoginForm';

export default function LoginScreen() {
  const handleLoginSuccess = () => {
    // La connexion a réussi et l'utilisateur peut accéder au dashboard
    router.replace('/(tabs)');
  };

  const handleRedirect = (path: string, message: string, rejectionReason?: string) => {
    // Stocker le message et la raison du rejet pour l'afficher sur la page de destination
    console.log('🔍 handleRedirect appelé avec:', { path, message, rejectionReason });
    
    // Pour React Native, nous utiliserons AsyncStorage au lieu de localStorage
    // Les messages seront gérés différemment selon la destination
    
    if (path === '/register') {
      // Rediriger vers l'écran d'inscription (temporairement vers tabs)
      router.replace('/(tabs)');
    } else if (path === '/(tabs)') {
      // Rediriger vers le dashboard
      router.replace('/(tabs)');
    } else {
      // Redirection par défaut
      router.replace('/(tabs)');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        <View style={styles.content}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
               source={require('../assets/images/logo.png')}
               style={styles.logo}
               resizeMode="contain"
             />
          </View>

          {/* Titre */}
          <Text style={styles.title}>Connexion</Text>

          {/* Formulaire de connexion */}
          <View style={styles.formContainer}>
            <LoginForm 
              onSuccess={handleLoginSuccess}
              onRedirect={handleRedirect}
            />
          </View>
                  </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%',
  },
  logoContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 32,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
