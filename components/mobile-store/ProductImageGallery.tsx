"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

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

    const goToSlide = useCallback((index: number) => {
        const track = trackRef.current;
        const nextSlide = track?.children.item(index) as HTMLElement | null;

        setActiveIndex(index);

        if (track && nextSlide) {
            track.scrollTo({
                left: nextSlide.offsetLeft,
                behavior: "smooth",
            });
        }
    }, []);

    const hasMultiple = images.length > 1;

    return (
        <div className="gallery-root">
            {/* Main image carousel */}
            <div className="gallery-viewport">
                <div
                    ref={trackRef}
                    className="gallery-track"
                    aria-label="Hình ảnh sản phẩm"
                >
                    {images.map((imageSrc, index) => (
                        <div
                            key={`${imageSrc}-${index}`}
                            className="gallery-slide"
                        >
                            <Image
                                src={imageSrc}
                                alt={`${productName} - hình ${index + 1}`}
                                width={760}
                                height={560}
                                priority={priorityImage && index === 0}
                                quality={90}
                                sizes="(max-width: 768px) 100vw, 760px"
                                className="gallery-slide-image"
                            />
                        </div>
                    ))}
                </div>

                {/* Counter badge */}
                {hasMultiple && (
                    <div className="gallery-counter" aria-live="polite">
                        {activeIndex + 1} / {images.length}
                    </div>
                )}
            </div>

            {/* Dot indicators */}
            {hasMultiple && (
                <div
                    className="gallery-dots"
                    role="tablist"
                    aria-label="Chọn ảnh"
                >
                    {images.map((_, index) => (
                        <button
                            key={index}
                            type="button"
                            role="tab"
                            className="gallery-dot"
                            aria-selected={index === activeIndex}
                            aria-label={`Ảnh ${index + 1}`}
                            onClick={() => goToSlide(index)}
                        />
                    ))}
                </div>
            )}

            {/* Thumbnail strip */}
            {hasMultiple && (
                <div className="gallery-thumbs-shell">
                    <div
                        className="gallery-thumbs-track"
                        aria-label="Danh sách ảnh thu nhỏ"
                    >
                        {images.map((imageSrc, index) => (
                            <button
                                key={`${imageSrc}-thumb-${index}`}
                                ref={(node) => {
                                    thumbnailRefs.current[index] = node;
                                }}
                                type="button"
                                className="gallery-thumb"
                                aria-label={`Xem hình ${index + 1}`}
                                aria-pressed={index === activeIndex}
                                onClick={() => goToSlide(index)}
                            >
                                <Image
                                    src={imageSrc}
                                    alt={`${productName} thumbnail ${index + 1}`}
                                    width={160}
                                    height={120}
                                    quality={82}
                                    sizes="72px"
                                    className="gallery-thumb-image"
                                />
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
