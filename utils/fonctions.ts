import * as ImageManipulator from 'expo-image-manipulator';
import { Image } from 'react-native';

export const cleanCodeFormulaire = (code: string) => {
    if (!code) return 'Non spécifié';
    return code.replace(/^N°/, '').trim();
  };

// Helper function to extract first name from full name
export const extractFirstName = (fullName: string): string => {
  if (!fullName) return '';
  const parts = fullName.split(' ');
  return parts[0] || '';
};

// Helper function to extract last name from full name
export const extractLastName = (fullName: string): string => {
  if (!fullName) return '';
  const parts = fullName.split(' ');
  return parts.slice(1).join(' ') || parts[0] || '';
};

// Interface pour les données normalisées
export interface NormalizedMemberData {
  donneesSnapshot: {
    nom: string;
    prenoms: string;
    telephone: string;
    profession: string;
    date_naissance: string;
    lieu_naissance: string;
    adresse: string;
    ville_residence: string;
    selfie_photo_url: string;
    signature_url: string;
    employeur_ecole: string;
    numero_carte_consulaire: string;
    date_emission_piece: string;
    date_entree_congo: string;
    commentaire: string;
    nom_conjoint: string;
    prenom_conjoint: string;
    nombre_enfants: number;
  };
  numeroAdhesion: string;
  email: string | null;
  codeFormulaire: string;
  statutAdhesion: string;
}

// Fonction pour normaliser les données des membres
export function normalizeMemberData(member: any): NormalizedMemberData {
  console.log("🔧 normalizeMemberData called with member:", JSON.stringify(member, null, 2));
  
  // Handle different data structures
  let donneesSnapshot: any = {};
  let telephone = '';
  let numeroAdhesion = '';

  // Check if it's an admin member (type: "ADMIN_PERSONNEL")
  if (member.type === "ADMIN_PERSONNEL" && member.donnees_snapshot) {
    console.log("✅ Processing ADMIN_PERSONNEL member");
    // Admin member structure
    donneesSnapshot = member.donnees_snapshot;
    telephone = member.utilisateur?.telephone || donneesSnapshot.telephone || '';
    numeroAdhesion = member.utilisateur?.numero_adhesion || '';
  }
  // Priority 1: formulaire_actuel.donnees_snapshot (most complete data for regular members)
  else if (member.formulaire_actuel?.donnees_snapshot) {
    console.log("✅ Processing member with formulaire_actuel.donnees_snapshot");
    donneesSnapshot = member.formulaire_actuel.donnees_snapshot;
    telephone = member.telephone || donneesSnapshot.telephone || '';
    numeroAdhesion = member.numero_adhesion || member.code_formulaire || '';
  }
  // Priority 2: direct donnees_snapshot
  else if (member.donnees_snapshot) {
    console.log("✅ Processing member with direct donnees_snapshot");
    donneesSnapshot = member.donnees_snapshot;
    telephone = member.telephone || donneesSnapshot.telephone || '';
    numeroAdhesion = member.numero_adhesion || member.code_formulaire || '';
  }
  // Priority 3: direct member properties (from member directory)
  else {
    console.log("⚠️ Using fallback: direct member properties");
    // Map direct member properties to snapshot structure
    donneesSnapshot = {
      nom: member.nom || extractLastName(member.nom_complet) || '',
      prenoms: member.prenoms || extractFirstName(member.nom_complet) || '',
      telephone: member.telephone || '',
      profession: member.profession || 'Membre',
      date_naissance: member.date_naissance || '',
      lieu_naissance: member.lieu_naissance || '',
      adresse: member.adresse || '',
      ville_residence: member.ville_residence || '',
      selfie_photo_url: member.selfie_photo_url || member.photo_profil_url || '',
      signature_url: member.signature_url || '',
      employeur_ecole: member.employeur_ecole || '',
      numero_carte_consulaire: member.numero_carte_consulaire || '',
      date_emission_piece: member.date_emission_piece || '',
      date_entree_congo: member.date_entree_congo || '',
      commentaire: member.commentaire || '',
      nom_conjoint: member.nom_conjoint || '',
      prenom_conjoint: member.prenom_conjoint || '',
      nombre_enfants: member.nombre_enfants || 0,
    };
    telephone = member.telephone || '';
    numeroAdhesion = member.numero_adhesion || member.code_formulaire || '';
  }

  // Debug: Log donneesSnapshot at this point
  console.log("🔍 donneesSnapshot before normalization:", JSON.stringify(donneesSnapshot, null, 2));

  // Ensure all required fields have default values
  const normalizedSnapshot = {
    nom: donneesSnapshot.nom || '',
    prenoms: donneesSnapshot.prenoms || '',
    telephone: telephone || donneesSnapshot.telephone || '',
    profession: donneesSnapshot.profession || 'Membre',
    date_naissance: donneesSnapshot.date_naissance || '',
    lieu_naissance: donneesSnapshot.lieu_naissance || '',
    adresse: donneesSnapshot.adresse || '',
    ville_residence: donneesSnapshot.ville_residence || '',
    // For admin members, use multiple sources for photo URL
    selfie_photo_url: donneesSnapshot.selfie_photo_url || 
                     donneesSnapshot.photo_profil_url || 
                     member.utilisateur?.selfie_photo_url || 
                     member.utilisateur?.photo_profil_url || 
                     '',
    // For admin members, use multiple sources for signature URL  
    signature_url: donneesSnapshot.signature_url || 
                  member.utilisateur?.signature_url || 
                  '',
    employeur_ecole: donneesSnapshot.employeur_ecole || '',
    numero_carte_consulaire: donneesSnapshot.numero_carte_consulaire || '',
    date_emission_piece: donneesSnapshot.date_emission_piece || '',
    date_entree_congo: donneesSnapshot.date_entree_congo || '',
    commentaire: donneesSnapshot.commentaire || '',
    nom_conjoint: donneesSnapshot.nom_conjoint || '',
    prenom_conjoint: donneesSnapshot.prenom_conjoint || '',
    nombre_enfants: donneesSnapshot.nombre_enfants || 0,
  };

  const result = {
    donneesSnapshot: normalizedSnapshot,
    numeroAdhesion: cleanCodeFormulaire(numeroAdhesion),
    email: member.email || null,
    codeFormulaire: member.code_formulaire || '',
    statutAdhesion: member.statut || member.statut_adhesion || 'EN_ATTENTE'
  };
  
  console.log("🔧 normalizeMemberData result:", JSON.stringify(result, null, 2));
  
  return result;
}

