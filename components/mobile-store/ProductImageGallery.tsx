"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
    images: string[];
    productName: string;
    priorityImage?: boolean;
};

const scrollBehavior = (): ScrollBehavior =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth";

export default function ProductImageGallery({
    images,
    productName,
    priorityImage = false,
}: Props) {
    const trackRef = useRef<HTMLDivElement | null>(null);
    const thumbsTrackRef = useRef<HTMLDivElement | null>(null);
    const thumbnailRefs = useRef<Array<HTMLButtonElement | null>>([]);
    const [activeIndex, setActiveIndex] = useState(0);

    // Centre the active thumbnail by scrolling its own strip only. Scrolling the
    // element itself would also move the window, so the page jumped on every slide.
    useEffect(() => {
        const strip = thumbsTrackRef.current;
        const thumbnail = thumbnailRefs.current[activeIndex];
        if (!strip || !thumbnail) return;

        strip.scrollTo({
            left:
                thumbnail.offsetLeft -
                (strip.clientWidth - thumbnail.clientWidth) / 2,
            behavior: scrollBehavior(),
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
                behavior: scrollBehavior(),
            });
        }
    }, []);

    const hasMultiple = images.length > 1;

    return (
        <div className="gallery-root">
            <div className="gallery-viewport">
                <div
                    ref={trackRef}
                    role="group"
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
                                alt={
                                    hasMultiple
                                        ? `${productName} - hình ${index + 1}`
                                        : productName
                                }
                                width={760}
                                height={560}
                                preload={priorityImage && index === 0}
                                quality={90}
                                sizes="(min-width: 1024px) 568px, (min-width: 768px) 720px, 100vw"
                                className="gallery-slide-image"
                            />
                        </div>
                    ))}
                </div>

                {hasMultiple && (
                    <div className="gallery-counter" aria-live="polite">
                        {activeIndex + 1} / {images.length}
                    </div>
                )}
            </div>

            {hasMultiple && (
                <div
                    ref={thumbsTrackRef}
                    role="group"
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
                                alt=""
                                width={160}
                                height={120}
                                quality={82}
                                sizes="72px"
                                className="gallery-thumb-image"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
