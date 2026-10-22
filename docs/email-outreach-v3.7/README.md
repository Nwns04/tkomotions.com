# TKO Email Outreach source bundle

This bundle contains only the Email Outreach feature source from TKO Finance. It is an integration package, not a standalone application. The frontend expects the host app's React Router, shared Finance UI, authenticated Axios client, and staff auth context. The backend expects the host Express session/CSRF/auth middleware, MongoDB connection, and shared User model.

## Included

- `src/finance/pages/OutreachPage.jsx` and `outreach.css`
- `src/finance/utils/outreachCsv.js`
- `server/routes/outreach.routes.js`
- `server/models/Outreach.js`
- `server/services/outreach.js` and `outreachPolicy.js`
- Outreach unit and integration tests

## Host integration points

- Add the frontend route `outreach` under the authenticated Finance layout and add its navigation link, gated to staff with `canUseOutreach`.
- Mount `outreachPublicRouter` at `/api/finance/outreach` before the app's JSON body parser so signed Resend webhook requests retain their raw body. Mount the authenticated outreach router at the same path after the host session middleware is active.
- Start `startOutreachScheduler()` after the database connection, and stop its timer during server shutdown.
- Retain the host CSRF, staff-only, rate-limit, and global error-handler middleware. Do not expose the authenticated router as a public endpoint.
- The UI imports the host `src/api/client.js` and `src/finance/components/UI.jsx` modules. The backend imports the host auth/CSRF middleware, `User` model, and model serialization helper.

## Runtime configuration

Live sending stays disabled unless explicitly enabled and fully configured. Set these in the host server environment; never put credentials in frontend code:

- `RESEND_API_KEY`
- `OUTREACH_FROM_EMAIL` (or `RESEND_FROM_EMAIL`)
- `OUTREACH_REPLY_TO`
- `APP_ORIGIN` set to the production HTTPS origin
- `OUTREACH_LIVE_ENABLED=true` only after sender verification and testing
- For reply-aware automation: `OUTREACH_RECEIVING_ENABLED=true`, `OUTREACH_WEBHOOK_SECRET`, and `OUTREACH_AUTO_FOLLOWUP_ENABLED=true`

Configure Resend webhooks for received, delivered, bounced, failed, and complained events to `/api/finance/outreach/webhook`. The signed raw-body webhook must be mounted before JSON parsing. Automatic sending needs the scheduler process to remain online; verify production worker behavior before enabling it.

## Current feature scope

The upgraded data model supports two follow-ups per contact. CSV import creates drafts only; review and confirm each live email individually. Imports do not enable automation, and sends are blocked until a permission or other valid contact basis is recorded. The campaign CSVs and API secrets are intentionally not included in this source bundle.
## Upgrade: campaigns, CSV reuse and queued email scheduling

- Create a campaign from the Finance Outreach screen. Import additional CSV files into that campaign; duplicate emails **within that campaign** are skipped, not overwritten.
- CSV aliases accepted: `followup2`, `delayDays2` (or `followup2DelayDays`), `followup`, `delayDays`, and standard first-message fields. The example CSV template contains both follow-ups.
- Review each contact and add a truthful `permissionBasis` before scheduling. Imported leads always start as drafts with automation off.
- Select one or more contact checkboxes, enter local date and time and optional minute spacing; bulk schedule queues them. A campaign must be **active** for its due messages to send. Pausing a campaign prevents the worker from sending future steps.
- Follow-up 1 is due N days from the accepted initial send; follow-up 2 is due M days from that same initial send, and only after follow-up 1 was accepted. Defaults: 4 and 10 days. Replies or suppression stop both.
- The background scheduler processes due initial sends and subsequent follow-ups. Delivery via Resend still requires deployment and live environment configuration, a running scheduler, and a functioning inbound reply webhook.
- Absolute send instants are saved in UTC. The scheduling form converts the browser's local datetime. Verify the timezone before scheduling bulk outreach.

### Required MongoDB migration BEFORE deploying

The previous version created a unique `{ owner: 1, email: 1 }` index. That old index **must be removed explicitly** after backing up the database, or reusing the same address in different campaigns will still be blocked. In mongosh inspect `db.outreachleads.getIndexes()` and confirm the exact old index name; normally it is `owner_1_email_1`. Then, during a maintenance window, drop only that legacy unique index, e.g. `db.outreachleads.dropIndex('owner_1_email_1')` **after verifying the name**, and allow Mongoose to create the new `{ owner: 1, campaignId: 1, email: 1 }` partial unique index. Never drop the whole collection. Existing legacy contacts remain unassigned (`campaignId: null`) and are preserved.

