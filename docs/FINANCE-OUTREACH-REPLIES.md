# Outreach reply inbox

The Finance outreach page includes a Replies inbox, plus a Replies tab within each campaign. It shows sender, subject, received time and readable message text. Messages are rendered as text, including HTML-only messages, without executing email HTML or loading tracking images. Attachments remain in Resend; their names appear in the inbox and notification copy.

## Deployment configuration

Keep the verified Resend receiving address and signing secret already configured. Add these settings to Render, then deploy the updated application:

```ini
OUTREACH_REPLY_FORWARD_TO=temitopekehinde@tkomotions.com
OUTREACH_REPLY_OWNER_EMAIL=temitopekehinde@tkomotions.com
```

The Resend API key needs permission to retrieve received emails as well as send. OUTREACH_REPLY_OWNER_EMAIL identifies the internal staff account that owns otherwise unmatched messages. If that email does not identify a staff account, assignment is allowed only when exactly one active internal account exists. Public customer accounts never receive these records.

New signed incoming-email webhooks retrieve the email content, save the reply, stop matched follow-ups, and send a text notification copy to the configured mailbox. Reply-To on that copy is the original sender. Live sending must be enabled for notification copies. Destination addresses in the receiving domain are rejected to prevent loops. Failed or interrupted forwarding is held for review; do not retry in Resend without checking delivery first.

## Existing replies

Click **Import existing replies** in Finance to import a page of up to 25 received messages. This also matches the original contacts and stops remaining follow-ups. Import is repeatable and does not forward historical messages again. If there are more results, use **Import older replies**. The inbox itself also supports loading older saved messages.

This release intentionally does not mutate the production database or send notifications during local verification. After deployment, import the existing replies promptly, especially DB Studio Africa's different-address reply, before its next scheduled follow-up.

## Matching

New outreach uses a signed, contact-specific Reply-To alias within the same verified receiving domain. Existing emails can match an exact original-site contact link in the quoted email, then fall back to the sender address. Subject lines alone never determine a match. Unmatched replies stay in the owner's main inbox and can be explicitly linked to a sent contact. Link actions are owner-scoped, require CSRF, and atomically stop that contact's future follow-ups.

Replies and provider IDs are deduplicated per owner. A contact's reply and suppression history remains preserved. Incoming notification copies are separate from campaign emails and do not create new follow-up sequences.

## Historical import safeguards

Automatic matching and manual linking exclude contacts sent after the reply arrived. Missing or invalid historical received times leave the reply unlinked, with Time unavailable shown in the inbox. An unmatched reply with no resolvable internal owner returns HTTP 503 with a configuration message; its webhook is not marked complete and can be retried after OUTREACH_REPLY_OWNER_EMAIL is corrected. Other staff cannot claim replies already matched to another owner through import.
