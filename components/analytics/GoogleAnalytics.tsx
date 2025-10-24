'use client';

import Script from 'next/script';

interface GoogleAnalyticsProps {
  gaId: string;
}

/**
 * Google Analytics Component
 * 
 * Implements GA4 tracking with:
 * - Page view tracking
 * - Event tracking
 * - User engagement metrics
 * 
 * @param gaId - Google Analytics Measurement ID (G-XXXXXXXXXX)
 */
export function GoogleAnalytics({ gaId }: GoogleAnalyticsProps) {
  if (!gaId || gaId === 'G-XXXXXXXXXX') {
    return null; // Don't load in development or if not configured
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          
          gtag('config', '${gaId}', {
            page_path: window.location.pathname,
            send_page_view: true,
          });
        `}
      </Script>
    </>
  );
}

/**
 * Track custom events
 * Usage: trackEvent('button_click', { button_name: 'pricing_cta' })
 */
export const trackEvent = (eventName: string, eventParams?: Record<string, any>) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, eventParams);
  }
};

/**
 * Track page views manually (useful for SPA navigation)
 * Usage: trackPageView('/pricing')
 */
export const trackPageView = (url: string) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('config', process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID, {
      page_path: url,
    });
  }
};
