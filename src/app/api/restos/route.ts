/**
 * Endpoint API pour récupérer les restaurants depuis Google Sheets
 * GET /api/restos
 */

import { NextResponse } from "next/server";
import { Resto } from "@/types";
import { ERROR_MESSAGES } from "@/lib/constants";
import { normalizeStatus, isValidAddress } from "@/lib/utils";

const SHEET_ID = "1XkhOrwzI9VIKxmUmoctAXqd-AyYo5w8-";
const GID = "1880466191";
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&gid=${GID}`;

/**
 * Parse le JSON de Google Sheets
 */
function parseSheetJson(text: string): any {
  // Extraire le JSON entre setResponse(...)
  const match = text.match(
    /google\.visualization\.Query\.setResponse\((.+)\);/,
  );
  if (!match) {
    throw new Error("Format de réponse invalide");
  }
  return JSON.parse(match[1]);
}

/**
 * Récupère les données depuis Google Sheets
 */
async function fetchSheetData(): Promise<Resto[]> {
  const response = await fetch(SHEET_URL, { next: { revalidate: 3600 } });

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
    const statut = statutIndex !== -1 ? cells[statutIndex]?.v : null;

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
      statut: normalizeStatus(statut),
      sheetRowNumber,
    });
  });

  return restos;
}

export async function GET() {
  try {
    const restos = await fetchSheetData();

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
