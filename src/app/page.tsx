/**
 * Page principale de l'application
 * Récupère les restaurants, les géocode et affiche la carte
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { Map } from "@/components/Map";
import { MissingRestos } from "@/components/MissingRestos";
import { useGeocode } from "@/hooks/useGeocode";
import type { Resto, RestoWithCoords } from "@/types";
import { filterRestosWithCoords, cleanAddress } from "@/lib/utils";
import { ERROR_MESSAGES } from "@/lib/constants";

export default function Home() {
  const [restos, setRestos] = useState<Resto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedResto, setSelectedResto] = useState<RestoWithCoords | null>(null);

  const { restosWithCoords, isLoading: isGeocoding, error: geocodeError, geocodeAll } = useGeocode();

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
        err instanceof Error ? err.message : ERROR_MESSAGES.SHEET_FETCH_FAILED
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

  // Gérer le clic sur un marqueur
  const handleMarkerClick = useCallback((resto: RestoWithCoords) => {
    setSelectedResto(resto);
  }, []);

  // Filtrer les restaurants avec et sans coordonnées
  const { withCoords, withoutCoords } = filterRestosWithCoords(restosWithCoords);

  // État global de chargement
  const isLoadingGlobal = isLoading || isGeocoding;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Titre et description */}
      <section aria-labelledby="page-title">
        <h2 id="page-title" className="sr-only">
          Liste des restaurants
        </h2>
        <p className="text-gray-600 max-w-2xl">
          Cette carte affiche tous les restaurants listés dans la feuille de calcul.
          Les marqueurs sont colorés en fonction de leur statut.
        </p>
      </section>

      {/* Messages d'erreur */}
      {error && (
        <div
          className="bg-red-50 border border-red-200 rounded-lg p-4"
          role="alert"
          aria-live="assertive"
        >
          <p className="text-red-700 font-medium">❌ {error}</p>
        </div>
      )}

      {geocodeError && (
        <div
          className="bg-amber-50 border border-amber-200 rounded-lg p-4"
          role="alert"
          aria-live="polite"
        >
          <p className="text-amber-700">⚠️ {geocodeError}</p>
        </div>
      )}

      {/* Chargement */}
      {isLoadingGlobal && (
        <div
          className="flex items-center justify-center h-[400px] border border-gray-200 rounded-lg"
          role="status"
          aria-live="polite"
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des restaurants...</p>
          </div>
        </div>
      )}

      {/* Carte */}
      {!isLoadingGlobal && restosWithCoords.length > 0 && (
        <section aria-labelledby="map-title">
          <h2 id="map-title" className="sr-only">
            Carte des restaurants
          </h2>
          <Map
            restos={restosWithCoords}
            onMarkerClick={handleMarkerClick}
            selectedResto={selectedResto}
          />
        </section>
      )}

      {/* Restaurants non géocodés */}
      {!isLoadingGlobal && withoutCoords.length > 0 && (
        <section aria-labelledby="missing-title">
          <MissingRestos restos={withoutCoords} />
        </section>
      )}

      {/* Aucun restaurant trouvé */}
      {!isLoadingGlobal && restos.length === 0 && !error && (
        <div
          className="text-center py-12 border border-gray-200 rounded-lg"
          role="status"
        >
          <p className="text-gray-500">{ERROR_MESSAGES.NO_RESTOS}</p>
        </div>
      )}

      {/* Légende des statuts */}
      {!isLoadingGlobal && withCoords.length > 0 && (
        <section
          className="bg-gray-50 rounded-lg p-4"
          aria-labelledby="legend-title"
        >
          <h3 id="legend-title" className="font-semibold text-gray-800 mb-3">
            Légende des statuts :
          </h3>
          <div className="flex flex-wrap gap-3">
            {[
              { label: "Terminé", color: "bg-green-500" },
              { label: "En cours", color: "bg-orange-500" },
              { label: "A démarcher", color: "bg-red-500" },
              { label: "Refusé", color: "bg-gray-500" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <div
                  className={`w-4 h-4 rounded-full ${item.color}`}
                  aria-hidden="true"
                />
                <span className="text-sm text-gray-700">{item.label}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Bouton pour recharger */}
      <div className="text-center">
        <button
          onClick={fetchRestos}
          disabled={isLoadingGlobal}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
          aria-label="Recharger les données"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          {isLoadingGlobal ? "Chargement..." : "Recharger les données"}
        </button>
      </div>
    </div>
  );
}
