/**
 * Plan Features Utility
 * Centralizes the definition of features for different subscription plans
 */

/**
 * Get the features for a specific plan
 * @param planName Name of the subscription plan
 * @returns Array of features for the given plan
 */
export function getPlanFeatures(planName: string | undefined): string[] {
  // Default features for users with no subscription or when plan name isn't available
  const defaultFeatures = [
    "Access to legal document templates",
    "AI-powered document analysis",
    "Basic support"
  ];
  
  // Skip further checks if no plan name
  if (!planName) {
    return defaultFeatures;
  }
  
  const planNameLower = planName.toLowerCase();
  
  // Premium plan features
  if (planNameLower.includes("premium")) {
    return [
      "Unlimited legal documents (up to 150 pages each)",
      "Unlimited AI-powered revisions",
      "Real case law embedded",
      "Case Success Analysis",
      "Delivered in PDF + DOCX",
      "Email + Phone Support"
    ];
  }
  
  // Pro plan features
  if (planNameLower.includes("pro")) {
    return [
      "Up to 50 legal documents per month",
      "AI-powered document analysis",
      "Case law integration",
      "Basic Success Analysis",
      "PDF delivery",
      "Email Support"
    ];
  }
  
  // Standard plan features
  if (planNameLower.includes("standard")) {
    return [
      "Up to 10 legal documents per month",
      "Basic document analysis",
      "Limited case law access",
      "PDF delivery",
      "Email Support"
    ];
  }
  
  // Return default features if no specific plan match
  return defaultFeatures;
}