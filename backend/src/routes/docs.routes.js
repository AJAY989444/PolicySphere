const express = require('express');
const router = express.Router();
const swaggerSpec = require('../config/swagger');

// Raw OpenAPI 3.0 JSON Specification
router.get('/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(swaggerSpec);
});

// Interactive Modern API Documentation Explorer (Scalar / OpenAPI)
router.get('/docs', (req, res) => {
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <title>PolicySphere API Documentation (OpenAPI 3.0)</title>
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🛡️</text></svg>">
    <style>
      body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #0f172a; color: #f8fafc; }
      .header-bar { background: #1e1b4b; border-bottom: 1px solid #312e81; padding: 14px 24px; display: flex; align-items: center; justify-content: space-between; }
      .header-bar h1 { font-size: 1.15rem; margin: 0; display: flex; align-items: center; gap: 8px; color: #a5b4fc; font-weight: 700; }
      .header-bar a { color: #818cf8; text-decoration: none; font-size: 0.85rem; padding: 6px 14px; border: 1px solid #4338ca; border-radius: 6px; transition: all 0.2s; }
      .header-bar a:hover { background: #4338ca; color: #ffffff; }
    </style>
  </head>
  <body>
    <div class="header-bar">
      <h1>🛡️ PolicySphere Enterprise API Documentation</h1>
      <div style="display: flex; gap: 10px;">
        <a href="/api/docs.json" target="_blank">📥 Raw OpenAPI JSON</a>
        <a href="http://localhost:5173/developers">⚡ Developer Hub</a>
      </div>
    </div>
    <script
      id="api-reference"
      data-url="/api/docs.json"
      src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"
      data-configuration='{"theme": "deepSpace", "hideModels": false, "showSidebar": true}'>
    </script>
  </body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

module.exports = router;
