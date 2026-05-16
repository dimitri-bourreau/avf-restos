/**
 * Endpoint API pour récupérer les restaurants depuis Google Sheets
 * GET /api/restos
 */

import { NextResponse } from "next/server";
import { Resto } from "@/types";
import { ERROR_MESSAGES } from "@/lib/constants";
import { normalizeStatus, isValidAddress } from "@/lib/utils";

// Types pour la réponse Google Sheets
interface GoogleSheetCell {
  v: string | null;
  f?: string;
}

interface GoogleSheetRow {
  c: GoogleSheetCell[];
}

interface GoogleSheetData {
  version: string;
  reqId: string;
  status: string;
  sig: string;
  table: {
    cols: { id: string; label: string; type: string }[];
    rows: GoogleSheetRow[];
  };
}

const SHEET_ID = "1XkhOrwzI9VIKxmUmoctAXqd-AyYo5w8-";
const GID_PRINCIPAL = "1880466191";
const GID_TERMINES_2025 = "505702853";

/**
 * Parse le JSON de Google Sheets
 */
function parseSheetJson(text: string): GoogleSheetData {
  // Extraire le JSON entre setResponse(...)
  const match = text.match(
    /google\.visualization\.Query\.setResponse\((.+)\);/,
  );
  if (!match) {
    throw new Error("Format de réponse invalide");
  }
  return JSON.parse(match[1]) as GoogleSheetData;
}

/**
 * Récupère les données depuis un onglet Google Sheets
 * @param gid - L'identifiant de l'onglet (gid dans l'URL)
 * @param defaultStatus - Si fourni, utilise ce statut pour tous les restaurants (ignore la colonne Statut)
 */
async function fetchSheetData(
  gid: string,
  defaultStatus?: string,
): Promise<Resto[]> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&gid=${gid}`;
  const response = await fetch(url, { next: { revalidate: 3600 } });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const text = await response.text();
  const data = parseSheetJson(text);

  if (!data?.table?.cols || !data?.table?.rows) {
    throw new Error("Structure de données invalide");
  }

  // Trouver les indices des colonnes
  const cols = data.table.cols;
  const nomIndex = cols.findIndex(
    (c: { label: string }) => c.label === "Nom du resto",
  );
  const adresseIndex = cols.findIndex(
    (c: { label: string }) =>
      c.label === "Adresse" || c.label === "Adresse - lien site",
  );
  const statutIndex = cols.findIndex(
    (c: { label: string }) => c.label === "Statut",
  );

  if (nomIndex === -1 || adresseIndex === -1) {
    throw new Error("Colonnes requises non trouvées");
  }

  // Parser les lignes
  const restos: Resto[] = [];
  data.table.rows.forEach((row, index) => {
    const cells = row.c;
    const nom = cells[nomIndex]?.v;
    const rawAdresse = cells[adresseIndex]?.v;
    const rawStatut =
      defaultStatus ?? (statutIndex !== -1 ? cells[statutIndex]?.v : null);

    if (!nom || !rawAdresse) return;

    let adresse = String(rawAdresse).trim();
    if (!isValidAddress(adresse)) return;

    // Ajouter "Grenoble, France" si l'adresse ne contient pas déjà Grenoble ou un code postal 38xxx
    const hasLocation = /(grenoble|38[0-9]{3})/i.test(adresse);
    if (!hasLocation) {
      adresse = `${adresse}, Grenoble, France`;
    }

    // Numéro de ligne dans la sheet (1-indexed, ligne 1 = en-tête)
    const sheetRowNumber = index + 2;

    restos.push({
      nom: nom.trim(),
      adresse,
      statut: defaultStatus ?? normalizeStatus(rawStatut),
      sheetRowNumber,
    });
  });

  return restos;
}

export async function GET() {
  try {
    const [restosPrincipal, restosTermines2025] = await Promise.all([
      fetchSheetData(GID_PRINCIPAL),
      fetchSheetData(GID_TERMINES_2025, "2025"),
    ]);

    const restos = [...restosPrincipal, ...restosTermines2025];

    return NextResponse.json({
      success: true,
      restos,
      count: restos.length,
    });
  } catch (error) {
    console.error("Erreur récupération restos:", error);

    return NextResponse.json(
      {
        success: false,
        error: ERROR_MESSAGES.SHEET_FETCH_FAILED,
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 },
    );
  }
}
