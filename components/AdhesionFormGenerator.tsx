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
  generatePNG: (logoBase64?: string, photoUrl?: string, signatureUrl?: string, customData?: any, presidentSignatureUrl?: string) => Promise<string>;
}

const AdhesionFormGenerator = forwardRef<AdhesionFormGeneratorRef, AdhesionFormGeneratorProps>(
  ({ adhesionData, logoImage, photoImage, signatureImage, onImageGenerated, onError }, ref) => {
    const viewShotRef = useRef<ViewShot>(null);
    const webViewRef = useRef<WebView>(null);

         const generateHTML = (data: any, logoBase64?: string, photoUrl?: string, signatureUrl?: string, presidentSignatureUrl?: string) => {
       // Mapper les propriétés françaises vers les propriétés anglaises
       const mappedData = {
         firstName: data.prenoms || data.firstName,
         lastName: data.nom || data.lastName,
         birthDate: data.date_naissance || data.birthDate,
         birthPlace: data.lieu_naissance || data.birthPlace,
         address: data.adresse || data.address,
         profession: data.profession || data.profession,
         idNumber: data.numero_piece || data.idNumber,
         idIssueDate: data.date_emission_piece || data.idIssueDate,
         city: data.ville_residence || data.city,
         entryDate: data.date_entree_congo || data.entryDate,
         employer: data.employeur_ecole || data.employer,
         phone: data.telephone || data.phone,
         spouseName: data.nom_conjoint || data.spouseName,
         childrenCount: data.nombre_enfants || data.childrenCount,
         comment: data.commentaire || data.comment,
         adhesionNumber: data.numero_adhesion || data.adhesionNumber,
         status: data.statut || data.status,
         idType: data.type_piece || data.idType,
         ...data // Garder les autres propriétés existantes
       };
       const htmlTemplate = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fiche d'Adhésion - ${mappedData.firstName} ${mappedData.lastName}</title>
    <style>
        :root {
            --a4-width: 210mm;
            --a4-height: 297mm;
            --a4-aspect-ratio: 0.707; /* 210 / 297 */
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

        /* En-tête avec logo - CENTRÉ */
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
            object-fit: cover;
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
            font-size: 7px;
            color: #666;
            line-height: 1.2;
            font-weight: bold;
        }

        /* Titre et photo sur la même ligne */
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
        .field-value { flex: 1; border-bottom: 1px dotted #000; padding-bottom: 1px; min-height: 14px; font-size: 9px; }
        .field-value-inline { display: inline-block; border-bottom: 1px dotted #000; padding-bottom: 1px; margin: 0 3px; min-width: 120px; font-size: 12px; }
        .declaration { text-align: right; font-style: italic; margin: 15px 0; font-size: 8px; line-height: 1.3; margin-right: 10%; }
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
        /* --- RESPONSIVE SCALING --- */
        @media screen and (max-width: 833px) { /* 210mm is ~833px at 1.25 device pixel ratio */
            .page-wrapper {
                /* Calculate the scaled height to avoid empty space */
                /* height = wrapper_width / aspect_ratio */
                height: calc(100vw / var(--a4-aspect-ratio));
                max-height: calc( (var(--a4-width) - 40px) / var(--a4-aspect-ratio) );
            }
            .container {
                /* Scale the container to fit the wrapper width */
                --scale-factor: calc( (100vw - 40px) / var(--a4-width) );
                transform: scale(var(--scale-factor));
            }
        }

        /* --- PRINT STYLES --- */
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
                        `<img src="${logoBase64}" alt="Logo AGCO" />` : 
                        `<div style="width: 100%; height: 100%; background: #f9f9f9; border: 1px solid #ccc; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #666;">
                            Logo AGCO
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
            ${mappedData.status === 'validated' && mappedData.adhesionNumber ? `
            <div class="adhesion-number-center">
                Numéro d'Adhésion : ${mappedData.adhesionNumber}
            </div>
            ` : ''}

            <!-- Formulaire -->
            <div class="form-section">
                <div class="form-field">
                    <span class="field-label">Nom(s) :</span>
                    <span class="field-value">${mappedData.lastName || ''}</span>
                </div>

                <div class="form-field">
                    <span class="field-label">Prénom(s) :</span>
                    <span class="field-value">${mappedData.firstName || ''}</span>
                </div>

                <div class="form-field">
                    <span class="field-label">Date et lieu de Naissance :</span>
                    <span class="field-value">${mappedData.birthDate || ''} ${mappedData.birthPlace ? `à ${mappedData.birthPlace}` : ''}</span>
                </div>

                <div class="form-field">
                    <span class="field-label">Adresse :</span>
                    <span class="field-value">${mappedData.address || ''}</span>
                </div>

                <div class="form-field">
                    <span class="field-label">Profession :</span>
                    <span class="field-value">${mappedData.profession || ''}</span>
                </div>

                <div class="form-field">
                    <span class="field-label">N° de ${mappedData.idType || 'Carte d\'identité consulaire'} :</span>
                    <span class="field-value-inline">${mappedData.idNumber || ''}</span>
                    <span style="margin-left: 20px;font-weight: bold;">Délivré le :</span>
                    <span class="field-value-inline">${mappedData.idIssueDate || ''}</span>
                </div>

                <div class="form-field">
                    <span class="field-label">Ville de Résidence :</span>
                    <span class="field-value">${mappedData.city || ''}</span>
                </div>

                <div class="form-field">
                    <span class="field-label">Date d'entrée au Congo :</span>
                    <span class="field-value">${mappedData.entryDate || ''}</span>
                </div>

                <div class="form-field">
                    <span class="field-label">Employeur / Université / École :</span>
                    <span class="field-value">${mappedData.employer || ''}</span>
                </div>

                <div class="form-field">
                    <span class="field-label">Téléphone :</span>
                    <span class="field-value">${mappedData.phone || ''}</span>
                </div>

                <div class="form-field">
                    <span class="field-label">Nom et Prénom du Conjoint(e) :</span>
                    <span class="field-value">${mappedData.spouseName || ''}</span>
                </div>

                <div class="form-field">
                    <span class="field-label">Nombre d'enfant :</span>
                    <span class="field-value">${mappedData.childrenCount || ''}</span>
                </div>

                <div class="form-field">
                    <span class="field-label">Commentaire :</span>
                    <span class="field-value">${mappedData.comment || ''}</span>
                </div>
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
                    ${presidentSignatureUrl ? 
                        `<img src="${presidentSignatureUrl}" alt="Signature du Président" class="signature-image" />` : 
                        `<div class="signature-space"></div>`
                    }
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

    const generatePNG = async (logoBase64?: string, photoUrl?: string, signatureUrl?: string, customData?: any, presidentSignatureUrl?: string): Promise<string> => {
      try {
        // Utiliser les paramètres fournis ou les props du composant
        const finalLogoBase64 = logoBase64 || logoImage;
        const finalPhotoUrl = photoUrl || photoImage;
        const finalSignatureUrl = signatureUrl || signatureImage;
        
        // Utiliser les données personnalisées ou les données par défaut
        const dataToUse = customData || adhesionData;
        
        console.log('🔄 Début de la génération PNG avec images...');
        console.log('Logo:', finalLogoBase64 ? 'Présent' : 'Absent');
        console.log('Photo:', finalPhotoUrl ? 'Présente' : 'Absente');
        console.log('Signature adhérent:', finalSignatureUrl ? 'Présente' : 'Absente');
        console.log('Signature président:', presidentSignatureUrl ? 'Présente' : 'Absente');
        console.log('Données utilisées:', dataToUse ? 'Personnalisées' : 'Par défaut');
        
        if (!viewShotRef.current) {
          throw new Error('ViewShot ref non disponible');
        }

        // Mettre à jour le HTML avec les images
        const updatedHtmlContent = generateHTML(dataToUse, finalLogoBase64, finalPhotoUrl, finalSignatureUrl, presidentSignatureUrl);
        
        // Mettre à jour le contenu du WebView
        if (webViewRef.current) {
          webViewRef.current.injectJavaScript(`
            document.body.innerHTML = \`${updatedHtmlContent}\`;
            true;
          `);
        }
        
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
