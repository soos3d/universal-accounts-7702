import { LIFI_CHAIN_IDS } from "./lifi";

export interface LiFiToken {
  address: string;
  symbol: string;
  decimals: number;
  chainId: number;
  name: string;
  coinKey?: string;
  priceUSD?: string;
  logoURI?: string;
}

export type TokensByChain = Record<number, LiFiToken[]>;

// Priority tokens - these appear first in lists (by coinKey)
// Based on most commonly traded tokens across DeFi
const PRIORITY_COIN_KEYS = [
  "ETH",
  "WETH",
  "USDC",
  "USDT",
  "DAI",
  "WBTC",
  "LINK",
  "UNI",
  "AAVE",
  "ARB",
  "OP",
  "MATIC",
  "BNB",
  "AVAX",
  "SOL",
];

function getTokenPriority(token: LiFiToken): number {
  const coinKey = token.coinKey?.toUpperCase() || token.symbol.toUpperCase();
  const index = PRIORITY_COIN_KEYS.indexOf(coinKey);
  return index === -1 ? PRIORITY_COIN_KEYS.length : index;
}

// In-memory cache
let cachedTokens: TokensByChain | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let sdkConfigured = false;

/**
 * Fetch tokens for all supported LI.FI chains using dynamic import
 */
export async function fetchLiFiTokens(): Promise<TokensByChain> {
  // Only run on client
  if (typeof window === "undefined") {
    return {};
  }

  const now = Date.now();

  // Return cached tokens if still valid
  if (cachedTokens && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedTokens;
  }

  // Dynamic import to ensure client-side only execution
  const { getTokens, createConfig, ChainType } = await import("@lifi/sdk");

  // Configure SDK if not already done
  if (!sdkConfigured) {
    createConfig({
      integrator: "particle-ua-demo",
    });
    sdkConfigured = true;
  }

  // Fetch tokens from LI.FI API
  const response = await getTokens({
    chains: LIFI_CHAIN_IDS as unknown as number[],
    chainTypes: [ChainType.EVM],
  });

  // The response.tokens is Record<ChainId, Token[]>
  const tokens = response.tokens as TokensByChain;

  // Cache the result
  cachedTokens = tokens;
  cacheTimestamp = now;

  return tokens;
}

/**
 * Get top tokens for a specific chain, sorted by priority then priceUSD
 */
export function getTopTokensForChain(
  tokens: TokensByChain,
  chainId: number,
  limit: number = 50
): LiFiToken[] {
  const chainTokens = tokens[chainId] || [];

  // Sort by priority first, then by priceUSD for non-priority tokens
  const sorted = [...chainTokens].sort((a, b) => {
    const priorityA = getTokenPriority(a);
    const priorityB = getTokenPriority(b);

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // For same priority, sort by price
    const priceA = parseFloat(a.priceUSD || "0");
    const priceB = parseFloat(b.priceUSD || "0");
    return priceB - priceA;
  });

  return sorted.slice(0, limit);
}

/**
 * Get all tokens across all chains, flattened and sorted
 */
export function getAllTokens(
  tokens: TokensByChain,
  limit: number = 100
): LiFiToken[] {
  const allTokens: LiFiToken[] = [];

  for (const chainId of Object.keys(tokens)) {
    const chainTokens = tokens[parseInt(chainId)] || [];
    allTokens.push(...chainTokens);
  }

  // Sort by priceUSD descending
  const sorted = allTokens.sort((a, b) => {
    const priceA = parseFloat(a.priceUSD || "0");
    const priceB = parseFloat(b.priceUSD || "0");
    return priceB - priceA;
  });

  return sorted.slice(0, limit);
}

/**
 * Search tokens by symbol or name
 */
export function searchTokens(
  tokens: TokensByChain,
  query: string,
  chainId?: number
): LiFiToken[] {
  const searchLower = query.toLowerCase().trim();

  if (!searchLower) {
    return chainId
      ? getTopTokensForChain(tokens, chainId, 50)
      : getAllTokens(tokens, 100);
  }

  let tokensToSearch: LiFiToken[] = [];

  if (chainId) {
    tokensToSearch = tokens[chainId] || [];
  } else {
    for (const cId of Object.keys(tokens)) {
      tokensToSearch.push(...(tokens[parseInt(cId)] || []));
    }
  }

  const filtered = tokensToSearch.filter(
    (token) =>
      token.symbol.toLowerCase().includes(searchLower) ||
      token.name.toLowerCase().includes(searchLower)
  );

  // Sort by: exact match first, then priority, then price
  return filtered.sort((a, b) => {
    const aExact =
      a.symbol.toLowerCase() === searchLower ||
      a.name.toLowerCase() === searchLower;
    const bExact =
      b.symbol.toLowerCase() === searchLower ||
      b.name.toLowerCase() === searchLower;

    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;

    // Then by priority
    const priorityA = getTokenPriority(a);
    const priorityB = getTokenPriority(b);
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // Finally by price
    const priceA = parseFloat(a.priceUSD || "0");
    const priceB = parseFloat(b.priceUSD || "0");
    return priceB - priceA;
  });
}
