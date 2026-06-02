import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const beVietnamPro = Be_Vietnam_Pro({
    subsets: ["latin", "vietnamese"],
    weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
    title: "DTP Packaging - In ly nhựa, ly giấy",
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
                <Header />
                <main className="flex-grow">{children}</main>
                <Footer />
            </body>
        </html>
    );
}
