/**
 * Endpoint API pour le géocodage d'une adresse
 * GET /api/geocode?address=...
 * 
 * Sécurité : La clé API Google Geocoding est utilisée côté serveur uniquement
 */

import { NextResponse } from "next/server";
import { GeocodeResult } from "@/types";
import { API_TIMEOUT, ERROR_MESSAGES } from "@/lib/constants";
import { cleanAddress, geocodeCache } from "@/lib/utils";

const GEOCODING_API_URL = "https://maps.googleapis.com/maps/api/geocode/json";

/**
 * Géocode une adresse via l'API Google Geocoding
 */
async function geocodeAddress(address: string): Promise<GeocodeResult> {
  // Vérifier le cache d'abord
  const cached = geocodeCache.get(address);
  if (cached) {
    return {
      lat: cached.lat,
      lng: cached.lng,
      formattedAddress: address,
    };
  }

  const apiKey = process.env.GOOGLE_GEOCODING_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_GEOCODING_API_KEY non configurée");
  }

  const params = new URLSearchParams({
    address,
    key: apiKey,
    language: "fr",
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(`${GEOCODING_API_URL}?${params}`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== "OK" || !data.results?.[0]) {
      throw new Error(data.error_message || "Aucun résultat trouvé");
    }

    const result = data.results[0];
    const location = result.geometry.location;
    const coords = { lat: location.lat, lng: location.lng };

    // Stocker en cache
    geocodeCache.set(address, coords);

    return {
      lat: location.lat,
      lng: location.lng,
      formattedAddress: result.formatted_address,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json(
      {
        success: false,
        error: "Paramètre 'address' manquant",
      },
      { status: 400 }
    );
  }

  const cleanedAddress = cleanAddress(address);

  if (cleanedAddress.length === 0) {
    return NextResponse.json(
      {
        success: false,
        error: "Adresse vide",
      },
      { status: 400 }
    );
  }

  try {
    const result = await geocodeAddress(cleanedAddress);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error(`Erreur de géocodage pour "${cleanedAddress}":`, error);

    return NextResponse.json(
      {
        success: false,
        error: ERROR_MESSAGES.GEOCODING_FAILED,
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: error instanceof Error && error.message.includes("non configurée") ? 500 : 404 }
    );
  }
}
