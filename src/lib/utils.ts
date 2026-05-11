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
 */
export function normalizeStatus(status: string | null | undefined): string {
  if (!status) return "À vérifier";
  
  const normalized = String(status).trim().toLowerCase();
  
  if (normalized.includes("ouvert")) return "Ouvert";
  if (normalized.includes("fermé") || normalized.includes("ferme")) return "Fermé";
  if (normalized.includes("vérifier") || normalized.includes("attente")) return "À vérifier";
  if (normalized.includes("inactif") || normalized.includes("inactive")) return "Inactif";
  if (normalized.includes("terminé")) return "Ouvert";
  if (normalized.includes("refusé")) return "Fermé";
  if (normalized.includes("en cours")) return "À vérifier";
  if (normalized.includes("démarcher")) return "À vérifier";
  
  return status.trim();
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
