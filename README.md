# TKO Motions + TKO Finance

The TKO Motions marketing site is a Next.js App Router application. Field notes are authored as MDX under `content/field-notes` and compiled by Velite. The private finance workspace remains at `/finance`, with its Express API under `/api/finance`. It covers clients, AI-assisted or manual quotations, invoices, payments, receipts, settings, and server-generated PDFs.

## TKO AI Sales Engine demo

`/solutions/ai-sales` hosts the public **TKO Properties** demonstration. Visitor messages and approved knowledge are stored in MongoDB. The secure contact form creates a deterministic, `DEMO`-scoped lead and creates an inspection request when selected. Staff must use the existing Finance session to access `/lead-dashboard`; the dashboard APIs do not return business data to public visitors.

Set `AI_PROVIDER=groq`, `AI_BASE_URL=https://api.groq.com/openai/v1`, `AI_API_KEY`, and `AI_MODEL=openai/gpt-oss-20b` for the demo assistant. `AI_PROVIDER=openai` supports a compatible OpenAI endpoint without rewriting business workflows.

## Stack

- Next.js 15, React 19, React Router, Tailwind CSS 4, GSAP, Velite, Axios
- Node.js and Express 5
- MongoDB and Mongoose
- Server-side sessions in MongoDB using an HTTP-only, secure cookie
- Puppeteer for server-rendered HTML-to-PDF documents

## Local setup

1. Install dependencies:

   ```powershell
   npm install
   ```

2. Copy `.env.example` to `.env` and set:

   ```env
   NODE_ENV=development
   PORT=3000
   FINANCE_PORT=4000
   MONGODB_URI=mongodb://127.0.0.1:27017/tko_finance
   SESSION_SECRET=use-at-least-32-random-characters-here
   APP_ORIGIN=http://localhost:5173
   FINANCE_API_ORIGIN=http://127.0.0.1:4000
   RESEND_API_KEY=
   RESEND_FROM_EMAIL=
   PUPPETEER_EXECUTABLE_PATH=
   BUSINESS_TIME_ZONE=Africa/Lagos
   ENSURE_DATABASE_INDEXES=true
   AI_PRIMARY_PROVIDER=gemini
   AI_FALLBACK_PROVIDER=groq
   GEMINI_API_KEY=
   GEMINI_MODEL=gemini-3.8-flash
   GROQ_API_KEY=
   GROQ_MODEL=openai/gpt-oss-120b
   ```

3. Create or update the single administrator account. Passwords must contain at least 12 characters:

   ```powershell
   npm run create-admin -- --email=owner@tkomotions.com --password=replace-with-a-strong-password --name="TKO Owner"
   ```

4. Start the Next.js site and Express API together:

   ```powershell
   npm run dev
   ```

5. Open `http://localhost:5173/` for the marketing site or `http://localhost:5173/finance/login` for the finance workspace.

Run `npm run dev:content` in a second terminal when editing MDX field notes; this regenerates the Velite collection as content changes.

There is no public registration route. Run `create-admin` again to rotate the password.

## Data model

MongoDB collections are created by Mongoose automatically:

- `users`
- `clients`
- `quotations` (line items are embedded so an approved commercial offer remains auditable)
- `catalogitems`
- `invoices` (line items are embedded for atomic document totals and audit consistency)
- `payments`
- `receipts`
- `businesssettings`
- `aiusagelogs` (operational metadata only; logs expire automatically after 180 days)
- `sessions`

All business records are owner-scoped. Public URLs use random UUIDs; customer-facing quotation, invoice, and receipt numbers use non-sequential `TKO-Q-YY-XXXXX`, `TKO-I-YY-XXXXX`, and `TKO-R-YY-XXXXX` formats. Monetary values are stored as integer minor units to avoid floating-point rounding errors.

## Quotation intelligence

The AI layer is optional and provider-independent. Gemini is the configured primary provider and Groq Cloud is the fallback. Both adapters return the same strictly validated quotation schema. Provider errors, timeouts, rate limits, missing keys, unavailable models, and invalid structured output trigger bounded retry/failover. If both providers fail, the editor stays usable in manual mode and preserves the user's draft.

AI never creates authoritative totals or publishes a document. The server reconciles recognized catalog items to MongoDB prices, validates all generated fields, and calculates discounts, tax, and totals deterministically. A user must review and save the quotation, approve it, and then explicitly convert it into a draft invoice. Payments and receipts continue through the existing invoice workflow.

