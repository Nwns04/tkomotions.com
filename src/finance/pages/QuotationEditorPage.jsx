import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, apiMessage } from "../../api/client.js";
import {
  calculateDraft,
  fromMinor,
  inputDate,
  toMinor,
} from "../utils/format.js";
import {
  Button,
  Field,
  LinkButton,
  LoadingBlock,
  Notice,
  PageHeader,
} from "../components/UI.jsx";
import { QuotationPreview } from "../components/DocumentPreview.jsx";
import { removeMonetaryClaims } from "../utils/quotationCopy.js";

const plusDays = (days) => {
  const value = new Date();
  value.setDate(value.getDate() + days);
  return inputDate(value);
};
const initial = {
  clientPublicId: "",
  prospectName: "",
  title: "",
  summary: "",
  serviceCategory: "",
  detectedPackage: "",
  issueDate: inputDate(),
  validUntil: plusDays(30),
  currency: "NGN",
  items: [
    { description: "", quantity: 1, unitPrice: "", sourceCatalogPublicId: "" },
  ],
  discountType: "fixed",
  discountValue: 0,
  taxEnabled: false,
  taxRate: 0,
  includedFeatures: [],
  excludedFeatures: [],
  assumptions: [],
  optionalAdditions: [],
  internalWarnings: [],
  paymentTerms: "",
  formalCopy: "",
  whatsAppCopy: "",
  ai: { generated: false, provider: "", model: "", fallbackUsed: false },
  aiAttestation: "",
};

const listFromText = (value) =>
  value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

