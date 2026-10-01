import { useEffect, useState } from 'react';
import { api, apiMessage } from '../../api/client.js';
import { Button, Field, LinkButton, LoadingBlock, Notice, PageHeader } from '../components/UI.jsx';

const emptyBankAccount = (currency) => ({ currency, bankName: '', accountName: '', accountNumber: '', ibanSwift: '' });
const currencies = ['NGN', 'USD', 'GBP'];
const fields = { businessName: 'TKO Motions', logoUrl: '', ceoName: '', ceoTitle: 'CEO', signatureUrl: '', email: '', phone: '', address: '', website: 'https://tkomotions.com', defaultCurrency: 'NGN', bankAccounts: currencies.map(emptyBankAccount), paymentInstructions: '', defaultTerms: '', defaultTaxRate: 0 };

export default function SettingsPage() {
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState({ type: 'error', text: '' });
  const [logoBusy, setLogoBusy] = useState(false);
  const [signatureBusy, setSignatureBusy] = useState(false);

  useEffect(() => {
    api.get('/settings')
      .then(({ data }) => {
        const bankAccounts = currencies.map((currency) => data.settings.bankAccounts?.find((account) => account.currency === currency) || (currency === 'NGN' ? { ...emptyBankAccount(currency), bankName: data.settings.bankName || '', accountName: data.settings.accountName || '', accountNumber: data.settings.accountNumber || '', ibanSwift: data.settings.ibanSwift || '' } : emptyBankAccount(currency)));
        setForm({ ...Object.fromEntries(Object.keys(fields).filter((key) => key !== 'bankAccounts').map((key) => [key, data.settings[key] ?? fields[key]])), bankAccounts });
      })
      .catch((error) => setNotice({ type: 'error', text: apiMessage(error) }));
  }, []);

  const change = (key) => (event) => setForm({ ...form, [key]: event.target.value });

  const changeBankAccount = (currency, key) => (event) => setForm({ ...form, bankAccounts: form.bankAccounts.map((account) => account.currency === currency ? { ...account, [key]: event.target.value } : account) });

  async function submit(event) {
    event.preventDefault(); setBusy(true); setNotice({ type: 'error', text: '' });
    try {
      const ngnAccount = form.bankAccounts.find((account) => account.currency === 'NGN') || emptyBankAccount('NGN');
      const { data } = await api.put('/settings', { ...form, ...{ bankName: ngnAccount.bankName, accountName: ngnAccount.accountName, accountNumber: ngnAccount.accountNumber, ibanSwift: ngnAccount.ibanSwift }, defaultTaxRate: Number(form.defaultTaxRate) });
      setForm(data.settings);
      setNotice({ type: 'success', text: 'Business settings saved.' });
    } catch (error) { setNotice({ type: 'error', text: apiMessage(error) }); }
    finally { setBusy(false); }
  }

  async function uploadLogo(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = '';
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 700 * 1024) {
      setNotice({ type: 'error', text: 'Choose a PNG, JPEG, or WebP image smaller than 700 KB.' });
      return;
    }

    setLogoBusy(true);
    setNotice({ type: 'error', text: '' });
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Could not read the selected image.'));
        reader.readAsDataURL(file);
      });
      const { data } = await api.post('/settings/logo', { dataUrl });
      setForm((current) => ({ ...current, logoUrl: data.logoUrl }));
      setNotice({ type: 'success', text: 'Logo uploaded.' });
    } catch (error) { setNotice({ type: 'error', text: apiMessage(error) }); }
    finally { setLogoBusy(false); }
  }

  async function removeLogo() {
    setLogoBusy(true);
    try {
      await api.delete('/settings/logo');
      setForm((current) => ({ ...current, logoUrl: '' }));
      setNotice({ type: 'success', text: 'Logo removed.' });
    } catch (error) { setNotice({ type: 'error', text: apiMessage(error) }); }
    finally { setLogoBusy(false); }
  }

  async function uploadSignature(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = '';
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 700 * 1024) {
      setNotice({ type: 'error', text: 'Choose a PNG, JPEG, or WebP signature image smaller than 700 KB.' });
      return;
    }

    setSignatureBusy(true);
    setNotice({ type: 'error', text: '' });
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Could not read the selected signature image.'));
        reader.readAsDataURL(file);
      });
      const { data } = await api.post('/settings/signature', { dataUrl });
      setForm((current) => ({ ...current, signatureUrl: data.signatureUrl }));
      setNotice({ type: 'success', text: 'CEO signature uploaded.' });
    } catch (error) { setNotice({ type: 'error', text: apiMessage(error) }); }
    finally { setSignatureBusy(false); }
  }

  async function removeSignature() {
    setSignatureBusy(true);
    try {
      await api.delete('/settings/signature');
      setForm((current) => ({ ...current, signatureUrl: '' }));
      setNotice({ type: 'success', text: 'CEO signature removed.' });
    } catch (error) { setNotice({ type: 'error', text: apiMessage(error) }); }
    finally { setSignatureBusy(false); }
  }

  return <><PageHeader eyebrow="Workspace" title="Business settings" description="These details automatically populate new invoices and receipts." actions={<LinkButton to="/finance/settings/ai" variant="secondary">AI & catalog status</LinkButton>} />{!form ? <LoadingBlock /> : <form className="editor-card settings-form" onSubmit={submit}><Notice type={notice.type}>{notice.text}</Notice><section><div className="form-section-title"><span>01</span><div><h2>Business identity</h2><p>Public details displayed on documents.</p></div></div><div className="form-grid"><Field label="Business name"><input value={form.businessName} onChange={change('businessName')} required /></Field><Field label="Business logo"><input type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadLogo} disabled={logoBusy} />{form.logoUrl && <div className="logo-upload-preview"><img src={form.logoUrl} alt="Current business logo" /><Button type="button" variant="secondary" disabled={logoBusy} onClick={removeLogo}>{logoBusy ? 'Working…' : 'Remove logo'}</Button></div>}<small>PNG, JPEG, or WebP. Maximum file size 700 KB.</small></Field><Field label="Business email"><input type="email" value={form.email} onChange={change('email')} /></Field><Field label="Phone"><input value={form.phone} onChange={change('phone')} /></Field><Field label="Website"><input value={form.website} onChange={change('website')} /></Field><Field label="Address"><textarea rows="3" value={form.address} onChange={change('address')} /></Field></div></section><section><div className="form-section-title"><span>02</span><div><h2>Receipt signature</h2><p>Shown on fully paid receipts.</p></div></div><div className="form-grid"><Field label="CEO name"><input value={form.ceoName} onChange={change('ceoName')} /></Field><Field label="Title"><input value={form.ceoTitle} onChange={change('ceoTitle')} /></Field><Field label="Signature image"><input type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadSignature} disabled={signatureBusy} /><small>Transparent PNG recommended. Maximum 700 KB.</small></Field></div>{form.signatureUrl && <div className="signature-upload-preview"><img src={form.signatureUrl} alt="CEO signature preview" /><Button type="button" variant="secondary" disabled={signatureBusy} onClick={removeSignature}>{signatureBusy ? 'Working…' : 'Remove signature'}</Button></div>}</section><section><div className="form-section-title"><span>03</span><div><h2>Receiving accounts</h2><p>Invoices automatically use the account matching their currency.</p></div></div>{form.bankAccounts.map((account) => <div className="form-grid" key={account.currency}><h3>{account.currency} account</h3><Field label="Bank name"><input value={account.bankName} onChange={changeBankAccount(account.currency, 'bankName')} /></Field><Field label="Account name"><input value={account.accountName} onChange={changeBankAccount(account.currency, 'accountName')} /></Field><Field label="Account number"><input value={account.accountNumber} onChange={changeBankAccount(account.currency, 'accountNumber')} /></Field><Field label="IBAN / SWIFT"><input value={account.ibanSwift} onChange={changeBankAccount(account.currency, 'ibanSwift')} /></Field></div>)}<Field label="Payment instructions"><textarea rows="4" value={form.paymentInstructions} onChange={change('paymentInstructions')} /></Field></section><section><div className="form-section-title"><span>04</span><div><h2>Invoice defaults</h2><p>Used as a starting point for new invoices.</p></div></div><div className="form-grid"><Field label="Default currency"><select value={form.defaultCurrency} onChange={change('defaultCurrency')}><option>NGN</option><option>USD</option><option>GBP</option></select></Field><Field label="Default tax rate (%)"><input type="number" min="0" max="100" step="0.01" value={form.defaultTaxRate} onChange={change('defaultTaxRate')} /></Field><Field label="Default terms"><textarea rows="4" value={form.defaultTerms} onChange={change('defaultTerms')} /></Field></div></section><div className="form-actions sticky-actions"><Button disabled={busy}>{busy ? 'Saving…' : 'Save settings'}</Button></div></form>}</>;
}
