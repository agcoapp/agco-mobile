import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import ViewShot from 'react-native-view-shot';
import { WebView } from 'react-native-webview';

interface AdhesionFormGeneratorProps {
  adhesionData: any;
  logoImage?: string; // URI du logo
  photoImage?: string; // URI de la photo de profil
  signatureImage?: string; // URI de la signature
  onImageGenerated?: (base64Image: string) => void;
  onError?: (error: string) => void;
}

export interface AdhesionFormGeneratorRef {
  generatePNG: (logoBase64?: string, photoUrl?: string, signatureUrl?: string) => Promise<string>;
}

const AdhesionFormGenerator = forwardRef<AdhesionFormGeneratorRef, AdhesionFormGeneratorProps>(
  ({ adhesionData, logoImage, photoImage, signatureImage, onImageGenerated, onError }, ref) => {
    const viewShotRef = useRef<ViewShot>(null);
    const webViewRef = useRef<WebView>(null);

    console.log('logoImage', logoImage);
    console.log('photoImage', photoImage);
    console.log('signatureImage', signatureImage);

    const generateHTML = (data: any, logoBase64?: string, photoUrl?: string, signatureUrl?: string) => {
      const htmlTemplate = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fiche d'Adhésion - ${data.firstName} ${data.lastName}</title>
    <style>
        :root {
            --a4-width: 210mm;
            --a4-height: 297mm;
            --a4-aspect-ratio: 0.707;
        }

        @page {
            size: A4;
            margin: 15mm;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Arial', sans-serif;
            font-size: 13px;
            line-height: 1.3;
            color: #000;
            background: #f0f0f0;
            padding: 20px;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: flex-start;
        }

        .page-wrapper {
            width: 100%;
            max-width: var(--a4-width);
            margin: 0 auto;
        }

        .container {
            width: var(--a4-width);
            height: var(--a4-height);
            background: white;
            position: relative;
            padding: 20mm;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            overflow: hidden;
            transform-origin: top left;
        }

        .header {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 45px;
            padding-bottom: 10px;
            margin-top: -10mm;
        }

        .logo {
            width: 150px;
            height: 150px;
            margin-right: -100px;
            flex-shrink: 0;
        }

        .logo img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }

        .association-info {
            flex: 1;
            text-align: center;
        }

        .association-name {
            font-size: 16px;
            font-weight: bold;
            color: #000;
            margin-bottom: 3px;
        }

        .association-motto {
            font-size: 13px;
            color: #333;
            margin-bottom: 5px;
            font-weight: bold;
        }

        .association-details {
            font-size: 11px;
            color: #666;
            line-height: 1.2;
            font-weight: bold;
        }

        .title-photo-section {
            display: flex;
            justify-content: center;
            align-items: flex-end;
            margin-bottom: 15px;
            margin-top: 20px;
            position: relative;
            padding-top: 30px;
        }

        .title-container {
            text-align: center;
            flex: 1;
            display: flex;
            justify-content: center;
        }

        .photo-box-positioned {
            position: absolute;
            right: 0;
        }

        .title-box {
            border: 2px solid #000;
            padding: 8px 25px;
            border-radius: 3px;
            display: inline-block;
            margin-bottom: 10px;
        }

        .title {
            font-size: 26px;
            font-weight: bold;
            text-align: center;
        }

        .photo-box {
            width: 120px;
            height: 150px;
            border: 2px solid #000;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f9f9f9;
            flex-shrink: 0;
            margin-bottom: 10px;
        }

        .photo-box img {
            width: 116px;
            height: 146px;
            object-fit: cover;
        }

        .photo-placeholder {
            font-size: 8px;
            color: #666;
            text-align: center;
        }

        .adhesion-number-center {
            text-align: center;
            font-size: 13px;
            font-weight: bold;
            margin-bottom: 50px;
            margin-top: 5px;
        }

        .form-section { margin-bottom: 20px; }
        .form-field { margin-bottom: 8px; display: flex; align-items: baseline; page-break-inside: avoid; }
        .field-label { font-weight: bold; min-width: 180px; margin-right: 8px; font-size: 12px; }
        .field-value { flex: 1; border-bottom: 1px dotted #000; padding-bottom: 1px; min-height: 14px; font-size: 12px; }
        .field-value-inline { display: inline-block; border-bottom: 1px dotted #000; padding-bottom: 1px; margin: 0 3px; min-width: 120px; font-size: 12px; }
        .declaration { text-align: right; font-style: italic; margin: 15px 0; font-size: 11px; line-height: 1.3; margin-right: 10%; }
        .signatures { display: flex; justify-content: space-between; margin-top: 20px; page-break-inside: avoid; }
        .signature-box { text-align: center; width: 45%; }
        .signature-label { font-weight: bold; margin-bottom: 30px; font-size: 12px; }
        .signature-space { height: 30px; margin-bottom: 8px; }
        .signature-right { display: flex; flex-direction: column; align-items: center; text-align: center; width: 45%; }
        .lu-approuve { font-size: 11px; margin-top: 15px; }

        .signature-image {
            max-width: 100%;
            max-height: 120px;
            object-fit: contain;
        }

        @media screen and (max-width: 833px) {
            .page-wrapper {
                height: calc(100vw / var(--a4-aspect-ratio));
                max-height: calc( (var(--a4-width) - 40px) / var(--a4-aspect-ratio) );
            }
            .container {
                --scale-factor: calc( (100vw - 40px) / var(--a4-width) );
                transform: scale(var(--scale-factor));
            }
        }

        @media print {
            body {
                background: white;
                padding: 0;
            }
            .page-wrapper {
                width: auto;
                height: auto;
                max-width: none;
                max-height: none;
            }
            .container {
                margin: 0;
                box-shadow: none;
                transform: scale(1);
                width: 100%;
                height: 100%;
                padding: 15mm;
            }
        }
    </style>
</head>
<body>
    <div class="page-wrapper">
        <div class="container">
            <!-- En-tête -->
            <div class="header">
                <div class="logo">
                    ${logoBase64 ? 
                        `<img src="${logoBase64}" alt="Logo AGC" style="width: 100%; height: 100%; object-fit: contain;" />` : 
                        `<div style="width: 100%; height: 100%; background: #f9f9f9; border: 1px solid #ccc; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #666;">
                            Logo AGC
                        </div>`
                    }
                </div>
                <div class="association-info">
                    <div class="association-name">ASSOCIATION DES GABONAIS DU CONGO</div>
                    <div class="association-motto">ENGAGEMENT * SOLIDARITÉ * ENTRAIDE</div>
                    <div class="association-details">
                        Adresse : 5 Rue Louis TRECHO, Immeuble OTTA Brazzaville (Congo)<br>
                        Téléphone : (+242) 05 337 00 14 / 06 692 31 00
                    </div>
                </div>
            </div>

            <!-- Titre et photo sur la même hauteur -->
            <div class="title-photo-section">
                <div class="title-container">
                    <div class="title-box">
                        <div class="title">FICHE D'ADHÉSION</div>
                    </div>
                </div>
                                 <div class="photo-box photo-box-positioned">
                     ${photoUrl ? 
                         `<img src="${photoUrl}" alt="Photo du membre" />` : 
                         `<div class="photo-placeholder">PHOTO</div>`
                     }
                 </div>
            </div>

            <!-- Numéro d'adhésion centré -->
            ${data.status === 'validated' && data.adhesionNumber ? `
            <div class="adhesion-number-center">
                Numéro d'Adhésion : ${data.adhesionNumber}
            </div>
            ` : ''}

            <!-- Formulaire -->
            <div class="form-section">
                <div class="form-field">
                    <span class="field-label">Nom(s) :</span>
                    <span class="field-value">${data.lastName || 'Non spécifié'}</span>
                </div>

                <div class="form-field">
                    <span class="field-label">Prénom(s) :</span>
                    <span class="field-value">${data.firstName || 'Non spécifié'}</span>
                </div>

                <div class="form-field">
                    <span class="field-label">Date et lieu de Naissance :</span>
                    <span class="field-value">${data.birthDate || 'Non spécifiée'} à ${data.birthPlace || 'Non spécifié'}</span>
                </div>

                <div class="form-field">
                    <span class="field-label">Adresse :</span>
                    <span class="field-value">${data.address || 'Non spécifiée'}</span>
                </div>

                <div class="form-field">
                    <span class="field-label">Profession :</span>
                    <span class="field-value">${data.profession || 'Non spécifiée'}</span>
                </div>

                <div class="form-field">
                    <span class="field-label">N° de Carte d'identité consulaire :</span>
                    <span class="field-value-inline">${data.idNumber || 'Non spécifié'}</span>
                    <span style="margin-left: 20px;">Délivré le :</span>
                    <span class="field-value-inline">${data.idIssueDate || 'Non spécifiée'}</span>
                </div>

                <div class="form-field">
                    <span class="field-label">Ville de Résidence :</span>
                    <span class="field-value">${data.city || 'Non spécifiée'}</span>
                </div>

                <div class="form-field">
                    <span class="field-label">Date d'entrée au Congo :</span>
                    <span class="field-value">${data.entryDate || 'Non spécifiée'}</span>
                </div>

                <div class="form-field">
                    <span class="field-label">Employeur / Université / École :</span>
                    <span class="field-value">${data.employer || 'Non spécifié'}</span>
                </div>

                <div class="form-field">
                    <span class="field-label">Téléphone :</span>
                    <span class="field-value">${data.phone || 'Non spécifié'}</span>
                </div>

                <div class="form-field">
                    <span class="field-label">Nom et Prénom du Conjoint(e) :</span>
                    <span class="field-value">${data.spouseName || 'Non renseigné'}</span>
                </div>

                <div class="form-field">
                    <span class="field-label">Nombre d'enfant :</span>
                    <span class="field-value">${data.childrenCount || 0}</span>
                </div>

                ${data.comment ? `
                <div class="form-field">
                    <span class="field-label">Commentaire :</span>
                    <span class="field-value">${data.comment}</span>
                </div>
                ` : ''}
            </div>

            <!-- Déclaration -->
            <div class="declaration">
                "Je reconnais avoir reçu et pris connaissance des<br>
                Statuts et du Règlement intérieur de l'Association"
            </div>

            <!-- Signatures -->
            <div class="signatures">
                <div class="signature-box">
                    <div class="signature-label">Signature du Président(e)</div>
                </div>
                                 <div class="signature-right">
                     <div class="signature-label">Signature de l'Adhérent(e)</div>
                     ${signatureUrl ? 
                         `<img src="${signatureUrl}" alt="Signature de l'Adhérent" class="signature-image" />` : 
                         `<div class="signature-space"></div>`
                     }
                     <div class="lu-approuve">Lu et Approuvé</div>
                 </div>
            </div>
        </div>
    </div>
</body>
</html>`;

      return htmlTemplate;
    };

    const generatePNG = async (logoBase64?: string, photoUrl?: string, signatureUrl?: string): Promise<string> => {
      try {
        // Utiliser les paramètres fournis ou les props du composant
        const finalLogoBase64 = logoBase64 || logoImage;
        const finalPhotoUrl = photoUrl || photoImage;
        const finalSignatureUrl = signatureUrl || signatureImage;
        
        console.log('🔄 Début de la génération PNG avec images...');
        console.log('Logo:', finalLogoBase64 ? 'Présent' : 'Absent');
        console.log('Photo:', finalPhotoUrl ? 'Présente' : 'Absente');
        console.log('Signature:', finalSignatureUrl ? 'Présente' : 'Absente');
        
        if (!viewShotRef.current) {
          throw new Error('ViewShot ref non disponible');
        }

        // Mettre à jour le HTML avec les images
        const updatedHtmlContent = generateHTML(adhesionData, finalLogoBase64, finalPhotoUrl, finalSignatureUrl);
        
        // Attendre que le WebView soit chargé
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Capturer l'image
        if (!viewShotRef.current?.capture) {
          throw new Error('Méthode capture non disponible');
        }
        const uri = await viewShotRef.current.capture();

        console.log('✅ PNG généré avec succès !');
        console.log('📏 Taille de l\'image:', uri.length, 'caractères base64');

        if (onImageGenerated) {
          onImageGenerated(uri);
        }

        return uri;
      } catch (error) {
        console.error('❌ Erreur lors de la génération PNG:', error);
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

    const htmlContent = generateHTML(adhesionData, logoImage, photoImage, signatureImage);

    return (
      <View style={styles.container}>
        <ViewShot
          ref={viewShotRef}
          style={styles.viewShot}
          options={{
            format: 'png',
            quality: 1,
            result: 'base64',
            width: 794,
            height: 1123,
          }}
        >
          <WebView
            ref={webViewRef}
            source={{ html: htmlContent }}
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
              console.log('🌐 WebView chargé avec succès');
            }}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('❌ Erreur WebView:', nativeEvent);
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
    width: 794,
    height: 1123,
    backgroundColor: 'white',
  },
  viewShot: {
    width: 794,
    height: 1123,
    backgroundColor: 'white',
  },
  webview: {
    width: 794,
    height: 1123,
    backgroundColor: 'white',
  },
});

export default AdhesionFormGenerator;
