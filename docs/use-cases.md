# Use case content

The directory and ten pages are generated from src/lib/use-cases.ts. Add a complete UseCase entry with an original headline, problem, solution, conversation, at least five useful FAQs, a valid recommended package number and related slugs. The sitemap includes every entry automatically. Unsupported slugs return 404.

Industry keys prepare a future taxonomy; they do not link to unpublished industry routes. Avoid country-name copies or thin variants. Examples are fictional and labelled. Keep unknown availability, professional judgement, prices, booking confirmation and legal terms with the business team.

Prices come from src/lib/ai-packages.ts, also used by AI Solutions. Package anchors use /solutions/ai#package-01 through package-04. WhatsApp, live stock, calendars, payment connections and document workflows require agreed additional scope.

Assessment and marketing links prefill the contact form with the use-case context. They do not submit anything automatically. Keep the current demo enquiry prefill supported.

The root layout already supplies Organization structured data; the use-case layout supplies WebSite data. Detail pages supply breadcrumb, WebPage and FAQ data matching visible content. This is semantic markup, not a promise of search rankings or FAQ rich results. Google documentation: https://developers.google.com/search/docs/appearance/structured-data/faqpage

Checks: npm run test:use-cases, npm run lint, npx tsc --noEmit, npm run build. Verify desktop, tablet and mobile; follow an assessment link; check the matching form prefill; inspect canonical, Open Graph and Twitter tags, package anchors, sitemap.xml and related links. Keep the homepage design unchanged.
