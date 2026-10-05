'use client';

import { useEffect, useState } from 'react';

export type AiPriceItem = {
  number: string;
  name: string;
  outcome: string;
  description: string;
  setupNgn: number;
  setupSuffix?: string;
  monthlyNgn: number;
  monthlySuffix?: string;
  bestFor: string;
  bestForSummary: string;
  example: string;
  includes: string[];
};

export type AiAddOn = { name: string; priceNgn: number };

type MarketCurrency = { country: string; code: string };
type RatesResponse = { rates: Record<string, number>; updatedAt: string };

const markets: MarketCurrency[] = [
  { country: 'Algeria', code: 'DZD' },
  { country: 'Angola', code: 'AOA' },
  { country: 'Benin', code: 'XOF' },
  { country: 'Botswana', code: 'BWP' },
  { country: 'Burkina Faso', code: 'XOF' },
  { country: 'Burundi', code: 'BIF' },
  { country: 'Cabo Verde', code: 'CVE' },
  { country: 'Cameroon', code: 'XAF' },
  { country: 'Central African Republic', code: 'XAF' },
  { country: 'Chad', code: 'XAF' },
  { country: 'Comoros', code: 'KMF' },
  { country: 'Congo, Democratic Republic', code: 'CDF' },
  { country: 'Congo, Republic', code: 'XAF' },
  { country: 'Cote d’Ivoire', code: 'XOF' },
  { country: 'Djibouti', code: 'DJF' },
  { country: 'Egypt', code: 'EGP' },
  { country: 'Equatorial Guinea', code: 'XAF' },
  { country: 'Eritrea', code: 'ERN' },
  { country: 'Eswatini', code: 'SZL' },
  { country: 'Ethiopia', code: 'ETB' },
  { country: 'Gabon', code: 'XAF' },
  { country: 'Gambia', code: 'GMD' },
  { country: 'Ghana', code: 'GHS' },
  { country: 'Guinea', code: 'GNF' },
  { country: 'Guinea-Bissau', code: 'XOF' },
  { country: 'Kenya', code: 'KES' },
  { country: 'Lesotho', code: 'LSL' },
  { country: 'Liberia', code: 'LRD' },
  { country: 'Libya', code: 'LYD' },
  { country: 'Madagascar', code: 'MGA' },
  { country: 'Malawi', code: 'MWK' },
  { country: 'Mali', code: 'XOF' },
  { country: 'Mauritania', code: 'MRU' },
  { country: 'Mauritius', code: 'MUR' },
  { country: 'Morocco', code: 'MAD' },
  { country: 'Mozambique', code: 'MZN' },
  { country: 'Namibia', code: 'NAD' },
  { country: 'Niger', code: 'XOF' },
  { country: 'Nigeria', code: 'NGN' },
  { country: 'Rwanda', code: 'RWF' },
  { country: 'Sao Tome and Principe', code: 'STN' },
  { country: 'Senegal', code: 'XOF' },
  { country: 'Seychelles', code: 'SCR' },
  { country: 'Sierra Leone', code: 'SLE' },
  { country: 'Somalia', code: 'SOS' },
  { country: 'South Africa', code: 'ZAR' },
  { country: 'South Sudan', code: 'SSP' },
  { country: 'Sudan', code: 'SDG' },
  { country: 'Tanzania', code: 'TZS' },
  { country: 'Togo', code: 'XOF' },
  { country: 'Tunisia', code: 'TND' },
  { country: 'Uganda', code: 'UGX' },
  { country: 'Zambia', code: 'ZMW' },
  { country: 'Zimbabwe', code: 'ZWG' },
];

