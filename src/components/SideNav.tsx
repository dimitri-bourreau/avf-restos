/**
 * Barre latérale droite affichant la liste des restaurants
 */

import type { Resto } from "@/types";

interface SideNavProps {
  restos: Resto[];
}

export function SideNav({ restos }: SideNavProps) {
  if (restos.length === 0) return null;

  return (
    <aside className="fixed right-4 top-4 bottom-28 w-80 bg-white rounded-lg shadow-lg overflow-y-auto p-4 z-20">
      <h2 className="font-semibold text-gray-800 mb-3 sticky top-0 bg-white pt-2 pb-1 -mx-4 -mt-4 px-4">
        Restaurants ({restos.length})
      </h2>
      <ul className="space-y-2">
        {restos.map((resto, index) => (
          <li
            key={`${resto.nom}-${index}`}
            className="flex items-start gap-3 p-2 rounded hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm text-gray-400 font-mono mt-1">
              {index + 2}
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-800 truncate">
                {resto.nom}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">{resto.statut}</div>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
