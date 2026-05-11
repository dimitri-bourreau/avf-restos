/**
 * Fonctions utilitaires générales
 */

import { RestoWithCoords } from "@/types";

/**
 * Nettoie une adresse pour le géocodage
 * Supprime les espaces multiples et normalise la casse
 */
export function cleanAddress(address: string): string {
  return address
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\n/g, " ");
}

/**
 * Vérifie si une adresse est valide (non vide)
 */
export function isValidAddress(address: string): boolean {
  return cleanAddress(address).length > 0;
}

/**
 * Normalise un statut pour correspondre aux valeurs attendues
 * Retourne directement les valeurs de la feuille : Terminé, En cours, A démarcher, Refusé
 */
export function normalizeStatus(status: string | null | undefined): string {
  if (!status) return "Refusé";
  
  const trimmed = String(status).trim();
  
  // Garder les statuts tels quels s'ils correspondent aux valeurs connues
  if (trimmed === "Terminé" || trimmed === "En cours" || trimmed === "A démarcher" || trimmed === "Refusé") {
    return trimmed;
  }
  
  // Fallback pour d'autres valeurs
  const normalized = trimmed.toLowerCase();
  if (normalized.includes("terminé")) return "Terminé";
  if (normalized.includes("cours")) return "En cours";
  if (normalized.includes("démarcher") || normalized.includes("demarcher")) return "A démarcher";
  if (normalized.includes("refusé") || normalized.includes("refuse")) return "Refusé";
  
  return trimmed;
}

/**
 * Filtre les restaurants avec des coordonnées valides
 */
export function filterRestosWithCoords(restos: RestoWithCoords[]): {
  withCoords: RestoWithCoords[];
  withoutCoords: RestoWithCoords[];
} {
  return {
    withCoords: restos.filter((r) => r.lat !== null && r.lng !== null),
    withoutCoords: restos.filter((r) => r.lat === null || r.lng === null),
  };
}

/**
 * Crée un cache simple en mémoire (pour éviter de re-géocoder la même adresse)
 */
export function createGeocodeCache() {
  const cache = new Map<string, { lat: number; lng: number }>();
  
  return {
    get: (address: string) => cache.get(cleanAddress(address)),
    set: (address: string, coords: { lat: number; lng: number }) => {
      cache.set(cleanAddress(address), coords);
    },
    clear: () => cache.clear(),
    has: (address: string) => cache.has(cleanAddress(address)),
  };
}

// Cache global pour le géocodage (instance unique)
export const geocodeCache = createGeocodeCache();
