import { AxiosError } from 'axios';

interface BackendErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as BackendErrorResponse | undefined;

    if (data?.message) {
      return data.message;
    }

    if (data?.errors) {
      const firstKey = Object.keys(data.errors)[0];
      if (firstKey && data.errors[firstKey]?.[0]) {
        return data.errors[firstKey][0];
      }
    }

    switch (error.response?.status) {
      case 401:
        return 'Session expirée. Veuillez vous reconnecter.';
      case 403:
        return 'Accès non autorisé.';
      case 404:
        return 'Ressource introuvable.';
      case 422:
        return 'Données invalides. Veuillez vérifier vos informations.';
      case 429:
        return 'Trop de requêtes. Veuillez patienter.';
      case 500:
        return 'Erreur serveur. Veuillez réessayer.';
      default:
        return 'Une erreur est survenue.';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Une erreur inattendue est survenue.';
}
