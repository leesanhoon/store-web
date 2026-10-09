import Image from "next/image";

type Props = {
    src: string;
    label: string;
    description?: string;
};

export default function GalleryImageCard({ src, label, description }: Props) {
    // The caption below is the accessible name, so the image itself is decorative.
    const detail = description && description !== label ? description : "";

    return (
        <figure className="overflow-hidden rounded-md border border-line bg-white shadow-sm">
            <div className="relative aspect-[4/5] border-b border-line bg-surface">
                <Image
                    src={src}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(min-width:1024px) 260px, (min-width:768px) 33vw, 50vw"
                    loading="lazy"
                    quality={82}
                />
            </div>
            <figcaption className="grid gap-1 p-3">
                <span className="text-sm font-semibold text-ink">{label}</span>
                {detail ? (
                    <span className="text-sm text-muted">{detail}</span>
                ) : null}
            </figcaption>
        </figure>
    );
}
