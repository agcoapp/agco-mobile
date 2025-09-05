import * as FileSystem from 'expo-file-system';
import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import ViewShot from 'react-native-view-shot';
import { WebView } from 'react-native-webview';

// Fonction pour générer un QR code à partir d'une URL
const generateQRCode = async (url: string): Promise<string> => {
  try {
    console.log('🔄 Génération du QR code pour:', url);
    
    // Utiliser l'API QR Server pour générer le QR code
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
    
    // Télécharger l'image QR code générée
    const downloadResult = await FileSystem.downloadAsync(
      qrApiUrl,
      FileSystem.documentDirectory + 'temp_qr_code.png'
    );
    
    // Lire l'image téléchargée en base64
    const base64 = await FileSystem.readAsStringAsync(downloadResult.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    console.log('✅ QR code généré avec succès');
    return `data:image/png;base64,${base64}`;
  } catch (error) {
    console.error('❌ Erreur lors de la génération du QR code:', error);
    
    // Fallback: créer un QR code simple avec Canvas (si disponible)
    // Pour l'instant, retourner un placeholder
    const placeholderQR = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    return `data:image/png;base64,${placeholderQR}`;
  }
};


interface CarteVersoGeneratorProps {
  member: any;
  qrCodeImage?: string; // URI du QR Code
  signatureImage?: string; // URI de la signature/sceau officiel
  onImageGenerated?: (base64Image: string) => void;
  onError?: (error: string) => void;
}

export interface CarteVersoGeneratorRef {
  generatePNG: (qrCodeBase64?: string, signatureUrl?: string, finalFormUrl?: string) => Promise<string>;
}

const CarteVersoGenerator = forwardRef<CarteVersoGeneratorRef, CarteVersoGeneratorProps>(
  ({ member, qrCodeImage, signatureImage, onImageGenerated, onError }, ref) => {
    const viewShotRef = useRef<ViewShot>(null);
    const webViewRef = useRef<WebView>(null);

    console.log('qrCodeImage', qrCodeImage);
    console.log('signatureImage', signatureImage);

    const generateHTML = (memberData: any, qrCodeBase64?: string, signatureUrl?: string) => {
      const versoHTML = `
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" rel="stylesheet">

        <div style="width: 660px; height: 450px; background: #fefefe; border: 2px solid #ccc; position: relative; margin: 0 auto;">
          <!-- Main Section -->
          <div style="position: absolute; width: 100%; height: 350px; top: 0; left: 0; background: #fefefe; display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <!-- Title -->
            <div style="font-family: 'Inter, sans-serif'; font-weight: 700; color: #1b1b1b; font-size: 32px; line-height: normal; margin-bottom: 40px;">
              Le Président
            </div>
            
            <div style="display: flex; width: 100%; justify-content: space-around; align-items: center; padding: 0 40px;">
              <!-- QR Code -->
              ${qrCodeBase64 ? 
                `<img src="${qrCodeBase64}" alt="QR Code" style="width: 140px; height: 140px; object-fit: cover;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                 <div style="width: 140px; height: 140px; background: #f5f5f5; border: 1px solid #ccc; display: none; align-items: center; justify-content: center; font-size: 12px; color: #666; font-family: 'Inter, Helvetica';">QR Code</div>` : 
                `<div style="width: 140px; height: 140px; background: #f5f5f5; border: 1px solid #ccc; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #666; font-family: 'Inter, Helvetica';">QR Code</div>`
              }
              
              <!-- Sceau officiel et signature -->
              ${signatureUrl ? 
                `<img src="${signatureUrl}" alt="Sceau officiel" style="width: 280px; height: 180px; object-fit: contain;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                 <div style="width: 280px; height: 180px; background: #f5f5f5; border: 1px solid #ccc; display: none; align-items: center; justify-content: center; font-size: 12px; color: #666; font-family: 'Inter, Helvetica';">Sceau officiel</div>` : 
                `<div style="width: 280px; height: 180px; background: #f5f5f5; border: 1px solid #ccc; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #666; font-family: 'Inter, Helvetica';">Sceau officiel</div>`
              }
            </div>
          </div>
          
          <!-- Footer Section -->
          <div style="position: absolute; width: 100%; height: 100px; bottom: 0; left: 0; background: #0d65c4; display: flex; align-items: center; justify-content: center;">
            <div style="font-family: 'Inter'; font-weight: 700; color: white; font-size: 15px; line-height: 20px; text-align: center; max-width: 80%;">
              Il est demandé à toutes les autorités civiles, administratives<br/>
              et militaires d'apporter assistance et protection au porteur<br/>
              de la présente carte afin qu'il se rapproche de son Ambassade<br/>
              en toute sécurité.
            </div>
          </div>
        </div>
      `;

      return versoHTML;
    };

    const generatePNG = async (qrCodeBase64?: string, signatureUrl?: string, finalFormUrl?: string): Promise<string> => {
      try {
        // Utiliser les paramètres fournis ou les props du composant
        const finalQrCodeBase64 = qrCodeBase64 || qrCodeImage;
        const finalSignatureUrl = signatureUrl || signatureImage;
        
        console.log('🔄 Début de la génération PNG Carte Verso avec images...');
        console.log('QR Code:', finalQrCodeBase64 ? 'Présent' : 'Absent');
        console.log('Signature:', finalSignatureUrl ? 'Présente' : 'Absente');
        console.log('URL formulaire final:', finalFormUrl ? 'Présente' : 'Absente');

        // Générer automatiquement le QR code si pas fourni
        let qrCodeToUse = finalQrCodeBase64;
        if (!qrCodeToUse) {
          // Priorité à l'URL du formulaire final (avec numéro d'adhésion)
          const urlToUse = finalFormUrl || member.formulaire_actuel?.url_image_formulaire;
          if (urlToUse) {
            console.log('🔄 Génération automatique du QR code pour:', urlToUse);
            qrCodeToUse = await generateQRCode(urlToUse);
          }
        }

        // Générer le HTML avec les images
        const htmlContent = generateHTML(member, qrCodeToUse, finalSignatureUrl);
        
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

        console.log('✅ PNG Carte Verso généré avec succès !');
        console.log('📏 Taille de l\'image:', uri.length, 'caractères base64');

        if (onImageGenerated) {
          onImageGenerated(uri);
        }

        return uri;
      } catch (error) {
        console.error('❌ Erreur lors de la génération PNG Carte Verso:', error);
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
            source={{ html: generateHTML(member, qrCodeImage, signatureImage) }}
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
              console.log('🌐 WebView Carte Verso chargé avec succès');
            }}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('❌ Erreur WebView Carte Verso:', nativeEvent);
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

export default CarteVersoGenerator;
