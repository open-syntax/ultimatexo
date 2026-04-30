import { useEffect, useRef } from "react";

interface RippleProps {
  color: "primary" | "danger";
}

export function Ripple({ color }: RippleProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;

    if (!el) return;

    requestAnimationFrame(() => {
      el.classList.add("animate-ripple-expand");
    });
  }, []);

  return (
    <div
      ref={ref}
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
    >
      <div
        className={`rounded-full border-2 ${color === "primary" ? "border-primary" : "border-danger"} opacity-0`}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
        }}
      />
    </div>
  );
}
