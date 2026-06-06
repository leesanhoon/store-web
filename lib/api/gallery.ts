import { apiClient } from "@/lib/api/http";

export type GalleryItemDto = {
    id: number;
    label: string;
    title: string;
    description: string;
    imageUrl: string;
    displayOrder?: number | null;
};

export type HomeFeatureDto = {
    id: number;
    title: string;
    description: string;
    displayOrder?: number | null;
};

type CollectionResponse<T> = T[] | { value?: T[]; Value?: T[] };

function unwrapCollection<T>(response: CollectionResponse<T>) {
    return Array.isArray(response) ? response : response.value ?? response.Value ?? [];
}

function byDisplayOrder<T extends { displayOrder?: number | null }>(items: T[]) {
    return [...items].sort((left, right) => {
        const leftOrder = left.displayOrder;
        const rightOrder = right.displayOrder;

        if (typeof leftOrder !== "number" && typeof rightOrder !== "number") return 0;
        if (typeof leftOrder !== "number") return 1;
        if (typeof rightOrder !== "number") return -1;

        return leftOrder - rightOrder;
    });
}

export async function getGalleryItems() {
    const response = await apiClient.get<CollectionResponse<GalleryItemDto>>("/api/v1/Gallery");
    return byDisplayOrder(unwrapCollection(response));
}

export async function getHomeFeatures() {
    const response = await apiClient.get<CollectionResponse<HomeFeatureDto>>("/api/v1/HomeFeatures");
    return byDisplayOrder(unwrapCollection(response));
}
