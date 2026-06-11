"use client";

import { useEffect, useRef } from "react";

/**
 * Gắn class `.reveal-in` cho phần tử khi nó vào viewport (một lần),
 * tạo hiệu ứng trồi lên + tan blur theo kiểu staggered. Tôn trọng
 * prefers-reduced-motion: nếu người dùng tắt chuyển động thì hiện ngay.
 */
export function useRevealOnScroll<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReduced || typeof IntersectionObserver === "undefined") {
      node.classList.add("reveal-in");
      return;
    }

    node.classList.add("reveal-pending");

    const scrollRoot = node.closest<HTMLElement>(".mobile-screen");
    let animationFrame = 0;
    let observer: IntersectionObserver | null = null;

    const reveal = () => {
      node.classList.remove("reveal-pending");
      node.classList.add("reveal-in");
      observer?.disconnect();
      scrollRoot?.removeEventListener("scroll", queueVisibilityCheck);
      window.removeEventListener("resize", queueVisibilityCheck);
    };

    const isVisibleInRoot = () => {
      const rootRect = scrollRoot?.getBoundingClientRect() ?? {
        top: 0,
        bottom: window.innerHeight,
      };
      const nodeRect = node.getBoundingClientRect();
      const visibleHeight =
        Math.min(nodeRect.bottom, rootRect.bottom) -
        Math.max(nodeRect.top, rootRect.top);

      return visibleHeight >= nodeRect.height * 0.12;
    };

    function queueVisibilityCheck() {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = 0;
        if (isVisibleInRoot()) reveal();
      });
    }

    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            reveal();
          }
        }
      },
      { root: scrollRoot, rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );

    observer.observe(node);
    queueVisibilityCheck();
    scrollRoot?.addEventListener("scroll", queueVisibilityCheck, {
      passive: true,
    });
    window.addEventListener("resize", queueVisibilityCheck);

    return () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      observer?.disconnect();
      scrollRoot?.removeEventListener("scroll", queueVisibilityCheck);
      window.removeEventListener("resize", queueVisibilityCheck);
    };
  }, []);

  return ref;
}
