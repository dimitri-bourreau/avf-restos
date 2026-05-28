/**
 * Endpoint API pour récupérer et géocoder les restaurants depuis Google Sheets
 * GET /api/restos
 *
 * Le géocodage est fait côté serveur en séquentiel pour respecter la limite
 * de Nominatim (1 req/s). Le résultat est mis en cache par Next.js (revalidate).
 */

import { NextResponse } from "next/server";
import { Resto, RestoWithCoords, Niveau } from "@/types";
import { ERROR_MESSAGES } from "@/lib/constants";
import { normalizeStatus, isValidAddress } from "@/lib/utils";
import { geocodeFileCache } from "@/lib/geocodeFileCache";

// ─── Google Sheets ────────────────────────────────────────────────────────────

interface GoogleSheetCell {
  v: string | null;
  f?: string;
}

interface GoogleSheetRow {
  c: GoogleSheetCell[];
}

interface GoogleSheetData {
  table: {
    cols: { id: string; label: string; type: string }[];
    rows: GoogleSheetRow[];
  };
}

const SHEET_ID = "1XkhOrwzI9VIKxmUmoctAXqd-AyYo5w8-";
const GID_PRINCIPAL = "1880466191";
const GID_TERMINES_2025 = "505702853";

function parseNiveau(raw: unknown): Niveau | null {
  if (raw == null) return null;
  const n = Number(raw);
  return n === 1 || n === 2 || n === 3 || n === 4 ? n : null;
}

function parseSheetJson(text: string): GoogleSheetData {
  const match = text.match(
    /google\.visualization\.Query\.setResponse\((.+)\);/,
  );
  if (!match) throw new Error("Format de réponse invalide");
  return JSON.parse(match[1]) as GoogleSheetData;
}

async function fetchSheetData(
  gid: string,
  defaultStatus?: string,
): Promise<Resto[]> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&gid=${gid}`;
  const response = await fetch(url, { next: { revalidate: 3600 } });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

  const data = parseSheetJson(await response.text());
  if (!data?.table?.cols || !data?.table?.rows)
    throw new Error("Structure de données invalide");

  const cols = data.table.cols;
  const nomIndex = cols.findIndex((c) => c.label === "Nom du resto");
  const adresseIndex = cols.findIndex(
    (c) => c.label === "Adresse" || c.label === "Adresse - lien site",
  );
  const statutIndex = cols.findIndex((c) => c.label === "Statut");
  const niveauIndex = cols.findIndex((c) => c.label === "Niveau");

  if (nomIndex === -1 || adresseIndex === -1)
    throw new Error("Colonnes requises non trouvées");

  const restos: Resto[] = [];
  data.table.rows.forEach((row, index) => {
    const cells = row.c;
    const nom = cells[nomIndex]?.v;
    const rawAdresse = cells[adresseIndex]?.v;
    const rawStatut =
      defaultStatus ?? (statutIndex !== -1 ? cells[statutIndex]?.v : null);
    const niveau =
      niveauIndex !== -1 ? parseNiveau(cells[niveauIndex]?.v) : null;

    if (!nom || !rawAdresse) return;

    let adresse = String(rawAdresse).trim();
    if (!isValidAddress(adresse)) return;

    const hasLocation = /(grenoble|38[0-9]{3})/i.test(adresse);
    if (!hasLocation) adresse = `${adresse}, Grenoble, France`;

    restos.push({
      nom: nom.trim(),
      adresse,
      statut: defaultStatus ?? normalizeStatus(rawStatut),
      niveau,
      sheetRowNumber: index + 2,
    });
  });

  return restos;
}

// ─── Géocodage Nominatim ──────────────────────────────────────────────────────

// Photon (Komoot) — basé sur OSM, sans clé API, plus permissif que Nominatim
const PHOTON_URL = "https://photon.komoot.io/api/";

async function geocodeOne(
  adresse: string,
): Promise<{ lat: number; lng: number } | null> {
  if (geocodeFileCache.has(adresse)) return geocodeFileCache.get(adresse);

  const params = new URLSearchParams({ q: adresse, limit: "1", lang: "fr" });
  try {
    const response = await fetch(`${PHOTON_URL}?${params}`, {
      headers: { "User-Agent": "AVF-Restos/1.0 (dimitri@release-dev.com)" },
    });
    if (!response.ok) return null;
    const data = await response.json();
    // Photon renvoie du GeoJSON : coordinates = [longitude, latitude]
    const coords = data?.features?.[0]?.geometry?.coordinates;
    if (!coords) return null;
    const result = { lat: coords[1], lng: coords[0] };
    geocodeFileCache.set(adresse, result);
    return result;
  } catch {
    return null;
  }
}

async function geocodeSequentially(
  restos: Resto[],
): Promise<RestoWithCoords[]> {
  const results: RestoWithCoords[] = [];

  for (const resto of restos) {
    const wasCached = geocodeFileCache.has(resto.adresse);
    const coords = await geocodeOne(resto.adresse);
    results.push({
      ...resto,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
      geocodeError: coords ? undefined : "Adresse non trouvée",
    });
    // Respecter la limite Photon uniquement si on a appelé l'API
    if (!wasCached) {
      await new Promise((resolve) => setTimeout(resolve, 1100));
    }
  }

  return results;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const [restosPrincipal, restosTermines2025] = await Promise.all([
      fetchSheetData(GID_PRINCIPAL),
      fetchSheetData(GID_TERMINES_2025, "2025"),
    ]);

    const restos = [...restosPrincipal, ...restosTermines2025];
    const restosWithCoords = await geocodeSequentially(restos);

    return NextResponse.json({
      success: true,
      restos: restosWithCoords,
      count: restosWithCoords.length,
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
