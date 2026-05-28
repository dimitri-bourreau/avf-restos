/**
 * Filtre par niveau de signature (1 à 4)
 * Aucune case cochée = aucun filtre actif (tous les restos sont affichés)
 */

"use client";

import type { Niveau } from "@/types";

export const ALL_NIVEAUX: Niveau[] = [1, 2, 3, 4];

const NIVEAU_DESCRIPTIONS: Record<Niveau, string> = {
  1: "Au moins une option vegan tous les jours",
  2: "Option vegan quotidienne + menu 100% vegan hebdo",
  3: "Menu 100% vegan disponible tous les jours",
  4: "Restaurant 100% vegan",
};

interface NiveauxFilterProps {
  selectedNiveaux: Niveau[];
  onToggleNiveau: (niveau: Niveau) => void;
}

export function NiveauxFilter({
  selectedNiveaux,
  onToggleNiveau,
}: NiveauxFilterProps) {
  return (
    <div className="border-t border-gray-200 pt-3 mb-3">
      <div className="flex flex-col gap-2">
        {ALL_NIVEAUX.map((n) => {
          const checked = selectedNiveaux.includes(n);
          return (
            <label key={n} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggleNiveau(n)}
                className="accent-[#0e983a] shrink-0"
              />
              <div>
                <span className="text-sm text-gray-700">Niveau {n}</span>
                <p className="text-xs text-[#0e983a] leading-tight">
                  {NIVEAU_DESCRIPTIONS[n]}
                </p>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
