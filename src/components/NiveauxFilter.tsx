/**
 * Filtre par niveau de signature (1 à 4)
 * Aucune case cochée = aucun filtre actif (tous les restos sont affichés)
 */

"use client";

import type { Niveau } from "@/types";

export const ALL_NIVEAUX: Niveau[] = [1, 2, 3, 4];

interface NiveauxFilterProps {
  selectedNiveaux: Niveau[];
  onToggleNiveau: (niveau: Niveau) => void;
  onClearAll: () => void;
}

export function NiveauxFilter({
  selectedNiveaux,
  onToggleNiveau,
  onClearAll,
}: NiveauxFilterProps) {
  const hasActive = selectedNiveaux.length > 0;

  return (
    <div className="border-t border-gray-200 pt-3 mb-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-800">Filtres :</h3>
        {hasActive && (
          <button
            onClick={onClearAll}
            className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
          >
            Retirer les filtres
          </button>
        )}
      </div>
      <div className="flex flex-col gap-1">
        {ALL_NIVEAUX.map((n) => {
          const checked = selectedNiveaux.includes(n);
          return (
            <label
              key={n}
              className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggleNiveau(n)}
                className="accent-[#0e983a]"
              />
              <span>Niveau {n}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
