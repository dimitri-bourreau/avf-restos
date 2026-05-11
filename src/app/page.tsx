/**
 * Page principale de l'application
 * Affiche la carte en plein écran avec side nav et légende
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { Map } from "@/components/Map";
import { RestaurantListModal } from "@/components/RestaurantListModal";
import { LegendWithLink } from "@/components/LegendWithLink";
import { MissingRestos } from "@/components/MissingRestos";
import { useGeocode } from "@/hooks/useGeocode";
import type { Resto, RestoWithCoords } from "@/types";
import { filterRestosWithCoords } from "@/lib/utils";
import { ERROR_MESSAGES } from "@/lib/constants";

export default function Home() {
  const [restos, setRestos] = useState<Resto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    restosWithCoords,
    isLoading: isGeocoding,
    error: geocodeError,
    geocodeAll,
  } = useGeocode();

  // Récupérer les restaurants depuis l'API
  const fetchRestos = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/restos");
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || ERROR_MESSAGES.SHEET_FETCH_FAILED);
      }

      setRestos(data.restos || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : ERROR_MESSAGES.SHEET_FETCH_FAILED,
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Au montage, récupérer les restaurants et les géocoder
  useEffect(() => {
    fetchRestos();
  }, [fetchRestos]);

  // Quand les restaurants sont chargés, les géocoder
  useEffect(() => {
    if (restos.length > 0) {
      geocodeAll(restos);
    }
  }, [restos, geocodeAll]);

  // Filtrer les restaurants avec et sans coordonnées
  const { withCoords, withoutCoords } =
    filterRestosWithCoords(restosWithCoords);

  // État global de chargement
  const isLoadingGlobal = isLoading || isGeocoding;

  return (
    <div className="relative w-screen h-screen">
      {/* Carte en plein écran */}
      <Map restos={restosWithCoords} />

      {/* Bouton pour afficher la liste + modal */}
      <RestaurantListModal restos={restos} />

      {/* Légende + lien toujours visible */}
      <LegendWithLink />

      {/* Restaurants non géocodés */}
      {!isLoadingGlobal && withoutCoords.length > 0 && (
        <MissingRestos restos={withoutCoords} />
      )}

      {/* Messages d'erreur */}
      {(error || geocodeError) && (
        <div
          className="fixed top-4 left-4 bg-red-50 border border-red-200 rounded-lg p-4 max-w-xs z-30"
          role="alert"
          aria-live="assertive"
        >
          {error && <p className="text-red-700 font-medium">❌ {error}</p>}
          {geocodeError && (
            <p className="text-red-700 font-medium">⚠️ {geocodeError}</p>
          )}
        </div>
      )}

      {/* Chargement */}
      {isLoadingGlobal && (
        <div
          className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-30"
          role="status"
          aria-live="polite"
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des restaurants...</p>
          </div>
        </div>
      )}
    </div>
  );
}
