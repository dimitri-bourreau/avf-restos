/**
 * Composant Marqueur personnalisé pour la carte
 * Affiche un marqueur avec une couleur basée sur le statut du restaurant
 */

import { STATUS_COLORS } from "@/types";
import type { RestoStatus } from "@/types";

interface MarkerProps {
  status: RestoStatus;
  onClick?: () => void;
  isSelected?: boolean;
}

/**
 * Compose une couleur de marqueur à partir du statut
 * Retourne une couleur valide pour Google Maps
 */
function getMarkerColor(status: RestoStatus): string {
  return STATUS_COLORS[status] || STATUS_COLORS["Inactif"];
}

/**
 * Génère une URL de marqueur SVG personnalisé
 * Utilise un cercle coloré avec une bordure blanche
 */
function getMarkerIconUrl(color: string, size: number = 32): string {
  return `https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld=%7C${color.replace("#", "")}|${size}`;
}

// Cache pour les URLs d'icônes
const iconCache = new Map<string, string>();

export function Marker({ status, onClick, isSelected = false }: MarkerProps) {
  const color = getMarkerColor(status);
  const cacheKey = `${color}-${isSelected}`;

  // Générer ou récupérer l'URL de l'icône
  if (!iconCache.has(cacheKey)) {
    const size = isSelected ? 40 : 32;
    iconCache.set(cacheKey, getMarkerIconUrl(color, size));
  }

  const iconUrl = iconCache.get(cacheKey)!;

  return (
    <div
      className="cursor-pointer"
      onClick={onClick}
      role="button"
      aria-label={`Marqueur - Statut: ${status}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <img
        src={iconUrl}
        alt=""
        style={{ width: isSelected ? 40 : 32, height: isSelected ? 40 : 32 }}
        aria-hidden="true"
      />
    </div>
  );
}

// Export pour utilisation directe avec Google Maps API
export function getGoogleMapsMarkerIcon(status: RestoStatus) {
  const color = getMarkerColor(status);
  const iconUrl = getMarkerIconUrl(color, 32);

  return {
    url: iconUrl,
    scaledSize: new google.maps.Size(32, 32),
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(16, 32),
  };
}
