// Constantes pour l'application

// Timeout pour les requêtes API (en ms)
export const API_TIMEOUT = 10000;

// Zoom par défaut de la carte
export const DEFAULT_ZOOM = 6;

// Messages d'erreur
export const ERROR_MESSAGES = {
  GEOCODING_FAILED: "Impossible de trouver cette adresse sur Google Maps",
  SHEET_FETCH_FAILED:
    "Impossible de récupérer les données depuis la feuille de calcul",
  NO_RESTOS: "Aucun restaurant trouvé",
} as const;
