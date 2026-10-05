export type UseCaseCategory = 'commerce' | 'services' | 'sales';
export type IndustryKey = 'fashion-ecommerce' | 'hospitality' | 'real-estate' | 'education' | 'professional-services';
export type UseCase = {
  slug: string; title: string; category: UseCaseCategory; industry: IndustryKey;
  headline: string; description: string; outcome: string; cardDescription: string; keywords: string[];
  problemTitle: string; problem: string[]; questions: string[]; solution: string[]; capabilities: string[];
  workflow: string[]; example: [string, string][]; exampleValue: string; targetBusinesses: string[];
  packageKey: string; packageReason: string; marketing: string; faq: [string, string][];
  related: string[]; seoTitle: string; seoDescription: string;
};
export const useCaseCategories = [
  { key: 'commerce', label: 'Commerce', description: 'Product choices, purchase questions and order enquiries.', anchor: 'commerce' },
  { key: 'services', label: 'Services & artisans', description: 'Job requirements for photographers, tailors, mechanics and home or field-service teams.', anchor: 'services-artisans' },
  { key: 'sales', label: 'Customer & sales', description: 'Dining, stays, property searches, admissions and professional consultations.', anchor: 'customer-sales' },
] as const;
// Industry keys reserve a taxonomy for future substantial industry pages; no placeholder routes.
export const industries: Record<IndustryKey, string> = {
  'fashion-ecommerce': 'Fashion & ecommerce', hospitality: 'Hospitality', 'real-estate': 'Real estate',
  education: 'Education', 'professional-services': 'Professional services',
};
export const useCases: UseCase[] = [
  {
    "slug": "ai-for-clothing-businesses",
    "title": "AI for Clothing Businesses",
    "category": "commerce",
    "industry": "fashion-ecommerce",
    "headline": "Turn clothing customer enquiries into opportunities.",
    "description": "An AI customer assistant for clothing brands, fashion vendors and online boutiques. Give shoppers clear product, size and delivery information, then collect the details your team needs to handle an order enquiry.",
    "outcome": "Turn social media enquiries into orders.",
    "cardDescription": "Help shoppers explore your catalogue, ask about sizes and delivery, and send an order enquiry with their requirements already organized.",
    "keywords": [
      "AI for clothing business",
      "clothing business chatbot",
      "fashion business automation",
      "AI assistant for fashion business"
    ],
    "problemTitle": "Your customers are already asking questions.",
    "problem": [
      "A new collection attracts interest, but the same questions arrive beneath posts and in private messages. A shopper asking for size XL may also need measurements, a price and delivery information before they are ready to order. Answering each part manually takes time away from sourcing, styling and fulfilling orders.",
      "A useful response depends on the product they mean. Without a clear catalogue and enquiry process, the seller has to reconstruct the conversation later. Slow replies and missing details make it harder for a customer to take the next step."
    ],
    "questions": [
      "How much is this dress?",
      "Do you have size XL?",
      "Is black available?",
      "Do you deliver to Abuja?",
      "How long does delivery take?",
      "How do I order?"
    ],
    "solution": [
      "TKO can build an assistant around your product descriptions, published prices, size guides and delivery policies. It gives customers one place to find approved information and can collect the product, size, colour, quantity and contact method for an order enquiry.",
      "Stock and sizing need care: a listed size is not a promise that an item is still in stock or will fit. Your team confirms availability, measurements, payment and dispatch. Live inventory or checkout connections are scoped separately; they are not assumed to be included."
    ],
    "capabilities": [
      "Product and collection questions",
      "Published size guides and measurements",
      "Pricing and listed availability",
      "Delivery areas and dispatch policies",
      "Product, colour and quantity requirements",
      "Order enquiries and contact details",
      "Basic enquiry capture",
      "Human handoff for final confirmation"
    ],
    "workflow": [
      "Shopper discovers a collection",
      "Asks about a product or size",
      "Gets approved catalogue information",
      "Provides colour, size and quantity",
      "Order enquiry is captured",
      "Seller confirms stock and next steps"
    ],
    "example": [
      [
        "Customer",
        "Do you have this dress in black, size 42?"
      ],
      [
        "Assistant",
        "The sample catalogue lists black in sizes 40–44. The seller will need to confirm current stock. Would you like to send an order enquiry for black, size 42?"
      ],
      [
        "Customer",
        "Yes, one dress. I need delivery to Abuja."
      ],
      [
        "Assistant",
        "I can include the product, size, quantity and delivery city in your enquiry. Please use the enquiry form to add a contact method."
      ]
    ],
    "exampleValue": "The seller receives the requested item, size, colour and delivery city together, rather than restarting the conversation. The customer has a clear next step without an unverified stock or delivery promise.",
    "targetBusinesses": [
      "Fashion brands",
      "Instagram clothing vendors",
      "Online boutiques",
      "Independent designers",
      "Fashion retailers",
      "Small clothing businesses"
    ],
    "packageKey": "01",
    "packageReason": "AI Customer is a useful starting point for a product information assistant, a one-page business website and basic enquiries. Move to AI Lead when your team needs qualification, order enquiry categorization and basic follow-up.",
    "marketing": "A collection post or advert can direct shoppers to a business page with product information and an assistant. Your team can then follow up on enquiries that already name an item and its requirements.",
    "faq": [
      [
        "Can AI answer questions about my clothing products?",
        "Yes, using the catalogue, pricing and policies you approve. The assistant needs accurate product information and a clear process for keeping it current. It should refer questions about unlisted products to your team."
      ],
      [
        "Can the assistant help customers choose a clothing size?",
        "It can explain your published measurements and size guide. It should not guarantee fit. A seller can take over when a customer needs individual sizing advice or alterations."
      ],
      [
        "Can it confirm current clothing stock?",
        "It can explain listed availability, but your team must confirm stock unless a suitable live inventory connection is separately implemented. A catalogue entry alone is not a stock reservation."
      ],
      [
        "Can it answer delivery questions and capture clothing orders?",
        "It can explain approved delivery areas and time estimates, then collect an order enquiry. Final stock, payment and dispatch confirmation stay with the business unless additional order workflows are agreed."
      ],
      [
        "Can I use it if I currently sell through Instagram or WhatsApp?",
        "A business website can give people coming from social media a place to get answers and enquire. WhatsApp integration is an additional service and may involve third-party setup and usage charges."
      ],
      [
        "How much does an AI customer assistant for a clothing business cost?",
        "AI solutions start from ₦80,000 setup + ₦10,000/month. The recommended AI Customer package covers a basic digital presence and customer assistance; more involved order and follow-up workflows are scoped separately."
      ]
    ],
    "related": [
      "ai-for-hair-businesses",
      "ai-for-beauty-businesses",
      "ai-for-artisans"
    ],
    "seoTitle": "AI for Clothing Businesses & Fashion Vendors",
    "seoDescription": "Help clothing shoppers ask about sizes, prices and delivery. Explore a practical AI assistant, order enquiry capture and packages for fashion businesses."
  },
  {
    "slug": "ai-for-hair-businesses",
    "title": "AI for Hair & Wig Businesses",
    "category": "commerce",
    "industry": "fashion-ecommerce",
    "headline": "Give hair buyers clarity before the next message.",
    "description": "Help hair vendors and wig sellers explain lengths, textures, lace options and care information. An assistant can organize the customer’s preferences into an enquiry your team can confirm.",
    "outcome": "Make product choices easier to follow up.",
    "cardDescription": "Answer recurring questions about hair specifications, customization and delivery, then collect the buyer’s preferences for your team.",
    "keywords": [
      "AI for hair business",
      "AI for wig sellers",
      "hair business automation",
      "AI assistant for hair vendors"
    ],
    "problemTitle": "One wig enquiry can involve many choices.",
    "problem": [
      "A buyer may ask for a bob wig, then need to understand length, density, lace type and the difference between ready-to-wear and made-to-order options. Prices and dispatch times may change with those choices. A single product photo rarely answers everything.",
      "When preferences arrive across several messages, your team can miss a detail such as cap size or an event date. A structured enquiry helps you respond with the right product or a clear customization discussion."
    ],
    "questions": [
      "Is this a 12-inch bob?",
      "What lace type does it have?",
      "Can I choose a different density?",
      "Is it ready to wear?",
      "Can you colour it for me?",
      "Can it arrive before my event?"
    ],
    "solution": [
      "The assistant can use your approved hair catalogue, specification explanations, customization rules, published prices and care guidance. It asks for relevant preferences such as texture, length and whether the customer wants a ready-made or custom wig.",
      "Your team retains the final say on suitability, stock, customization costs and delivery deadlines. The assistant should identify a missing specification rather than invent a hair grade or make a quality claim that is absent from your catalogue."
    ],
    "capabilities": [
      "Length and texture explanations",
      "Lace, density and cap information",
      "Ready-made versus custom enquiries",
      "Published pricing and care guidance",
      "Customization requirements",
      "Customer event dates and delivery cities",
      "Structured product enquiries",
      "Seller handoff for stock and quotations"
    ],
    "workflow": [
      "Buyer finds a wig or hair product",
      "Asks about its specifications",
      "Assistant explains listed options",
      "Buyer shares length and customization needs",
      "Product enquiry is organized",
      "Vendor confirms availability and quotation"
    ],
    "example": [
      [
        "Customer",
        "Can I get this bob in 12 inches with a side part?"
      ],
      [
        "Assistant",
        "The sample product information lists a 12-inch option. I can include the side-part request for the vendor to confirm. Do you want a ready-made wig or a custom order?"
      ],
      [
        "Customer",
        "A custom order for an event next month."
      ],
      [
        "Assistant",
        "I can add the length, styling request and event timeframe to your enquiry. The vendor will confirm the customization price and completion date."
      ]
    ],
    "exampleValue": "The vendor sees a specific customization request with a timeframe. The assistant explains the options while leaving quality, fit and completion commitments with the person fulfilling the order.",
    "targetBusinesses": [
      "Hair vendors",
      "Wig retailers",
      "Custom wig makers",
      "Hair extension sellers",
      "Online hair stores",
      "Salon retail teams"
    ],
    "packageKey": "01",
    "packageReason": "Start with AI Customer for product explanations, a professional business page and basic enquiry capture. AI Lead becomes relevant when custom orders need qualification, categorization and routine follow-up.",
    "marketing": "Hair tutorials, product videos and collection adverts can bring buyers to a page that explains specifications before they enquire. A focused product enquiry gives the vendor useful context for the sales conversation.",
    "faq": [
      [
        "Can an AI assistant explain wig lengths, textures and lace types?",
        "It can explain the specifications and terminology in your approved catalogue. You should provide consistent descriptions, especially where products use similar names but different materials or construction."
      ],
      [
        "Can it recommend the best wig for every customer?",
        "It can help a buyer compare listed options and collect preferences. Personal fit, styling suitability and quality questions that need expert judgement should go to the vendor."
      ],
      [
        "Can it capture custom wig requirements?",
        "Yes. Length, texture, parting, colour requests and the required timeframe can be collected as an enquiry. The maker confirms whether the work is feasible and supplies the final quotation."
      ],
      [
        "Can it promise delivery before a customer’s event?",
        "Only an approved estimate can be shared. A specific deadline needs confirmation against production time, stock and delivery arrangements; the assistant should not promise arrival without that confirmation."
      ],
      [
        "Can it support hair-care questions?",
        "It can repeat the care guidance you approve for your products. It should not invent treatments, warranties or claims about a product’s origin. Unlisted or sensitive questions should be handed to your team."
      ],
      [
        "What does an AI assistant for a hair business cost?",
        "AI Customer starts from ₦80,000 setup + ₦10,000/month. More detailed custom-order qualification can use AI Lead. WhatsApp integration and any third-party setup or usage charges are additional."
      ]
    ],
    "related": [
      "ai-for-clothing-businesses",
      "ai-for-beauty-businesses",
      "ai-for-professional-services"
    ],
    "seoTitle": "AI for Hair Businesses & Wig Sellers",
    "seoDescription": "Explain hair and wig specifications, collect customization preferences and organize buyer enquiries with a practical AI customer assistant for hair vendors."
  },
  {
    "slug": "ai-for-beauty-businesses",
    "title": "AI for Beauty Businesses",
    "category": "commerce",
    "industry": "professional-services",
    "headline": "Help beauty customers choose a useful next step.",
    "description": "Bring product information, treatment menus and appointment enquiries into a clearer customer journey for beauty retailers, salons and studios. Your staff keep control of advice and booking confirmation.",
    "outcome": "Connect product questions with service enquiries.",
    "cardDescription": "Explain approved beauty products or service menus, collect customer preferences, and route appointment enquiries to your team.",
    "keywords": [
      "AI for beauty business",
      "beauty business chatbot",
      "AI assistant for salons",
      "beauty appointment enquiries"
    ],
    "problemTitle": "Product questions and appointment requests arrive together.",
    "problem": [
      "A beauty business may sell products and provide services from the same social account. Customers ask about treatment prices, session length, product use and weekend appointments. Your team has to separate a quick information request from an enquiry that needs a qualified staff member.",
      "Missing details can create extra back-and-forth: which service, which location, and what day does the customer prefer? A clear intake process helps staff prepare a response without letting automated guidance become a personal treatment recommendation."
    ],
    "questions": [
      "How much is a facial?",
      "How long is the appointment?",
      "Which branch offers this service?",
      "Can I come on Saturday?",
      "What is the cancellation policy?",
      "How should I use this product?"
    ],
    "solution": [
      "TKO can organize your approved service menu, product descriptions, opening hours, branch information and appointment policies into an assistant. It can collect the service of interest, preferred branch, timing and contact information for your staff.",
      "For skin concerns, allergies or a treatment’s suitability, the assistant should direct the customer to a qualified professional. Appointment requests need staff confirmation unless a separately agreed booking integration is implemented. Published product directions can be shared without presenting them as individual medical advice."
    ],
    "capabilities": [
      "Beauty product and service menu questions",
      "Published treatment prices and durations",
      "Branch and opening-hours information",
      "Approved product-use instructions",
      "Preferred service, branch and time",
      "Appointment and consultation enquiries",
      "Customer contact collection",
      "Human handoff for suitability and confirmation"
    ],
    "workflow": [
      "Customer explores products or services",
      "Asks about a treatment or appointment",
      "Gets the approved menu and policy",
      "Shares a service, branch and preferred time",
      "Appointment enquiry is captured",
      "Staff review and confirm the next step"
    ],
    "example": [
      [
        "Customer",
        "Do you offer facials on Saturday and how long do they take?"
      ],
      [
        "Assistant",
        "The sample menu lists a 60-minute facial, and Saturday is listed as an opening day. An appointment still needs confirmation. Which branch would you prefer?"
      ],
      [
        "Customer",
        "The main branch, in the afternoon."
      ],
      [
        "Assistant",
        "I can add a Saturday afternoon enquiry for the main branch. The staff can confirm a suitable time and discuss any treatment questions with you."
      ]
    ],
    "exampleValue": "Staff receive a defined service and preferred branch and time. Customers get practical information without an automated treatment diagnosis or an unconfirmed appointment.",
    "targetBusinesses": [
      "Beauty retailers",
      "Skincare product stores",
      "Salons",
      "Beauty studios",
      "Makeup artists",
      "Non-clinical wellness service businesses"
    ],
    "packageKey": "02",
    "packageReason": "AI Lead suits beauty businesses handling repeated service and appointment enquiries. It adds qualification and basic follow-up to customer assistance. A smaller product-only shop can begin with AI Customer.",
    "marketing": "Service demonstrations and product content can lead to a page with a clear menu and enquiry form. Separate product questions from appointment interest so your team can follow up appropriately.",
    "faq": [
      [
        "Can AI answer questions about my salon’s services and prices?",
        "Yes, from an approved menu with prices, durations and policies. Keep the menu current so the assistant can distinguish a standard service from work that needs a separate consultation or quote."
      ],
      [
        "Can it book beauty appointments automatically?",
        "This use case supports appointment requests for staff review. Confirmed bookings, live calendar availability and reminders require a separately agreed workflow or integration."
      ],
      [
        "Can it give customers personalized skincare advice?",
        "The assistant should share approved product instructions and general business information. Individual skin concerns, allergies and treatment suitability should go to a qualified professional."
      ],
      [
        "Can it help a beauty business with several branches?",
        "It can collect the preferred branch and explain approved branch information. Routing, permissions and branch-specific workflows need to be scoped according to the business requirements."
      ],
      [
        "How does it help staff prepare for a consultation?",
        "It can capture the customer’s service of interest, preferred location and timing. Staff can ask for any additional information through their normal consultation process rather than collecting unnecessary sensitive details in chat."
      ],
      [
        "Which package fits a beauty appointment business?",
        "AI Lead starts from ₦150,000 setup + ₦20,000/month and is a useful starting point for organized enquiries. Simple customer assistance starts from ₦80,000 setup + ₦10,000/month. Final scope depends on the workflow."
      ]
    ],
    "related": [
      "ai-for-hair-businesses",
      "ai-for-clothing-businesses",
      "ai-for-professional-services"
    ],
    "seoTitle": "AI for Beauty Businesses, Salons & Studios",
    "seoDescription": "Organize beauty service questions, product information and appointment enquiries. Explore AI assistance with clear staff handoff and relevant business packages."
  },
  {
    "slug": "ai-for-gadget-businesses",
    "title": "AI for Gadget & Electronics Businesses",
    "category": "commerce",
    "industry": "fashion-ecommerce",
    "headline": "Turn specification questions into clear purchase enquiries.",
    "description": "Help electronics shoppers understand listed models, specifications, prices and warranty policies. Collect the device and requirements before your sales team confirms stock and terms.",
    "outcome": "Give gadget buyers the details they need.",
    "cardDescription": "Explain approved specifications and shop policies, compare listed models, and collect a focused purchase enquiry for the sales team.",
    "keywords": [
      "AI for gadget business",
      "electronics shop chatbot",
      "AI assistant for gadget sellers",
      "gadget sales enquiries"
    ],
    "problemTitle": "Buyers need more than a product name.",
    "problem": [
      "Two phones can have a similar name but different storage, condition or region. Laptop buyers ask about memory, battery, intended use and warranty. If answers are incomplete, a sale enquiry can become a long thread of clarifications.",
      "Staff also need to separate a price enquiry from a request for a specific configuration. A structured conversation can record the exact model and budget while leaving stock, condition inspection and payment arrangements for the business to confirm."
    ],
    "questions": [
      "Is this phone 128 GB or 256 GB?",
      "Is it new or pre-owned?",
      "What warranty do you provide?",
      "Will this laptop suit my software?",
      "Do you offer delivery?",
      "Can I trade in my current device?"
    ],
    "solution": [
      "An assistant can work from your approved model catalogue, specifications, published prices, delivery policy and warranty terms. It can help customers compare documented differences and collect model, storage, budget and intended-use preferences.",
      "Compatibility, trade-in values, device condition and live stock should be verified by your team where the catalogue is insufficient. Integrations with inventory, payments or a trade-in system need separate implementation; the assistant does not assume access to those systems."
    ],
    "capabilities": [
      "Model and configuration questions",
      "Published specification comparisons",
      "New or pre-owned listing information",
      "Warranty and returns policy explanations",
      "Delivery and purchase enquiry support",
      "Model, storage and budget requirements",
      "Contact capture for sales follow-up",
      "Staff handoff for compatibility and stock"
    ],
    "workflow": [
      "Buyer asks about a device",
      "Assistant identifies the listed model",
      "Explains documented specifications",
      "Buyer shares configuration and budget",
      "Purchase enquiry is captured",
      "Sales staff confirm stock and final terms"
    ],
    "example": [
      [
        "Customer",
        "I need a 256 GB phone. Is the listed one new?"
      ],
      [
        "Assistant",
        "The sample listing describes this model as new with 256 GB storage. Current stock needs confirmation. Would you like to send a purchase enquiry for that configuration?"
      ],
      [
        "Customer",
        "Yes, and please ask about the warranty."
      ],
      [
        "Assistant",
        "I can include the model, storage and warranty question in the enquiry so the sales team can confirm the details together."
      ]
    ],
    "exampleValue": "The sales team receives a specific configuration and an unresolved warranty question. It can respond accurately instead of treating a catalogue description as a final sales commitment.",
    "targetBusinesses": [
      "Phone retailers",
      "Laptop dealers",
      "Electronics shops",
      "Accessory sellers",
      "Online gadget vendors",
      "Businesses selling new and pre-owned devices"
    ],
    "packageKey": "02",
    "packageReason": "AI Lead is relevant when device enquiries need configuration and budget qualification. For larger sales teams, AI Sales Engine adds pipeline and follow-up workflows; a basic information assistant can start with AI Customer.",
    "marketing": "A model-focused advert or comparison post can direct buyers to approved specifications and a purchase enquiry. This creates a clearer handoff from product interest to the sales team.",
    "faq": [
      [
        "Can an AI assistant compare phones or laptop specifications?",
        "It can compare documented specifications in your catalogue, such as memory, storage and display size. It should identify missing information and avoid claiming a device supports software without reliable approved information."
      ],
      [
        "Can it guarantee that a listed gadget is available?",
        "No, a product listing alone is not live stock confirmation. Staff confirm availability unless a suitable inventory integration has been scoped and implemented."
      ],
      [
        "Can it explain warranty and return policies?",
        "Yes, using the policy supplied by your business. It should distinguish a manufacturer’s warranty from a seller’s warranty and route unclear or disputed cases to staff."
      ],
      [
        "Can it value a trade-in device?",
        "It can collect the device details and a trade-in question. A final valuation normally needs your team’s inspection and policy; an automated value should not be invented."
      ],
      [
        "Can customers pay through the assistant?",
        "The initial workflow collects purchase enquiries. Checkout or payment integrations are additional work, with payment gateway charges separate from the AI package."
      ],
      [
        "What AI package suits an electronics retailer?",
        "AI Lead starts from ₦150,000 setup + ₦20,000/month for structured enquiries. AI Sales Engine starts from ₦350,000 setup + ₦60,000/month for a more complete sales workflow. Requirements determine the final scope."
      ]
    ],
    "related": [
      "ai-for-clothing-businesses",
      "ai-for-artisans",
      "ai-for-professional-services"
    ],
    "seoTitle": "AI for Gadget Businesses & Electronics Retailers",
    "seoDescription": "Answer gadget specification and warranty questions, collect device requirements and qualify purchase enquiries with an AI assistant for electronics retailers."
  },
  {
    "slug": "ai-for-artisans",
    "title": "AI for Artisans",
    "category": "services",
    "industry": "professional-services",
    "headline": "Start every job enquiry with useful information.",
    "description": "For photographers, tailors, mechanics and home-service professionals, an assistant can explain services and collect job requirements before you prepare a quote or arrange a visit.",
    "outcome": "Spend less time reconstructing job enquiries.",
    "cardDescription": "Collect the service, location, scope and preferred timeframe so a photographer, tailor, mechanic or field-service team can respond with context.",
    "keywords": [
      "AI for artisans",
      "artisan business automation",
      "AI chatbot for artisans",
      "automate service enquiries"
    ],
    "problemTitle": "“How much?” rarely describes the whole job.",
    "problem": [
      "A photographer needs an event date and coverage requirements. A tailor needs the garment type and deadline. A mechanic needs vehicle and symptom details, while an electrician needs the job location and scope. The same short price question can represent very different work.",
      "While you are on a job, enquiries may wait until you can respond. Collecting the basics early helps you decide whether a job fits, what you need to inspect, and what information is still missing before a quote."
    ],
    "questions": [
      "Can you cover my wedding next month?",
      "How much to sew this style?",
      "Do you repair this vehicle model?",
      "Can you come to my location?",
      "What do you need before giving a quote?",
      "Can I arrange an assessment?"
    ],
    "solution": [
      "TKO can build an assistant around your service list, coverage areas, standard information and enquiry requirements. The conversation adapts to the trade: an event type and date for photography, garment and deadline for tailoring, or vehicle details for repair work.",
      "A quote request is not a final quotation, and a preferred visit time is not a confirmed appointment. Your team checks scope, access, materials and availability. If photos or documents are needed, the assistant can request them through your agreed handoff channel; file uploads or analysis are not assumed to be included."
    ],
    "capabilities": [
      "Trade-specific service questions",
      "Job scope and customer requirements",
      "Service area and site location",
      "Preferred dates and deadlines",
      "Quote and assessment requests",
      "Requests for reference materials via agreed channels",
      "Lead capture and basic qualification",
      "Human handoff for inspection and pricing"
    ],
    "workflow": [
      "Customer describes the job",
      "Assistant checks the service area",
      "Collects trade-specific requirements",
      "Customer shares timing and contact method",
      "Quote or visit enquiry is saved",
      "Artisan reviews scope and responds"
    ],
    "example": [
      [
        "Customer",
        "Can you photograph a birthday event in Abuja next month?"
      ],
      [
        "Assistant",
        "The sample service list includes event photography in Abuja. What date and approximate coverage duration do you have in mind?"
      ],
      [
        "Customer",
        "The 18th, for about four hours."
      ],
      [
        "Assistant",
        "I can include the event type, city, date and four-hour coverage request. The photographer will confirm availability and prepare a quote after reviewing the details."
      ]
    ],
    "exampleValue": "The artisan gets enough context to assess a job and identify what still needs discussion. This is useful intake, rather than an automatic price or a visit promise.",
    "targetBusinesses": [
      "Photographers",
      "Tailors and dressmakers",
      "Mechanics",
      "Electricians and plumbers",
      "Carpenters and installers",
      "Home and field-service teams"
    ],
    "packageKey": "02",
    "packageReason": "AI Lead fits trades that need job requirements, location and timing collected before quoting. AI Customer is enough for basic service information; advanced dispatch, document processing or internal workflows require additional scope.",
    "marketing": "A portfolio post, service advert or referral link can send people to your service page. The assistant helps turn a broad enquiry into a job description you can review when you are available.",
    "faq": [
      [
        "Can an AI assistant collect requirements for different artisan services?",
        "Yes, when the questions are designed around the trade. Photography, tailoring, vehicle repairs and home-service jobs need different information; the intake should reflect the actual work rather than use one generic questionnaire."
      ],
      [
        "Can it give a final quote for a job?",
        "It can share approved standard prices or collect a quote request. Jobs that depend on materials, inspection, access or detailed scope need a quotation from the business."
      ],
      [
        "Can customers send reference photos or documents?",
        "They can be asked to provide reference materials through an agreed handoff channel. Direct file uploads, storage or automated document analysis require separate scope and should not be assumed in a basic assistant."
      ],
      [
        "Can it arrange an artisan’s site visit?",
        "It can capture the preferred location and time as a visit request. Your team confirms availability and access. Dispatching staff or connecting a live scheduling system is additional implementation work."
      ],
      [
        "Can it help while I am working and cannot reply?",
        "It can provide approved service information and gather enquiry details for later review. You still need an operating process for reviewing enquiries and responding to customers."
      ],
      [
        "What does an AI lead assistant for artisans cost?",
        "AI Lead starts from ₦150,000 setup + ₦20,000/month. Basic customer assistance starts from ₦80,000 setup + ₦10,000/month. WhatsApp integration and third-party setup or usage charges are additional."
      ]
    ],
    "related": [
      "ai-for-professional-services",
      "ai-for-gadget-businesses",
      "ai-for-clothing-businesses"
    ],
    "seoTitle": "AI for Artisans & Service Business Enquiries",
    "seoDescription": "Collect job scope, service location and quote requests with AI for photographers, tailors, mechanics and home-service professionals. Explore practical enquiry workflows."
  },
  {
    "slug": "ai-for-restaurants",
    "title": "AI for Restaurants",
    "category": "sales",
    "industry": "hospitality",
    "headline": "Keep menu questions moving towards an enquiry.",
    "description": "Give diners clear menu, opening-hour and ordering information. Collect table requests, group requirements and food-order enquiries while your restaurant team confirms availability and fulfilment.",
    "outcome": "Organize dining and order enquiries.",
    "cardDescription": "Explain the approved menu and ordering policies, collect group or delivery requirements, and hand a clear enquiry to restaurant staff.",
    "keywords": [
      "AI for restaurants",
      "restaurant enquiry chatbot",
      "AI restaurant assistant",
      "restaurant booking enquiries"
    ],
    "problemTitle": "Your team is serving guests while messages arrive.",
    "problem": [
      "Customers ask about the menu, closing time, takeaway, delivery areas and tables for a group. During a busy service, staff may not have time to answer every message while also attending to guests and kitchen operations.",
      "An enquiry for ten people needs different information from a takeaway request. Capturing the date, party size or delivery city early helps staff prepare a useful response. The assistant must also know when a food question requires the kitchen’s judgement."
    ],
    "questions": [
      "Are you open this evening?",
      "Can I see the menu?",
      "Do you deliver to my area?",
      "Can I reserve for ten people?",
      "Can the kitchen cater for an allergy?",
      "How do I place a takeaway order?"
    ],
    "solution": [
      "An assistant can use your approved menu, published prices, opening hours, location and takeaway or delivery policies. It can collect a party size and preferred time for a table enquiry, or items and fulfilment preference for an order enquiry.",
      "Restaurant staff confirm table space, item availability, preparation times and any payment step. Allergy, ingredient and dietary questions that are not covered by verified menu information go to the kitchen. The assistant should not guarantee that a dish is safe for a particular diner."
    ],
    "capabilities": [
      "Menu and published price questions",
      "Opening hours and restaurant location",
      "Takeaway and delivery policy information",
      "Table and group booking requests",
      "Party size and preferred dining time",
      "Food-order enquiry requirements",
      "Customer contact capture",
      "Kitchen or staff handoff for confirmation"
    ],
    "workflow": [
      "Diner discovers the restaurant",
      "Asks about menu or dining",
      "Gets approved service information",
      "Shares group size, items or timing",
      "Dining or order enquiry is captured",
      "Staff confirm availability and fulfilment"
    ],
    "example": [
      [
        "Customer",
        "Can we come for dinner on Friday? There are ten of us."
      ],
      [
        "Assistant",
        "I can prepare a group dining enquiry for Friday for ten guests. What time would you prefer?"
      ],
      [
        "Customer",
        "Around 7 PM. One person has an allergy."
      ],
      [
        "Assistant",
        "I can include the preferred time and note that a guest needs to discuss an allergy with staff. The restaurant must confirm table availability and the food requirements before the booking is agreed."
      ]
    ],
    "exampleValue": "The restaurant receives a group size and time, together with a question requiring human review. Staff can handle the request without a false table confirmation or an unsafe dietary assumption.",
    "targetBusinesses": [
      "Independent restaurants",
      "Cafés",
      "Takeaway businesses",
      "Restaurant groups",
      "Catering businesses",
      "Casual dining venues"
    ],
    "packageKey": "02",
    "packageReason": "AI Lead helps restaurants organize table requests and order enquiries with basic follow-up. Live reservations, delivery operations and payment connections are separate workflows to scope; a menu-information assistant can begin with AI Customer.",
    "marketing": "Menu content and local advertising can bring diners to the restaurant’s page. Clear information and a relevant enquiry path let staff follow up on group dining, catering and order interest.",
    "faq": [
      [
        "Can AI answer questions about my restaurant menu?",
        "It can explain the approved menu, published prices and service information. Seasonal changes, sold-out items and specials need an update process so old information does not become a promise."
      ],
      [
        "Can the assistant confirm a restaurant reservation?",
        "The initial workflow captures table requests with party size and preferred time. Staff confirm availability unless a live reservation workflow is separately agreed and implemented."
      ],
      [
        "Can it accept takeaway or delivery orders?",
        "It can gather an order enquiry and explain your approved fulfilment policy. Final item availability, preparation time, payment and dispatch stay with the restaurant unless additional workflows are implemented."
      ],
      [
        "How should it answer food-allergy questions?",
        "It should share only verified ingredient information and refer allergy or cross-contact questions to the restaurant team. It must not declare a meal safe based on incomplete menu information."
      ],
      [
        "Can it help with group dining or catering enquiries?",
        "Yes. It can collect the event date, guest count, service type and questions for the team. The restaurant reviews capacity, menu requirements and quotation details before agreeing the booking."
      ],
      [
        "Which AI package suits restaurant enquiries?",
        "AI Lead starts from ₦150,000 setup + ₦20,000/month. Basic menu and customer information can start with AI Customer from ₦80,000 setup + ₦10,000/month. Third-party integrations and usage costs are additional where applicable."
      ]
    ],
    "related": [
      "ai-for-hotels",
      "ai-for-artisans",
      "ai-for-professional-services"
    ],
    "seoTitle": "AI for Restaurants & Dining Enquiries",
    "seoDescription": "Help diners find menu information and send table, group dining or food-order enquiries. Explore a practical AI restaurant assistant with staff confirmation."
  },
  {
    "slug": "ai-for-real-estate",
    "title": "AI for Real Estate",
    "category": "sales",
    "industry": "real-estate",
    "headline": "Give your sales team a clearer property enquiry.",
    "description": "Help property seekers explore approved listings and share their budget, location and property requirements. Organize the enquiry before a sales agent discusses availability or an inspection.",
    "outcome": "Turn property interest into qualified enquiries.",
    "cardDescription": "Collect location, budget and buying or renting preferences, answer approved listing questions, and prepare an inspection request for the sales team.",
    "keywords": [
      "AI for real estate",
      "real estate lead qualification",
      "property enquiry chatbot",
      "AI property sales assistant"
    ],
    "problemTitle": "A property message is only the beginning.",
    "problem": [
      "“Is this available?” may come from someone searching in a different area, outside the price range, or looking to rent rather than buy. An agent needs those requirements before recommending a property or arranging an inspection.",
      "Details such as preferred neighbourhood, property type and moving timeframe can disappear inside a long conversation. A consistent enquiry process gives the team context and helps the visitor see an appropriate next step without making unverified listing claims."
    ],
    "questions": [
      "Do you have a three-bedroom home in Wuse?",
      "What is available within my budget?",
      "Is the listed price for buying or renting?",
      "When can I see the property?",
      "Are installment payments possible?",
      "Which documents can the agent provide?"
    ],
    "solution": [
      "TKO’s property demo shows an assistant answering approved listing questions, filtering sample homes by requirements and preparing a viewing enquiry. The conversation carries the customer’s location, budget and preferred time into an editable enquiry summary.",
      "For your business, the system needs your own maintained listings and sales process. Agents verify availability, fees, payment terms, legal documents and inspection appointments. A request is not a booking, and the assistant should not invent a street address or a financing offer."
    ],
    "capabilities": [
      "Approved property listing questions",
      "Location and neighbourhood requirements",
      "Budget and property-type collection",
      "Buying or renting preference",
      "Moving timeframe and preferred viewing time",
      "Inspection requests requiring confirmation",
      "Lead qualification and sales follow-up workflows",
      "Sales notifications and human takeover"
    ],
    "workflow": [
      "Visitor asks about a listing",
      "Shares property requirements",
      "Budget and location are collected",
      "Enquiry is qualified and organized",
      "Sales agent reviews the lead",
      "Agent confirms an inspection if appropriate"
    ],
    "example": [
      [
        "Customer",
        "When can I see the Wuse house?"
      ],
      [
        "Assistant",
        "In the fictional demo, you can request a viewing Monday to Saturday between 9 AM and 5 PM. Which day and time would suit you? An appointment needs confirmation."
      ],
      [
        "Customer",
        "Saturday at 10 AM. My budget is ₦90 million."
      ],
      [
        "Assistant",
        "I can include your budget and preferred viewing time in the sample enquiry. Review the details before saving; no real appointment is booked."
      ]
    ],
    "exampleValue": "The working demo keeps the selected home and viewing preference together. A real sales agent receives the customer’s requirements, while availability and appointment confirmation remain explicit human steps.",
    "targetBusinesses": [
      "Real estate agencies",
      "Property developers",
      "Independent property agents",
      "Property sales teams",
      "Property managers",
      "Businesses handling buying and rental enquiries"
    ],
    "packageKey": "03",
    "packageReason": "AI Sales Engine is the relevant starting point for qualification, lead scoring, a sales pipeline and follow-up. Its scope is agreed around your team and listings. AI Lead can suit a simpler enquiry-only operation.",
    "marketing": "A listing advert can lead to a property enquiry page and an assistant that collects the visitor’s requirements. The sales team then follows up on a defined enquiry instead of a disconnected social-media message.",
    "faq": [
      [
        "Can an AI real estate assistant qualify property enquiries?",
        "Yes. It can collect budget, location, property type, buying or renting preference and timeframe. Qualification organizes the enquiry for the team; it does not replace an agent’s judgement or guarantee a sale."
      ],
      [
        "Can it answer “When can I see the property?”",
        "It can explain approved viewing hours and record a preferred day and time. The agent confirms availability and the appointment. The live fictional demo on the AI Solutions page illustrates this distinction."
      ],
      [
        "Can it answer questions about title documents or payment plans?",
        "Only approved information can be provided. Missing document details, payment eligibility, deposits or legal terms should be recorded as questions for the sales team to verify."
      ],
      [
        "Does it show live property availability?",
        "Only if a reliable listing or inventory connection is included in the agreed implementation. Otherwise your team maintains the information and confirms availability before an inspection or transaction."
      ],
      [
        "Can it support both rental and purchase enquiries?",
        "The enquiry journey can record either preference if your business supplies suitable listings and policies. The current fictional demo has purchase listings and does not pretend those prices are rents."
      ],
      [
        "What does an AI sales system for real estate cost?",
        "AI Sales Engine starts from ₦350,000 setup + ₦60,000/month. Simpler qualification can use AI Lead from ₦150,000 setup + ₦20,000/month. Integrations and third-party charges depend on the agreed scope."
      ]
    ],
    "related": [
      "ai-for-professional-services",
      "ai-for-hotels",
      "ai-for-artisans"
    ],
    "seoTitle": "AI for Real Estate & Property Lead Qualification",
    "seoDescription": "Collect property budgets, location requirements and viewing requests with an AI sales assistant. Explore the working demo, lead qualification and relevant packages."
  },
  {
    "slug": "ai-for-hotels",
    "title": "AI for Hotels & Hospitality",
    "category": "sales",
    "industry": "hospitality",
    "headline": "Help guests enquire with their stay details ready.",
    "description": "Explain approved room information, hotel policies and services, then collect dates, guest counts and accommodation preferences for your reservations team to review.",
    "outcome": "Give reservations staff better guest enquiries.",
    "cardDescription": "Answer room and stay-policy questions, gather travel dates and guest requirements, and prepare an accommodation enquiry for reservations staff.",
    "keywords": [
      "AI for hotels",
      "hotel enquiry chatbot",
      "AI hospitality assistant",
      "hotel reservation enquiries"
    ],
    "problemTitle": "A room enquiry needs dates and context.",
    "problem": [
      "Guests ask about room types, rates, breakfast, check-in time and late arrival. A price without dates or occupancy may not help them decide. Reservations staff need arrival and departure dates, guest numbers and any specific requests before checking availability.",
      "Information can become fragmented when a guest switches from asking about a weekend stay to adding airport transfer or meeting-space requirements. Capturing the details together makes the next conversation more useful for both the guest and the team."
    ],
    "questions": [
      "Which room suits two adults?",
      "Is breakfast included?",
      "What time is check-in?",
      "Can I arrive late?",
      "Do you have rooms for these dates?",
      "Can I ask about airport pickup?"
    ],
    "solution": [
      "TKO can build an assistant around room descriptions, published rate guidance, check-in and cancellation policies, opening information and approved hotel services. It collects stay dates, guest count, room preference and questions for the reservations team.",
      "Staff must confirm date-specific rates, room inventory and any special arrangement. The assistant should distinguish a request for an accessible room or transfer from a confirmed service. Connections to a property-management system or live booking engine require separate scope."
    ],
    "capabilities": [
      "Room-type and published amenity questions",
      "Check-in, checkout and cancellation policies",
      "Arrival and departure date collection",
      "Guest counts and room preferences",
      "Group or meeting-space enquiries",
      "Requests for approved additional services",
      "Reservations enquiry capture",
      "Staff confirmation and human handoff"
    ],
    "workflow": [
      "Guest discovers the hotel",
      "Asks about rooms or policies",
      "Gets approved accommodation information",
      "Shares dates and guest requirements",
      "Stay enquiry is organized",
      "Reservations staff confirm rates and availability"
    ],
    "example": [
      [
        "Customer",
        "I need a room for two adults from Friday to Sunday. Is breakfast included?"
      ],
      [
        "Assistant",
        "The sample hotel lists breakfast with its standard room option. Your dates and the applicable rate need confirmation. Do you have a preferred room type?"
      ],
      [
        "Customer",
        "A standard room, and we may arrive late."
      ],
      [
        "Assistant",
        "I can include the room preference, dates, two guests and late-arrival question in your enquiry. Reservations staff will confirm the rate, availability and arrival arrangements."
      ]
    ],
    "exampleValue": "Reservations staff start with a defined stay and an arrival question. The guest receives useful policy information without an invented nightly rate or a false room reservation.",
    "targetBusinesses": [
      "Independent hotels",
      "Boutique hotels",
      "Guest houses",
      "Serviced apartments",
      "Hospitality groups",
      "Accommodation businesses handling group enquiries"
    ],
    "packageKey": "02",
    "packageReason": "AI Lead is a practical starting point for structured stay enquiries and basic follow-up. AI Sales Engine may suit group and corporate sales pipelines. Live booking or property-management integrations need their own agreed scope.",
    "marketing": "Travel content and room adverts can send guests to a page with useful room and policy information. The enquiry path gathers stay details so reservations staff can respond with an appropriate offer.",
    "faq": [
      [
        "Can an AI hotel assistant answer guest questions at any time?",
        "A website assistant can provide approved room and policy information when a visitor uses it. Your reservations process still needs staff review for availability, rates and requests that require confirmation."
      ],
      [
        "Can it confirm room availability for specific dates?",
        "Not from a static room description alone. Live availability requires a reliable booking or property-management connection that has been separately agreed and implemented."
      ],
      [
        "Can it explain check-in, breakfast and cancellation policies?",
        "Yes, using the current policies you supply. Rate-specific exceptions and unusual arrival arrangements should be referred to the reservations team."
      ],
      [
        "Can it collect group accommodation or meeting enquiries?",
        "It can collect dates, guest or attendee count, room preferences and meeting requirements. Staff then review capacity, rates and any additional services before providing an offer."
      ],
      [
        "Can it handle accessibility or special stay requests?",
        "It can record the request and refer it to staff for a factual response about facilities. It should not claim that a room meets a guest’s needs without verification."
      ],
      [
        "What is the starting price for a hotel enquiry assistant?",
        "AI solutions start from ₦80,000 setup + ₦10,000/month. For structured stay enquiries, AI Lead starts from ₦150,000 setup + ₦20,000/month. Booking integrations and third-party charges are additional where applicable."
      ]
    ],
    "related": [
      "ai-for-restaurants",
      "ai-for-real-estate",
      "ai-for-professional-services"
    ],
    "seoTitle": "AI for Hotels & Hospitality Guest Enquiries",
    "seoDescription": "Answer hotel policy questions and collect stay dates, guest counts and room preferences. Explore an AI hospitality assistant with reservations-team handoff."
  },
  {
    "slug": "ai-for-schools",
    "title": "AI for Schools",
    "category": "sales",
    "industry": "education",
    "headline": "Make admissions information easier for families to find.",
    "description": "Help prospective parents and students understand published programmes, fees and admissions steps. Organize enquiries for your school team without automating admission decisions.",
    "outcome": "Help families navigate admissions enquiries.",
    "cardDescription": "Explain published admissions information, collect programme and term interests, and prepare parent or student enquiries for school staff.",
    "keywords": [
      "AI for schools",
      "school admissions chatbot",
      "AI assistant for admissions enquiries",
      "education enquiry automation"
    ],
    "problemTitle": "Families need clear answers before they apply.",
    "problem": [
      "Admissions teams repeatedly explain entry stages, term dates, fees, visiting arrangements and application steps. A parent may be comparing programmes and need an overview before deciding whether to contact the school.",
      "Unclear or outdated answers create more follow-up work. An assistant can make approved information easier to find, while keeping eligibility, assessment and final admissions decisions with the school."
    ],
    "questions": [
      "Which year groups are open for enquiries?",
      "What are the published fees?",
      "When does the next term start?",
      "How do we begin an application?",
      "Can we arrange a school visit?",
      "Who can explain entry requirements?"
    ],
    "solution": [
      "The assistant can use your published programme descriptions, fee guidance, term calendar, location information and application process. It can collect the programme or year group of interest, intended term and a parent or prospective student’s contact method.",
      "Admissions staff review applications and confirm requirements. The initial enquiry should avoid unnecessary children’s records, identity documents or sensitive assessment information in chat. Student databases, document processing and internal approval workflows require a separate agreed implementation."
    ],
    "capabilities": [
      "Programme and year-group information",
      "Published fee and term-date questions",
      "Admissions process explanations",
      "Programme and intended-term interests",
      "School visit requests",
      "Parent or prospective student enquiry capture",
      "Routing to admissions staff",
      "Human review of eligibility and application questions"
    ],
    "workflow": [
      "Family discovers the school",
      "Asks about a programme or admissions",
      "Gets approved published information",
      "Shares year group and intended term",
      "Admissions enquiry is captured",
      "School staff guide the application or visit"
    ],
    "example": [
      [
        "Customer",
        "I am asking about Year 7 for the next term. Can we visit the school?"
      ],
      [
        "Assistant",
        "I can prepare a Year 7 admissions and school-visit enquiry. The school team will confirm the entry process and visiting arrangements. Which term are you considering?"
      ],
      [
        "Customer",
        "The next September intake."
      ],
      [
        "Assistant",
        "I can include Year 7, the September intake and the visit request. Please add a parent or guardian’s contact method through the enquiry form; staff can guide the next step."
      ]
    ],
    "exampleValue": "Admissions staff receive the programme, intended intake and visit request. The conversation helps a family find its way without collecting an application dossier or implying admission is approved.",
    "targetBusinesses": [
      "Primary and secondary schools",
      "Private schools",
      "Training institutions",
      "Vocational centres",
      "Education providers",
      "Institutions with admissions or course enquiry teams"
    ],
    "packageKey": "02",
    "packageReason": "AI Lead supports admissions enquiry qualification and basic follow-up. Larger schools seeking internal document and staff workflows may consider AI Business Operations after a separate assessment of the required systems and access.",
    "marketing": "Programme information, open-day content and outreach can direct families to an admissions page. An assistant helps them understand the steps and send an enquiry that the school can act on.",
    "faq": [
      [
        "Can AI answer school admissions questions?",
        "It can explain your published programmes, application steps, term dates and fee guidance. Requirements that depend on a particular applicant or unpublished policy should go to admissions staff."
      ],
      [
        "Can it decide whether a student is eligible or admitted?",
        "No. The assistant organizes enquiries and provides approved information. Assessment, eligibility review and admission decisions remain with the school’s authorized staff."
      ],
      [
        "Can it help parents request a school tour?",
        "It can record a tour request with the programme and preferred timing. The school confirms visit arrangements and availability; the enquiry is not a booked tour."
      ],
      [
        "Should parents upload children’s records into the chat?",
        "The initial enquiry should collect only what is necessary to route the question. Records, identity documents and sensitive student information belong in an approved school application process, not a generic chat."
      ],
      [
        "Can it work for a training centre as well as a school?",
        "Yes. The content can be tailored to courses, schedules, published fees and enrolment steps. A course enquiry is still distinct from a confirmed place or completed registration."
      ],
      [
        "Which AI package fits a school admissions team?",
        "AI Lead starts from ₦150,000 setup + ₦20,000/month for organized enquiries. AI Business Operations starts from ₦750,000 setup + ₦120,000/month for a separately scoped internal workflow system."
      ]
    ],
    "related": [
      "ai-for-professional-services",
      "ai-for-hotels",
      "ai-for-artisans"
    ],
    "seoTitle": "AI for Schools & Admissions Enquiries",
    "seoDescription": "Help families find programme, fee and admissions information. Explore an AI school assistant for organized enquiries and visit requests with staff-led decisions."
  },
  {
    "slug": "ai-for-professional-services",
    "title": "AI for Professional Services",
    "category": "sales",
    "industry": "professional-services",
    "headline": "Give your team context before the first consultation.",
    "description": "Help consultants, agencies and professional firms explain their services and collect an enquiry’s scope, timing and contact details before a person reviews the next step.",
    "outcome": "Turn a broad request into a useful brief.",
    "cardDescription": "Explain service scope, collect project requirements and consultation requests, and hand a structured brief to your professional team.",
    "keywords": [
      "AI for professional services",
      "consulting enquiry chatbot",
      "AI assistant for service firms",
      "professional services lead qualification"
    ],
    "problemTitle": "A consultation starts with understanding the request.",
    "problem": [
      "“Can you help us?” may describe a strategy project, a technical problem or work outside the firm’s services. Before arranging a consultation, someone needs to understand the business, the objective, the timeframe and whether the request fits.",
      "Repetitive information calls can consume the same time needed for client delivery. An assistant can explain the service boundaries and gather a short brief, without turning the first conversation into professional advice or a guaranteed engagement."
    ],
    "questions": [
      "Do you support businesses like ours?",
      "What does this service cover?",
      "What do you need for an initial discussion?",
      "Can we request a consultation?",
      "How is your work priced?",
      "Can you review our existing process?"
    ],
    "solution": [
      "TKO can use your service descriptions, approved engagement process, published price guidance and enquiry requirements to build an intake assistant. It can collect an objective, project scope, timeframe and contact method, then route the brief to your team.",
      "The team decides fit, provides advice and confirms an engagement or consultation. Legal, financial and other regulated professional questions need an appropriate human expert. Existing client-system integrations and document access are separately scoped, with access agreed before implementation."
    ],
    "capabilities": [
      "Service scope and process questions",
      "Approved pricing guidance",
      "Business objectives and project requirements",
      "Preferred consultation timeframe",
      "Contact collection and enquiry categorization",
      "Lead qualification and basic follow-up",
      "Routing to the appropriate team",
      "Human handoff for advice and engagement terms"
    ],
    "workflow": [
      "Prospect explores a service",
      "Asks about scope or fit",
      "Assistant explains the approved process",
      "Prospect shares objective and timeframe",
      "A short enquiry brief is captured",
      "Team reviews fit and arranges the next step"
    ],
    "example": [
      [
        "Customer",
        "We need help improving our customer enquiry process. Can you review it?"
      ],
      [
        "Assistant",
        "The sample firm lists process-review services. I can collect a short brief for the team to assess. Where do customers currently contact you?"
      ],
      [
        "Customer",
        "Mostly email and social media. We keep losing track."
      ],
      [
        "Assistant",
        "I can include those channels and the follow-up problem in your enquiry. The team can discuss the scope and confirm whether a consultation is the right next step."
      ]
    ],
    "exampleValue": "The professional team starts with a business problem and its current channels. The prospect gets a clear intake path while scope, advice and commercial commitments remain human decisions.",
    "targetBusinesses": [
      "Consulting firms",
      "Creative and digital agencies",
      "Accounting practices",
      "Business advisory teams",
      "Legal service firms",
      "Technical and professional service providers"
    ],
    "packageKey": "02",
    "packageReason": "AI Lead is a useful starting point for brief collection, qualification and basic follow-up. Firms needing internal knowledge, approvals or document workflows can assess AI Business Operations; complex integrations use Custom AI Systems.",
    "marketing": "Case studies, service content and outreach can point prospects to a relevant service page. A concise enquiry brief gives your team a stronger starting point for a consultation.",
    "faq": [
      [
        "Can an AI assistant qualify enquiries for a professional firm?",
        "It can collect the business objective, scope, timing and relevant contact information against questions you approve. Your team still decides whether a request fits and how to proceed."
      ],
      [
        "Can it provide legal, accounting or other professional advice?",
        "It should explain services and the engagement process. Advice that requires professional judgement, regulated expertise or a review of a person’s circumstances should be handed to an appropriate qualified team member."
      ],
      [
        "Can it collect a brief before a consultation?",
        "Yes. A short objective, current process and preferred timeframe can help your team prepare. Sensitive client files should use an approved document and engagement process rather than an open enquiry chat."
      ],
      [
        "Can it quote for a consulting project?",
        "It can share published pricing guidance or gather a quotation request. A final scope, fee and engagement terms need confirmation from your team."
      ],
      [
        "Can it connect to our CRM or document system?",
        "Connections are assessed and implemented as separate scope. The initial assistant does not assume access to existing client records, documents or internal systems."
      ],
      [
        "What does an AI enquiry system for a service firm cost?",
        "AI Lead starts from ₦150,000 setup + ₦20,000/month. Basic assistance starts from ₦80,000 setup + ₦10,000/month. Custom AI Systems start from ₦1.5m for complex integrations and workflows, subject to agreed requirements."
      ]
    ],
    "related": [
      "ai-for-artisans",
      "ai-for-real-estate",
      "ai-for-schools"
    ],
    "seoTitle": "AI for Professional Services & Consultation Enquiries",
    "seoDescription": "Collect project briefs, explain service scope and qualify consultation enquiries with AI for professional firms. Keep advice and engagement decisions with your team."
  }
];
export function getUseCase(slug: string) { return useCases.find(item => item.slug === slug); }
export function assessmentHref(slug?: string) {
  return '/contact?need=business-assessment' + (slug ? '&useCase=' + encodeURIComponent(slug) : '');
}
