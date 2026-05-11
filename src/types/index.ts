// Types pour les restaurants
export type RestoStatus = "Ouvert" | "Fermé" | "À vérifier" | "Inactif" | string;

export interface Resto {
  nom: string;
  adresse: string;
  statut: RestoStatus;
}

export interface RestoWithCoords extends Resto {
  lat: number | null;
  lng: number | null;
  geocodeError?: string;
}

export interface GeocodeResult {
  lat: number;
  lng: number;
  formattedAddress: string;
}

export interface GeocodeResponse {
  success: boolean;
  result?: GeocodeResult;
  error?: string;
}

export interface GoogleSheetsResponse {
  success: boolean;
  restos?: Resto[];
  error?: string;
}

// Mapping des couleurs pour les marqueurs en fonction du statut
export const STATUS_COLORS: Record<RestoStatus, string> = {
  Ouvert: "#22c55e", // Vert
  Fermé: "#ef4444", // Rouge
  "À vérifier": "#f97316", // Orange
  Inactif: "#6b7280", // Gris
};

export const DEFAULT_MAP_CENTER = { lat: 46.603354, lng: 1.888334 }; // Centre de la France
export const DEFAULT_ZOOM = 6; // Zoom par défaut
