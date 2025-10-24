'use client';

import Script from 'next/script';

interface GoogleTagManagerProps {
  gtmId: string;
}

/**
 * Google Tag Manager Component
 * 
 * Implements GTM for advanced tracking and marketing pixels
 * 
 * @param gtmId - Google Tag Manager Container ID (GTM-XXXXXXX)
 */
export function GoogleTagManager({ gtmId }: GoogleTagManagerProps) {
  if (!gtmId || gtmId === 'GTM-XXXXXXX') {
    return null; // Don't load in development or if not configured
  }

  return (
    <>
      <Script id="gtm-script" strategy="afterInteractive">
        {`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${gtmId}');
        `}
      </Script>
    </>
  );
}

/**
 * GTM NoScript Component
 * Place this in <body> as first child
 */
export function GoogleTagManagerNoScript({ gtmId }: GoogleTagManagerProps) {
  if (!gtmId || gtmId === 'GTM-XXXXXXX') {
    return null;
  }

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
      />
    </noscript>
  );
}

/**
 * Push custom events to GTM data layer
 * Usage: pushToDataLayer({ event: 'purchase', value: 99.99 })
 */
export const pushToDataLayer = (data: Record<string, any>) => {
  if (typeof window !== 'undefined' && (window as any).dataLayer) {
    (window as any).dataLayer.push(data);
  }
};
