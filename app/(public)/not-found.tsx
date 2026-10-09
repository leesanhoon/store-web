import NotFoundContent, { notFoundMetadata } from "@/components/NotFoundContent";

export const metadata = notFoundMetadata;

// Rendered inside app/(public)/layout.tsx, which already provides the site chrome.
export default function PublicNotFound() {
  return <NotFoundContent />;
}
