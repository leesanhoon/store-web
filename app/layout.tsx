import type { Metadata } from "next";
import { Noto_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartConfiguratorProvider from "@/components/cart/CartConfiguratorProvider";

const notoSans = Noto_Sans({ subsets: ["latin", "vietnamese"], weight: ["400", "500", "600", "700", "800"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "Store-web", template: "%s | Store-web" },
  description: "Nền tảng bán hàng và in ấn cho ly PET, PP và ly giấy, với quy trình đặt hàng rõ ràng và theo dõi đơn minh bạch.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${notoSans.className} flex min-h-screen flex-col bg-background text-foreground antialiased`} suppressHydrationWarning>
        <Script id="strip-extension-hydration-attrs" strategy="beforeInteractive">
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
          <a href="#main-content" className="skip-link">Bỏ qua tới nội dung chính</a>
          <Header />
          <main id="main-content" className="flex-grow">{children}</main>
          <Footer />
        </CartConfiguratorProvider>
      </body>
    </html>
  );
}
