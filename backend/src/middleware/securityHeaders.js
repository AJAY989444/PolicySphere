// backend/src/middleware/securityHeaders.js
// Enterprise Security Hardening & Zero-Trust Defense (SRS Module 36)

function securityHardeningMiddleware(req, res, next) {
  // 1. Strict Transport Security (HSTS) - 1 Year with Subdomains
  res.setHeader(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );

  // 2. Clickjacking Protection
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // 3. MIME Sniffing Prevention
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // 4. Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // 5. Cross-Origin Protection
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

  // 6. Restrict Browser Features (Camera, Microphone, USB, Geolocation)
  res.setHeader(
    'Permissions-Policy',
    'accelerometer=(), camera=(), geolocation=(self), gyroscope=(), magnetometer=(), microphone=(), payment=(self), usb=()'
  );

  // 7. Content-Security-Policy (CSP)
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' ws: wss: http: https:",
      "frame-ancestors 'self'",
    ].join('; ')
  );

  next();
}

module.exports = securityHardeningMiddleware;
