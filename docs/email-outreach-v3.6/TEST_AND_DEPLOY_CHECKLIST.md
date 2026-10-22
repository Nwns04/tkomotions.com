# TKO Outreach v3.3 — staging deployment & acceptance checklist

1. Back up database and code. Do not test first on production contacts.
2. Merge only these feature source files into the full TKO Finance host repo; check its auth, CSRF, route mounting and MongoDB model imports.
3. Inspect `db.outreachleads.getIndexes()` and only then perform the documented *specific* old unique-index migration. Verify new compound index exists.
4. Install host dependencies, build the React app and run `node --test server/tests/outreach.test.mjs server/tests/outreach.integration.test.mjs` with a disposable MongoDB database.
5. Verify signed Resend webhook mounted before JSON parser. Configure a verified sending domain and controlled test reply-to address.
6. Import the supplied 20-contact CSV in draft mode. It must show 20 rows, two follow-ups each, no sends.
7. Create separate campaigns, import another CSV, reject same-campaign duplicates and prevent simultaneous sequences to same recipient in different campaigns.
8. Schedule one contact for a future time. Confirm manual Send is blocked until unscheduled.
9. Schedule 3 test contacts staggered 5 minutes. Confirm correct persisted UTC timestamps; pause campaign and confirm nothing sends.
10. Test a simulated partial schedule failure (database error after first write); confirm no partial schedules and no orphan leases remain.
11. Test one real controlled delivery with automatic follow-ups disabled. Verify provider ID, delivery status and unsubscribe endpoint.
12. Test reply detection to the configured incoming webhook; confirm pending follow-ups become ineligible. Test webhook replay.
13. Test opt-out, bounce/complaint handling and no unwanted subsequent sends.
14. Test two follow-up stages on test inboxes using shortened fixture delays, not by editing production records.
15. Restart scheduler during a pending job and verify it resumes without duplicate sends; check needs-review cases manually.
16. Keep live campaign sends disabled until all checks above pass and sending policies are approved.

**Open limitations**: no transaction-based bulk scheduling, no durable independent task queue, no threaded inbox reconciliation, no business-hours schedule policy, no host build/live Resend evidence in this ZIP.
