/**
 * Modal affichant la liste des restaurants avec filtres par statut
 */

"use client";

import { useState, useMemo } from "react";
import type { Resto } from "@/types";

const STATUS_COLORS = {
  Terminé: "bg-green-500",
  "En cours": "bg-orange-500",
  "A démarcher": "bg-red-500",
  Refusé: "bg-gray-500",
} as const;

const ALL_STATUSES = ["Terminé", "En cours", "A démarcher", "Refusé"] as const;

interface RestaurantListModalProps {
  restos: Resto[];
}

export function RestaurantListModal({ restos }: RestaurantListModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  // Compter les restaurants par statut
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    ALL_STATUSES.forEach((status) => {
      counts[status] = restos.filter((r) => r.statut === status).length;
    });
    return counts;
  }, [restos]);

  // Restaurants filtrés par statut
  const filteredRestos = useMemo(() => {
    if (!selectedStatus) return restos;
    return restos.filter((r) => r.statut === selectedStatus);
  }, [restos, selectedStatus]);

  // Total des restaurants filtrés
  const filteredCount = filteredRestos.length;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 bg-white rounded-lg shadow-lg p-3 hover:bg-gray-50 transition-colors flex items-center gap-2 z-20"
        aria-label="Afficher la liste des restaurants"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-gray-700"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
        <span className="text-sm font-medium text-gray-800">
          Liste des restaurants
        </span>
      </button>
    );
  }

  return (
    <>
      {/* Bouton pour ouvrir la liste */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-36 bg-white rounded-lg shadow-lg p-3 hover:bg-gray-50 transition-colors flex items-center gap-2 z-20"
        aria-label="Afficher la liste des restaurants"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-gray-700"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
        <span className="text-sm font-medium text-gray-800">
          Liste des restaurants
        </span>
      </button>

      {/* Modal de la liste */}
      <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-30 flex flex-col">
        {/* En-tête */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            Restaurants ({restos.length})
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            aria-label="Fermer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Filtres par statut */}
        <div className="flex flex-wrap gap-2 p-4 border-b border-gray-200">
          {ALL_STATUSES.map((status) => {
            const count = statusCounts[status];
            const isActive = selectedStatus === status;
            return (
              <button
                key={status}
                onClick={() => setSelectedStatus(isActive ? null : status)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  isActive
                    ? `bg-${STATUS_COLORS[status].replace(
                        "bg-",
                        "",
                      )} text-white`
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                aria-pressed={isActive}
                aria-label={`Filtrer par statut: ${status}`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isActive ? "bg-white/30" : STATUS_COLORS[status]
                  }`}
                  aria-hidden="true"
                />
                <span>{status}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-xs ${
                    isActive ? "bg-white/20" : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Liste des restaurants */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="w-96 mx-auto">
            {filteredCount === 0 ? (
              <p className="text-center text-gray-500 py-8">
                Aucun restaurant trouvé
              </p>
            ) : (
              <div className="space-y-2">
                {filteredRestos.map((resto) => (
                  <div
                    key={`${resto.nom}-${resto.sheetRowNumber}`}
                    className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-sm text-gray-400 font-mono mt-1 flex-shrink-0">
                      {resto.sheetRowNumber}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-800 truncate">
                        {resto.nom}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {resto.adresse}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium text-white flex-shrink-0 ${
                        STATUS_COLORS[
                          resto.statut as keyof typeof STATUS_COLORS
                        ]
                      }`}
                    >
                      {resto.statut}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Résumé du filtre */}
        {selectedStatus && (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <p className="text-center text-sm text-gray-500">
              {filteredCount} restaurant{filteredCount > 1 ? "s" : ""} avec le
              statut {selectedStatus}
              <button
                onClick={() => setSelectedStatus(null)}
                className="ml-2 text-blue-600 hover:text-blue-800 hover:underline"
              >
                Tout afficher
              </button>
            </p>
          </div>
        )}
      </div>
    </>
  );
}
