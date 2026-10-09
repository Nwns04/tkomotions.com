import { formatDate, formatMoney } from '../utils/format.js';
import { removeMonetaryClaims } from '../utils/quotationCopy.js';
import ItemDescription from './ItemDescription.jsx';

function DocumentBrand({ settings }) {
  return <div className="doc-brand">{settings.logoUrl ? <img src={settings.logoUrl} alt="" /> : <span>TKO</span>}<div><strong>{settings.businessName || 'TKO Motions'}</strong><small>{settings.website || 'tkomotions.com'}</small>{settings.email && <small>{settings.email}</small>}{settings.phone && <small>{settings.phone}</small>}</div></div>;
}

function CancelledMark({ status }) {
  return status === 'Cancelled' ? <div className="cancelled-watermark" aria-label="Cancelled document">CANCELLED</div> : null;
}

export function InvoicePreview({ invoice, client, settings = {} }) {
  const items = invoice.items || [];
  const invoiceAccount = invoice.bankAccount || (invoice.currency === 'NGN' && settings.bankName ? {
    bankName: settings.bankName,
    accountName: settings.accountName,
    accountNumber: settings.accountNumber,
    ibanSwift: settings.ibanSwift,
  } : {});
  const accountDetails = [
    invoiceAccount.bankName,
    invoiceAccount.accountName,
    invoiceAccount.accountNumber,
    invoiceAccount.ibanSwift && `IBAN / SWIFT: ${invoiceAccount.ibanSwift}`,
  ].filter(Boolean);

  return (
    <article className="document invoice-document" id="print-document">
      <CancelledMark status={invoice.status} />
      <header>
        <DocumentBrand settings={settings} />
        <div className="doc-type"><h2>INVOICE</h2><strong>{invoice.number || 'Generated when saved'}</strong></div>
      </header>
      <section className="doc-party">
        <div><small>BILL TO</small><strong>{client?.name || 'Select a client'}</strong><span>{client?.company}</span><span>{client?.email}</span><span>{client?.address}</span></div>
        <div><small>ISSUE DATE</small><strong>{formatDate(invoice.issueDate)}</strong><small>DUE DATE</small><strong>{formatDate(invoice.dueDate)}</strong></div>
      </section>
      <table><thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>{items.map((item, index) => <tr key={index}><td><ItemDescription description={item.description} /></td><td>{item.quantity || 0}</td><td>{formatMoney(item.unitPriceMinor ?? item.unitPrice ?? 0, invoice.currency)}</td><td>{formatMoney(item.amount ?? Math.round((Number(item.quantity) || 0) * (Number(item.unitPriceMinor ?? item.unitPrice) || 0)), invoice.currency)}</td></tr>)}</tbody></table>
      <section className="doc-totals">
        <div><span>Subtotal</span><b>{formatMoney(invoice.subtotal, invoice.currency)}</b></div>
        {invoice.discountAmount > 0 && <div><span>Discount</span><b>− {formatMoney(invoice.discountAmount, invoice.currency)}</b></div>}
        {invoice.taxAmount > 0 && <div><span>Tax</span><b>{formatMoney(invoice.taxAmount, invoice.currency)}</b></div>}
        <div className="doc-grand"><span>Total</span><b>{formatMoney(invoice.total, invoice.currency)}</b></div>
        <div><span>Paid</span><b>{formatMoney(invoice.amountPaid || 0, invoice.currency)}</b></div>
        <div><span>Balance due</span><b>{formatMoney(invoice.balance ?? invoice.total, invoice.currency)}</b></div>
      </section>
      <section className="doc-notes">
        <div><small>PAYMENT INSTRUCTIONS</small><p>{invoice.paymentInstructions || settings.paymentInstructions || 'Payment details will appear here.'}</p>{accountDetails.length > 0 && <p>{accountDetails.join('\n')}</p>}</div>
        <div><small>NOTES & TERMS</small><p>{invoice.notes}</p><p>{invoice.terms || settings.defaultTerms}</p></div>
      </section>
      <footer>Thank you for working with TKO Motions.</footer>
    </article>
  );
}

