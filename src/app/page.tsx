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
import type { Resto, RestoWithCoords, Niveau } from "@/types";
import { filterRestosWithCoords } from "@/lib/utils";
import { ERROR_MESSAGES } from "@/lib/constants";

export default function Home() {
  const [restos, setRestos] = useState<Resto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedNiveaux, setSelectedNiveaux] = useState<Niveau[]>([]);
  const [selectedResto, setSelectedResto] = useState<RestoWithCoords | null>(
    null,
  );

  const toggleNiveau = useCallback((niveau: Niveau) => {
    setSelectedNiveaux((prev) =>
      prev.includes(niveau)
        ? prev.filter((n) => n !== niveau)
        : [...prev, niveau],
    );
  }, []);

  const clearNiveaux = useCallback(() => setSelectedNiveaux([]), []);

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

  const handleSelectResto = useCallback(
    (resto: Resto) => {
      const found =
        restosWithCoords.find(
          (r) =>
            r.nom === resto.nom && r.sheetRowNumber === resto.sheetRowNumber,
        ) ?? null;
      setSelectedResto(found);
    },
    [restosWithCoords],
  );

  // Appliquer les filtres (statut + niveaux) pour la carte
  const filteredRestos = restosWithCoords.filter((r) => {
    if (selectedStatus && r.statut !== selectedStatus) return false;
    if (selectedNiveaux.length > 0) {
      if (r.niveau === null) return false;
      if (!selectedNiveaux.includes(r.niveau)) return false;
    }
    return true;
  });

  // État global de chargement
  const isLoadingGlobal = isLoading || isGeocoding;

  return (
    <div className="h-screen bg-[#0e983a] flex flex-col">
      {/* Titre */}
      <header className="px-4 pt-4 pb-3 sm:px-6 sm:pt-5 sm:pb-4 flex-shrink-0">
        <h1 className="text-white text-xl sm:text-2xl font-semibold">
          AVF - Suivi des signatures de la charte
        </h1>
      </header>

      {/* Bloc carte */}
      <div className="flex-1 relative overflow-hidden rounded-none sm:rounded-2xl sm:mx-4 sm:mb-4 min-h-0">
        <Map restos={filteredRestos} selectedResto={selectedResto} />

        <RestaurantListModal
          restos={restos}
          onSelectResto={handleSelectResto}
        />

        <LegendWithLink
          selectedStatus={selectedStatus}
          onStatusFilter={setSelectedStatus}
          selectedNiveaux={selectedNiveaux}
          onToggleNiveau={toggleNiveau}
          onClearNiveaux={clearNiveaux}
        />

        {!isLoadingGlobal && withoutCoords.length > 0 && (
          <div className="absolute top-4 right-4 z-20">
            <MissingRestos restos={withoutCoords} />
          </div>
        )}

        {(error || geocodeError) && (
          <div
            className="absolute top-4 left-4 bg-red-50 border border-red-200 rounded-lg p-4 max-w-xs z-30"
            role="alert"
            aria-live="assertive"
          >
            {error && <p className="text-red-700 font-medium">❌ {error}</p>}
            {geocodeError && (
              <p className="text-red-700 font-medium">⚠️ {geocodeError}</p>
            )}
          </div>
        )}

        {isLoadingGlobal && (
          <div
            className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-30"
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
    </div>
  );
}
