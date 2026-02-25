"use client";

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-zinc-800/60 ${className}`}
      aria-hidden
    />
  );
}

export function WorkspaceCardSkeleton() {
  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 ring-1 ring-zinc-800/50">
      <Skeleton className="mb-3 h-5 w-3/4" />
      <Skeleton className="mb-2 h-4 w-1/2" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-zinc-800/60 p-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 flex-1" />
    </div>
  );
}
