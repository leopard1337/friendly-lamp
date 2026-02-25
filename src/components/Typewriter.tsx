"use client";

import { useEffect, useState } from "react";

type TypewriterProps = {
  text: string;
  className?: string;
  speed?: number;
  delay?: number;
};

export function Typewriter({
  text,
  className = "",
  speed = 60,
  delay = 800,
}: TypewriterProps) {
  const [display, setDisplay] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const startTimer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(startTimer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    if (display.length >= text.length) return;

    const timer = setTimeout(() => {
      setDisplay(text.slice(0, display.length + 1));
    }, speed);

    return () => clearTimeout(timer);
  }, [started, display, text, speed]);

  const isComplete = display.length >= text.length;

  return (
    <span className={className}>
      {display}
      {!isComplete && <span className="animate-pulse">|</span>}
    </span>
  );
}
