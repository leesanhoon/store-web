import NotFoundContent, { notFoundMetadata } from "@/components/NotFoundContent";
import SiteChrome from "@/components/mobile-store/SiteChrome";

export const metadata = notFoundMetadata;

// Unmatched URLs render this boundary outside app/(public)/layout.tsx, so it brings its own chrome.
// notFound() thrown inside (public) uses app/(public)/not-found.tsx instead (the layout already has the chrome).
export default function NotFound() {
  return (
    <SiteChrome>
      <NotFoundContent />
    </SiteChrome>
  );
}
