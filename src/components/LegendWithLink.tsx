/**
 * Légende des statuts (filtrables) et lien vers la Google Sheet
 * Toujours visible en bas à gauche
 */

"use client";

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
}

export function LegendWithLink({
  selectedStatus,
  onStatusFilter,
}: LegendWithLinkProps) {
  const handleClick = (status: Status) => {
    onStatusFilter(selectedStatus === status ? null : status);
  };

  return (
    <div className="fixed bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 z-20 max-w-xs">
      <h3 className="font-semibold text-gray-800 mb-2">Légende :</h3>
      <div className="flex flex-wrap gap-2 mb-3">
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
  );
}
