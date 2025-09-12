// Service API pour React Native avec AsyncStorage
// Basé sur l'API SGM Backend documentée
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError, AxiosInstance } from 'axios';

const API_BASE_URL = "https://sgm-backend-production.up.railway.app";

export interface User {
  id: number;
  prenoms: string;
  nom: string;
  email: string;
  telephone: string;
  nom_utilisateur: string;
  role: 'MEMBRE' | 'SECRETAIRE_GENERALE' | 'PRESIDENT';
  statut: 'EN_ATTENTE' | 'APPROUVE' | 'REJETE';
  a_soumis_formulaire: boolean;
  est_actif: boolean;
  selfie_photo_url?: string;
}

// Interface pour la réponse complète de getUserStatus
export interface UserStatusResponse {
  authentifie: boolean;
  utilisateur: {
    id: number;
    numero_adhesion: string | null;
    nom_utilisateur: string;
    prenoms: string;
    nom: string;
    nom_complet: string;
    email: string | null;
    telephone: string;
    photo_profil_url: string | null;
    date_naissance: string;
    lieu_naissance: string;
    adresse: string;
    profession: string;
    ville_residence: string;
    date_entree_congo: string;
    employeur_ecole: string;
    numero_carte_consulaire: string;
    date_emission_piece: string;
    selfie_photo_url: string | null;
    signature_url: string | null;
    commentaire: string;
    carte_recto_url: string | null;
    carte_verso_url: string | null;
    carte_generee_le: string | null;
    carte_generee_par: number | null;
    prenom_conjoint: string;
    nom_conjoint: string;
    nombre_enfants: number;
    role: 'MEMBRE' | 'SECRETAIRE_GENERALE' | 'PRESIDENT';
    statut: 'EN_ATTENTE' | 'APPROUVE' | 'REJETE';
    code_formulaire: string | null;
    url_qr_code: string | null;
    carte_emise_le: string | null;
    raison_rejet: string | null;
    rejete_le: string | null;
    rejete_par: number | null;
    doit_changer_mot_passe: boolean;
    a_change_mot_passe_temporaire: boolean;
    a_paye: boolean;
    a_soumis_formulaire: boolean;
    derniere_connexion: string;
    est_actif: boolean;
    desactive_le: string | null;
    desactive_par: number | null;
    raison_desactivation: string | null;
    cree_le: string;
    modifie_le: string;
  };
  doit_changer_mot_passe: boolean;
  doit_soumettre_formulaire: boolean;
  statut_formulaire: {
    soumis: boolean;
    statut: 'EN_ATTENTE' | 'APPROUVE' | 'REJETE';
    code_formulaire: string | null;
    carte_emise_le: string | null;
    raison_rejet: string | null;
    rejete_le: string | null;
    rejete_par: number | null;
  };
  formulaire_adhesion: {
    id: number;
    numero_version: number;
    url_image_formulaire: string;
    donnees_snapshot: {
      nom: string;
      adresse: string;
      prenoms: string;
      telephone: string;
      profession: string;
      commentaire: string;
      nom_conjoint: string;
      signature_url: string;
      date_naissance: string;
      lieu_naissance: string;
      nombre_enfants: number;
      employeur_ecole: string;
      prenom_conjoint: string;
      ville_residence: string;
      selfie_photo_url: string;
      date_entree_congo: string;
      date_emission_piece: string;
      url_image_formulaire: string;
      numero_carte_consulaire: string;
    };
    est_version_active: boolean;
    cree_le: string;
  };
  prochaine_action: string;
  compte_actif: boolean;
  images: {
    photo_profil: string | null;
    selfie_photo: string | null;
    signature: string | null;
    carte_membre: {
      recto: string;
      verso: string;
      generee_le: string;
      generee_par: number;
    };
    formulaire_pdf: string;
  };
}

// Nouvelle interface pour la réponse complète de getUserProfile
export interface UserProfileResponse {
  authentifie: boolean;
  utilisateur: {
    id: number;
    nom_utilisateur: string;
    nom_complet: string;
    role: 'MEMBRE' | 'SECRETAIRE_GENERALE' | 'PRESIDENT';
    statut: 'EN_ATTENTE' | 'APPROUVE' | 'REJETE';
    est_actif: boolean;
  };
  doit_changer_mot_passe: boolean;
  doit_soumettre_formulaire: boolean;
  statut_formulaire: {
    soumis: boolean;
    statut: 'EN_ATTENTE' | 'APPROUVE' | 'REJETE';
    code_formulaire: string | null;
    carte_emise_le: string | null;
    raison_rejet: string | null;
    rejete_le: string | null;
    rejete_par: string | null;
  };
  prochaine_action: string;
  compte_actif: boolean;
}

export interface LoginRequest {
  nom_utilisateur: string;
  mot_passe: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  utilisateur: {
    nom_utilisateur: string;
    role: string;
    doit_changer_mot_passe: boolean;
  };
}

