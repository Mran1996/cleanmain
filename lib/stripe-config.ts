export const PRODUCTS = {
  QUICK_LEGAL: "Quick Legal Start",
  COURT_READY: "Court-Ready Docs",
  CASE_BUILDER: "CaseBuilder Pro",
  FULL_SERVICE: "Full Service Legal Support"
} as const;

export type ProductName = typeof PRODUCTS[keyof typeof PRODUCTS];

export const PRICE_MAP: Record<ProductName, string> = {
  [PRODUCTS.QUICK_LEGAL]: process.env.STRIPE_QUICK_LEGAL_PRICE_ID || "",
  [PRODUCTS.COURT_READY]: process.env.STRIPE_COURT_READY_PRICE_ID || "",
  [PRODUCTS.CASE_BUILDER]: process.env.STRIPE_CASE_BUILDER_PRICE_ID || "",
  [PRODUCTS.FULL_SERVICE]: process.env.STRIPE_QUICK_LEGAL_FULL_ACCESS_PRICE_ID || "",
};

export const PRODUCT_DETAILS = {
  [PRODUCTS.QUICK_LEGAL]: {
    name: PRODUCTS.QUICK_LEGAL,
    price: 59,
    features: [
      "Up to 15 pages",
      "1 AI legal response",
      "PDF + DOCX included"
    ]
  },
  [PRODUCTS.COURT_READY]: {
    name: PRODUCTS.COURT_READY,
    price: 179,
    features: [
      "Unlimited pages",
      "Advanced legal formatting",
      "Priority support",
      "Court-ready templates"
    ]
  },
  [PRODUCTS.CASE_BUILDER]: {
    name: PRODUCTS.CASE_BUILDER,
    price: 549,
    features: [
      "All Court-Ready features",
      "Case law integration",
      "Advanced legal research",
      "Dedicated support",
      "Custom branding"
    ]
  },
  [PRODUCTS.FULL_SERVICE]: {
    name: PRODUCTS.FULL_SERVICE,
    price: 479,
    features: [
      "Complete legal document drafting (up to 150 pages)",
      "AI + human review",
      "State-specific case law research",
      "Up to 3 revisions within 14 days",
      "Email or physical mail delivery",
      "7 business day turnaround"
    ]
  }
};