function formatCurrency(amount: number, currency: string) {
  if (!Number.isFinite(amount)) return 'Price unavailable';

  return new Intl.NumberFormat('en', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function AIPackagePricing({ solutions, customSystem, addOns }: { solutions: AiPriceItem[]; customSystem: AiPriceItem; addOns: AiAddOn[] }) {
  const [marketCountry, setMarketCountry] = useState('Nigeria');
  const [amountInput, setAmountInput] = useState('80000');
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [updatedAt, setUpdatedAt] = useState('');
  const [rateStatus, setRateStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setRateStatus('loading');

    fetch('/api/currency-rates', { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Exchange rates unavailable');
        const data = await response.json() as RatesResponse;
        if (!data.rates || !data.updatedAt) throw new Error('Invalid exchange-rate response');
        setRates(data.rates);
        setUpdatedAt(data.updatedAt);
        setRateStatus('ready');
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === 'AbortError') return;
        setRateStatus('error');
      });

    return () => controller.abort();
  }, [retry]);

  const selectedMarket = markets.find((market) => market.country === marketCountry) ?? markets[0];
  const candidateRate = selectedMarket.code === 'NGN' ? 1 : rates?.[selectedMarket.code];
  const exchangeRate = typeof candidateRate === 'number' && Number.isFinite(candidateRate) && candidateRate > 0
    ? candidateRate
    : undefined;
  const displayCurrency = exchangeRate === undefined ? 'NGN' : selectedMarket.code;
  const enteredAmount = Number(amountInput);
  const calculatedAmount = exchangeRate === undefined ? Number.NaN : enteredAmount * exchangeRate;
  const convertedAmount = Number.isFinite(enteredAmount) && enteredAmount >= 0 && Number.isFinite(calculatedAmount)
    ? calculatedAmount
    : null;

  function displayAmount(amountNgn: number, suffix = '') {
    if (selectedMarket.code === 'NGN' || exchangeRate === undefined) {
      return `${formatCurrency(amountNgn, 'NGN')}${suffix}`;
    }
    return `${formatCurrency(amountNgn * exchangeRate, selectedMarket.code)}${suffix}`;
  }

  return (
    <>
      <div className="mt-10 grid border border-kh-rule lg:grid-cols-[1fr_0.85fr]">
        <div className="grid gap-5 p-5 sm:grid-cols-2 md:p-6">
          <label className="block">
            <span className="mb-2 block font-mono text-[9px] tracking-[0.055em] text-kh-muted">PRICE MARKET</span>
            <select
              value={marketCountry}
              onChange={(event) => setMarketCountry(event.target.value)}
              className="h-12 w-full border border-kh-rule bg-white px-3 text-sm text-kh-ink focus:border-kh-green focus:outline-none"
            >
              {markets.map((market) => (
                <option key={market.country} value={market.country}>{market.country} ({market.code})</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block font-mono text-[9px] tracking-[0.055em] text-kh-muted">CONVERT FROM NIGERIAN NAIRA</span>
            <input
              type="number"
              min="0"
              step="1000"
              inputMode="decimal"
              value={amountInput}
              onChange={(event) => setAmountInput(event.target.value)}
              className="h-12 w-full border border-kh-rule bg-white px-3 text-sm text-kh-ink focus:border-kh-green focus:outline-none"
              aria-label="Amount in Nigerian naira"
            />
          </label>
        </div>
        <div className="flex min-h-28 flex-col justify-center bg-kh-green px-5 py-4 text-white md:px-6" aria-live="polite">
          <p className="font-mono text-[9px] tracking-[0.055em] text-white/70">ESTIMATED CONVERSION</p>
                <p className="mt-1 text-3xl font-medium leading-tight tracking-[-0.04em]">
            {convertedAmount === null ? 'Rate unavailable' : formatCurrency(convertedAmount, selectedMarket.code)}
          </p>
          <p className="mt-1 text-xs text-white/70">
            {amountInput ? `${formatCurrency(Number(amountInput) || 0, 'NGN')} to ${displayCurrency}` : `Enter a naira amount to convert to ${displayCurrency}`}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-kh-muted" aria-live="polite">
        <p>
          {rateStatus === 'loading' && 'Loading indicative exchange rates…'}
          {rateStatus === 'ready' && updatedAt && `Indicative rates · Updated ${new Date(updatedAt).toLocaleDateString('en-NG', { dateStyle: 'medium' })} · Source: ExchangeRate-API`}
          {rateStatus === 'error' && 'Live conversion is unavailable. Package prices remain shown in NGN.'}
        </p>
        {rateStatus === 'error' && (
          <button type="button" onClick={() => setRetry((count) => count + 1)} className="border-b border-kh-green pb-1 font-mono text-[9px] tracking-[0.055em] text-kh-green">
            RETRY RATES
          </button>
        )}
      </div>

      <div className="mt-8 grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {solutions.map((solution) => (
          <article key={solution.number} className={`flex min-w-0 flex-col border p-5 ${solution.number === '03' ? 'border-kh-green bg-kh-soft' : 'border-kh-rule bg-white'}`}>
            <div className="flex min-h-5 items-center justify-between gap-2">
              <span className="font-mono text-[9px] tracking-[0.055em] text-kh-muted">{solution.number} / AI</span>
              {solution.number === '03' && <span className="font-mono text-[8px] tracking-[0.04em] text-kh-green">RECOMMENDED</span>}
            </div>
            <h3 className="mt-4 min-h-12 text-lg font-medium leading-tight tracking-[-0.025em]">{solution.name}</h3>
            <p className="mt-2 min-h-10 text-sm leading-relaxed text-kh-muted">{solution.outcome}</p>
            <div className="mt-5 bg-kh-green px-4 py-4 text-white">
              <p className="font-mono text-[9px] tracking-[0.055em] text-white/70">SETUP · {displayCurrency}</p>
              <p className="mt-1 break-words text-2xl font-medium leading-tight">{displayAmount(solution.setupNgn, solution.setupSuffix)}</p>
              <p className="mt-3 border-t border-white/25 pt-3 font-mono text-[9px] tracking-[0.055em] text-white/70">MONTHLY · {displayCurrency}</p>
              <p className="mt-1 break-words text-lg font-medium leading-tight">{displayAmount(solution.monthlyNgn, solution.monthlySuffix)} / MO</p>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-kh-muted"><span className="font-medium text-kh-ink">Best for: </span>{solution.bestForSummary}</p>
            <details className="group mt-auto border-t border-kh-rule pt-4">
              <summary className="cursor-pointer list-none font-mono text-[9px] tracking-[0.055em] text-kh-green marker:hidden">
                <span className="group-open:hidden">VIEW INCLUDED FEATURES +</span>
                <span className="hidden group-open:inline">HIDE INCLUDED FEATURES −</span>
              </summary>
              <ul className="mt-4 grid gap-2">
                {solution.includes.map((feature) => (
                  <li key={feature} className="flex gap-2 text-xs leading-relaxed text-kh-muted">
                    <span aria-hidden="true" className="shrink-0 text-kh-green">✓</span>{feature}
                  </li>
                ))}
              </ul>
            </details>
          </article>
        ))}
      </div>

      <section className="mt-8 border border-kh-rule bg-kh-soft p-5 md:flex md:items-start md:justify-between md:gap-8 md:p-7" aria-labelledby="custom-ai-title">
        <div className="max-w-2xl">
          <p className="font-mono text-[9px] tracking-[0.055em] text-kh-green">BEYOND THE PACKAGES</p>
          <h3 id="custom-ai-title" className="mt-3 text-2xl font-medium leading-tight tracking-[-0.03em]">{customSystem.name}</h3>
          <p className="mt-2 text-sm leading-relaxed text-kh-muted">{customSystem.description}</p>
          <p className="mt-4 text-xs leading-relaxed text-kh-muted"><span className="font-medium text-kh-ink">For: </span>{customSystem.bestFor}</p>
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
            {customSystem.includes.map((feature) => (
              <li key={feature} className="text-xs leading-relaxed text-kh-muted"><span aria-hidden="true" className="mr-2 text-kh-green">✓</span>{feature}</li>
            ))}
          </ul>
        </div>
        <div className="mt-6 shrink-0 border-t border-kh-rule pt-4 md:mt-0 md:min-w-48 md:border-l md:border-t-0 md:pl-6 md:pt-0">
          <p className="font-mono text-[9px] tracking-[0.055em] text-kh-muted">FROM · {displayCurrency}</p>
          <p className="mt-1 break-words text-2xl font-medium leading-tight text-kh-green">{displayAmount(customSystem.setupNgn, customSystem.setupSuffix)}</p>
          <p className="mt-3 font-mono text-[9px] tracking-[0.055em] text-kh-muted">MONTHLY · {displayCurrency}</p>
          <p className="mt-1 break-words text-lg font-medium leading-tight text-kh-green">{displayAmount(customSystem.monthlyNgn, customSystem.monthlySuffix)} / MO</p>
        </div>
      </section>
      <p className="mt-4 text-xs leading-relaxed text-kh-muted">WhatsApp integration is available as an add-on. Meta usage charges are separate.</p>

      <section className="mt-16 border-t border-kh-rule pt-8" aria-labelledby="ai-outcomes-title">
        <p className="kh-label">A CLEAR PATH UP</p>
        <h3 id="ai-outcomes-title" className="mt-3 max-w-3xl text-3xl font-medium leading-tight tracking-[-0.04em]">Choose the outcome your business needs next.</h3>
        <ol className="mt-8 grid gap-x-8 md:grid-cols-2 xl:grid-cols-3">
          {solutions.map((solution) => (
            <li key={solution.number} className="flex gap-4 border-t border-kh-rule py-4">
              <span className="font-mono text-[9px] text-kh-green">{solution.number}</span>
              <span className="text-sm leading-relaxed">{solution.outcome}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-16 border-t border-kh-rule pt-8" aria-labelledby="ai-addons-title">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="kh-label">OPTIONAL / SCOPED TO YOUR NEEDS</p>
            <h3 id="ai-addons-title" className="mt-3 text-3xl font-medium leading-tight tracking-[-0.04em]">Add-ons</h3>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-kh-muted">Extend a package with the integrations and workflows your business actually needs.</p>
        </div>
        <div className="mt-6 grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
          {addOns.map((addOn) => (
            <div key={addOn.name} className="flex items-center justify-between gap-4 border-t border-kh-rule py-4">
              <span className="text-sm leading-relaxed">{addOn.name}</span>
              <span className="shrink-0 font-mono text-[10px] tracking-[0.03em] text-kh-green">{displayAmount(addOn.priceNgn)}+</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}