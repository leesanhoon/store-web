"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Slide = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  href: string;
  cta: string;
};

const slides: Slide[] = [
  {
    id: "pet-branding",
    eyebrow: "Gia cong nhanh",
    title: "Ly PET in logo cho quan cafe va tra sua",
    description: "Tu van mau ly, len layout va bao gia nhanh de shop chot mua trong ngay.",
    image: "/images/mockups/logo-cup-500-urban.png",
    href: "/products?category=PET",
    cta: "Xem ly PET",
  },
  {
    id: "paper-takeaway",
    eyebrow: "Mang di chuyen nghiep",
    title: "Ly giay cho menu takeaway va su kien",
    description: "Phu hop quan ca phe, bakery va chuoi giao hang can nhan dien dong bo.",
    image: "/images/mockups/paper-360-linen.png",
    href: "/products?category=Ly%20gi%E1%BA%A5y",
    cta: "Xem ly giay",
  },
  {
    id: "cup-lid-set",
    eyebrow: "Dong bo vat tu",
    title: "Set ly, nap va phu kien theo tung size",
    description: "Chon dung combo de gian hang van hanh on dinh, giam loi khi dong goi.",
    image: "/images/ly/coc-nhua-dung-tau-hu-7.png",
    href: "/products?category=N%E1%BA%AFp%20ly",
    cta: "Xem phu kien",
  },
];

export default function HeroSlider() {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || slides.length <= 1) return;

    const interval = window.setInterval(() => {
      const nextIndex = (activeIndex + 1) % slides.length;
      const nextSlide = track.children.item(nextIndex) as HTMLElement | null;
      if (nextSlide) {
        track.scrollTo({
          left: nextSlide.offsetLeft,
          behavior: "smooth",
        });
      }
    }, 4800);

    return () => window.clearInterval(interval);
  }, [activeIndex]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const handleScroll = () => {
      const { scrollLeft, clientWidth } = track;
      const nextIndex = Math.round(scrollLeft / Math.max(clientWidth, 1));
      setActiveIndex(Math.min(Math.max(nextIndex, 0), slides.length - 1));
    };

    track.addEventListener("scroll", handleScroll, { passive: true });
    return () => track.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="hero-slider" aria-label="Banner noi bat">
      <div ref={trackRef} className="hero-slider-track">
        {slides.map((slide) => (
          <article key={slide.id} className="hero-slide">
            <div className="hero-slide-copy">
              <span>{slide.eyebrow}</span>
              <h1>{slide.title}</h1>
              <p>{slide.description}</p>
              <div className="hero-slide-actions">
                <Link href={slide.href} className="mobile-cta primary">
                  {slide.cta}
                </Link>
                <Link href="/cart" className="mobile-cta secondary">
                  Yeu cau bao gia
                </Link>
              </div>
            </div>
            <div className="hero-slide-media">
              <Image
                src={slide.image}
                alt={slide.title}
                width={720}
                height={720}
                className="hero-slide-image"
                priority
              />
            </div>
          </article>
        ))}
      </div>

      <div className="hero-slider-dots" aria-label="Chuyen slide">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            className={index === activeIndex ? "active" : undefined}
            aria-label={`Mo slide ${index + 1}`}
            aria-pressed={index === activeIndex}
            onClick={() => {
              const track = trackRef.current;
              const nextSlide = track?.children.item(index) as HTMLElement | null;
              if (track && nextSlide) {
                track.scrollTo({
                  left: nextSlide.offsetLeft,
                  behavior: "smooth",
                });
              }
            }}
          />
        ))}
      </div>
    </section>
  );
}
