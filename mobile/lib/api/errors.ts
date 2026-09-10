import { AxiosError } from 'axios';

interface BackendErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as BackendErrorResponse | undefined;

    // Log full error details to console for debugging
    console.error('[API Error Details]', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });

    if (data?.message) {
      return data.message;
    }

    if (data?.errors) {
      const firstKey = Object.keys(data.errors)[0];
      if (firstKey && data.errors[firstKey]?.[0]) {
        return `${firstKey}: ${data.errors[firstKey][0]}`;
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
        return `Une erreur est survenue (HTTP ${error.response?.status || 'network'}).`;
    }
  }

  if (error instanceof Error) {
    console.error('[Unhandled Error]', error);
    return error.message;
  }

  console.error('[Unknown Error]', error);
  return 'Une erreur inattendue est survenue.';
}
