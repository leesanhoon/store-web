import type { Metadata } from "next";
import { Noto_Sans } from "next/font/google";
import Script from "next/script";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartConfiguratorProvider from "@/components/cart/CartConfiguratorProvider";
import "./globals.css";

const notoSans = Noto_Sans({
    subsets: ["latin", "vietnamese"],
    weight: ["400", "500", "600", "700", "800"],
    display: "swap",
});

export const metadata: Metadata = {
    title: { default: "In ly sờ to", template: "%s | In ly sờ to" },
    description:
        "Website mobile-first cho danh mục ly, nắp ly và yêu cầu báo giá in logo.",
};

export default function RootLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="vi" suppressHydrationWarning>
            <body
                className={`${notoSans.className} min-h-[100dvh] bg-background text-foreground antialiased`}
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
                <CartConfiguratorProvider>
                    <a href="#main-content" className="skip-link">
                        Bỏ qua tới nội dung chính
                    </a>
                    <Header />
                    <main
                        id="main-content"
                        className="min-h-[calc(100dvh-80px)]"
                    >
                        {children}
                    </main>
                    <Footer />
                </CartConfiguratorProvider>
            </body>
        </html>
    );
}
