import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import ViewShot from 'react-native-view-shot';
import { WebView } from 'react-native-webview';
import { cleanCodeFormulaire } from '../utils/fonctions';


interface CarteRectoGeneratorProps {
  member: any;
  logoImage?: string; // URI du logo
  photoImage?: string; // URI de la photo de profil
  onImageGenerated?: (base64Image: string) => void;
  onError?: (error: string) => void;
}

export interface CarteRectoGeneratorRef {
  generatePNG: (logoBase64?: string, photoUrl?: string, adhesionNumber?: string) => Promise<string>;
}

const CarteRectoGenerator = forwardRef<CarteRectoGeneratorRef, CarteRectoGeneratorProps>(
  ({ member, logoImage, photoImage, onImageGenerated, onError }, ref) => {
    const viewShotRef = useRef<ViewShot>(null);
    const webViewRef = useRef<WebView>(null);

    const generateHTML = (memberData: any, logoBase64?: string, photoUrl?: string, adhesionNumber?: string) => {
      const rectoHTML = `
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" rel="stylesheet">

        <div style="width: 660px; height: 450px; background: white; border: 2px solid #ccc; position: relative; margin: 0 auto;">
          <!-- Header Section -->
          <div style="height: 180px; position: relative; width: 100%;">
            <!-- Green header bar -->
            <div style="position: absolute; width: 100%; height: 60px; top: 0; left: 0; background: #029350;">
              <div style="position: absolute; width: 500px; height: 40px; top: 2px; left: 140px; font-family: 'Anton'; font-weight: normal; color: black; font-size: 33px; letter-spacing: -1px; line-height: normal; margin: 0; overflow: hidden; text-overflow: ellipsis;">
                ASSOCIATION DES GABONAIS DU CONGO
              </div>
            </div>

            <!-- Yellow info bar -->
            <div style="position: absolute; width: 100%; height: 65px; top: 50px; left: 0; background: #e4da2c;">
              <div style="position: absolute; width: 700px; height: 25px; top: 5px; left: 140px; font-family: 'Inter'; font-weight: normal; font-size: 22px; letter-spacing: 0; line-height: normal; overflow: hidden; text-overflow: ellipsis;">
                <span style="font-weight: bold; color: black; font-size: 23px; text-shadow: -2px 2px 2px rgba(0, 0, 0, 0.25);">ENGAGEMENT * SOLIDARITE * ENTRAIDE</span>
              </div>
              <div style="position: absolute; width: 400px; height: 24px; top: 30px; left: 180px; font-family: 'Inter'; font-weight: bold; color: black; font-size: 15.5px; letter-spacing: 0; line-height: normal; overflow: hidden; text-overflow: ellipsis;">
                Téléphone : (+242) 05 337 00 14 / 06 692 31 00
              </div>
              <div style="position: absolute; width: 540px; height: 24px; top: 46px; left: 124px; font-family: 'Inter'; font-weight: bold; color: black; font-size: 15.5px; letter-spacing: 0; line-height: normal; overflow: hidden; text-overflow: ellipsis;">
                Adresse : 5 Rue Louis TRECHO, Immeuble OTTA Brazzaville (Congo)
              </div>
            </div>

            <!-- Blue title bar -->
            <div style="position: absolute; width: 100%; height: 55px; top: 115px; left: 0; background: #1b6bab; overflow: hidden;">
              <div style="position: absolute; width: 400px; height: 60px; top: -2px; left: 24px; font-family: 'Anton'; font-weight: normal; color: #020604; font-size: 40px; letter-spacing: 0; line-height: normal; margin: 0;">
                CARTE DE MEMBRE
              </div>
            </div>

            <!-- Logo de l'association -->
             ${logoBase64 ? 
               `<img src="${logoBase64}" alt="Logo AGC" style="position: absolute; top: 0; left: 15px; width: 120px; height: 100px; object-fit: contain;" />` : 
               `<div style="position: absolute; top: 0; left: 15px; width: 120px; height: 100px; background: transparent; border: none; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #666;">Logo AGC</div>`
             }
          </div>

          <!-- Main Content Section -->
          <div style="top: 180px; position: absolute; width: 100%; left: 0; padding: 0;">
            <!-- Footer bar -->
            <div style="position: absolute; width: 100%; height: 35px; top: 235px; left: 0; background: #c8b285;"></div>

            <!-- Background logo -->
            ${logoBase64 ? 
              `<img src="${logoBase64}" alt="Logo AGC" style="position: absolute; top: 5px; left: 30px; width: 250px; height: 220px; object-fit: cover; opacity: 0.1;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
               <div style="position: absolute; top: 5px; left: 30px; width: 250px; height: 220px; background: transparent; border: none; display: none; align-items: center; justify-content: center; font-size: 12px; color: #666; opacity: 0.1;">Logo AGC</div>` : 
              `<div style="position: absolute; top: 5px; left: 30px; width: 250px; height: 220px; background: transparent; border: none; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #666; opacity: 0.1;">Logo AGC</div>`
            }

            <!-- Photo du membre -->
            <div style="position: absolute; width: 160px; height: 200px; top: 5px; left: 480px; background: white; border: 3px solid #029350; box-shadow: -4px 2px 6px rgba(0, 0, 0, 0.25);">
              ${photoUrl ? 
                `<img src="${photoUrl}" alt="Photo du membre" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                 <div style="width: 100%; height: 100%; display: none; align-items: center; justify-content: center; background: #f5f5f5; color: #666; font-size: 14px; text-align: center; font-family: 'Inter'; font-style: italic;">Aucune photo</div>` : 
                `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #f5f5f5; color: #666; font-size: 14px; text-align: center; font-family: 'Inter'; font-style: italic;">Aucune photo</div>`
              }
            </div>

            <!-- Member information -->
            <div style="position: absolute; width: 440px; height: 230px; top: 0; left: 24px; font-family: 'Inter'; font-weight: normal; color: black; font-size: 22px; letter-spacing: 0; line-height: normal;">
              <div style="margin-bottom: 3px;">
                <span style="font-family: 'Inter'; font-weight: normal; color: black; font-size: 24px; letter-spacing: 0;">Nom(s) :</span>
                <span style="font-family: 'Inter'; font-weight: bold; color: black; font-size: 24px;">${memberData.formulaire_actuel?.donnees_snapshot?.nom || 'Non spécifié'}</span>
              </div>
              <div style="margin-bottom: 3px;">
                <span style="font-family: 'Inter'; font-weight: normal; color: black; font-size: 24px; letter-spacing: 0;">Prénom(s) :</span>
                <span style="font-family: 'Inter'; font-weight: bold; color: black; font-size: 24px;">${memberData.formulaire_actuel?.donnees_snapshot?.prenoms || 'Non spécifié'}</span>
              </div>
              <div style="margin-bottom: 3px;">
                <span style="font-family: 'Inter'; font-weight: normal; color: black; font-size: 24px; letter-spacing: 0;">Fonction :</span>
                <span style="font-family: 'Inter'; font-weight: bold; color: black; font-size: 24px;">${memberData.formulaire_actuel?.donnees_snapshot?.profession || 'Membre'}</span>
              </div>
              <div style="margin-bottom: 3px;">
                <span style="font-family: 'Inter'; font-weight: normal; color: black; font-size: 24px; letter-spacing: 0;">Date de Naissance :</span>
                <span style="font-family: 'Inter'; font-weight: bold; color: black; font-size: 24px;">${memberData.formulaire_actuel?.donnees_snapshot?.date_naissance || 'Non spécifiée'}</span>
              </div>
              <div style="margin-bottom: 3px;">
                <span style="font-family: 'Inter'; font-weight: normal; color: black; font-size: 24px; letter-spacing: 0;">Téléphone :</span>
                <span style="font-family: 'Inter'; font-weight: bold; color: black; font-size: 24px;">${memberData.telephone || 'Non spécifié'}</span>
              </div>
              <div style="margin-bottom: 3px;">
                <span style="font-family: 'Inter'; font-weight: normal; color: black; font-size: 24px; letter-spacing: 0;">N° :</span>
                <span style="font-family: 'Inter'; font-weight: bold; color: black; font-size: 24px;">${cleanCodeFormulaire(adhesionNumber || memberData.numero_adhesion)}</span>
              </div>
              <div style="margin-top: 5px;">
                <span style="font-family: 'Inter'; font-weight: bold; color: black; font-size: 24px;">Fait à Brazzaville, le ${new Date().toLocaleDateString('fr-FR')}</span>
              </div>
            </div>
          </div>
        </div>
      `;

      return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Carte de Membre - Recto</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            background: #f0f0f0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            font-family: 'Inter', sans-serif;
        }
    </style>
</head>
<body>
    ${rectoHTML}
</body>
</html>`;
    };

    const generatePNG = async (logoBase64?: string, photoUrl?: string, adhesionNumber?: string): Promise<string> => {
      try {
        // Utiliser les paramètres fournis ou les props du composant
        const finalLogoBase64 = logoBase64 || logoImage;
        const finalPhotoUrl = photoUrl || photoImage;
        
        console.log('🔄 Début de la génération PNG Carte Recto avec images...');
        console.log('Logo:', finalLogoBase64 ? 'Présent' : 'Absent');
        console.log('Photo:', finalPhotoUrl ? 'Présente' : 'Absente');
        console.log('Numéro d\'adhésion:', adhesionNumber ? 'Présent' : 'Absent');

        // Générer le HTML avec les images
        const htmlContent = generateHTML(member, finalLogoBase64, finalPhotoUrl, adhesionNumber);
        
        if (!viewShotRef.current) {
          throw new Error('ViewShot ref non disponible');
        }

        // Mettre à jour le contenu du WebView
        if (webViewRef.current) {
          webViewRef.current.injectJavaScript(`
            document.body.innerHTML = \`${htmlContent}\`;
            true;
          `);
        }
        
        // Attendre que le WebView soit chargé
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Capturer l'image avec ViewShot
        if (!viewShotRef.current?.capture) {
          throw new Error('Méthode capture non disponible');
        }
        const uri = await viewShotRef.current.capture();

        console.log('✅ PNG Carte Recto généré avec succès !');
        console.log('📏 Taille de l\'image:', uri.length, 'caractères base64');

        if (onImageGenerated) {
          onImageGenerated(uri);
        }

        return uri;
      } catch (error) {
        console.error('❌ Erreur lors de la génération PNG Carte Recto:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        
        if (onError) {
          onError(errorMessage);
        }
        
        throw error;
      }
    };

    useImperativeHandle(ref, () => ({
      generatePNG,
    }));

    return (
      <View style={styles.container}>
        <ViewShot
          ref={viewShotRef}
          style={styles.viewShot}
          options={{
            format: 'png',
            quality: 1,
            result: 'base64',
            width: 700,
            height: 490,
          }}
        >
          <WebView
            ref={webViewRef}
            source={{ html: generateHTML(member, logoImage, photoImage) }}
            style={styles.webview}
            scrollEnabled={false}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            scalesPageToFit={false}
            bounces={false}
            onLoad={() => {
              console.log('🌐 WebView Carte Recto chargé avec succès');
            }}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('❌ Erreur WebView Carte Recto:', nativeEvent);
            }}
          />
        </ViewShot>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: -9999,
    left: -9999,
    width: 700,
    height: 490,
    backgroundColor: 'white',
  },
  viewShot: {
    width: 700,
    height: 490,
    backgroundColor: 'white',
  },
  webview: {
    width: 700,
    height: 490,
    backgroundColor: 'white',
  },
});

export default CarteRectoGenerator;
