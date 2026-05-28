"use client";

import { useState } from "react";
import type { Niveau } from "@/types";
import { NiveauxFilter } from "./NiveauxFilter";

const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1XkhOrwzI9VIKxmUmoctAXqd-AyYo5w8-/edit?gid=1880466191";

const STATUS_COLORS = {
  Terminé: "bg-green-500",
  "En cours": "bg-orange-500",
  "A démarcher": "bg-red-500",
  Refusé: "bg-gray-500",
  "2025": "bg-black",
} as const;

const ALL_STATUSES = [
  "Terminé",
  "En cours",
  "A démarcher",
  "Refusé",
  "2025",
] as const;

type Status = (typeof ALL_STATUSES)[number];

interface LegendWithLinkProps {
  selectedStatus: string | null;
  onStatusFilter: (status: string | null) => void;
  selectedNiveaux: Niveau[];
  onToggleNiveau: (niveau: Niveau) => void;
  onClearNiveaux: () => void;
}

export function LegendWithLink({
  selectedStatus,
  onStatusFilter,
  selectedNiveaux,
  onToggleNiveau,
  onClearNiveaux,
}: LegendWithLinkProps) {
  // Sur mobile, le panneau est réduit par défaut
  const [expanded, setExpanded] = useState(false);

  const handleClick = (status: Status) => {
    onStatusFilter(selectedStatus === status ? null : status);
  };

  const hasAnyFilter = selectedStatus !== null || selectedNiveaux.length > 0;

  const resetAll = () => {
    onStatusFilter(null);
    onClearNiveaux();
  };

  return (
    <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg z-20 max-w-xs">
      {/* En-tête : toujours visible */}
      <div className="flex items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-baseline gap-3">
          <h3 className="font-semibold text-gray-800 shrink-0">Filtres</h3>
          {hasAnyFilter && (
            <button
              onClick={resetAll}
              className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
            >
              Réinitialiser
            </button>
          )}
        </div>
        {/* Bouton toggle visible uniquement sur mobile */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="sm:hidden text-gray-400 hover:text-gray-600 ml-2"
          aria-label={expanded ? "Masquer les filtres" : "Afficher les filtres"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-4 w-4 transition-transform ${expanded ? "" : "rotate-180"}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>

      {/* Contenu : toujours visible sur desktop, toggle sur mobile */}
      <div className={`px-4 pb-4 ${expanded ? "block" : "hidden"} sm:block`}>
        <div className="flex flex-col gap-1 mb-3">
          {ALL_STATUSES.map((status) => {
            const isActive = selectedStatus === status;
            return (
              <button
                key={status}
                onClick={() => handleClick(status)}
                aria-pressed={isActive}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-full border transition-colors ${
                  isActive
                    ? "border-gray-800 bg-gray-100"
                    : "border-transparent hover:bg-gray-50"
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full ${STATUS_COLORS[status]}`}
                  aria-hidden="true"
                />
                <span className="text-xs text-gray-600">{status}</span>
              </button>
            );
          })}
        </div>
        <NiveauxFilter
          selectedNiveaux={selectedNiveaux}
          onToggleNiveau={onToggleNiveau}
        />
        <a
          href={SHEET_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
        >
          Voir la feuille de calcul
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      </div>
    </div>
  );
}
