import type { GalleryItemDto } from "@/lib/api/gallery";

// Fallback shown while `/api/v1/Gallery` does not exist on the backend. The gallery card
// renders the image as decorative and uses label + description as its accessible name,
// so `description` doubles as the alt text of each photo.
function sample(n: number, label: string, description: string): GalleryItemDto {
    return {
        id: n,
        label,
        title: label,
        description,
        imageUrl: `/images/gallery/mau-in-ly-${n}.png`,
        displayOrder: n,
    };
}

export const STATIC_GALLERY_ITEMS: GalleryItemDto[] = [
    sample(2, "Ống hút bọc màng", "Bó ống hút nhựa trong, mỗi ống được bọc kín trong màng riêng."),
    sample(3, "Ly nhựa trong thân tròn", "Ly nhựa trong suốt thân tròn, đáy bo, đặt trên nền tối."),
    sample(4, "Ly nhựa kèm nắp cầu", "Ly nhựa trong thân thẳng đậy nắp cầu trong suốt."),
    sample(5, "Ly nhựa thân cao nắp trắng", "Ly nhựa thân cao, hơi thon về đáy, đậy nắp nhựa trắng có nút đỏ."),
    sample(6, "Ly nhựa trong miệng tròn", "Ly nhựa trong suốt miệng tròn viền gờ, thân thẳng, chụp chính diện."),
    sample(7, "Các loại nắp ly nhựa", "Nhiều loại nắp ly nhựa trong xếp cạnh nhau, gồm nắp cầu có lỗ và nắp phẳng."),
    sample(8, "Muỗng nhựa trong", "Muỗng nhựa trong suốt cán dài, đặt trên nền tối."),
];
