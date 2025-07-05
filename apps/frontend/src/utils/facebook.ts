/**
 * Utilitaire pour vérifier si l'authentification Facebook est activée
 */
export const isFacebookAuthEnabled = (): boolean => {
  return process.env.NEXT_PUBLIC_FACEBOOK_AUTH_ENABLED === 'true';
};

/**
 * Obtenir l'ID de l'application Facebook
 */
export const getFacebookAppId = (): string | undefined => {
  return process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
};
