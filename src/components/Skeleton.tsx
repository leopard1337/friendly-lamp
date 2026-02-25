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

export function WorkspacePageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 w-full rounded-2xl" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    </div>
  );
}