export const convertImageToBase64WithTransparency = async (
  imageUrl: string,
  maxWidth: number,
  maxHeight: number,
  quality: number = 0.8,
  preserveTransparency: boolean = false
): Promise<string> => {
  try {
    return new Promise((resolve, reject) => {
      Image.getSize(
        imageUrl,
        (origWidth, origHeight) => {
          const scale = Math.min(maxWidth / origWidth, maxHeight / origHeight);
          const newWidth = Math.round(origWidth * scale);
          const newHeight = Math.round(origHeight * scale);

          ImageManipulator.manipulateAsync(
            imageUrl,
            [{ resize: { width: newWidth, height: newHeight } }],
            {
              compress: quality,
              format: preserveTransparency ? ImageManipulator.SaveFormat.PNG : ImageManipulator.SaveFormat.JPEG,
              base64: true,
            }
          ).then(processed => {
            if (processed.base64) {
              const format = preserveTransparency ? 'png' : 'jpeg';
              resolve(`data:image/${format};base64,${processed.base64}`);
            } else {
              reject(new Error('Failed to generate base64'));
            }
          }).catch(reject);
        },
        reject
      );
    });
  } catch (error) {
    console.error('Error in image conversion:', error);
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  }
};

export const convertImageToBase64 = async (imageUrl: string, maxWidth: number, maxHeight: number, quality: number = 0.8): Promise<string> => {
  return await convertImageToBase64WithTransparency(imageUrl, maxWidth, maxHeight, quality, false);
};
  