export interface AdhesionRequest {
  prenoms: string;
  nom: string;
  email: string;
  telephone: string;
  adresse?: string;
  date_naissance: string;
  lieu_naissance: string;
  profession: string;
  ville_residence: string;
  date_entree_congo: string;
  employeur_ecole: string;
  type_piece_identite: 'PASSEPORT' | 'CNI' | 'CARTE_SEJOUR';
  numero_piece_identite: string;
  date_emission_piece: string;
  id_front_photo: string;
  id_back_photo: string;
  selfie_photo: string;
}

export interface NewMemberRequest {
  prenoms: string;
  nom: string;
  a_paye: boolean;
  telephone?: string | null;
}

export interface ChangePasswordRequest {
  ancien_mot_passe: string;
  nouveau_mot_passe: string;
  confirmer_mot_passe: string;
}

export interface TemporaryPasswordChangeRequest {
  nouveau_mot_passe: string;
  email: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirmRequest {
  token: string;
  nouveau_mot_passe: string;
}

export interface ApproveFormRequest {
  id_utilisateur: number;
  commentaire?: string;
  url_formulaire_final?: string;
  carte_recto_url?: string;
  carte_verso_url?: string;
}

export interface RejectFormRequest {
  id_utilisateur: number;
  raison: string;
}

export interface Pagination {
  page: number;
  limite: number;
  total: number;
  pages_total: number;
}

export interface ErrorResponse {
  erreur: string;
  code?: string;
  details?: string;
}


// Interfaces pour les catégories de textes officiels
export interface CreerCategorieTexteOfficielRequest {
  nom: string;
  description?: string;
}

export interface MettreAJourCategorieTexteOfficielRequest {
  nom?: string;
  description?: string;
  est_actif?: boolean;
}

export interface ToggleCategorieTexteOfficielRequest {
  est_actif: boolean;
}

export interface CategorieTexteOfficiel {
  id: number;
  nom: string;
  description?: string;
  est_actif: boolean;
  cree_le: string;
  modifie_le?: string;
  createur?: {
    nom_complet: string;
    nom_utilisateur: string;
  };
  nombre_textes?: number;
}

export interface CategorieTexteOfficielResponse {
  message: string;
  categorie: CategorieTexteOfficiel;
}

export interface ListeCategoriesTexteOfficielResponse {
  message: string;
  donnees: {
    categories: CategorieTexteOfficiel[];
    pagination: Pagination;
  };
}

export interface CategorieTexteOfficielDetailsResponse {
  message: string;
  categorie: CategorieTexteOfficiel & {
    statistiques?: {
      nombre_total_textes: number;
      derniers_textes: Array<{
        id: number;
        titre: string;
        description?: string;
        telecharge_le: string;
        est_actif: boolean;
      }>;
    };
  };
}

export interface CategoriesTexteOfficielStatistiquesResponse {
  message: string;
  statistiques: {
    total_categories: number;
    categories_actives: number;
    categories_inactives: number;
    categories_avec_textes: number;
    categories_sans_textes: number;
    top_categories: Array<{
      id: number;
      nom: string;
      description?: string;
      nombre_textes: number;
    }>;
  };
}


// Nouvelles interfaces pour les textes officiels
export interface CreerTexteOfficielRequest {
  titre: string;
  description?: string;
  id_categorie: number;
  url_cloudinary: string;
  cloudinary_id: string;
  taille_fichier?: number;
  nom_fichier_original: string;
}

export interface MettreAJourTexteOfficielRequest {
  titre?: string;
  description?: string;
  est_actif?: boolean;
}

export interface TexteOfficiel {
  id: number;
  titre: string;
  description?: string;
  categorie: {
    id: number;
    nom: string;
    description?: string;
  };
  url_cloudinary: string;
  taille_fichier?: number;
  nom_fichier_original: string;
  telecharge_le?: string;
  modifie_le?: string;
  telecharge_par?: {
    prenoms: string;
    nom: string;
    role: string;
  };
}

export interface TexteOfficielResponse {
  message: string;
  texte_officiel: TexteOfficiel;
}

export interface ListeTextesOfficielsResponse {
  message: string;
  documents: TexteOfficiel[];
  pagination: Pagination;
}

export interface StatistiquesTextesOfficielsResponse {
  message: string;
  statistiques: {
    total_documents_actifs: number;
    total_documents_inactifs: number;
    par_type: Array<{
      type_document: string;
      type_document_label: string;
      count: number;
    }>;
  };
}

// Nouvelles interfaces pour les adhésions publiques
export interface AdhesionStatusResponse {
  trouve: boolean;
  demande?: {
    reference: string;
    nom_complet: string;
    statut: string;
    date_soumission: string;
  };
  message?: string;
}

export interface AdhesionSubmitResponse {
  success: boolean;
  message: string;
  reference: string;
  numero_fiche: string;
}

export interface AdhesionSchemaResponse {
  message: string;
  schema: any;
  workflow_info: {
    version: string;
    pdf_generation: string;
    required_field: string;
  };
}

export interface RejectionDetailsResponse {
  rejet: {
    raison: string;
    date_rejet: string;
    peut_resoumis: boolean;
  };
}

export interface ResubmitAdhesionResponse {
  message: string;
  adhesion: {
    id: number;
    nom_complet: string;
    telephone: string;
    statut: string;
    reference_temporaire: string;
    date_resoumission: string;
    url_fiche_adhesion: string;
  };
  prochaines_etapes: string[];
}

// Nouvelles interfaces pour la modification de formulaires
export interface ModifierFormulaireRequest {
  id_utilisateur: number;
  modifications: {
    prenoms?: string;
    nom?: string;
    telephone?: string;
    email?: string;
    adresse?: string;
    signature_membre_url?: string;
  };
}

// Nouvelles interfaces pour les nouveaux utilisateurs credentials
export interface UtilisateurCredentials {
  id: number;
  nom_complet: string;
  nom_utilisateur: string;
  mot_passe_temporaire: string;
  telephone?: string;
  statut: string;
  doit_changer_mot_passe: boolean;
  a_soumis_formulaire: boolean;
  statut_connexion: string;
  date_creation: string;
}

export interface NouveauxUtilisateursCredentialsResponse {
  message: string;
  donnees: {
    utilisateurs: UtilisateurCredentials[];
    pagination: Pagination;
    avertissement_securite: string;
  };
}

// Nouvelles interfaces pour les méthodes manquantes
export interface MarquerPayeRequest {
  id_utilisateur: number;
}

export interface MarquerPayeResponse {
  message: string;
}

export interface SupprimerMotPasseTemporaireRequest {
  id_utilisateur: number;
}

export interface SupprimerMotPasseTemporaireResponse {
  message: string;
  utilisateur: {
    id: number;
    nom_complet: string;
    nom_utilisateur: string;
  };
  action: string;
}

export interface PresidentSignatureResponse {
  signature_url: string;
  nom_president: string;
}

export interface AnnuaireMembre {
  id: number;
  numero_adhesion: string;
  nom_complet: string;
  prenoms: string;
  nom: string;
  adresse: string;
  telephone: string;
  email: string;
  profession: string;
  ville_residence: string;
  statut_adhesion: string;
}

export interface AnnuaireResponse {
  message: string;
  donnees: {
    membres: AnnuaireMembre[];
    pagination: Pagination;
  };
}

export interface CreerIdentifiantsRequest {
  id_utilisateur: number;
}

// Interfaces pour les formulaires d'administrateurs
export interface AdminFormulairePersonnelRequest {
  prenoms: string;
  nom: string;
  date_naissance: string;
  lieu_naissance: string;
  adresse: string;
  profession: string;
  ville_residence: string;
  date_entree_congo: string;
  employeur_ecole: string;
  telephone: string;
  url_image_formulaire: string;
  numero_carte_consulaire?: string;
  email?: string;
  signature_url?: string;
}

export interface AdminFormulairePersonnelResponse {
  message: string;
  formulaire: {
    id: number;
    type: string;
    statut: 'EN_ATTENTE' | 'APPROUVE' | 'REJETE';
    date_soumission: string;
    url_image_formulaire: string;
    donnees_snapshot: any;
  };
}

export interface AdminFormulaireStatutResponse {
  message: string;
  formulaire: {
    id: number;
    type: string;
    statut: 'EN_ATTENTE' | 'APPROUVE' | 'REJETE';
    date_soumission: string;
    url_image_formulaire: string;
    donnees_snapshot: any;
    raison_rejet?: string;
    date_validation?: string;
    valide_par?: string;
  } | null;
}

export interface AdminFormulaireSchemaResponse {
  message: string;
  schema: {
    champs_requis: string[];
    champs_optionnels: string[];
    exemples: any;
    regles_validation: any;
  };
}

export interface SecretaryAdminFormulairesResponse {
  message: string;
  donnees: {
    formulaires: Array<{
      id: number;
      type: string;
      statut: 'EN_ATTENTE' | 'APPROUVE' | 'REJETE';
      date_soumission: string;
      url_image_formulaire: string;
      donnees_snapshot: any;
      utilisateur: {
        id: number;
        nom_utilisateur: string;
        nom_complet: string;
        role: string;
      };
      raison_rejet?: string;
      date_validation?: string;
      valide_par?: string;
    }>;
    pagination: Pagination;
  };
}

export interface ApproveAdminFormulaireRequest {
  id_formulaire: number;
  commentaire?: string;
}

export interface ApproveAdminFormulaireResponse {
  message: string;
  formulaire: {
    id: number;
    statut: 'APPROUVE';
    date_validation: string;
    valide_par: string;
  };
}

export interface RejectAdminFormulaireRequest {
  id_formulaire: number;
  raison: string;
}

export interface RejectAdminFormulaireResponse {
  message: string;
  formulaire: {
    id: number;
    statut: 'REJETE';
    raison_rejet: string;
    date_validation: string;
    valide_par: string;
  };
}

export interface CreerIdentifiantsResponse {
  message: string;
}

export interface CloudinarySignatureResponse {
    signature: string;
    timestamp: number;
    api_key: string;
    cloud_name: string;
    upload_preset: string;
}

// Interface pour les formulaires d'adhésion des membres
export interface MemberAdhesionForm {
  id: number;
  nom_complet: string;
  statut: 'EN_ATTENTE' | 'APPROUVE' | 'REJETE';
  date_soumission: string;
  photos_urls: {
    id_front: string;
    id_back: string;
    selfie: string;
  };
}

class ApiService {
  private token: string | null = null;
  private axiosInstance: AxiosInstance;
  private requestQueue: Map<string, Promise<any>> = new Map();
  private lastRequestTime: Map<string, number> = new Map();
  private retryCount: Map<string, number> = new Map();

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000, // 30 secondes
    });

    // Intercepteur pour ajouter automatiquement le token d'authentification
    this.axiosInstance.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Intercepteur pour gérer les erreurs de réponse avec retry et throttling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const config = error.config;
        if (!config) {
          throw new Error('Configuration de requête manquante');
        }

        const requestKey = `${config.method}-${config.url}`;
        
        if (error.response?.status === 429) {
          // Erreur 429: Too Many Requests - attendre et réessayer
          const retryCount = this.retryCount.get(requestKey) || 0;
          const maxRetries = 3;
          
          if (retryCount < maxRetries) {
            // Calculer le délai d'attente exponentiel
            const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
            
            console.warn(`Rate limit atteint (429). Nouvelle tentative dans ${delay}ms (${retryCount + 1}/${maxRetries})`);
            
            // Attendre le délai
            await new Promise(resolve => setTimeout(resolve, delay));
            
            // Incrémenter le compteur de tentatives
            this.retryCount.set(requestKey, retryCount + 1);
            
            // Réessayer la requête
            return this.axiosInstance.request(config);
          } else {
            // Nombre maximum de tentatives atteint
            this.retryCount.delete(requestKey);
            throw new Error('Limite de taux dépassée après plusieurs tentatives. Veuillez réessayer plus tard.');
          }
        } else if (error.response) {
          // Le serveur a répondu avec un code d'erreur
          const errorData = error.response.data as ErrorResponse;
          
          // Gestion spécifique des erreurs HTTP courantes
          if (error.response.status === 401) {
            throw new Error('Identifiants incorrects.');
          } else if (error.response.status === 403) {
            throw new Error('Accès refusé. Vous n\'avez pas les permissions nécessaires.');
          } else if (error.response.status === 404) {
            throw new Error('Service non trouvé. Veuillez contacter l\'administrateur.');
          } else if (error.response.status === 500) {
            throw new Error('Erreur interne du serveur. Veuillez réessayer plus tard.');
          } else {
            // Pour les autres codes d'erreur, utiliser le message du serveur ou un message générique
            throw new Error(errorData?.erreur || `Erreur ${error.response.status}: ${error.response.statusText}`);
          }
        } else if (error.request) {
          // La requête a été faite mais aucune réponse n'a été reçue
          throw new Error('Aucune réponse du serveur. Vérifiez votre connexion internet.');
        } else {
          // Erreur lors de la configuration de la requête
          throw new Error('Erreur de configuration de la requête: ' + error.message);
        }
      }
    );
  }

  // Gestion du token
  async setToken(token: string) {
    this.token = token;
    // Mettre à jour le header d'autorisation dans l'instance axios
    this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    await AsyncStorage.setItem('sgm_token', token);
  }

  async getToken(): Promise<string | null> {
    if (!this.token) {
      this.token = await AsyncStorage.getItem('sgm_token');
      // Mettre à jour le header si on récupère le token depuis AsyncStorage
      if (this.token) {
        this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
      }
    }
    return this.token;
  }

  async clearToken() {
    this.token = null;
    // Supprimer le header d'autorisation de l'instance axios
    delete this.axiosInstance.defaults.headers.common['Authorization'];
    await AsyncStorage.removeItem('sgm_token');
  }

  // Méthodes d'authentification
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.axiosInstance.post(`/api/auth/connexion`, credentials);
    await this.setToken(response.data.token);
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      if (this.token) {
        await this.axiosInstance.post(`/api/auth/deconnexion`);
        await AsyncStorage.multiRemove(['sgm_user', 'sgm_token']);
      }
    } catch (error) {
      console.warn('Erreur lors de la déconnexion:', error);
    } finally {
      await this.clearToken();
    }
  }

  async changePassword(request: ChangePasswordRequest): Promise<{ message: string }> {
    const response = await this.axiosInstance.post(`/api/auth/change-password`, request);
    return response.data;
  }

  async changeTemporaryPassword(request: TemporaryPasswordChangeRequest): Promise<{ message: string }> {
    const response = await this.axiosInstance.post(`/api/auth/change-temporary-password`, request);
    return response.data;
  }

  async requestPasswordReset(request: PasswordResetRequest): Promise<{ message: string }> {
    const response = await this.axiosInstance.post(`/api/membre/demander-reinitialisation`, request);
    return response.data;
  }

  async resetPassword(request: PasswordResetConfirmRequest): Promise<{ message: string }> {
    const response = await this.axiosInstance.post(`/api/membre/reinitialiser-mot-passe`, request);
    return response.data;
  }

  async verifyPasswordReset(token: string): Promise<{ message: string }> {
    const response = await this.axiosInstance.post(`/api/auth/verify-reset`, { token });
    return response.data;
  }

  async getUserProfile(): Promise<UserProfileResponse> {
    const response = await this.axiosInstance.get(`/api/auth/profil`);
    return response.data;
  }

  async getUserStatus(): Promise<UserStatusResponse> {
    const response = await this.axiosInstance.get(`/api/auth/statut`);
    return response.data;
  }

  // Méthodes pour les membres
  async getMemberAdhesionForm(): Promise<MemberAdhesionForm> {
    const response = await this.axiosInstance.get(`/api/membre/formulaire-adhesion`);
    return response.data;
  }

  async getMemberCard(): Promise<any> {
    const response = await this.axiosInstance.get(`/api/membre/carte-membre`);
    return response.data;
  }

  async downloadAdhesionForm(): Promise<Blob> {
    const response = await this.axiosInstance.get(`/api/membre/telecharger-formulaire`, { responseType: 'blob' });
    return response.data;
  }

  async downloadMemberCard(): Promise<Blob> {
    const response = await this.axiosInstance.get(`/api/membre/telecharger-carte`, { responseType: 'blob' });
    return response.data;
  }

  async getMemberDirectory(params?: {
    page?: number;
    limite?: number;
    recherche?: string;
  }): Promise<AnnuaireResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limite) searchParams.append('limite', params.limite.toString());
    if (params?.recherche) searchParams.append('recherche', params.recherche);

    const response = await this.axiosInstance.get(`/api/membre/annuaire?${searchParams}`);
    return response.data;
  }

  async getPresidentSignature(): Promise<PresidentSignatureResponse> {
    const response = await this.axiosInstance.get(`/api/membre/president-signature`);
    return response.data;
  }

  // Méthodes pour la secrétaire
  async getSecretaryDashboard(): Promise<any> {
    const response = await this.axiosInstance.get(`/api/secretaire/tableau-bord`);
    return response.data;
  }

  async createNewMember(request: NewMemberRequest): Promise<any> {
    const response = await this.axiosInstance.post(`/api/secretaire/creer-nouveau-membre`, request);
    return response.data;
  }

  async getMembers(params?: {
    statut?: string;
    a_paye?: boolean;
    a_soumis_formulaire?: boolean;
  }): Promise<{ membres: User[]; total: number }> {
    const searchParams = new URLSearchParams();
    if (params?.statut) searchParams.append('statut', params.statut);
    if (params?.a_paye !== undefined) searchParams.append('a_paye', params.a_paye.toString());
    if (params?.a_soumis_formulaire !== undefined) searchParams.append('a_soumis_formulaire', params.a_soumis_formulaire.toString());

    const requestKey = `GET-/api/secretaire/membres?${searchParams}`;
    
    return this.throttleRequest(requestKey, async () => {
      const response = await this.axiosInstance.get(`/api/secretaire/membres?${searchParams}`);
      return response.data;
    }, 2000); // Minimum 2 secondes entre les appels à getMembers
  }

  async getAdhesionForms(params?: { statut?: string }): Promise<any> {
    const searchParams = new URLSearchParams();
    if (params?.statut) searchParams.append('statut', params.statut);

    const response = await this.axiosInstance.get(`/api/secretaire/formulaires?${searchParams}`);
    return response.data;
  }

  // Méthode pour obtenir les détails d'un formulaire spécifique
  async getFormulaireDetails(idUtilisateur: number): Promise<any> {
    const response = await this.axiosInstance.get(`/api/secretaire/formulaire/${idUtilisateur}`);
    return response.data;
  }

  async approveForm(request: ApproveFormRequest): Promise<any> {
    const response = await this.axiosInstance.post(`/api/secretaire/approuver-formulaire`, request);
    return response.data;
  }

  async rejectForm(request: RejectFormRequest): Promise<any> {
    const response = await this.axiosInstance.post(`/api/secretaire/rejeter-formulaire`, request);
    return response.data;
  }

  async deleteForm(userId: number): Promise<any> {
    const response = await this.axiosInstance.delete(`/api/secretaire/supprimer-formulaire`, { data: { id_utilisateur: userId } });
    return response.data;
  }

  async getApprovedForms(page: number = 1, limite: number = 20): Promise<any> {
    const response = await this.axiosInstance.get(`/api/secretaire/formulaires-approuves?page=${page}&limite=${limite}`);
    return response.data;
  }

  async getApprovedMembers(page: number = 1, limite: number = 50, recherche?: string): Promise<any> {
    const searchParams = new URLSearchParams();
    searchParams.append('page', page.toString());
    searchParams.append('limite', limite.toString());
    if (recherche) searchParams.append('recherche', recherche);

    const response = await this.axiosInstance.get(`/api/secretaire/membres-approuves?${searchParams}`);
    return response.data;
  }

  async getMemberCards(page: number = 1, limite: number = 20): Promise<any> {
    const response = await this.axiosInstance.get(`/api/secretaire/cartes-membres?page=${page}&limite=${limite}`);
    return response.data;
  }

  async deactivateUser(userId: number, raison: string): Promise<any> {
    const response = await this.axiosInstance.post(`/api/secretaire/desactiver-utilisateur`, { id_utilisateur: userId, raison });
    return response.data;
  }

  async updatePresidentSignature(urlSignature: string, cloudinaryId: string): Promise<any> {
    const response = await this.axiosInstance.post(`/api/secretaire/mettre-a-jour-signature`, { url_signature: urlSignature, cloudinary_id: cloudinaryId });
    return response.data;
  }

  async creerNouveauMembre(memberData: NewMemberRequest): Promise<any> {
    const response = await this.axiosInstance.post(`/api/secretaire/creer-nouveau-membre`, memberData);
    return response.data;
  }

  async creerIdentifiants(request: CreerIdentifiantsRequest): Promise<CreerIdentifiantsResponse> {
    const response = await this.axiosInstance.post(`/api/secretaire/creer-identifiants`, request);
    return response.data;
  }

  async marquerMembrePaye(request: MarquerPayeRequest): Promise<MarquerPayeResponse> {
    const response = await this.axiosInstance.post(`/api/secretaire/marquer-paye`, request);
    return response.data;
  }

  async supprimerMotPasseTemporaire(request: SupprimerMotPasseTemporaireRequest): Promise<SupprimerMotPasseTemporaireResponse> {
    const response = await this.axiosInstance.delete(`/api/secretaire/supprimer-mot-passe-temporaire`, { data: request });
    return response.data;
  }

  // NOUVELLES MÉTHODES POUR LES CATÉGORIES DE TEXTES OFFICIELS
  async createCategorieTexteOfficiel(request: CreerCategorieTexteOfficielRequest): Promise<CategorieTexteOfficielResponse> {
    const response = await this.axiosInstance.post(`/api/categories-texte-officiel`, request);
    return response.data;
  }

  async getCategoriesTexteOfficiel(params?: {
    page?: number;
    limite?: number;
    recherche?: string;
    actif_seulement?: boolean;
  }): Promise<ListeCategoriesTexteOfficielResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limite) searchParams.append('limite', params.limite.toString());
    if (params?.recherche) searchParams.append('recherche', params.recherche);
    if (params?.actif_seulement !== undefined) searchParams.append('actif_seulement', params.actif_seulement.toString());

    const response = await this.axiosInstance.get(`/api/categories-texte-officiel?${searchParams}`);
    return response.data;
  }

  async getCategoriesTexteOfficielStatistiques(): Promise<CategoriesTexteOfficielStatistiquesResponse> {
    const response = await this.axiosInstance.get(`/api/categories-texte-officiel/statistiques`);
    return response.data;
  }

  async getCategorieTexteOfficiel(id: number): Promise<CategorieTexteOfficielDetailsResponse> {
    const response = await this.axiosInstance.get(`/api/categories-texte-officiel/${id}`);
    return response.data;
  }

  async updateCategorieTexteOfficiel(id: number, request: MettreAJourCategorieTexteOfficielRequest): Promise<CategorieTexteOfficielResponse> {
    const response = await this.axiosInstance.put(`/api/categories-texte-officiel/${id}`, request);
    return response.data;
  }

  async deleteCategorieTexteOfficiel(id: number): Promise<{ message: string; categorie_supprimee: { id: number; nom: string } }> {
    const response = await this.axiosInstance.delete(`/api/categories-texte-officiel/${id}`);
    return response.data;
  }

  async toggleCategorieTexteOfficiel(id: number, request: ToggleCategorieTexteOfficielRequest): Promise<{ message: string; categorie: { id: number; nom: string; est_actif: boolean; modifie_le: string } }> {
    const response = await this.axiosInstance.patch(`/api/categories-texte-officiel/${id}/toggle`, request);
    return response.data;
  }

  // NOUVELLES MÉTHODES POUR LES TEXTES OFFICIELS
  async createTexteOfficiel(request: CreerTexteOfficielRequest): Promise<TexteOfficielResponse> {
    const response = await this.axiosInstance.post(`/api/textes-officiels`, request);
    return response.data;
  }

  async getTextesOfficiels(params?: {
    id_categorie?: number;
    page?: number;
    limite?: number;
    recherche?: string;
  }): Promise<ListeTextesOfficielsResponse> {
    const searchParams = new URLSearchParams();
    if (params?.id_categorie) searchParams.append('id_categorie', params.id_categorie.toString());
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limite) searchParams.append('limite', params.limite.toString());
    if (params?.recherche) searchParams.append('recherche', params.recherche);

    const response = await this.axiosInstance.get(`/api/textes-officiels?${searchParams}`);
    return response.data;
  }

  async getTexteOfficiel(id: number): Promise<TexteOfficielResponse> {
    const response = await this.axiosInstance.get(`/api/textes-officiels/${id}`);
    return response.data;
  }

  async updateTexteOfficiel(id: number, request: MettreAJourTexteOfficielRequest): Promise<TexteOfficielResponse> {
    const response = await this.axiosInstance.put(`/api/textes-officiels/${id}`, request);
    return response.data;
  }

  async deleteTexteOfficiel(id: number): Promise<{ message: string }> {
    const response = await this.axiosInstance.delete(`/api/textes-officiels/${id}`);
    return response.data;
  }

  async getTextesOfficielsStatistiques(): Promise<StatistiquesTextesOfficielsResponse> {
    const response = await this.axiosInstance.get(`/api/textes-officiels/statistiques`);
    return response.data;
  }

  // NOUVELLES MÉTHODES POUR LES NOUVEAUX UTILISATEURS CREDENTIALS
  async getNouveauxUtilisateursCredentials(params?: {
    page?: number;
    limite?: number;
    inclure_mot_passe_change?: boolean;
  }): Promise<NouveauxUtilisateursCredentialsResponse> {
    // Vérifier que le token est présent
    if (!this.getToken()) {
      throw new Error('Token d\'authentification requis');
    }

    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limite) searchParams.append('limite', params.limite.toString());
    if (params?.inclure_mot_passe_change !== undefined) {
      searchParams.append('inclure_mot_passe_change', params.inclure_mot_passe_change.toString());
    }

    const response = await this.axiosInstance.get(`/api/secretaire/nouveaux-utilisateurs-credentials?${searchParams}`);
    return response.data;
  }

  // NOUVELLES MÉTHODES POUR LA MODIFICATION DE FORMULAIRES
  async modifierFormulaire(request: ModifierFormulaireRequest): Promise<any> {
    const response = await this.axiosInstance.put(`/api/secretaire/modifier-formulaire`, request);
    return response.data;
  }

  // Méthodes pour les adhésions publiques
  async submitAdhesion(data: Record<string, any>): Promise<AdhesionSubmitResponse> {
    // Pour JSON uniquement
    console.log('==> Données JSON:', data);
    
    const response = await this.axiosInstance.post(`/api/adhesion/soumettre`, data, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    return response.data;
  }

  async previewAdhesionTemplate(): Promise<string> {
    const response = await this.axiosInstance.get(`/api/adhesion/preview-template`);
    return response.data;
  }

  async testAdhesionPdf(): Promise<Blob> {
    const response = await this.axiosInstance.get(`/api/adhesion/test-pdf`, { responseType: 'blob' });
    return response.data;
  }

  async checkAdhesionStatus(telephone?: string, reference?: string): Promise<AdhesionStatusResponse> {
    const searchParams = new URLSearchParams();
    if (telephone) searchParams.append('telephone', telephone);
    if (reference) searchParams.append('reference', reference);

    const response = await this.axiosInstance.get(`/api/adhesion/statut?${searchParams}`);
    return response.data;
  }

  // Méthode pour obtenir le schéma du formulaire d'adhésion
  async getAdhesionSchema(): Promise<AdhesionSchemaResponse> {
    const response = await this.axiosInstance.get(`/api/adhesion/schema`);
    return response.data;
  }

  // Méthode pour resoumettre un formulaire après rejet
  async resubmitAdhesion(data: Record<string, any>): Promise<ResubmitAdhesionResponse> {
    const response = await this.axiosInstance.put(`/api/adhesion/resoumission`, data);
    return response.data;
  }

  // Méthode pour obtenir les détails du rejet
  async getRejectionDetails(telephone: string): Promise<RejectionDetailsResponse> {
    const response = await this.axiosInstance.get(`/api/adhesion/details-rejet?telephone=${telephone}`);
    return response.data;
  }

  // Méthodes utilitaires
  async checkHealth(): Promise<any> {
    const response = await this.axiosInstance.get(`/api/health`);
    return response.data;
  }

  // Méthode pour générer une signature Cloudinary
  async generateCloudinarySignature(params: {
    folder?: string;
    resource_type?: 'image' | 'video' | 'raw' | 'auto';
    format?: string;
    public_id?: string;
    transformation?: string;
  }): Promise<CloudinarySignatureResponse> {
    const searchParams = new URLSearchParams();
    if (params.public_id) searchParams.append('public_id', params.public_id);
    if (params.folder) searchParams.append('folder', params.folder);
    if (params.resource_type) searchParams.append('resource_type', params.resource_type);
    if (params.format) searchParams.append('format', params.format);
    if (params.transformation) searchParams.append('transformation', params.transformation);

    const response = await this.axiosInstance.get(`/api/signature?${searchParams}`);
    return response.data;
  }

  async checkDetailedHealth(): Promise<any> {
    const response = await this.axiosInstance.get(`/api/health/detailed`);
    return response.data;
  }

  // Méthodes pour l'enregistrement (dépréciées mais maintenues pour compatibilité)
  async registerMember(formData: FormData): Promise<any> {
    const response = await this.axiosInstance.post(`/api/registration`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
    return response.data;
  }

  async checkRegistrationStatus(telephone?: string, reference?: string): Promise<any> {
    const searchParams = new URLSearchParams();
    if (telephone) searchParams.append('telephone', telephone);
    if (reference) searchParams.append('reference', reference);

    const response = await this.axiosInstance.get(`/api/registration/status?${searchParams}`);
    return response.data;
  }

  // Vérification de l'authentification
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Vérification des rôles
  hasRole(role: string): boolean {
    // Cette méthode nécessiterait de décoder le JWT ou de faire un appel API
    // Pour l'instant, on retourne true si authentifié
    return this.isAuthenticated();
  }

  // Méthode pour gérer le throttling des requêtes
  private async throttleRequest<T>(
    key: string, 
    requestFn: () => Promise<T>, 
    minInterval: number = 1000
  ): Promise<T> {
    const now = Date.now();
    const lastRequest = this.lastRequestTime.get(key) || 0;
    const timeSinceLastRequest = now - lastRequest;

    if (timeSinceLastRequest < minInterval) {
      const delay = minInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    // Vérifier si une requête similaire est déjà en cours
    if (this.requestQueue.has(key)) {
      return this.requestQueue.get(key)!;
    }

    // Créer une nouvelle promesse pour cette requête
    const requestPromise = requestFn().finally(() => {
      this.requestQueue.delete(key);
      this.lastRequestTime.set(key, Date.now());
    });

    this.requestQueue.set(key, requestPromise);
    return requestPromise;
  }

  // Méthodes pour les formulaires d'administrateurs
  async submitAdminFormulairePersonnel(data: AdminFormulairePersonnelRequest): Promise<AdminFormulairePersonnelResponse> {
    const response = await this.axiosInstance.post('/api/admin/formulaire-personnel', data);
    return response.data;
  }

  async getAdminFormulairePersonnelStatut(): Promise<AdminFormulaireStatutResponse> {
    const response = await this.axiosInstance.get('/api/admin/formulaire-personnel/statut');
    return response.data;
  }

  async getAdminFormulairePersonnelSchema(): Promise<AdminFormulaireSchemaResponse> {
    const response = await this.axiosInstance.get('/api/admin/formulaire-personnel/schema');
    return response.data;
  }

  // Méthodes pour le secrétariat - gestion des formulaires d'administrateurs
  async getSecretaryAdminFormulaires(params?: {
    page?: number;
    limite?: number;
    filtre?: 'tous' | 'en_attente' | 'approuves' | 'rejetes';
    recherche?: string;
  }): Promise<SecretaryAdminFormulairesResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limite) searchParams.append('limite', params.limite.toString());
    if (params?.filtre) searchParams.append('filtre', params.filtre);
    if (params?.recherche) searchParams.append('recherche', params.recherche);

    const response = await this.axiosInstance.get(`/api/secretaire/formulaires-admin?${searchParams}`);
    return response.data;
  }

  async approveAdminFormulaire(data: ApproveAdminFormulaireRequest): Promise<ApproveAdminFormulaireResponse> {
    const response = await this.axiosInstance.post('/api/secretaire/approuver-formulaire-admin', data);
    return response.data;
  }

  async rejectAdminFormulaire(data: RejectAdminFormulaireRequest): Promise<RejectAdminFormulaireResponse> {
    const response = await this.axiosInstance.post('/api/secretaire/rejeter-formulaire-admin', data);
    return response.data;
  }
}

// Instance singleton
export const apiService = new ApiService();
