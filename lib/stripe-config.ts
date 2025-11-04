export const PRODUCTS = {
  COURT_READY: "Court-Ready Docs",
  FULL_SERVICE: "Full Service Legal Support"
} as const;

export type ProductName = typeof PRODUCTS[keyof typeof PRODUCTS];

export const PRICE_MAP: Record<ProductName, string> = {
  [PRODUCTS.COURT_READY]: "price_1SKisYD8ZPcBhwZRUcV2cEq5",
  [PRODUCTS.FULL_SERVICE]: "price_1SK1zED8ZPcBhwZR8GEGgPQL",
};

export const PRODUCT_DETAILS = {

  [PRODUCTS.COURT_READY]: {
    name: PRODUCTS.COURT_READY,
    price: 199,
    features: [
      "Unlimited pages",
      "Advanced legal formatting",
      "Priority support",
      "Court-ready templates"
    ]
  },


  [PRODUCTS.FULL_SERVICE]: {
    name: PRODUCTS.FULL_SERVICE,
    price: 479,
    features: [
      "Complete legal document drafting (up to 150 pages)",
      "AI + human review",
      "State-specific case law research",
      "Case Success Analysis — legal strategy + projection",
      "Up to 3 revisions within 14 days",
      "Email + Phone Support",
      "Email or physical mail delivery",
      "7 business day turnaround",
      "Your own hearing prep script — exactly what to say in court for a winning edge"
    ]
  }
};