Provider keys stay server-side. Prompts contain only the minimum quotation context: requirements, currency, target budget, selected catalog records, an optional display name, and the current safe draft. Contact details and payment history are excluded. `/finance/settings/ai` shows provider availability, fallback activity, usage metadata, and the service catalog without exposing secrets or raw prompts.

No data migrations are required for a new database. On startup, `ENSURE_DATABASE_INDEXES=true` creates every declared application index without dropping unrelated indexes. Keep this enabled for the current MVP so uniqueness constraints are present on a fresh Render deployment.

Payment, linked-receipt, and quotation-conversion writes use MongoDB transactions. Use MongoDB Atlas or another replica-set-capable MongoDB deployment in development and production; standalone MongoDB servers do not support these transactions.

## Production deployment on Render

The included `render.yaml` configures one Node web service. Next.js serves the public site on Render's assigned `PORT`; Express listens on the internal `FINANCE_PORT`, and Next.js rewrites `/api/*` requests to it.

1. Create a MongoDB Atlas database and allow the Render service to connect.
2. Connect this repository to Render using the Blueprint or create a Node web service manually.
3. Set these secrets in Render:
   - `MONGODB_URI`
   - `SESSION_SECRET` (32+ random characters)
   - `APP_ORIGIN=https://tkomotions.com`
   - `RESEND_API_KEY` and `RESEND_FROM_EMAIL` for project enquiry delivery
   - `GEMINI_API_KEY`
   - `GROQ_API_KEY`
   - Keep `ENSURE_DATABASE_INDEXES=true` and `BUSINESS_TIME_ZONE=Africa/Lagos` unless the business timezone changes.
4. Build command: `npm ci && npm run build` (Velite runs before `next build`)
5. Start command: `npm start`
6. Point `tkomotions.com` at the Render service and ensure HTTPS is active.
7. Open a Render shell once and run the `npm run create-admin -- ...` command above.

Puppeteer downloads a compatible Chrome binary during `npm ci`. If the host supplies Chrome separately, set `PUPPETEER_EXECUTABLE_PATH` to that executable. Set `FINANCE_API_ORIGIN` only when the finance API is not listening at `127.0.0.1:4000`.

## Finance login outage diagnosis

The production launcher requires both MONGODB_URI and SESSION_SECRET. It loads local .env settings before launching processes. If either the website or Finance API exits unexpectedly, the launcher stops both with a failure status so Render can recover the service. /api/health checks the Finance API and its database at runtime and returns 503 while unavailable; it no longer reports success for the website alone.

If /api/finance/auth/session returns a plain-text 500, inspect Render logs for the backend startup failure or proxy connection error. Check required secrets, SESSION_SECRET length (32+ characters), the MongoDB Atlas network allowlist and database user permissions, and that the service uses npm start rather than next start. FINANCE_API_ORIGIN must point to the actual internal API listener; remove a stale override when using the default port 4000. Authentication failures normally return JSON with 401; a proxy 500 is not evidence of an incorrect password. Do not reset accounts to resolve a backend outage.

## Security notes

- Passwords are hashed with bcrypt (cost 12).
- Authentication uses a Mongo-backed, HTTP-only, `SameSite=Strict` cookie; no token is stored in browser storage or a URL.
- Mutations require a session-bound CSRF token.
- Login attempts are rate-limited.
- Helmet security headers, strict request schemas, owner-scoped database queries, random public IDs, and HTML escaping in PDF templates are enabled.
- Paid/cancelled documents are locked or retained rather than silently removed.
- Confirmed payments cannot exceed an invoice balance.

## Verification

```powershell
npm run lint
npm test
npm run build
npm audit --omit=dev
```

The tests cover percentage discounts, taxes, business-time-zone overdue status, receipt currencies, AI attestation integrity, valid primary-provider output, schema failures, rate limits, timeouts, unavailable models, missing keys, fallback success, and manual-mode degradation. Full authenticated workflow testing requires a reachable replica-set MongoDB instance and a bootstrapped administrator.

## Current MVP boundaries

This release intentionally excludes registration, customer accounts, payment gateways, automated email, reminders, payroll, expenses, tax filing, stock inventory, recurring billing, and double-entry bookkeeping. AI cannot silently publish or change catalog pricing. Documents use the configured HTTPS logo URL when one is provided and fall back to the typographic TKO brand mark.
