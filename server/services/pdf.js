import puppeteer from "puppeteer";
import { env } from "../config/env.js";
import { removeMonetaryClaims } from "./quotationCopy.js";

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const formatDate = (value) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));

const formatMoney = (amount, currency) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(amount || 0) / 100);

function safeLogoUrl(value) {
  if (
    /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(
      value || ""
    )
  )
    return value;
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    const privateHost =
      hostname === "localhost" ||
      hostname === "::1" ||
      hostname.startsWith("127.") ||
      hostname.startsWith("10.") ||
      hostname.startsWith("192.168.") ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
      hostname.startsWith("169.254.");
    return url.protocol === "https:" && !privateHost ? url.href : "";
  } catch {
    return "";
  }
}

function shell(title, number, settings, body, status = "") {
  const logo = safeLogoUrl(settings.logoUrl);
  const contact = [
    settings.website || "tkomotions.com",
    settings.email,
    settings.phone,
  ]
    .filter(Boolean)
    .map((item) => `<div class="muted">${escapeHtml(item)}</div>`)
    .join("");
  const statusBadge =
    status && status !== "Paid"
      ? `<span class="badge badge-${status
          .toLowerCase()
          .replace(/\s+/g, "-")}">${escapeHtml(status)}</span>`
      : "";
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page { size: A4; margin: 15mm; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body {
      position: relative;
      color: #111827;
      font-family: Arial, sans-serif;
      font-size: 12px;
      line-height: 1.6;
      background: #ffffff;
    }
    .top { display:flex; justify-content:space-between; gap:28px; padding-bottom:22px; border-bottom:3px solid #14532d; position:relative; flex-shrink: 0; }
    .top::after { content:''; position:absolute; left:0; right:0; bottom:-6px; height:3px; background:#84cc16; }
    .brand { display:flex; align-items:center; gap:12px; }
    .mark { display:grid; place-items:center; width:46px; height:46px; border-radius:50%; background:#14532d; color:#ffffff; font-weight:800; font-size:16px; }
    .brand-logo { width:52px; height:52px; object-fit:contain; padding:4px; background:#f7fee7; border-radius:50%; border:2px solid #84cc16; }
    .business { font-size:18px; font-weight:800; color:#14532d; }
    .muted { color:#64746a; }
    .doc-title { margin:0; text-align:right; color:#14532d; font-size:28px; letter-spacing:.16em; font-weight:800; }
    .doc-title::after { content:''; display:block; width:70px; height:4px; background:#84cc16; margin:8px 0 0 auto; border-radius:2px; }
    .doc-number { display:inline-block; margin-top:10px; padding:5px 14px; background:#f7fee7; color:#14532d; font-weight:800; border:1px solid #84cc16; border-radius:999px; font-size:12px; letter-spacing:.04em; }
    .doc-meta { text-align:right; }
    .badge { display:inline-block; margin-left:8px; padding:4px 12px; border-radius:999px; font-size:10px; font-weight:800; letter-spacing:.1em; text-transform:uppercase; vertical-align:middle; }
    .badge-draft, .badge-sent { background:#e4ece7; color:#37443d; }
    .badge-overdue { background:#fee2e2; color:#991b1b; }
    .badge-cancelled { background:#fee2e2; color:#991b1b; }

    .grid { display:grid; grid-template-columns:1fr 1fr; gap:24px; margin:32px 0; }
    .grid .right { text-align:right; }
    .label { margin-bottom:6px; color:#14532d; font-size:9px; font-weight:800; letter-spacing:.14em; text-transform:uppercase; }
    .strong { font-weight:800; font-size:14px; color:#14532d; }

    .card { padding:16px 18px; background:#f7fee7; border-left:4px solid #84cc16; border-radius:6px; }
    .card-plain { padding:16px 18px; background:#ffffff; border:1px solid #e4ece7; border-radius:6px; }
    .card-dark { padding:16px 18px; background:#14532d; color:#ffffff; border-radius:6px; }
    .card-dark .label { color:#a3e635; }
    .card-dark .strong { color:#ffffff; }

    .date-card { display:inline-block; padding:12px 18px; background:#f7fee7; border-left:4px solid #84cc16; border-radius:6px; margin-left:12px; text-align:left; min-width:160px; }
    .date-card.primary { background:#14532d; border-left-color:#84cc16; }
    .date-card.primary .label { color:#a3e635; }
    .date-card.primary .date-value { color:#ffffff; }
    .date-value { font-weight:800; font-size:14px; color:#14532d; }

    table { width:100%; border-collapse:separate; border-spacing:0; margin-top:8px; overflow:hidden; border-radius:6px; }
    thead th { padding:12px 10px; background:#14532d; color:#ffffff; font-size:9px; letter-spacing:.1em; text-transform:uppercase; text-align:left; font-weight:800; }
    thead th:first-child { border-top-left-radius:6px; }
    thead th:last-child { border-top-right-radius:6px; }
    tbody td { padding:12px 10px; border-bottom:1px solid #e4ece7; vertical-align:top; }
    tbody tr:nth-child(even) td { background:#f7fee7; }
    tbody tr:last-child td { border-bottom:0; }
    th.num, td.num { text-align:right; }
    tbody td.num { font-weight:700; color:#14532d; }
    tr { break-inside:avoid; page-break-inside:avoid; }

    .totals { width:340px; margin:24px 0 32px auto; }
    .totals .row { display:flex; justify-content:space-between; padding:7px 14px; }
    .totals .row.sub { color:#37443d; }
    .totals .row.discount { color:#991b1b; }
    .totals .grand { margin-top:10px; padding:14px 16px; background:#14532d; color:#ffffff; font-size:15px; font-weight:800; border-radius:6px; display:flex; justify-content:space-between; }
    .totals .grand .lime { color:#a3e635; }
    .totals .balance { margin-top:8px; padding:14px 16px; background:#f7fee7; border:2px solid #84cc16; border-radius:6px; display:flex; justify-content:space-between; font-size:15px; font-weight:800; color:#14532d; }

    .two-col { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-top:26px; }
    .stack > * + * { margin-top:16px; }
    .note { white-space:pre-wrap; color:#37443d; }

    .list-card { padding:14px 16px; background:#ffffff; border:1px solid #e4ece7; border-radius:6px; break-inside:avoid; page-break-inside:avoid; }
    .list-card .list-head { display:flex; align-items:center; gap:8px; margin-bottom:10px; font-size:10px; font-weight:800; letter-spacing:.12em; text-transform:uppercase; }
    .list-card .list-head::before { content:''; width:10px; height:10px; border-radius:2px; background:#84cc16; }
    .list-card.excluded .list-head::before { background:#991b1b; }
    .list-card.assumptions .list-head::before { background:#84cc16; }
    .list-card.optional { background:#f7fee7; border-color:#84cc16; }
    .list-card ul { margin:0; padding:0; list-style:none; }
    .list-card li { position:relative; padding:4px 0 4px 18px; color:#37443d; }
    .list-card li::before { content:''; position:absolute; left:0; top:11px; width:8px; height:8px; background:#84cc16; border-radius:2px; }
    .list-card.excluded li::before { background:#991b1b; }
    .empty { color:#94a3a0; font-style:italic; }

    .callout { padding:16px 20px; background:#f7fee7; border-left:5px solid #84cc16; border-radius:6px; margin:20px 0; }
    .callout .headline { font-size:16px; font-weight:800; color:#14532d; }

    .hero-amount { text-align:center; padding:28px 20px; background:#f7fee7; border:2px solid #84cc16; border-radius:10px; margin:26px 0; }
    .hero-amount .label { color:#14532d; }
    .hero-amount .amount { font-size:38px; font-weight:900; color:#14532d; letter-spacing:-.01em; line-height:1.1; margin-top:4px; }
    .hero-amount .rule { width:60px; height:4px; background:#84cc16; margin:12px auto 0; border-radius:2px; }

    .kv { display:grid; grid-template-columns:180px 1fr; gap:0; }
    .kv > div { padding:12px 16px; border-bottom:1px solid #e4ece7; }
    .kv > div:nth-last-child(-n+2) { border-bottom:0; }
    .kv .k { color:#64746a; font-size:10px; font-weight:800; letter-spacing:.1em; text-transform:uppercase; }
    .kv .v { color:#14532d; font-weight:700; }

    .paid-stamp { display:inline-block; padding:10px 22px; background:#f7fee7; border:2px solid #84cc16; color:#14532d; font-size:16px; font-weight:900; letter-spacing:.18em; transform:rotate(-4deg); border-radius:6px; }
    .paid-inline { display:inline-block; padding:6px 14px; background:#14532d; color:#a3e635; font-size:11px; font-weight:800; letter-spacing:.12em; border-radius:999px; }
    .receipt-signature { display:inline-grid; justify-items:center; min-width:150px; max-width:210px; color:#14532d; text-align:center; }
    .receipt-signature img { display:block; width:180px; height:64px; object-fit:contain; }
    .receipt-signature strong { padding-top:5px; border-top:1px solid #14532d; font-size:11px; }
    .receipt-signature span { margin-top:2px; color:#64746a; font-size:9px; }

    .watermark { position:fixed; top:42%; left:8%; right:8%; z-index:10; color:rgba(153,27,27,.16); font-size:72px; font-weight:900; letter-spacing:.16em; text-align:center; transform:rotate(-24deg); pointer-events:none; }

    /* Force follow-up section onto a fresh page */
    .page-break { break-before: page; page-break-before: always; }

  </style><title>${escapeHtml(title)} ${escapeHtml(number)}</title></head><body>
  ${status === "Cancelled" ? '<div class="watermark">CANCELLED</div>' : ""}
  <div class="top">
    <div>
      <div class="brand">
        ${
          logo
            ? `<img class="brand-logo" src="${escapeHtml(logo)}" alt="">`
            : '<div class="mark">TKO</div>'
        }
        <div>
          <div class="business">${escapeHtml(
            settings.businessName || "TKO Motions"
          )}</div>
          ${contact}
        </div>
      </div>
    </div>
    <div class="doc-meta">
      <h1 class="doc-title">${escapeHtml(title)}</h1>
      <div><span class="doc-number">${escapeHtml(
        number
      )}</span>${statusBadge}</div>
    </div>
  </div>
  <div class="content">${body}</div>
  </body></html>`;
}

function invoiceHtml(invoice, settings) {
  const client = invoice.client || {};
  const account =
    invoice.bankAccount ||
    (invoice.currency === "NGN" && settings.bankName ? settings : {});
  const accountRows = [
    ["Bank name", account.bankName],
    ["Account name", account.accountName],
    ["Account number", account.accountNumber],
    ["IBAN / SWIFT", account.ibanSwift],
  ]
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<div class="k">${escapeHtml(k)}</div><div class="v">${escapeHtml(
          v
        )}</div>`
    )
    .join("");

  const rows = invoice.items
    .map(
      (item) =>
        `<tr><td>${escapeHtml(item.description)}</td><td class="num">${
          item.quantity
        }</td><td class="num">${formatMoney(
          item.unitPrice,
          invoice.currency
        )}</td><td class="num">${formatMoney(
          item.amount,
          invoice.currency
        )}</td></tr>`
    )
    .join("");
  const balanceDue = Number(invoice.balance || 0);
  const isPaid = balanceDue === 0;

  const body = `
  <div class="grid">
    <div>
      <div class="card">
        <div class="label">Bill to</div>
        <div class="strong">${escapeHtml(client.name)}</div>
        <div>${escapeHtml(client.company)}</div>
        <div class="muted">${escapeHtml(client.email)}</div>
        <div class="muted">${escapeHtml(client.address)}</div>
      </div>
    </div>
    <div class="right">
      <div class="date-card">
        <div class="label">Issue date</div>
        <div class="date-value">${formatDate(invoice.issueDate)}</div>
      </div>
      <div class="date-card ${
        isPaid ? "" : "primary"
      }" style="margin-top:10px;">
        <div class="label">Due date</div>
        <div class="date-value">${formatDate(invoice.dueDate)}</div>
      </div>
    </div>
  </div>

  <table>
    <thead><tr><th>Description</th><th class="num">Qty</th><th class="num">Rate</th><th class="num">Amount</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="totals">
    <div class="row sub"><span>Subtotal</span><span>${formatMoney(
      invoice.subtotal,
      invoice.currency
    )}</span></div>
    ${
      invoice.discountAmount
        ? `<div class="row discount"><span>Discount</span><span>− ${formatMoney(
            invoice.discountAmount,
            invoice.currency
          )}</span></div>`
        : ""
    }
    ${
      invoice.taxAmount
        ? `<div class="row sub"><span>Tax</span><span>${formatMoney(
            invoice.taxAmount,
            invoice.currency
          )}</span></div>`
        : ""
    }
    <div class="grand"><span>Total</span><span class="lime">${formatMoney(
      invoice.total,
      invoice.currency
    )}</span></div>
    <div class="row sub"><span>Paid</span><span>${formatMoney(
      invoice.amountPaid,
      invoice.currency
    )}</span></div>
    ${
      isPaid
        ? `<div class="balance"><span>Balance</span><span>No balance outstanding</span></div>`
        : `<div class="balance"><span>Balance due</span><span>${formatMoney(
            invoice.balance,
            invoice.currency
          )}</span></div>`
    }
  </div>

  <div class="page-break"></div>

  <div class="stack">
    <div class="card-plain">
      <div class="label">Payment instructions</div>
      <div class="note">${escapeHtml(
        invoice.paymentInstructions || settings.paymentInstructions || "—"
      )}</div>
      ${
        accountRows
          ? `<div class="kv" style="margin-top:14px;">${accountRows}</div>`
          : ""
      }
    </div>
    <div class="card-plain">
      <div class="label">Notes & terms</div>
      <div class="note">${escapeHtml(invoice.notes || "")}</div>
      ${
        invoice.terms || settings.defaultTerms
          ? `<div class="note" style="margin-top:10px;">${escapeHtml(
              invoice.terms || settings.defaultTerms
            )}</div>`
          : ""
      }
    </div>
    ${
      isPaid
        ? `<div style="text-align:right; margin-top:8px;"><span class="paid-stamp">PAID</span></div>`
        : ""
    }
  </div>`;
  return shell("INVOICE", invoice.number, settings, body, invoice.status);
}

function quotationHtml(quotation, settings) {
  const client = quotation.client || {};
  const customerName =
    client.name || quotation.prospectName || "Prospective client";
  const formalCopy = removeMonetaryClaims(quotation.formalCopy);
  const rows = quotation.items
    .map(
      (item) =>
        `<tr><td>${escapeHtml(item.description)}</td><td class="num">${
          item.quantity
        }</td><td class="num">${formatMoney(
          item.unitPrice,
          quotation.currency
        )}</td><td class="num">${formatMoney(
          item.amount,
          quotation.currency
        )}</td></tr>`
    )
    .join("");

  const listCard = (label, items, variant = "") => {
    const has = Array.isArray(items) && items.length;
    if (!has) return "";
    return `<div class="list-card ${variant}">
      <div class="list-head">${escapeHtml(label)}</div>
      <ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    </div>`;
  };

  const summaryBlock =
    quotation.summary || formalCopy
      ? `
    <div class="callout">
      ${
        quotation.summary
          ? `<div class="headline">${escapeHtml(quotation.summary)}</div>`
          : ""
      }
      ${
        formalCopy && formalCopy !== quotation.summary
          ? `<div class="note" style="margin-top:8px;">${escapeHtml(
              formalCopy
            )}</div>`
          : ""
      }
      <div class="note" style="margin-top:10px;"><strong style="color:#14532d;">The total cost is ${escapeHtml(
        formatMoney(quotation.total, quotation.currency)
      )}.</strong></div>
    </div>`
      : "";

  const body = `
  <div class="grid">
    <div>
      <div class="card">
        <div class="label">Prepared for</div>
        <div class="strong">${escapeHtml(customerName)}</div>
        ${client.company ? `<div>${escapeHtml(client.company)}</div>` : ""}
      </div>
    </div>
    <div class="right">
      <div class="date-card">
        <div class="label">Issue date</div>
        <div class="date-value">${formatDate(quotation.issueDate)}</div>
      </div>
      <div class="date-card primary" style="margin-top:10px;">
        <div class="label">Valid until</div>
        <div class="date-value">${formatDate(quotation.validUntil)}</div>
      </div>
    </div>
  </div>

  ${
    quotation.title
      ? `<div class="label" style="margin-top:8px;">${escapeHtml(
          quotation.title
        )}</div>`
      : ""
  }
  ${summaryBlock}

  <table>
    <thead><tr><th>Description</th><th class="num">Qty</th><th class="num">Rate</th><th class="num">Amount</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="totals">
    <div class="row sub"><span>Subtotal</span><span>${formatMoney(
      quotation.subtotal,
      quotation.currency
    )}</span></div>
    ${
      quotation.discountAmount
        ? `<div class="row discount"><span>Discount</span><span>− ${formatMoney(
            quotation.discountAmount,
            quotation.currency
          )}</span></div>`
        : ""
    }
    ${
      quotation.taxAmount
        ? `<div class="row sub"><span>Tax</span><span>${formatMoney(
            quotation.taxAmount,
            quotation.currency
          )}</span></div>`
        : ""
    }
    <div class="grand"><span>Proposed total</span><span class="lime">${formatMoney(
      quotation.total,
      quotation.currency
    )}</span></div>
  </div>

  <div class="page-break"></div>

  <div class="two-col">
    <div class="stack">
      ${listCard("Included", quotation.includedFeatures)}
      ${listCard("Assumptions", quotation.assumptions, "assumptions")}
    </div>
    <div class="stack">
      ${listCard("Not included", quotation.excludedFeatures, "excluded")}
      ${listCard("Optional additions", quotation.optionalAdditions, "optional")}
    </div>
  </div>

  ${
    quotation.paymentTerms || settings.defaultTerms
      ? `
    <div class="card-plain" style="margin-top:20px;">
      <div class="label">Payment terms</div>
      <div class="note">${escapeHtml(
        quotation.paymentTerms || settings.defaultTerms
      )}</div>
    </div>`
      : ""
  }`;
  return shell("QUOTATION", quotation.number, settings, body, quotation.status);
}

function receiptHtml(receipt, settings) {
  const client = receipt.client || {};
  const invoice = receipt.invoice || null;
  const currency =
    receipt.currency || invoice?.currency || settings.defaultCurrency || "NGN";
  const remaining = Number(receipt.remainingBalance || 0);
  const isFullyPaid = invoice && remaining === 0;
  const signatureImage = /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(settings.signatureUrl || '')
    ? `<img src="${escapeHtml(settings.signatureUrl)}" alt="">`
    : '';

  const kvRows = [
    ["Amount received", formatMoney(receipt.amount, currency)],
    ["Purpose", receipt.purpose],
    ["Payment method", receipt.method],
    ["Reference", receipt.reference || "—"],
    invoice ? ["Linked invoice", invoice.number] : null,
    invoice ? ["Remaining balance", formatMoney(remaining, currency)] : null,
  ]
    .filter(Boolean)
    .map(
      ([k, v]) =>
        `<div class="k">${escapeHtml(k)}</div><div class="v">${escapeHtml(
          v
        )}</div>`
    )
    .join("");

  const body = `
  <div class="grid">
    <div>
      <div class="card">
        <div class="label">Received from</div>
        <div class="strong">${escapeHtml(client.name)}</div>
        ${client.company ? `<div>${escapeHtml(client.company)}</div>` : ""}
      </div>
    </div>
    <div class="right">
      <div class="date-card primary">
        <div class="label">Payment date</div>
        <div class="date-value">${formatDate(receipt.paymentDate)}</div>
      </div>
    </div>
  </div>

  <div class="hero-amount">
    <div class="label">Amount received</div>
    <div class="amount">${formatMoney(receipt.amount, currency)}</div>
    <div class="rule"></div>
  </div>

  <div class="card-plain">
    <div class="kv">${kvRows}</div>
  </div>

  <div class="two-col">
    <div class="card-plain">
      <div class="label">Notes</div>
      <div class="note">${escapeHtml(receipt.notes || "—")}</div>
    </div>
    <div style="text-align:right; padding-top:16px;">
      ${
        isFullyPaid
          ? `<div class="receipt-signature">${signatureImage}${settings.ceoName ? `<strong>${escapeHtml(settings.ceoName)}</strong>` : ''}${settings.ceoTitle ? `<span>${escapeHtml(settings.ceoTitle)}</span>` : ''}</div>`
          : invoice
          ? '<span class="paid-inline">PART PAYMENT</span>'
          : ""
      }
    </div>
  </div>`;
  return shell("RECEIPT", receipt.number, settings, body, receipt.status);
}

export async function renderDocumentPdf(type, document, settings) {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const page = await browser.newPage();
    const html =
      type === "invoice"
        ? invoiceHtml(document, settings)
        : type === "quotation"
        ? quotationHtml(document, settings)
        : receiptHtml(document, settings);
    await page.setContent(html, { waitUntil: "networkidle0" });
    return await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: true,
      headerTemplate: "<div></div>",
      footerTemplate: '<div style="width:100%; margin:0 15mm; padding-top:5px; border-top:2px solid #14532d; color:#64746a; font:8px Arial,sans-serif; text-align:center;">Thank you for working with <strong style="color:#14532d;">TKO Motions</strong>.</div>',
    });
  } finally {
    await browser.close();
  }
}