### Deployment and testing limitations

This ZIP contains only a feature source subset: the surrounding application, dependencies, MongoDB instance, and Resend credentials are not present. Static JS syntax checks succeeded but full React compilation and end-to-end integration are **not verified**. Keep live sending disabled and test with test domains/inboxes before use. Future work should add persistent webhook event deduplication, threaded reply identifiers, more explicit schedule previews, and detailed retry/reconciliation flows for provider failures. Sending claims are intentionally held for manual review on ambiguous results to avoid accidental duplicates.

## v3.1 hardening and deployment checklist

- The supplied 20-contact outreach CSV now imports with typed `autoFollowup` booleans and numeric `delayDays` / `followup2DelayDays`. This CSV contains publicly published business inboxes; do not interpret them as explicit opt-in. Imports always disable automatic sends until contacts are reviewed.
- Bulk contact-basis editing is now available in the UI. Enter only a **truthful** and supportable lawful contact basis after reviewing recipients, relevance, local requirements and opt-outs. Bulk approval does not prove consent. Never fabricate a basis merely to enable sending.
- Bulk select eligible visible contacts, then schedule at an individual timestamp or a staggered set of timestamps. Campaigns must be activated first. Scheduling rejects duplicate email addresses in the selected set or an already-active sequence within the same account.
- Keep automatic follow-ups OFF until reply routing is verified. Existing webhook reply handling is sender-address based and may stop all active sequences for an address; it cannot monitor Gmail/Outlook unless replies reach Resend Receiving. This is intentionally conservative: a detected reply should stop contact, rather than risk an unwanted follow-up.
- Message provider acknowledgements mean **accepted**, not guaranteed delivered/read. Ambiguous sending results remain in manual review; do not blindly retry.
- For new code deployments, run integration tests with the actual TKO Finance host's dependency set and a disposable MongoDB database; review scheduler bootstrapping and worker uptime. The ZIP is a **feature-only integration package**, not a standalone deployable app.
- On production release, verify the old MongoDB unique index migration, event webhook routing before express.json(), HTTPS origin and unsubscribe endpoint, Resend sending identity, real test-inbox replies, opt-outs, duplicate suppression, campaign pauses, exact timezone, infrastructure and daily sending limits.
- Follow-up due dates count calendar days from the **accepted** initial send. The worker only sends due emails while running. No business-hour calendar is enforced yet; schedule initial messages accordingly. Webhook idempotency and exact reply-thread matching remain prospective enhancements, not verified production guarantees.

## v3.2 safety fixes (this package)

- Manual sending now rejects an initial email with a pending schedule. **Unschedule** first to explicitly override the calendar.
- Cross-campaign sequencing adds the `OutreachLease` collection, keyed uniquely by account and normalized recipient. Both individual live sends and bulk scheduling reserve that key. Concurrent requests cannot reserve two different sequences for one inbox; manual stop or unschedule of an unsent lead releases its key. A conservative 75-day expiration makes leases eventually reusable without relying on database TTL cleanup. Expiration is validated at acquisition; do not prematurely delete live leases. Other duplicate guards remain in place.
- Signed Resend webhooks now record `svix-id` in `OutreachWebhookEvent` to skip duplicate delivery. The event record is removed if processing fails so provider retries can reprocess it. This does **not** establish thread-level reply matching: received replies still conservatively stop all active sequences for the sender's address.
- `server/tests/outreach.integration.test.mjs` adds checks for premature manual sending and atomic reservation contention. These tests require the original TKO Finance host dependencies and the disposable database indicated by the test itself; they were NOT executed in this isolated feature-only workspace.

### Upgrade-specific notes

1. Back up the MongoDB database, confirm the legacy index migration in the previous section, and let the host create the new indexes (`OutreachLease.key`, `OutreachWebhookEvent.eventId`). A replica-set test database is recommended for integrated tests.
2. Reconfirm the webhook raw-body routing and sender-reply address configuration. Webhook deduplication is at the signed event level, not an inbox-sync substitute.
3. Confirm job worker uptime and a single Resend sender configuration. Leases prevent competing recipient sequences, but a worker outage delays due sends, and an ambiguous Resend response remains in human-review state rather than auto-retrying.
4. Validate campaign pause, opt-out, bounce, early-send prevention, same-address scheduling races, and customer reply cancellation with test mailboxes before turning on live sending.
5. Do not equate source-level syntax checks with production readiness. This package still needs full host compilation, database-backed test execution, deployment review, and live mailbox testing. Inbound message threading, business-hour delivery constraints, and paginated lead lists are not implemented.