export function ReceiptPreview({ receipt, settings = {} }) {
  const currency = receipt.invoice?.currency || receipt.currency || settings.defaultCurrency || 'NGN';
  const isFullyPaid = receipt.invoice && receipt.remainingBalance === 0;
  return <article className="document receipt-document" id="print-document"><CancelledMark status={receipt.status} /><header><DocumentBrand settings={settings} /><div className="doc-type"><h2>RECEIPT</h2><strong>{receipt.number || 'Generated when saved'}</strong></div></header><section className="receipt-heading"><div><small>RECEIVED FROM</small><strong>{receipt.client?.name || 'Select a client'}</strong><span>{receipt.client?.company}</span></div><div><small>PAYMENT DATE</small><strong>{formatDate(receipt.paymentDate)}</strong></div></section><section className="receipt-details"><div><small>AMOUNT RECEIVED</small><strong>{formatMoney(receipt.amount, currency)}</strong></div><div><small>PURPOSE</small><span>{receipt.purpose || '—'}</span></div><div><small>PAYMENT METHOD</small><span>{receipt.method || '—'}</span></div><div><small>REFERENCE</small><span>{receipt.reference || '—'}</span></div>{receipt.invoice && <><div><small>LINKED INVOICE</small><span>{receipt.invoice.number}</span></div><div><small>REMAINING BALANCE</small><span>{formatMoney(receipt.remainingBalance, currency)}</span></div></>}</section><section className="doc-notes receipt-notes"><div><small>NOTES</small><p>{receipt.notes || '—'}</p></div>{isFullyPaid && <div className="receipt-signature-preview">{settings.signatureUrl && <img src={settings.signatureUrl} alt="CEO signature" />}{settings.ceoName && <strong>{settings.ceoName}</strong>}{settings.ceoTitle && <span>{settings.ceoTitle}</span>}</div>}</section><footer>Thank you for working with TKO Motions.</footer></article>;
}

export function QuotationPreview({ quotation, client, settings = {} }) {
  const items = quotation.items || [];
  const formalCopy = removeMonetaryClaims(quotation.formalCopy);
  const renderList = (values) => values?.length ? <ul>{values.map((value, index) => <li key={`${value}-${index}`}>{value}</li>)}</ul> : <p>—</p>;
  return <article className="document quotation-document" id="print-document"><CancelledMark status={quotation.status} /><header><DocumentBrand settings={settings} /><div className="doc-type"><h2>QUOTATION</h2><strong>{quotation.number || 'Generated when saved'}</strong></div></header><section className="doc-party"><div><small>PREPARED FOR</small><strong>{client?.name || quotation.prospectName || 'Prospective client'}</strong><span>{client?.company}</span></div><div><small>ISSUE DATE</small><strong>{formatDate(quotation.issueDate)}</strong><small>VALID UNTIL</small><strong>{formatDate(quotation.validUntil)}</strong></div></section><section className="quote-intro"><small>{quotation.serviceCategory || 'PROPOSAL'}</small><h3>{quotation.title || 'Quotation title'}</h3>{quotation.summary && <p>{quotation.summary}</p>}{formalCopy && formalCopy !== quotation.summary && <p className="quote-formal-copy">{formalCopy}</p>}{quotation.formalCopy && quotation.formalCopy !== quotation.summary && <p className="quote-formal-copy">The total cost is {formatMoney(quotation.total, quotation.currency)}.</p>}</section><table><thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>{items.map((item, index) => <tr key={index}><td>{item.description || 'Service item'}</td><td>{item.quantity || 0}</td><td>{formatMoney(item.unitPriceMinor ?? item.unitPrice ?? 0, quotation.currency)}</td><td>{formatMoney(item.amount ?? Math.round((Number(item.quantity) || 0) * (Number(item.unitPriceMinor ?? item.unitPrice) || 0)), quotation.currency)}</td></tr>)}</tbody></table><section className="doc-totals"><div><span>Subtotal</span><b>{formatMoney(quotation.subtotal, quotation.currency)}</b></div>{quotation.discountAmount > 0 && <div><span>Discount</span><b>− {formatMoney(quotation.discountAmount, quotation.currency)}</b></div>}{quotation.taxAmount > 0 && <div><span>Tax</span><b>{formatMoney(quotation.taxAmount, quotation.currency)}</b></div>}<div className="doc-grand"><span>Proposed total</span><b>{formatMoney(quotation.total, quotation.currency)}</b></div></section><section className="quote-scope"><div><small>INCLUDED</small>{renderList(quotation.includedFeatures)}</div><div><small>NOT INCLUDED</small>{renderList(quotation.excludedFeatures)}</div><div><small>ASSUMPTIONS</small>{renderList(quotation.assumptions)}</div><div><small>OPTIONAL ADDITIONS</small>{renderList(quotation.optionalAdditions)}</div><div><small>PAYMENT TERMS</small><p>{quotation.paymentTerms || settings.defaultTerms || '—'}</p></div></section><footer>We look forward to creating with you.</footer></article>;
}
