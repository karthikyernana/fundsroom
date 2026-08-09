import { Router, Request, Response } from 'express';

const router = Router();

const htmlDocs = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FundsRoom REST API Documentation</title>
  <style>
    :root {
      --primary: #1F4D3D;
      --primary-light: #2A6852;
      --bg: #F7F6F2;
      --card-bg: #FFFFFF;
      --text: #211D18;
      --muted: #6B6358;
      --border: #C9BFA8;
      --code-bg: #EDE7DA;
      --get: #2E7D32;
      --post: #1565C0;
      --put: #E65100;
      --delete: #C62828;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      padding: 32px 16px;
    }
    .container {
      max-width: 1000px;
      margin: 0 auto;
    }
    header {
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 2px solid var(--primary);
    }
    h1 {
      font-size: 2rem;
      color: var(--primary);
      margin-bottom: 8px;
    }
    p.subtitle {
      color: var(--muted);
      font-size: 1rem;
    }
    .badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: bold;
      font-size: 0.75rem;
      color: #fff;
      text-transform: uppercase;
      margin-right: 8px;
    }
    .method-GET { background: var(--get); }
    .method-POST { background: var(--post); }
    .method-PUT { background: var(--put); }
    .method-DELETE { background: var(--delete); }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.04);
    }
    .card-title {
      display: flex;
      align-items: center;
      font-size: 1.125rem;
      font-weight: 600;
      margin-bottom: 12px;
    }
    .path { font-family: monospace; font-size: 1rem; color: var(--text); }
    .roles { font-size: 0.8125rem; color: var(--muted); margin-left: auto; font-style: italic; }
    .section-title {
      font-size: 1.25rem;
      color: var(--primary);
      margin: 32px 0 16px 0;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--border);
    }
    pre {
      background: var(--code-bg);
      padding: 12px;
      border-radius: 6px;
      font-family: monospace;
      font-size: 0.875rem;
      overflow-x: auto;
      margin-top: 8px;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>FundsRoom REST API Documentation</h1>
      <p class="subtitle">Official API Reference for FundsRoom Mini ERP + CRM Operations Portal</p>
    </header>

    <div class="section-title">Authentication & System</div>
    
    <div class="card">
      <div class="card-title">
        <span class="badge method-POST">POST</span>
        <span class="path">/auth/login</span>
        <span class="roles">Public</span>
      </div>
      <p>Authenticate user credentials and return a JWT access token.</p>
      <pre>Body: { "email": "admin@fundsroom.com", "password": "password123" }</pre>
    </div>

    <div class="card">
      <div class="card-title">
        <span class="badge method-GET">GET</span>
        <span class="path">/auth/me</span>
        <span class="roles">All Roles</span>
      </div>
      <p>Retrieve profile of the currently authenticated user.</p>
    </div>

    <div class="card">
      <div class="card-title">
        <span class="badge method-GET">GET</span>
        <span class="path">/health</span>
        <span class="roles">Public</span>
      </div>
      <p>Health check endpoint returning API operational status.</p>
    </div>

    <div class="section-title">Customer CRM Module</div>

    <div class="card">
      <div class="card-title">
        <span class="badge method-GET">GET</span>
        <span class="path">/customers</span>
        <span class="roles">All Roles</span>
      </div>
      <p>List customer records with support for search, status, assigned sales rep, and pagination.</p>
    </div>

    <div class="card">
      <div class="card-title">
        <span class="badge method-POST">POST</span>
        <span class="path">/customers</span>
        <span class="roles">Admin, Sales</span>
      </div>
      <p>Create a new customer account with GST number validation and assigned sales rep.</p>
    </div>

    <div class="section-title">Product & Inventory Module</div>

    <div class="card">
      <div class="card-title">
        <span class="badge method-GET">GET</span>
        <span class="path">/products</span>
        <span class="roles">All Roles</span>
      </div>
      <p>List product inventory with category and low stock threshold filtering.</p>
    </div>

    <div class="card">
      <div class="card-title">
        <span class="badge method-POST">POST</span>
        <span class="path">/products/:id/stock-movements</span>
        <span class="roles">Admin, Warehouse</span>
      </div>
      <p>Record an audit-logged manual stock IN or OUT movement with reasoning.</p>
    </div>

    <div class="section-title">Sales Challan Module</div>

    <div class="card">
      <div class="card-title">
        <span class="badge method-POST">POST</span>
        <span class="path">/challans</span>
        <span class="roles">Admin, Sales, Warehouse</span>
      </div>
      <p>Create a draft sales challan with frozen product price snapshots.</p>
    </div>

    <div class="card">
      <div class="card-title">
        <span class="badge method-POST">POST</span>
        <span class="path">/challans/:id/confirm</span>
        <span class="roles">Admin, Sales, Warehouse</span>
      </div>
      <p>Confirm sales challan and atomically deduct stock via database row locks.</p>
    </div>

  </div>
</body>
</html>`;

router.get('/', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(htmlDocs);
});

export default router;
