"use client";

import { useEffect, useRef, useState } from "react";

type SplitTextProps = {
  text: string;
  tag?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p";
  className?: string;
  delay?: number;
  splitType?: "chars" | "words";
};

export function SplitText({
  text,
  tag: Tag = "p",
  className = "",
  delay = 50,
  splitType = "chars",
}: SplitTextProps) {
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !hasAnimated) setHasAnimated(true);
      },
      { threshold: 0.1, rootMargin: "-50px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasAnimated]);

  const parts =
    splitType === "chars"
      ? text.split("").map((char, i) => ({ key: i, text: char, isSpace: char === " " }))
      : text.split(" ").map((word, i) => ({ key: i, text: word, isSpace: false }));

  return (
    <div ref={ref}>
      <Tag className={className}>
        {splitType === "chars" ? (
          parts.map(({ key, text: c, isSpace }) =>
            isSpace ? (
              <span key={key} className="inline-block" style={{ width: "0.25em" }} />
            ) : (
              <span
                key={key}
                className="inline-block"
                style={{
                  animation: hasAnimated ? `split-char 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${key * (delay / 1000)}s both` : "none",
                }}
              >
                {c}
              </span>
            )
          )
        ) : (
          parts.map(({ key, text: w }) => (
            <span key={key} className="inline-block">
              <span
                className="inline-block"
                style={{
                  animation: hasAnimated ? `split-char 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${key * (delay / 1000)}s both` : "none",
                }}
              >
                {w}
              </span>
              {key < parts.length - 1 && <span className="inline-block" style={{ width: "0.25em" }} />}
            </span>
          ))
        )}
      </Tag>
    </div>
  );
}
