import { getGalleryItems as fetchGalleryItems, type GalleryItemDto } from "@/lib/api/gallery";
import { ApiError } from "@/lib/api/http";
import { STATIC_GALLERY_ITEMS } from "@/lib/content/gallery";

export { getHomeFeatures } from "@/lib/api/gallery";

// `/api/v1/Gallery` is missing on the backend (404). Real data wins whenever it is
// non-empty; any other failure still propagates so the page keeps its error state.
export async function getGalleryItems(): Promise<GalleryItemDto[]> {
    try {
        const items = await fetchGalleryItems();
        return items.length > 0 ? items : STATIC_GALLERY_ITEMS;
    } catch (error) {
        if (error instanceof ApiError && error.status === 404) return STATIC_GALLERY_ITEMS;
        throw error;
    }
}
