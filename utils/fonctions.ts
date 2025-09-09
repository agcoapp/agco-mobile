export const cleanCodeFormulaire = (code: string) => {
    if (!code) return 'Non spécifié';
    return code.replace(/^N°/, '').trim();
  };
