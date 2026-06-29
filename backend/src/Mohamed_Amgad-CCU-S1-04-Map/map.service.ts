// Map service — uses Nominatim (OpenStreetMap) for geocoding and places search
// Free, no API key required. Rate-limited to 1 request/second by Nominatim policy.

import { logger } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/logger.js';

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

interface GeocodeResult {
  lat: string;
  lon: string;
  displayName: string;
}

interface PlaceResult {
  placeId: string;
  lat: string;
  lon: string;
  displayName: string;
  type: string;
  category: string;
}

// Simple in-memory cache for geocoding results (5-minute TTL)
const geocodeCache = new Map<string, { data: GeocodeResult[]; expires: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

export const mapService = {
  /**
   * Forward geocode: convert an address/place name to coordinates.
   * Biased towards UTM campus area (Johor Bahru, Malaysia).
   */
  async geocode(query: string): Promise<GeocodeResult[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    // Check cache first
    const cacheKey = query.toLowerCase().trim();
    const cached = geocodeCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    try {
      const params = new URLSearchParams({
        q: query,
        format: 'json',
        limit: '5',
        countrycodes: 'my',          // Malaysia only
        viewbox: '103.55,1.45,103.72,1.62', // UTM/Johor Bahru bounding box
        bounded: '0',                // Prefer results in viewbox but don't exclude others
        addressdetails: '1',
      });

      const res = await fetch(`${NOMINATIM_BASE}/search?${params}`, {
        headers: {
          'User-Agent': 'CatCare-UTM/1.0 (campus cat management system)',
          'Accept-Language': 'en',
        },
      });

      if (!res.ok) {
        logger.warn({ status: res.status }, 'Nominatim geocoding request failed');
        return [];
      }

      const data = await res.json() as Array<{
        lat: string;
        lon: string;
        display_name: string;
      }>;

      const results: GeocodeResult[] = data.map((item) => ({
        lat: item.lat,
        lon: item.lon,
        displayName: item.display_name,
      }));

      // Cache the results
      geocodeCache.set(cacheKey, { data: results, expires: Date.now() + CACHE_TTL_MS });

      return results;
    } catch (error) {
      logger.error({ error }, 'Geocoding service error');
      return [];
    }
  },

  /**
   * Search for places (POI) near UTM campus.
   * Uses Nominatim search with amenity/POI bias.
   */
  async searchPlaces(query: string): Promise<PlaceResult[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    try {
      const params = new URLSearchParams({
        q: query,
        format: 'json',
        limit: '10',
        countrycodes: 'my',
        viewbox: '103.55,1.45,103.72,1.62',
        bounded: '0',
        addressdetails: '1',
        extratags: '1',
      });

      const res = await fetch(`${NOMINATIM_BASE}/search?${params}`, {
        headers: {
          'User-Agent': 'CatCare-UTM/1.0 (campus cat management system)',
          'Accept-Language': 'en',
        },
      });

      if (!res.ok) {
        logger.warn({ status: res.status }, 'Nominatim places search request failed');
        return [];
      }

      const data = await res.json() as Array<{
        place_id: number;
        lat: string;
        lon: string;
        display_name: string;
        type: string;
        category: string;
      }>;

      return data.map((item) => ({
        placeId: String(item.place_id),
        lat: item.lat,
        lon: item.lon,
        displayName: item.display_name,
        type: item.type,
        category: item.category,
      }));
    } catch (error) {
      logger.error({ error }, 'Places search service error');
      return [];
    }
  },
};
