/**
 * Hook personnalisé pour le géocodage des adresses
 * Utilise l'endpoint API côté serveur pour ne pas exposer la clé API
 */

import { useState, useCallback, useRef } from "react";
import { Resto, RestoWithCoords, GeocodeResponse } from "@/types";

export interface UseGeocodeResult {
  restosWithCoords: RestoWithCoords[];
  isLoading: boolean;
  error: string | null;
  geocodeResto: (resto: Resto) => Promise<void>;
  geocodeAll: (restos: Resto[]) => Promise<void>;
}

/**
 * Géocode une adresse via l'API serveur
 */
async function geocodeSingleAddress(
  address: string,
): Promise<{ lat: number; lng: number } | null> {
  try {
    const response = await fetch(
      `/api/geocode?address=${encodeURIComponent(address)}`,
    );
    const data: GeocodeResponse = await response.json();

    if (!data.success || !data.result) {
      return null;
    }

    return {
      lat: data.result.lat,
      lng: data.result.lng,
    };
  } catch {
    return null;
  }
}

export function useGeocode(initialRestos: Resto[] = []): UseGeocodeResult {
  const [restosWithCoords, setRestosWithCoords] = useState<RestoWithCoords[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cache local pour éviter de re-géocoder la même adresse (stable via useRef)
  const addressCache = useRef(
    new Map<string, { lat: number; lng: number } | null>(),
  );

  const geocodeResto = useCallback(async (resto: Resto) => {
    setIsLoading(true);
    setError(null);

    try {
      // Vérifier le cache
      if (addressCache.current.has(resto.adresse)) {
        const cached = addressCache.current.get(resto.adresse);
        setRestosWithCoords((prev) => {
          const existingIndex = prev.findIndex(
            (r) => r.adresse === resto.adresse,
          );
          if (existingIndex !== -1) {
            const updated = [...prev];
            updated[existingIndex] = {
              ...resto,
              lat: cached?.lat ?? null,
              lng: cached?.lng ?? null,
              geocodeError: cached === null ? "Adresse non trouvée" : undefined,
            };
            return updated;
          }
          return [
            ...prev,
            {
              ...resto,
              lat: cached?.lat ?? null,
              lng: cached?.lng ?? null,
              geocodeError: cached === null ? "Adresse non trouvée" : undefined,
            },
          ];
        });
        return;
      }

      // Géocoder via API
      const coords = await geocodeSingleAddress(resto.adresse);
      addressCache.current.set(resto.adresse, coords);

      setRestosWithCoords((prev) => {
        const existingIndex = prev.findIndex(
          (r) => r.adresse === resto.adresse,
        );
        if (existingIndex !== -1) {
          const updated = [...prev];
          updated[existingIndex] = {
            ...resto,
            lat: coords?.lat ?? null,
            lng: coords?.lng ?? null,
            geocodeError: coords === null ? "Adresse non trouvée" : undefined,
          };
          return updated;
        }
        return [
          ...prev,
          {
            ...resto,
            lat: coords?.lat ?? null,
            lng: coords?.lng ?? null,
            geocodeError: coords === null ? "Adresse non trouvée" : undefined,
          },
        ];
      });
    } catch (err) {
      setError("Erreur lors du géocodage");
      setRestosWithCoords((prev) => [
        ...prev,
        {
          ...resto,
          lat: null,
          lng: null,
          geocodeError: "Erreur de géocodage",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const geocodeAll = useCallback(async (restos: Resto[]) => {
    setIsLoading(true);
    setError(null);

    try {
      // Initialiser avec tous les restaurants (sans coords)
      const initial: RestoWithCoords[] = restos.map((r) => ({
        ...r,
        lat: null,
        lng: null,
      }));
      setRestosWithCoords(initial);

      // Géocoder chaque restaurant
      const promises = restos.map(async (resto) => {
        if (addressCache.current.has(resto.adresse)) {
          const cached = addressCache.current.get(resto.adresse);
          return {
            ...resto,
            lat: cached?.lat ?? null,
            lng: cached?.lng ?? null,
            geocodeError: cached === null ? "Adresse non trouvée" : undefined,
          };
        }

        const coords = await geocodeSingleAddress(resto.adresse);
        addressCache.current.set(resto.adresse, coords);

        return {
          ...resto,
          lat: coords?.lat ?? null,
          lng: coords?.lng ?? null,
          geocodeError: coords === null ? "Adresse non trouvée" : undefined,
        };
      });

      const results = await Promise.all(promises);
      setRestosWithCoords(results);
    } catch (err) {
      setError("Erreur lors du géocodage des adresses");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    restosWithCoords,
    isLoading,
    error,
    geocodeResto,
    geocodeAll,
  };
}
