import Script from "next/script";

const GA_ID_PATTERN = /^G-[A-Z0-9]+$/;

/**
 * GA4 gtag snippet. Off unless NEXT_PUBLIC_GA_ID is a valid measurement id
 * (read directly so Next.js inlines it at build time).
 * The pattern check also makes the id safe to interpolate into the inline script.
 */
export default function GoogleAnalytics() {
    const gaId = (process.env.NEXT_PUBLIC_GA_ID ?? "").trim();
    if (!GA_ID_PATTERN.test(gaId)) return null;

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
          gtag('config', '${gaId}');
        `}
            </Script>
        </>
    );
}
