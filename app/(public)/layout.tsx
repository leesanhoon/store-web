import SiteChrome from "@/components/mobile-store/SiteChrome";

export default function PublicLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return <SiteChrome>{children}</SiteChrome>;
}
