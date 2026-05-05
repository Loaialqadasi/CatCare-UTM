import rateLimit from 'express-rate-limit';

// 5 login/register attempts per 15 min per IP
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many authentication attempts. Please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false
});

// general API rate limit — 100 requests per hour
export const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

// stricter limit for password resets — 3 per 24 hours
export const passwordResetLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 3,
  message: 'Too many password reset requests. Please try again after 24 hours.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});
