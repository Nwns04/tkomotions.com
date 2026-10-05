import type { MarketingPageData } from '@/types';

export const marketingPages: Record<string, MarketingPageData> = {
  about: {
    eyebrow: 'ABOUT / TKO MOTIONS LTD',
    title: 'We identify. We investigate. We design. We build.',
    intro: 'TKO Motions is a Nigerian Business Innovation & Digital Solutions company working across business, software, AI and product development.',
    sections: [
      { index: '01', title: 'Start with the work', body: 'We look at how a business operates, where effort gets repeated, and what people need to move forward.' },
      { index: '02', title: 'Make the problem specific', body: 'We define the intended change before settling on a tool, platform or technical approach.' },
      { index: '03', title: 'Build for use', body: 'We design and deliver useful software, connections and digital experiences around the actual need.' },
    ],
  },
  capabilities: {
    eyebrow: 'CAPABILITIES / THE SYSTEMS WE BUILD',
    title: 'The tool follows the need.',
    intro: 'A focused set of software and digital capabilities for work that does not fit a one-size-fits-all answer.',
    sections: [
      { index: '01', title: 'Software systems', body: 'Applications, dashboards, portals and internal tools that make business work easier to see and manage.' },
      { index: '02', title: 'AI and automation', body: 'Assisted workflows, document handling, knowledge tools and integrations that reduce avoidable repetition.' },
      { index: '03', title: 'Digital products and web', body: 'Products, websites and platforms shaped around real user needs and clear business outcomes.' },
      { index: '04', title: 'Integrations', body: 'APIs, payments, messaging and data connections that help existing systems work together.' },
    ],
  },
  process: {
    eyebrow: 'PROCESS / FROM QUESTION TO SYSTEM',
    title: 'Find the friction. Build what moves.',
    intro: 'A practical sequence keeps the work tied to the problem and makes room to learn as the system is used.',
    sections: [
      { index: '01', title: 'Find', body: 'Understand what is slowing the business down and where there is room to move.' },
      { index: '02', title: 'Define and design', body: 'Make the problem specific, agree what progress means, then shape an experience and technical approach.' },
      { index: '03', title: 'Build and test', body: 'Develop, connect and test the parts that need to work together.' },
      { index: '04', title: 'Move and improve', body: 'Put the system to work, learn from use and improve what comes next.' },
    ],
  },
  products: {
    eyebrow: 'PRODUCTS / TKO PRODUCT DIRECTION',
    title: 'Products built around real needs.',
    intro: 'We explore focused products where a clear problem, an identifiable audience and a useful digital service meet.',
    sections: [
      { index: '01', title: 'TaxBot Naija', body: 'A WhatsApp-first Nigerian tax assistant combining tax information, calculations and AI-assisted guidance.' },
      { index: '02', title: 'Product development', body: 'From early validation to a working first release, we shape products around the problem they are meant to solve.' },
    ],
    cta: 'Explore our work',
    ctaHref: '/work',
  },
  careers: {
    eyebrow: 'CAREERS / WORK WITH TKO',
    title: 'Build useful things with curious people.',
    intro: 'We value clear thinking, care for the people using a system and a willingness to learn from the work.',
    sections: [
      { index: '01', title: 'How we work', body: 'Our projects bring business context, design and engineering together around a concrete outcome.' },
      { index: '02', title: 'Current openings', body: 'There are no public openings listed at this time. For a future opportunity, introduce yourself by email.' },
    ],
    cta: 'Introduce yourself',
    ctaHref: 'mailto:hello@tkomotions.com?subject=Career%20enquiry',
  },
  partners: {
    eyebrow: 'PARTNERS / BUILDING TOGETHER',
    title: 'Good work takes the right people.',
    intro: 'We collaborate with organisations and specialists when shared context and complementary skills can make a better result.',
    sections: [
      { index: '01', title: 'Technology partners', body: 'We work with established platforms and service providers where they fit the needs of the project.' },
      { index: '02', title: 'Project collaboration', body: 'Bring a defined opportunity, a team that needs a technical partner, or a specialist capability to explore together.' },
    ],
    cta: 'Discuss a partnership',
  },
  'future-innovators': {
    eyebrow: 'FUTURE INNOVATORS / LEARNING BY BUILDING',
    title: 'Make room for the next builders.',
    intro: 'Technology becomes more useful when people can understand it, question it and take part in making it.',
    sections: [
      { index: '01', title: 'Practical curiosity', body: 'We are interested in thoughtful ways to help young people encounter software, product thinking and problem solving.' },
      { index: '02', title: 'Start a conversation', body: 'Schools, educators and community organisations can contact us to explore a possible learning collaboration.' },
    ],
    cta: 'Explore a collaboration',
  },
  privacy: {
    eyebrow: 'PRIVACY / WEBSITE NOTICE',
    title: 'Your information deserves care.',
    intro: 'This page is a working draft and is not a substitute for a reviewed privacy notice.',
    sections: [
      { index: '01', title: 'Project enquiries', body: 'The project form collects the details you choose to provide so TKO Motions can respond to your enquiry.' },
      { index: '02', title: 'Contact', body: 'For questions about information submitted through this website, email hello@tkomotions.com.' },
    ],
    notice: 'Draft for review: retention periods, processors, cookie use, data-subject rights and a formal privacy contact must be confirmed before publication as a legal notice.',
  },
  terms: {
    eyebrow: 'TERMS / WEBSITE NOTICE',
    title: 'Terms for using this website.',
    intro: 'This page is a working draft. Project-specific terms are agreed separately before work begins.',
    sections: [
      { index: '01', title: 'Website information', body: 'Website content is provided for general information and may change as products and services develop.' },
      { index: '02', title: 'Project work', body: 'Scope, fees, ownership, delivery and support for any engagement are set out in the relevant written agreement.' },
    ],
    notice: 'Draft for review: governing law, liability, intellectual property, acceptable use and other legal provisions require review before these terms are treated as final.',
  },
};