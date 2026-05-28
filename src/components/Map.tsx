"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { RestoWithCoords } from "@/types";
import { STATUS_COLORS, DEFAULT_MAP_CENTER, DEFAULT_ZOOM } from "@/types";

interface MapProps {
  restos: RestoWithCoords[];
  onMarkerClick?: (resto: RestoWithCoords) => void;
  selectedResto?: RestoWithCoords | null;
}

function markerColor(status: string): string {
  return STATUS_COLORS[status] || "#6b7280";
}

function createIcon(status: string, niveau: number | null): L.DivIcon {
  const color = markerColor(status);
  const label = niveau !== null ? String(niveau) : "";
  return L.divIcon({
    className: "",
    html: `<div style="
      width:24px; height:24px; border-radius:50%;
      background:${color}; border:2px solid #fff;
      box-shadow:0 1px 3px rgba(0,0,0,.4);
      display:flex; align-items:center; justify-content:center;
      font-size:11px; font-weight:bold; color:#fff;
    ">${label}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  });
}

function popupContent(resto: RestoWithCoords): string {
  const bgColor = markerColor(resto.statut);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(resto.nom + " " + resto.adresse)}`;
  return `
    <div style="min-width:180px;">
      <strong style="font-size:15px;">${resto.nom}</strong>
      <p style="color:#555; margin:4px 0 8px; font-size:13px;">${resto.adresse}</p>
      <span style="background:${bgColor}; color:#fff; padding:2px 8px; border-radius:4px; font-size:12px;">${resto.statut}</span>
      <br/>
      <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer"
         style="display:inline-block; margin-top:8px; font-size:12px; color:#1a73e8; text-decoration:none;">
        Voir sur Google Maps
      </a>
    </div>
  `;
}

export function Map({ restos, onMarkerClick, selectedResto }: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<globalThis.Map<string, L.Marker>>(
    new globalThis.Map(),
  );

  // Initialiser la carte une seule fois
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng],
      zoom: DEFAULT_ZOOM,
      zoomControl: false,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    // CartoDB Positron — style épuré, fond clair
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 20,
      },
    ).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Mettre à jour les marqueurs quand la liste change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Supprimer les anciens marqueurs
    markersRef.current.forEach((m) => m.remove());
    markersRef.current.clear();

    const valid = restos.filter((r) => r.lat !== null && r.lng !== null);
    if (valid.length === 0) return;

    const bounds: [number, number][] = [];

    valid.forEach((resto) => {
      const marker = L.marker([resto.lat!, resto.lng!], {
        icon: createIcon(resto.statut, resto.niveau),
        title: resto.nom,
      });

      marker.bindPopup(popupContent(resto));
      marker.on("click", () => onMarkerClick?.(resto));
      marker.addTo(map);

      const key = `${resto.nom}-${resto.sheetRowNumber}`;
      markersRef.current.set(key, marker);
      bounds.push([resto.lat!, resto.lng!]);
    });

    if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [32, 32] });
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 15);
    }
  }, [restos, onMarkerClick]);

  // Zoomer sur le restaurant sélectionné depuis la liste
  useEffect(() => {
    const map = mapRef.current;
    if (
      !map ||
      !selectedResto ||
      selectedResto.lat === null ||
      selectedResto.lng === null
    )
      return;

    const pos: [number, number] = [selectedResto.lat, selectedResto.lng];
    map.setView(pos, 17, { animate: true });

    const key = `${selectedResto.nom}-${selectedResto.sheetRowNumber}`;
    const marker = markersRef.current.get(key);
    if (marker) {
      marker.openPopup();
    }
  }, [selectedResto]);

  // z-0 crée un contexte d'empilement isolé pour les panes Leaflet (z-index 200–700),
  // permettant à nos overlays React (z-20+) d'apparaître par-dessus la carte.
  return (
    <div
      ref={containerRef}
      className="w-full h-full z-0"
      role="application"
      aria-label="Carte des restaurants"
    />
  );
}
