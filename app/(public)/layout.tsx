export default function PublicLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return (
        <>
            <a href="#main-content" className="skip-link">
                Bỏ qua tới nội dung chính
            </a>
            <main id="main-content" className="min-h-[calc(100dvh-80px)]">
                {children}
            </main>
        </>
    );
}
