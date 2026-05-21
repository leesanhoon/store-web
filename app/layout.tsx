import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "In ly Quảng Ngãi",
    description:
        "DTP - Đối tác in ấn bao bì hàng đầu tại Quảng Ngãi. Chuyên cung cấp dịch vụ in ly giấy, in hộp giấy, và các giải pháp đóng gói sáng tạo. Cam kết chất lượng, giá cả cạnh tranh, và giao hàng nhanh chóng. Liên hệ ngay để trải nghiệm dịch vụ in ấn chuyên nghiệp và nâng tầm thương hiệu của bạn với DTP.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="vi" suppressHydrationWarning>
            <body
                className={`${inter.className} flex flex-col min-h-screen`}
                suppressHydrationWarning
            >
                <Header />
                <main className="flex-grow">{children}</main>
                <Footer />
            </body>
        </html>
    );
}
