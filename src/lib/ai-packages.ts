import type { AiPriceItem } from '@/components/ai-solutions/AIPackagePricing';

export const solutions: AiPriceItem[] = [
  {
    "number": "01",
    "name": "AI CUSTOMER",
    "outcome": "Get online. Answer customers.",
    "setupNgn": 80000,
    "monthlyNgn": 10000,
    "description": "For small businesses that need a professional online presence and an easier way for customers to get answers.",
    "bestFor": "Fashion vendors • Hair/wig sellers • Tailors • Shoe sellers • Beauty businesses • Artisans • Cake vendors • Photographers • Freelancers • Small service businesses",
    "promise": "Get your business online and give customers a better way to discover and enquire.",
    "featureGroups": [
      {
        "title": "Business Presence",
        "features": [
          "One-page professional business website",
          "Business information",
          "Products/services",
          "Gallery",
          "Contact/location",
          "Social media links",
          "WhatsApp/contact CTA",
          "Mobile optimization",
          "Basic SEO setup"
        ]
      },
      {
        "title": "AI Customer Assistant",
        "features": [
          "Business knowledge setup",
          "FAQ automation",
          "Products/services information",
          "Pricing/basic information",
          "Opening hours/location/delivery information",
          "Basic enquiry capture",
          "Human handoff"
        ]
      },
      {
        "title": "Support",
        "features": [
          "Hosting/platform maintenance",
          "Basic analytics",
          "Monthly support"
        ]
      }
    ]
  },
  {
    "number": "02",
    "name": "AI LEAD",
    "outcome": "Capture and qualify enquiries.",
    "setupNgn": 150000,
    "monthlyNgn": 20000,
    "description": "For businesses already receiving regular enquiries and ready to turn those enquiries into structured leads.",
    "bestFor": "Established fashion brands • Gadget sellers • Furniture businesses • Restaurants • Hotels/Airbnb • Event vendors • Training businesses • Real estate agents • Growing online stores • Professional services",
    "promise": "Stop losing enquiries in your DMs. Capture the information you need to follow up.",
    "includedFrom": "Everything in AI Customer, plus:",
    "featureGroups": [
      {
        "title": "Additional features",
        "features": [
          "Advanced business knowledge base",
          "Product/service catalogue",
          "Lead capture",
          "Lead qualification",
          "Customer requirement collection",
          "Enquiry categorization",
          "Lead notifications",
          "Basic lead management",
          "Appointment requests",
          "Order enquiries",
          "Basic follow-up workflows",
          "Conversation history",
          "Basic business dashboard",
          "Monthly optimization"
        ]
      }
    ]
  },
  {
    "number": "03",
    "name": "AI SALES ENGINE",
    "outcome": "Convert enquiries into opportunities and sales.",
    "setupNgn": 350000,
    "monthlyNgn": 60000,
    "description": "For businesses with significant enquiry volume that want a system for converting enquiries into customers.",
    "bestFor": "Real estate • Schools • Hotels • Auto dealers • Logistics • Training companies • Established ecommerce • Professional services • Property managers • Businesses with sales teams",
    "promise": "Turn customer interest into qualified opportunities and sales.",
    "includedFrom": "Everything in AI Lead, plus:",
    "featureGroups": [
      {
        "title": "Additional features",
        "features": [
          "Advanced AI customer assistant",
          "Advanced lead qualification",
          "Lead scoring",
          "Sales pipeline",
          "CRM",
          "Automated follow-up",
          "Appointment/booking workflows",
          "Order workflows",
          "Sales notifications",
          "Conversation history",
          "Human takeover",
          "Lead dashboard",
          "Multiple customer journeys",
          "Email notifications",
          "Advanced workflows",
          "Sales performance insights",
          "Monthly optimization"
        ]
      }
    ]
  },
  {
    "number": "04",
    "name": "AI BUSINESS OPERATIONS",
    "outcome": "Automate how the business works.",
    "setupNgn": 750000,
    "monthlyNgn": 120000,
    "description": "For established businesses that want AI to improve customer-facing and internal operations.",
    "bestFor": "Established SMEs • Schools • Hotels • Logistics companies • Real estate companies • Professional services • Multi-location businesses • Businesses with multiple departments • Businesses processing large volumes of information",
    "promise": "Go beyond customer enquiries and automate the work behind the business.",
    "includedFrom": "Everything in AI Sales Engine, plus:",
    "featureGroups": [
      {
        "title": "Additional features",
        "features": [
          "Internal AI assistant",
          "Staff knowledge system",
          "Document knowledge base",
          "Document processing",
          "Workflow automation",
          "Task automation",
          "CRM workflows",
          "Automated reports",
          "Management dashboard",
          "Approval workflows",
          "Internal notifications",
          "Business process automation",
          "Custom integrations"
        ]
      }
    ]
  }
];
