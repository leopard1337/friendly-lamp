"use client";

export function StepIndicator({
  current,
  total,
  onStepClick,
}: {
  current: number;
  total: number;
  onStepClick?: (step: number) => void;
}) {
  const pct = total > 0 ? (current / total) * 100 : 0;
  return (
    <div className="mb-4">
      <p className="mb-2 text-xs font-medium text-zinc-500">
        Step {current} of {total}
      </p>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800/80">
        <div
          className="h-full rounded-full bg-[#7C3AED] transition-all duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      {onStepClick && total > 1 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {Array.from({ length: total }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onStepClick(i + 1)}
              className={`h-2 w-2 rounded-full transition-colors ${
                i + 1 === current
                  ? "bg-[#7C3AED]"
                  : i + 1 < current
                    ? "bg-zinc-500 hover:bg-zinc-400"
                    : "bg-zinc-700 hover:bg-zinc-600"
              }`}
              title={`Go to step ${i + 1}`}
              aria-label={`Go to step ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
