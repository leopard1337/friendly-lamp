const BASE = "https://api.geckoterminal.com/api/v2";

export async function getTokenPrice(network: string, tokenAddress: string) {
  const res = await fetch(
    `${BASE}/simple/networks/${network}/token_price/${tokenAddress}`,
    { headers: { Accept: "application/json;version=20230203" } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  const prices = data.data?.attributes?.prices;
  if (!prices || typeof prices !== "object") return null;
  const usd = prices["usd"];
  return usd ? parseFloat(usd) : null;
}
