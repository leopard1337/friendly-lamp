export function formatPrice(price: number): string {
  if (price >= 0.01) return price.toFixed(4);
  const s = price.toFixed(10);
  return s.replace(/0+$/, "").replace(/\.$/, "") || "0";
}
