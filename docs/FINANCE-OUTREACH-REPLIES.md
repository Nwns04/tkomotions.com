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

## Conversation view

Outreach home shows a Replies button with the unread incoming-message count. The dedicated inbox lists conversations, with Unread and Unmatched filters and campaign-specific access through each campaign's Replies button. Opening a conversation shows the original outreach, sent follow-ups, incoming replies, and your own responses in chronological order. Earlier messages and older conversations are paginated. Automatic and manual refreshes reload the conversation pages already opened, preserving older pages and their pagination position. List requests run sequentially, and results from a previous campaign view are ignored.

Read receipts mark only the incoming messages actually loaded in the visible conversation. Incoming mail that arrives during loading remains unread until displayed. Quoted email history can be expanded separately from the new response. Draft text is kept when switching conversations within the inbox.

The composer previews the latest respondent's email address. Sending uses the configured Resend sender, a signed receiving alias, and In-Reply-To/References headers from the received email. Existing received messages fetch their original threading ID from Resend when needed. No additional environment keys are required beyond live sending and receiving already configured. If a newer reply arrives before sending, the server rejects the stale response before creating or sending an email. The draft is preserved, the latest reply and recipient are refreshed, and the user can review them and send the unchanged draft again. This explicit rejection resets the send request identity; uncertain delivery errors keep the original identity.

Responses are saved before transport and protected by a request ID, provider idempotency key, and an owner/contact sending lock. Uncertain transport results are held for delivery review and cannot be automatically retried. A stop or archive detected before transport cancels the response. Suppressed contacts and archived campaigns cannot receive new responses. Sending a human response never re-enables automated follow-ups. Delivery webhooks update the sent bubble's delivery state.

## Attachments

The reply composer supports up to five files with a combined raw size of 5 MB. Supported filenames end in PDF, DOC/DOCX, XLS/XLSX, PPT/PPTX, PNG, JPG/JPEG, GIF, WEBP, TXT, CSV or ZIP. A text response is still required. Select **Attach files**, review filenames and sizes, remove unwanted files, and send the reply. Files stay with the draft when switching conversations within the inbox and when delivery needs review. Successful sending clears the draft files.

The server validates file count, decoded size, filenames and Base64 content. Base64 validation scans the alphabet and padding without repeating regex groups, including at the full 5 MB boundary. File metadata and SHA-256 digests are stored with the outgoing message; file contents are passed directly to Resend and are not stored in MongoDB. Reusing a send request with different files is rejected, while an identical accepted request returns the existing result.

Received attachments and successfully sent response attachments have **Download** buttons. Each download checks the staff session, owning account, conversation, message and attachment before requesting a fresh Resend download URL. Old incoming records without provider attachment IDs are matched against Resend by filename and size; ambiguous incoming matches require checking the original in Resend. Sent files with identical filenames and sizes are matched by comparing the downloaded content against the stored SHA-256 digest. The matching provider attachment ID is saved for later downloads, so provider list order never decides which file is downloaded. The app downloads from Resend CDN hosts only, without sending the API key to the CDN, and forces a file download rather than rendering the file inline. Files larger than 40 MB must be opened in Resend.

The send endpoint alone accepts JSON up to 8 MB to allow Base64 encoding; other endpoints keep their existing limits. Existing Resend receiving/read permissions are required for attachment retrieval. No new environment settings or dependencies are required.

Provider references: [sending attachments](https://resend.com/docs/api-reference/emails/send-email#body-parameters), [received attachment retrieval](https://resend.com/docs/api-reference/emails/retrieve-received-email-attachment).