## v3.3 clean-up for deployment testing (2026-10-22)

- Recipient reservations now stay held through their actual sequence instead of expiring after 75 calendar days. Reservations are released after the final accepted step, a recorded reply, suppression, failure, or staff stop. Reservations in `needs-review` intentionally remain held until an administrator reconciles provider status. Do not automatically clear unknown-send records.
- Bulk scheduling now returns only after all updates succeed. If any update fails, it rolls back eligible writes and newly acquired reservations. This is *compensating rollback*, not a MongoDB ACID transaction: process crashes and conflicting concurrent changes may still require reconciliation.
- The file remains a **feature bundle**, not the entire TKO Finance app. Do not deploy it by itself. Replace the corresponding source files in a staging checkout of the actual host. Make a database backup and migrate old MongoDB indexes as documented above.
- Automated unit/integration tests and the host build are not certified in this bundle. Validate under an installed host app with disposable MongoDB before enabling `OUTREACH_LIVE_ENABLED`.
- Resend reply routing is still sender-address-based, not conversation-thread-specific. Until inbound delivery is tested, leave `OUTREACH_AUTO_FOLLOWUP_ENABLED` off. Do not assume Gmail/Outlook replies are monitored.
- Recommended staged acceptance: CSV import > individual schedule > staggered batch > pause > manual early-send rejection > webhook duplicate > reply/opt-out stop > actual two-step follow-up (test inboxes).


## Campaign-first UX update (October 2026)

`OutreachPage.jsx` now uses a campaign dashboard and guided five-step campaign setup (name, CSV import, contact review, sending preferences, finish). Opening an existing campaign leads to its management workspace with contacts and emails, sent emails, follow-ups, activity, and campaign settings. Existing API endpoints and delivery safeguards remain unchanged.

Important limitations: the API creates the campaign on the first wizard step. Settings such as the unscheduled date/spacing remain browser-state preferences until contacts are explicitly scheduled, and the account-wide activity feed has no campaign association. The primary API returns only the newest 1,000 contacts, so displayed campaign contact totals are limited to loaded records. A production implementation requiring resumable wizard progress or permanent per-campaign settings will need additional backend work.


## v3.5 Campaign workflow updates
- Wizard progress (`setupStep`, `setupComplete`) and send defaults are persisted on each campaign in MongoDB via authenticated, CSRF-protected `PATCH /outreach/campaigns/:id/settings`. Existing v3.4 campaigns lacking setupComplete will appear unfinished; complete their wizard before using the workspace.
- Import moves to review while persisting setup progress. Finishing the wizard never sends or schedules.
- Activity events now include campaignId on newly recorded events; prior events are matched via loaded lead IDs where possible. The account activity API still returns the latest 50 records, so old activity may not be shown.
- Contact actions use an expandable action menu. Scheduling lives in a separate modal from saved General Settings.
- Full app build/integration requires original repository dependencies and deployment configuration, not included in this source patch package.

## v3.6 CSV import experience and diagnostics
- CSV selection now parses locally, displays recognized fields and basic email-format counts, and requires a separate explicit import confirmation. Unrecognized headers must be renamed using the template; custom interactive field mapping is not yet implemented.
- Import success is now distinguished from a subsequent wizard-progress save failure. A progress-save failure does not offer a blind re-import and keeps the user on the review step.
- Expandable import diagnostics show phases, counts, HTTP status and safe error messages, with downloadable text logs and browser console output. CSV rows, message bodies and credentials are not intentionally logged; server error messages are redacted for email addresses.
- This is a frontend-only improvement within the feature bundle. Full host compilation, actual network requests and database-backed tests still require the host application. A network timeout during import can leave the commit ambiguous: check campaign contacts before retrying.


## v3.7 server-terminal CSV import diagnostics

The `/import` endpoint now writes structured `[outreach-import]` JSON lines to the **backend Node.js terminal / host process logs**, including a unique `ref`, request row count, current phase, CSV row number, number saved, skipped count, elapsed time, error name, MongoDB numeric error code and safe schema field names. It never prints CSV content, email addresses, recipient names, credentials or exception messages. Errors return the same reference to the frontend diagnostics and report how many rows were saved before the failure (not a transaction guarantee).

Use the server process logs for the new reference; browser DevTools shows only the associated HTTP failure. Check the database for partially imported contacts before retrying. Potential causes include MongoDB validation errors and an unmigrated legacy unique index: inspect `db.outreachleads.getIndexes()` without exposing contact details. The ZIP is still a feature-only bundle; merge into the full host and test.
