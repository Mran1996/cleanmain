export const PLANS = {
  QUICK_START: "Quick Legal Start",
  COURT_READY: "Court-Ready Docs",
  CASE_BUILDER: "CaseBuilder Pro",
} as const;

export type PlanName = typeof PLANS[keyof typeof PLANS];

export const PLAN_PRICES: Record<PlanName, string> = {
  [PLANS.QUICK_START]: "price_1RVnWdD8ZPcBhwZR3elsUwaL",
  [PLANS.COURT_READY]: "price_1RVo64D8ZPcBhwZRG0DloXvL",
  [PLANS.CASE_BUILDER]: "price_1RVo72D8ZPcBhwZRm9DLrri6",
};

export const PLAN_DETAILS: Record<PlanName, {
  name: PlanName;
  price: number;
  features: string[];
}> = {
  [PLANS.QUICK_START]: {
    name: PLANS.QUICK_START,
    price: 59,
    features: [
      "Up to 15 pages",
      "1 AI legal response",
      "PDF + DOCX included"
    ]
  },
  [PLANS.COURT_READY]: {
    name: PLANS.COURT_READY,
    price: 199,
    features: [
      "Unlimited pages",
      "Advanced legal formatting",
      "Priority support",
      "Court-ready templates"
    ]
  },
  [PLANS.CASE_BUILDER]: {
    name: PLANS.CASE_BUILDER,
    price: 549,
    features: [
      "All Court-Ready features",
      "Case law integration",
      "Advanced legal research",
      "Dedicated support",
      "Custom branding"
    ]
  }
}; 