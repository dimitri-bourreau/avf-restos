/**
 * Cache de géocodage persistant sur disque.
 * Survit aux redémarrages du serveur et aux rechargements de modules (HMR).
 * Le fichier JSON peut être commité pour pré-peupler les déploiements.
 */

import fs from "fs";
import path from "path";

const CACHE_PATH = path.join(process.cwd(), "geocode-cache.json");

type CacheData = Record<string, { lat: number; lng: number }>;

function load(): CacheData {
  try {
    return JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8"));
  } catch {
    return {};
  }
}

function save(data: CacheData): void {
  try {
    fs.writeFileSync(CACHE_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch {
    // Silencieux en production read-only (ex : Vercel)
  }
}

const store: CacheData = load();

export const geocodeFileCache = {
  has: (address: string) => address in store,
  get: (address: string) => store[address] ?? null,
  set: (address: string, coords: { lat: number; lng: number }) => {
    store[address] = coords;
    save(store);
  },
};
