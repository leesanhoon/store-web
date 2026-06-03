import { mockGalleryItems, mockHomeFeatures } from "@/lib/mock/catalog";

const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "1";

export function getGalleryItems() {
    return mockGalleryItems;
}

export function getHomeFeatures() {
    return mockHomeFeatures;
}

export function getGalleryDataMode() {
    return useMockData ? "mock" : "static";
}