export default function QuotationEditorPage() {
  const { publicId } = useParams();
  const editing = Boolean(publicId);
  const navigate = useNavigate();
  const [form, setForm] = useState(initial);
  const [clients, setClients] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [settings, setSettings] = useState({});
  const [number, setNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [notice, setNotice] = useState({ type: "error", text: "" });
  const [mobilePreview, setMobilePreview] = useState(false);
  const [aiInput, setAiInput] = useState({
    requirements: "",
    targetBudget: "",
    revisionInstruction: "",
    operation: editing ? "reviseQuotation" : "generateQuotation",
    selectedCatalogPublicIds: [],
  });

  useEffect(() => {
    Promise.all([
      api.get("/clients"),
      api.get("/settings"),
      api.get("/catalog"),
      editing ? api.get(`/quotations/${publicId}`) : Promise.resolve(null),
    ])
      .then(
        ([
          clientResponse,
          settingsResponse,
          catalogResponse,
          quotationResponse,
        ]) => {
          setClients(clientResponse.data.clients);
          setSettings(settingsResponse.data.settings);
          setCatalog(catalogResponse.data.items);
          if (!editing) {
            setForm((current) => ({
              ...current,
              currency: settingsResponse.data.settings.defaultCurrency,
              taxRate: settingsResponse.data.settings.defaultTaxRate,
              paymentTerms: settingsResponse.data.settings.defaultTerms,
            }));
          } else {
            const quotation = quotationResponse.data.quotation;
            setNumber(quotation.number);
            setForm({
              clientPublicId: quotation.client?.publicId || "",
              prospectName: quotation.prospectName || "",
              title: quotation.title,
              summary: quotation.summary,
              serviceCategory: quotation.serviceCategory,
              detectedPackage: quotation.detectedPackage,
              issueDate: inputDate(quotation.issueDate),
              validUntil: inputDate(quotation.validUntil),
              currency: quotation.currency,
              items: quotation.items.map((item) => ({
                description: item.description,
                quantity: item.quantity,
                unitPrice: fromMinor(item.unitPrice),
                sourceCatalogPublicId: item.sourceCatalogPublicId || "",
              })),
              discountType: quotation.discountType,
              discountValue:
                quotation.discountType === "fixed"
                  ? fromMinor(quotation.discountValue)
                  : quotation.discountValue,
              taxEnabled: quotation.taxEnabled,
              taxRate: quotation.taxRate,
              includedFeatures: quotation.includedFeatures,
              excludedFeatures: quotation.excludedFeatures,
              assumptions: quotation.assumptions,
              optionalAdditions: quotation.optionalAdditions,
              internalWarnings: quotation.internalWarnings,
              paymentTerms: quotation.paymentTerms,
              formalCopy: removeMonetaryClaims(quotation.formalCopy),
              whatsAppCopy: quotation.whatsAppCopy,
              ai: quotation.ai || initial.ai,
              aiAttestation: "",
            });
          }
        }
      )
      .catch((error) => setNotice({ type: "error", text: apiMessage(error) }))
      .finally(() => setLoading(false));
  }, [editing, publicId]);

  const totals = useMemo(() => calculateDraft(form), [form]);
  const selectedClient = clients.find(
    (client) => client.publicId === form.clientPublicId
  );
  const preview = {
    ...form,
    ...totals,
    number,
    items: form.items.map((item) => ({
      ...item,
      unitPriceMinor: toMinor(item.unitPrice),
      amount: Math.round(
        (Number(item.quantity) || 0) * toMinor(item.unitPrice)
      ),
    })),
  };
  const set = (key) => (event) =>
    setForm({
      ...form,
      [key]:
        event.target.type === "checkbox"
          ? event.target.checked
          : event.target.value,
    });
  const setList = (key) => (event) =>
    setForm({ ...form, [key]: listFromText(event.target.value) });
  const updateItem = (index, key, value) =>
    setForm({
      ...form,
      items: form.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item
      ),
    });

  function requestPayload() {
    return {
      ...form,
      items: form.items.map((item) => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: toMinor(item.unitPrice),
      })),
      discountValue:
        form.discountType === "fixed"
          ? toMinor(form.discountValue)
          : Number(form.discountValue),
      taxRate: Number(form.taxRate),
    };
  }

  async function generateWithAI() {
    setAiBusy(true);
    setNotice({ type: "error", text: "" });
    try {
      const { data } = await api.post("/ai/quotation", {
        requirements: aiInput.requirements,
        clientPublicId: form.clientPublicId,
        clientName: form.prospectName,
        currency: form.currency,
        targetBudget: aiInput.targetBudget
          ? toMinor(aiInput.targetBudget)
          : null,
        selectedCatalogPublicIds: aiInput.selectedCatalogPublicIds,
        currentQuotation:
          aiInput.operation === "generateQuotation" ? null : requestPayload(),
        revisionInstruction: aiInput.revisionInstruction,
        operation: aiInput.operation,
      });
      if (data.mode === "manual") {
        setNotice({ type: "error", text: data.message });
        return;
      }
      const result = data.data;
      const ai = {
        generated: true,
        provider: data.provider,
        model: data.model,
        fallbackUsed: data.fallbackUsed,
      };
      const pricedItems = result.lineItems.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: fromMinor(item.unitPrice),
        sourceCatalogPublicId: item.catalogPublicId,
      }));
      setForm((current) => {
        if (aiInput.operation === "generateFormalCopy")
          return {
            ...current,
            formalCopy: result.formalQuotationCopy,
            internalWarnings: result.internalWarnings,
            ai,
            aiAttestation: data.attestation,
          };
        if (aiInput.operation === "generateWhatsAppCopy")
          return {
            ...current,
            whatsAppCopy: result.whatsAppCopy,
            internalWarnings: result.internalWarnings,
            ai,
            aiAttestation: data.attestation,
          };
        if (aiInput.operation === "recommendPricing")
          return {
            ...current,
            items: pricedItems,
            detectedPackage: result.detectedPackage,
            serviceCategory: result.serviceCategory,
            internalWarnings: result.internalWarnings,
            ai,
            aiAttestation: data.attestation,
          };
        return {
          ...current,
          title: result.title,
          summary: result.summary,
          serviceCategory: result.serviceCategory,
          detectedPackage: result.detectedPackage,
          currency: result.currency,
          items: pricedItems,
          includedFeatures: result.includedFeatures,
          excludedFeatures: result.excludedFeatures,
          assumptions: result.assumptions,
          optionalAdditions: result.optionalAdditions,
          internalWarnings: result.internalWarnings,
          paymentTerms: result.suggestedPaymentTerms,
          formalCopy: result.formalQuotationCopy,
          whatsAppCopy: result.whatsAppCopy,
          ai,
          aiAttestation: data.attestation,
        };
      });
      setNotice({
        type: "success",
        text: `Draft generated with ${data.provider}${
          data.fallbackUsed ? " after provider fallback" : ""
        }. Review all scope and prices before saving.`,
      });
    } catch (error) {
      setNotice({ type: "error", text: apiMessage(error) });
    } finally {
      setAiBusy(false);
    }
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setNotice({ type: "error", text: "" });
    try {
      const { data } = editing
        ? await api.put(`/quotations/${publicId}`, requestPayload())
        : await api.post("/quotations", requestPayload());
      navigate(`/finance/quotations/${data.quotation.publicId}`);
    } catch (error) {
      setNotice({ type: "error", text: apiMessage(error) });
    } finally {
      setBusy(false);
    }
  }

  if (loading)
    return (
      <>
        <PageHeader
          eyebrow="Quotation builder"
          title={editing ? "Edit quotation" : "New quotation"}
        />
        <LoadingBlock />
      </>
    );

  return (
    <>
      <PageHeader
        eyebrow="Quotation builder"
        title={editing ? `Edit ${number}` : "Create quotation"}
        description="Start manually or ask AI for a structured draft. You remain in control of every price and line item."
        actions={
          <>
            <Button
              type="button"
              variant="secondary"
              className="mobile-preview-button"
              onClick={() => setMobilePreview(!mobilePreview)}
            >
              {mobilePreview ? "Edit quotation" : "Preview quotation"}
            </Button>
            <LinkButton
              to={
                editing
                  ? `/finance/quotations/${publicId}`
                  : "/finance/quotations"
              }
              variant="ghost"
            >
              Cancel
            </LinkButton>
          </>
        }
      />
      <Notice type={notice.type}>{notice.text}</Notice>
      <section className="ai-assist-panel">
        <div>
          <span className="eyebrow">Optional AI assistance</span>
          <h2>Draft from a client brief</h2>
          <p>
            Only requirements, catalog data, target budget, and an optional
            client name are sent. Contact, payment, and authentication
            information stay private.
          </p>
        </div>
        <div className="ai-assist-fields">
          <Field label="Requirements">
            <textarea
              rows="5"
              value={aiInput.requirements}
              onChange={(event) =>
                setAiInput({ ...aiInput, requirements: event.target.value })
              }
              placeholder="Describe the project, deliverables, timing, and constraints…"
            />
          </Field>
          <div className="form-grid">
            <Field label={`Target budget (${form.currency}, optional)`}>
              <input
                type="number"
                min="0"
                step="0.01"
                value={aiInput.targetBudget}
                onChange={(event) =>
                  setAiInput({ ...aiInput, targetBudget: event.target.value })
                }
              />
            </Field>
            <Field label="AI operation">
              <select
                value={aiInput.operation}
                onChange={(event) =>
                  setAiInput({ ...aiInput, operation: event.target.value })
                }
              >
                <option value="generateQuotation">Generate quotation</option>
                <option value="reviseQuotation">Revise quotation</option>
                <option value="recommendPricing">Recommend pricing</option>
                <option value="generateFormalCopy">Refresh formal copy</option>
                <option value="generateWhatsAppCopy">
                  Refresh WhatsApp copy
                </option>
              </select>
            </Field>
          </div>
          {aiInput.operation !== "generateQuotation" && (
            <Field label="Revision instruction">
              <textarea
                rows="3"
                value={aiInput.revisionInstruction}
                onChange={(event) =>
                  setAiInput({
                    ...aiInput,
                    revisionInstruction: event.target.value,
                  })
                }
              />
            </Field>
          )}
          <div className="catalog-picks">
            <span>Catalog context</span>
            <div>
              {catalog
                .filter((item) => item.currency === form.currency)
                .map((item) => (
                  <label key={item.publicId}>
                    <input
                      type="checkbox"
                      checked={aiInput.selectedCatalogPublicIds.includes(
                        item.publicId
                      )}
                      onChange={(event) =>
                        setAiInput({
                          ...aiInput,
                          selectedCatalogPublicIds: event.target.checked
                            ? [
                                ...aiInput.selectedCatalogPublicIds,
                                item.publicId,
                              ]
                            : aiInput.selectedCatalogPublicIds.filter(
                                (id) => id !== item.publicId
                              ),
                        })
                      }
                    />
                    {item.name}
                  </label>
                ))}
            </div>
            {!catalog.some((item) => item.currency === form.currency) && (
              <small>
                No {form.currency} catalog services yet. AI will flag custom
                proposals for review.
              </small>
            )}
          </div>
          <Button
            type="button"
            onClick={generateWithAI}
            disabled={aiBusy || !aiInput.requirements.trim()}
          >
            {aiBusy ? "Generating…" : "Generate structured draft"}
          </Button>
        </div>
      </section>
      <div className={`invoice-builder ${mobilePreview ? "show-preview" : ""}`}>
        <form className="editor-card invoice-form" onSubmit={submit}>
          <section>
            <div className="form-section-title">
              <span>01</span>
              <div>
                <h2>Client and heading</h2>
                <p>Choose a saved client or use a prospect name.</p>
              </div>
            </div>
            <div className="form-grid">
              <Field label="Existing client">
                <select
                  value={form.clientPublicId}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      clientPublicId: event.target.value,
                      prospectName: event.target.value ? "" : form.prospectName,
                    })
                  }
                >
                  <option value="">Prospective client</option>
                  {clients.map((client) => (
                    <option value={client.publicId} key={client.publicId}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </Field>
              {!form.clientPublicId && (
                <Field label="Prospect name">
                  <input
                    value={form.prospectName}
                    onChange={set("prospectName")}
                    required
                  />
                </Field>
              )}
              <Field label="Quotation title">
                <input value={form.title} onChange={set("title")} required />
              </Field>
              <Field label="Service category">
                <input
                  value={form.serviceCategory}
                  onChange={set("serviceCategory")}
                />
              </Field>
              <Field label="Detected package">
                <input
                  value={form.detectedPackage}
                  onChange={set("detectedPackage")}
                />
              </Field>
              <Field label="Summary">
                <textarea
                  rows="4"
                  value={form.summary}
                  onChange={set("summary")}
                />
              </Field>
            </div>
          </section>
          <section>
            <div className="form-section-title">
              <span>02</span>
              <div>
                <h2>Dates and currency</h2>
                <p>Set the quotation validity window.</p>
              </div>
            </div>
            <div className="form-grid three">
              <Field label="Issue date">
                <input
                  type="date"
                  value={form.issueDate}
                  onChange={set("issueDate")}
                  required
                />
              </Field>
              <Field label="Valid until">
                <input
                  type="date"
                  value={form.validUntil}
                  onChange={set("validUntil")}
                  required
                />
              </Field>
              <Field label="Currency">
                <select value={form.currency} onChange={set("currency")}>
                  <option>NGN</option>
                  <option>USD</option>
                  <option>GBP</option>
                </select>
              </Field>
            </div>
          </section>
          <section>
            <div className="form-section-title">
              <span>03</span>
              <div>
                <h2>Line items</h2>
                <p>Backend calculations remain authoritative.</p>
              </div>
            </div>
            <div className="line-items">
              <div className="line-head">
                <span>Description</span>
                <span>Qty</span>
                <span>Unit price</span>
                <span />
              </div>
              {form.items.map((item, index) => (
                <div className="line-item" key={index}>
                  <input
                    aria-label="Description"
                    value={item.description}
                    onChange={(event) =>
                      updateItem(index, "description", event.target.value)
                    }
                    required
                  />
                  <input
                    aria-label="Quantity"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={item.quantity}
                    onChange={(event) =>
                      updateItem(index, "quantity", event.target.value)
                    }
                    required
                  />
                  <input
                    aria-label="Unit price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(event) =>
                      updateItem(index, "unitPrice", event.target.value)
                    }
                    required
                  />
                  <button
                    type="button"
                    aria-label={`Remove line ${index + 1}`}
                    onClick={() =>
                      form.items.length > 1 &&
                      setForm({
                        ...form,
                        items: form.items.filter(
                          (_, itemIndex) => itemIndex !== index
                        ),
                      })
                    }
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                setForm({
                  ...form,
                  items: [
                    ...form.items,
                    {
                      description: "",
                      quantity: 1,
                      unitPrice: "",
                      sourceCatalogPublicId: "",
                    },
                  ],
                })
              }
            >
              + Add line item
            </Button>
          </section>
          <section>
            <div className="form-section-title">
              <span>04</span>
              <div>
                <h2>Scope and terms</h2>
                <p>One item per line for scope lists.</p>
              </div>
            </div>
            <div className="form-grid">
              <Field label="Included features">
                <textarea
                  rows="5"
                  value={form.includedFeatures.join("\n")}
                  onChange={setList("includedFeatures")}
                />
              </Field>
              <Field label="Excluded features">
                <textarea
                  rows="5"
                  value={form.excludedFeatures.join("\n")}
                  onChange={setList("excludedFeatures")}
                />
              </Field>
              <Field label="Assumptions">
                <textarea
                  rows="5"
                  value={form.assumptions.join("\n")}
                  onChange={setList("assumptions")}
                />
              </Field>
              <Field label="Optional additions">
                <textarea
                  rows="5"
                  value={form.optionalAdditions.join("\n")}
                  onChange={setList("optionalAdditions")}
                />
              </Field>
              <Field label="Payment terms">
                <textarea
                  rows="5"
                  value={form.paymentTerms}
                  onChange={set("paymentTerms")}
                />
              </Field>
              <Field label="Formal quotation copy">
                <textarea
                  rows="5"
                  value={form.formalCopy}
                  onChange={set("formalCopy")}
                />
              </Field>
              <Field label="WhatsApp copy">
                <textarea
                  rows="5"
                  value={form.whatsAppCopy}
                  onChange={set("whatsAppCopy")}
                />
              </Field>
            </div>
            {form.internalWarnings.length > 0 && (
              <div className="internal-warnings">
                <strong>Internal warnings</strong>
                <ul>
                  {form.internalWarnings.map((warning, index) => (
                    <li key={`${warning}-${index}`}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
          <section>
            <div className="form-section-title">
              <span>05</span>
              <div>
                <h2>Adjustments</h2>
                <p>Optional discount and tax, calculated by TKO Finance.</p>
              </div>
            </div>
            <div className="form-grid three">
              <Field label="Discount type">
                <select
                  value={form.discountType}
                  onChange={set("discountType")}
                >
                  <option value="fixed">Fixed amount</option>
                  <option value="percentage">Percentage</option>
                </select>
              </Field>
              <Field
                label={
                  form.discountType === "fixed"
                    ? `Discount (${form.currency})`
                    : "Discount (%)"
                }
              >
                <input
                  type="number"
                  min="0"
                  max={form.discountType === "percentage" ? "100" : undefined}
                  step="0.01"
                  value={form.discountValue}
                  onChange={set("discountValue")}
                />
              </Field>
              <Field label="Tax">
                <label className="check-field">
                  <input
                    type="checkbox"
                    checked={form.taxEnabled}
                    onChange={set("taxEnabled")}
                  />
                  <span>Apply tax</span>
                </label>
              </Field>
              {form.taxEnabled && (
                <Field label="Tax rate (%)">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={form.taxRate}
                    onChange={set("taxRate")}
                  />
                </Field>
              )}
            </div>
          </section>
          <div className="form-actions sticky-actions">
            <Button disabled={busy}>
              {busy ? "Saving…" : editing ? "Save quotation" : "Save draft"}
            </Button>
          </div>
        </form>
        <aside className="preview-pane">
          <div className="preview-label">
            <span>Live preview</span>
            <small>A4 document</small>
          </div>
          <QuotationPreview
            quotation={preview}
            client={selectedClient}
            settings={settings}
          />
        </aside>
      </div>
    </>
  );
}
