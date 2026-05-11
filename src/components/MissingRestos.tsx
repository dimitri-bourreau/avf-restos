/**
 * Composant pour afficher les restaurants non géocodés
 * Accessible et responsive
 */

import type { RestoWithCoords } from "@/types";

interface MissingRestosProps {
  restos: RestoWithCoords[];
}

export function MissingRestos({ restos }: MissingRestosProps) {
  if (restos.length === 0) return null;

  return (
    <aside
      className="bg-amber-50 border border-amber-200 rounded-lg p-4 my-4 w-full max-w-md"
      aria-labelledby="missing-restos-title"
      role="complementary"
    >
      <h2
        id="missing-restos-title"
        className="text-lg font-semibold text-amber-800 mb-3"
      >
        ⚠️ Restaurants non localisés ({restos.length})
      </h2>
      <p className="text-sm text-amber-700 mb-3">
        Ces adresses n&apos;ont pas pu être trouvées sur Google Maps :
      </p>
      <ul className="space-y-2">
        {restos.map((resto, index) => (
          <li key={`${resto.nom}-${index}`} className="text-sm">
            <div className="font-medium text-gray-800">{resto.nom}</div>
            <div className="text-gray-600 truncate">{resto.adresse}</div>
            <div className="text-xs text-gray-500 mt-1">
              Statut: <span className="font-medium">{resto.statut}</span>
            </div>
            {resto.geocodeError && (
              <div className="text-xs text-red-600 mt-1">
                {resto.geocodeError}
              </div>
            )}
          </li>
        ))}
      </ul>
      <p className="text-xs text-amber-600 mt-4">
        Vérifiez l&apos;orthographe des adresses ou essayez une recherche manuelle.
      </p>
    </aside>
  );
}
