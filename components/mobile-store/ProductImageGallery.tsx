"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type Props = {
    images: string[];
    productName: string;
    priorityImage?: boolean;
};

export default function ProductImageGallery({
    images,
    productName,
    priorityImage = false,
}: Props) {
    const trackRef = useRef<HTMLDivElement | null>(null);
    const thumbnailRefs = useRef<Array<HTMLButtonElement | null>>([]);
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        const activeThumbnail = thumbnailRefs.current[activeIndex];
        activeThumbnail?.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "center",
        });
    }, [activeIndex]);

    useEffect(() => {
        const track = trackRef.current;
        if (!track || images.length <= 1) return;

        const handleScroll = () => {
            const nextIndex = Math.round(
                track.scrollLeft / Math.max(track.clientWidth, 1),
            );
            setActiveIndex(Math.min(Math.max(nextIndex, 0), images.length - 1));
        };

        track.addEventListener("scroll", handleScroll, { passive: true });
        return () => track.removeEventListener("scroll", handleScroll);
    }, [images.length]);

    const openImage = (index: number) => {
        const track = trackRef.current;
        const nextSlide = track?.children.item(index) as HTMLElement | null;

        setActiveIndex(index);

        if (track && nextSlide) {
            track.scrollTo({
                left: nextSlide.offsetLeft,
                behavior: "smooth",
            });
        }
    };

    return (
        <div className="product-image-gallery">
            <div
                ref={trackRef}
                className="product-image-gallery-main"
                aria-label="Hinh anh san pham"
            >
                {images.map((imageSrc, index) => (
                    <div key={`${imageSrc}-${index}`} className="product-image-gallery-slide">
                        <Image
                            src={imageSrc}
                            alt={`${productName} - hinh ${index + 1}`}
                            width={760}
                            height={560}
                            priority={priorityImage && index === 0}
                            quality={90}
                            sizes="(max-width: 768px) 100vw, 760px"
                            className="product-image-gallery-image"
                        />
                    </div>
                ))}
            </div>

            {images.length > 1 ? (
                <div
                    className="product-image-gallery-thumbs"
                    aria-label="Danh sach anh thu nho"
                >
                    {images.map((imageSrc, index) => (
                        <button
                            key={`${imageSrc}-thumb-${index}`}
                            ref={(node) => {
                                thumbnailRefs.current[index] = node;
                            }}
                            type="button"
                            className="product-image-gallery-thumb"
                            aria-label={`Xem hinh ${index + 1}`}
                            aria-pressed={index === activeIndex}
                            onClick={() => openImage(index)}
                        >
                            <Image
                                src={imageSrc}
                                alt={`${productName} thumbnail ${index + 1}`}
                                width={160}
                                height={120}
                                quality={82}
                                sizes="72px"
                                className="product-image-gallery-thumb-image"
                            />
                        </button>
                    ))}
                </div>
            ) : null}
        </div>
    );
}
