import { useEffect, useRef, useState } from "react";

interface ScrollSpyOptions {
  rootMargin?: string;
  threshold?: number | number[];
}

function useScrollSpy(
  ids: string[],
  { rootMargin = "-100px 0px -60% 0px", threshold = 0 }: ScrollSpyOptions = {},
): string | null {
  const [activeId, setActiveId] = useState<string | null>(null);
  const visibleRef = useRef<Set<string>>(new Set());
  const key = ids.join("|");

  useEffect(() => {
    const sectionIds = key.split("|").filter(Boolean);

    if (sectionIds.length === 0) return;

    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visibleRef.current.add(entry.target.id);
          } else {
            visibleRef.current.delete(entry.target.id);
          }
        }

        const nextActive = sectionIds.find((id) => visibleRef.current.has(id));

        if (nextActive) setActiveId(nextActive);
      },
      { rootMargin, threshold },
    );

    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [key, rootMargin, threshold]);

  return activeId;
}

export default useScrollSpy;
