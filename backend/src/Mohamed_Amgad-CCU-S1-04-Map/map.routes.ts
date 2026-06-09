import { Router } from 'express';
import rateLimit from 'express-rate-limit';

export const mapRoutes = Router();

const mapLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute per IP
  message: {
    success: false,
    error: 'Too many map requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Proxy endpoint for Google Maps Geocoding API (protects API key from exposure)
mapRoutes.get('/geocode', mapLimiter, async (_req, res) => {
  // Placeholder for geocoding proxy — requires GOOGLE_MAPS_API_KEY to be configured
  res.status(501).json({ success: false, error: { code: 'NOT_IMPLEMENTED', message: 'Map geocoding not yet configured' } });
});

// Proxy endpoint for Google Maps Places API (protects API key from exposure)
mapRoutes.get('/places', mapLimiter, async (_req, res) => {
  res.status(501).json({ success: false, error: { code: 'NOT_IMPLEMENTED', message: 'Map places search not yet configured' } });
});
