import { useEffect } from "react";
import confetti from "canvas-confetti";

interface ConfettiBurstProps {
  type: "X" | "O" | "Draw";
}

export function ConfettiBurst({ type }: ConfettiBurstProps) {
  useEffect(() => {
    const colors =
      type === "X"
        ? ["#2563eb", "#3b82f6", "#60a5fa"]
        : type === "O"
          ? ["#ef4444", "#f87171", "#fca5a5"]
          : ["#2563eb", "#ef4444", "#22c55e", "#eab308"];

    const end = Date.now() + 2500;

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.8 },
        colors,
        gravity: 1.2,
        scalar: 1.2,
        ticks: 150,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.8 },
        colors,
        gravity: 1.2,
        scalar: 1.2,
        ticks: 150,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();

    confetti({
      particleCount: 100,
      spread: 120,
      origin: { y: 0.55 },
      colors,
      gravity: 0.7,
      scalar: 1.2,
      ticks: 250,
      startVelocity: 35,
      shapes: ["circle", "square"],
    });
  }, [type]);

  return null;
}
