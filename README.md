# Eastbox Helpdesk Support System

This repository contains:
- `frontend/`: React + Tailwind + Lucide client app.
- `backend/`: Cloudflare Worker API (Hono).
- `google-apps-script/`: Apps Script code that exposes Google Sheets tabs as a JSON API.

## 1) Google Sheets setup

1. Create a Google Sheet with tabs:
   - `Users`: `id, email, password_hash, role, name`
   - `Tickets`: `ticket_id, client_id, subject, description, category, status, urgency, assigned_to, created_at, updated_at`
   - `Comments`: `comment_id, ticket_id, user_id, message, timestamp`
2. Open **Extensions > Apps Script** and paste `google-apps-script/Code.gs`.
3. Deploy as Web App:
   - **Execute as**: Me
   - **Who has access**: Anyone with link (or restricted as needed)
4. Copy the Web App URL. Use this URL as `GOOGLE_SCRIPT_URL` in Cloudflare Worker vars.

## 2) Google Sheets API credentials (optional direct API mode)

Use this if you want to call Google Sheets directly instead of Apps Script:

1. Go to **Google Cloud Console** and create/select a project.
2. Enable **Google Sheets API** and **Google Drive API**.
3. Create a **Service Account** under **IAM & Admin > Service Accounts**.
4. Create a JSON key for the service account and store it securely.
5. Share your Google Sheet with the service account email (Editor access).
6. Store credentials in Cloudflare Worker secrets (recommended):
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
   - `GOOGLE_SHEETS_SPREADSHEET_ID`
7. If your private key contains newlines, replace `\n` with real line breaks at runtime.

## 3) Backend (Cloudflare Worker)

1. `cd backend`
2. Install dependencies: `npm install`
3. Set env vars in `wrangler.toml` or via `wrangler secret put`:
   - `GOOGLE_SCRIPT_URL`: Apps Script Web App URL
   - `JWT_SECRET`: strong random secret
4. Run local dev server:
   - `npm run dev`
5. Deploy:
   - `npm run deploy`

## 4) Frontend (React + Tailwind)

1. `cd frontend`
2. Install dependencies: `npm install`
3. Create `.env` with:
   - `VITE_API_BASE_URL=http://localhost:8787`
4. Run dev server:
   - `npm run dev`
5. Build:
   - `npm run build`

## 5) Auth and role flow

- Login endpoint: `POST /auth/login`.
- Worker returns JWT + user profile.
- Frontend stores token and uses role-based protected routes:
  - Client -> `/client`
  - Support -> `/support`
  - Admin -> `/admin`
- Users in all roles can add ticket comments/updates when they have access to the ticket.

## 6) Notes for production hardening

- Replace plaintext password comparison with strong hashing (e.g., bcrypt before writing to Sheets).
- Add refresh token / session invalidation strategy.
- Restrict Apps Script endpoint access with signed requests or API key validation.
- Add request validation and audit logs.
