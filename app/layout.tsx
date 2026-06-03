import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartConfiguratorProvider from "@/components/cart/CartConfiguratorProvider";

const beVietnamPro = Be_Vietnam_Pro({
    subsets: ["latin", "vietnamese"],
    weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
    title: {
        default: "DTP Packaging",
        template: "%s | DTP Packaging",
    },
    description:
        "DTP Packaging cung cấp ly nhựa PET, PP, ly giấy và dịch vụ in logo cho quán cà phê, trà sữa, nước ép và chuỗi F&B.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="vi" suppressHydrationWarning>
            <body className={`${beVietnamPro.className} flex min-h-screen flex-col bg-background text-foreground antialiased`} suppressHydrationWarning>
                <CartConfiguratorProvider>
                    <a href="#main-content" className="skip-link">
                        Bỏ qua tới nội dung chính
                    </a>
                    <Header />
                    <main id="main-content" className="flex-grow">
                        {children}
                    </main>
                    <Footer />
                </CartConfiguratorProvider>
            </body>
        </html>
    );
}
