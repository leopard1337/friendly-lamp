const STORAGE_KEY = "token-analytics-watchlist";

export type WatchlistItem = {
  mint: string;
  symbol?: string;
  name?: string;
  addedAt: string;
};

export function getWatchlist(): WatchlistItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addToWatchlist(item: Omit<WatchlistItem, "addedAt">): void {
  const list = getWatchlist();
  if (list.some((x) => x.mint === item.mint)) return;
  list.push({ ...item, addedAt: new Date().toISOString() });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function removeFromWatchlist(mint: string): void {
  const list = getWatchlist().filter((x) => x.mint !== mint);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function isInWatchlist(mint: string): boolean {
  return getWatchlist().some((x) => x.mint === mint);
}
