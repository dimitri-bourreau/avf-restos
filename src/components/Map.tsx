/**
 * Composant Carte Google Maps avec marqueurs pour les restaurants
 * Accessible et responsive
 */

"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Wrapper } from "@googlemaps/react-wrapper";
import type { RestoWithCoords } from "@/types";
import { STATUS_COLORS, DEFAULT_MAP_CENTER, DEFAULT_ZOOM } from "@/types";

// Clé API Google Maps (côté client - nécessaire pour l'API JavaScript)
const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

interface MapProps {
  restos: RestoWithCoords[];
  onMarkerClick?: (resto: RestoWithCoords) => void;
  selectedResto?: RestoWithCoords | null;
}

/**
 * Crée une icône de marqueur personnalisée avec un cercle coloré
 */
function createMarkerIcon(status: string) {
  const color = STATUS_COLORS[status] || "#6b7280";
  return {
    path: google.maps.SymbolPath.CIRCLE,
    scale: 10,
    fillColor: color,
    fillOpacity: 1,
    strokeWeight: 2,
    strokeColor: "#ffffff",
  };
}

/**
 * Crée une info window pour un restaurant
 */
function createInfoWindowContent(resto: RestoWithCoords): string {
  const bgColor = STATUS_COLORS[resto.statut] || "#6b7280";
  return `
    <div class="p-2">
      <h3 class="font-bold text-lg">${resto.nom}</h3>
      <p class="text-gray-600">${resto.adresse}</p>
      <p class="mt-1">
        <span class="inline-block px-2 py-1 rounded text-xs font-medium" 
              style="background-color: ${bgColor}; color: white;">
          ${resto.statut}
        </span>
      </p>
    </div>
  `;
}

/**
 * Composant interne pour afficher la carte une fois l'API chargée
 */
function MapInner({
  restos,
  onMarkerClick,
}: {
  restos: RestoWithCoords[];
  onMarkerClick?: (resto: RestoWithCoords) => void;
}) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const mapRef = useRef<HTMLDivElement>(null);

  // Filtrer les restaurants avec des coordonnées valides
  const validRestos = useMemo(
    () => restos.filter((r) => r.lat !== null && r.lng !== null),
    [restos],
  );

  // Calculer les bounds pour centrer la carte
  const bounds = useMemo(() => {
    if (validRestos.length === 0) return null;

    const b = new google.maps.LatLngBounds();
    validRestos.forEach((r) => {
      if (r.lat && r.lng) {
        b.extend(new google.maps.LatLng(r.lat, r.lng));
      }
    });
    return b;
  }, [validRestos]);

  // Centrer la carte
  const center = useMemo(() => {
    if (validRestos.length === 0) return DEFAULT_MAP_CENTER;
    if (bounds) {
      return bounds.getCenter()?.toJSON() || DEFAULT_MAP_CENTER;
    }
    return DEFAULT_MAP_CENTER;
  }, [validRestos, bounds]);

  // Initialiser la carte
  useEffect(() => {
    if (!mapRef.current || !window.google || !window.google.maps) return;

    const mapInstance = new google.maps.Map(mapRef.current, {
      center,
      zoom: validRestos.length <= 1 ? DEFAULT_ZOOM : undefined,
      gestureHandling: "greedy",
      fullscreenControl: false,
      mapTypeControl: false,
      streetViewControl: false,
      zoomControl: true,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "on" }],
        },
      ],
    });

    setMap(mapInstance);
    infoWindowRef.current = new google.maps.InfoWindow();

    // Créer les marqueurs
    const newMarkers: google.maps.Marker[] = [];

    validRestos.forEach((resto) => {
      if (resto.lat === null || resto.lng === null) return;

      const marker = new google.maps.Marker({
        position: { lat: resto.lat, lng: resto.lng },
        map: mapInstance,
        title: resto.nom,
        icon: createMarkerIcon(resto.statut),
      });

      // Ajouter l'event listener pour le clic
      marker.addListener("click", () => {
        // Fermer l'info window existante
        if (infoWindowRef.current) {
          infoWindowRef.current.close();
        }

        // Créer le contenu
        const content = createInfoWindowContent(resto);

        // Ouvrir l'info window
        infoWindowRef.current?.setContent(content);
        infoWindowRef.current?.open({
          anchor: marker,
          map: mapInstance,
        });

        // Appeler le callback si fourni
        onMarkerClick?.(resto);
      });

      newMarkers.push(marker);
    });

    setMarkers(newMarkers);

    // Ajuster les bounds si nécessaire
    if (bounds && validRestos.length > 0) {
      mapInstance.fitBounds(bounds);
    }

    return () => {
      // Nettoyer les marqueurs
      newMarkers.forEach((marker) => marker.setMap(null));
    };
  }, [validRestos, onMarkerClick, center, bounds]);

  return (
    <div
      ref={mapRef}
      className="w-full h-full"
      role="application"
      aria-label="Carte des restaurants"
    />
  );
}

export function Map({ restos, onMarkerClick, selectedResto }: MapProps) {
  if (!apiKey) {
    return (
      <div className="fixed inset-0 bg-red-50 flex items-center justify-center">
        <p className="text-red-700 font-medium">
          Clé API Google Maps non configurée
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0">
      <Wrapper apiKey={apiKey} libraries={["places"]} version="weekly">
        <MapInner restos={restos} onMarkerClick={onMarkerClick} />
      </Wrapper>
    </div>
  );
}
