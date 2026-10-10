import type { Metadata, Viewport } from "next";
import { Source_Sans_3 } from "next/font/google";
import Script from "next/script";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import CartConfiguratorProvider from "@/components/cart/CartConfiguratorProvider";
import { SITE } from "@/lib/site";
import "./globals.css";

const sourceSans = Source_Sans_3({
    subsets: ["latin", "vietnamese"],
    variable: "--font-source-sans",
    display: "swap",
});

export const metadata: Metadata = {
    // Omitted (never a placeholder domain) until NEXT_PUBLIC_SITE_URL is set.
    metadataBase: SITE.url ? new URL(SITE.url) : undefined,
    title: {
        default: "In ly DTP - CN Quảng Ngãi",
        template: "%s | In ly DTP - CN Quảng Ngãi",
    },
    description:
        "In ly nhựa PET, PP, ly giấy in logo cho quán café, trà sữa tại Quảng Ngãi. Báo giá nhanh, thiết kế miễn phí.",
};

// viewportFit "cover" makes env(safe-area-inset-*) non-zero on iOS
export const viewport: Viewport = {
    viewportFit: "cover",
    themeColor: "#ffffff",
};

export default function RootLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return (
        <html
            lang="vi"
            className={sourceSans.variable}
            suppressHydrationWarning
        >
            <body
                className="min-h-[100dvh] antialiased"
                suppressHydrationWarning
            >
                <Script
                    id="strip-extension-hydration-attrs"
                    strategy="beforeInteractive"
                >
                    {`
            (function () {
              function stripBisAttributes(root) {
                if (!root || root.nodeType !== 1) return;
                if (root.hasAttribute('bis_skin_checked')) root.removeAttribute('bis_skin_checked');
                root.querySelectorAll('[bis_skin_checked]').forEach(function (element) {
                  element.removeAttribute('bis_skin_checked');
                });
              }

              stripBisAttributes(document.documentElement);

              var observer = new MutationObserver(function (mutations) {
                mutations.forEach(function (mutation) {
                  if (mutation.type === 'attributes') stripBisAttributes(mutation.target);
                  mutation.addedNodes.forEach(stripBisAttributes);
                });
              });

              observer.observe(document.documentElement, {
                attributes: true,
                attributeFilter: ['bis_skin_checked'],
                childList: true,
                subtree: true
              });

              window.addEventListener('load', function () {
                window.setTimeout(function () { observer.disconnect(); }, 1000);
              });
            })();
          `}
                </Script>
                <GoogleAnalytics />
                <CartConfiguratorProvider>{children}</CartConfiguratorProvider>
            </body>
        </html>
    );
}
