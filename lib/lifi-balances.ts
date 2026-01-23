import { ethers } from "ethers";
import type { LiFiToken, TokensByChain } from "./lifi-tokens";
import { LIFI_CHAIN_IDS } from "./lifi";

export interface TokenBalance {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  chainId: number;
  amount: string;
  amountInUSD: number;
  logoURI?: string;
  priceUSD?: string;
}

// Popular tokens to scan for existing balances
const POPULAR_TOKENS_TO_SCAN = [
  "ETH",
  "WETH",
  "LINK",
  "UNI",
  "AAVE",
  "ARB",
  "OP",
  "MATIC",
  "WBTC",
  "DAI",
  "CRV",
  "LDO",
  "MKR",
  "SNX",
  "COMP",
  "GRT",
  "ENS",
  "PEPE",
  "SHIB",
  "APE",
];

// Public RPC endpoints for each chain (using reliable free endpoints)
const RPC_URLS: Record<number, string> = {
  1: "https://cloudflare-eth.com",
  56: "https://bsc-dataseed1.binance.org",
  137: "https://polygon-bor-rpc.publicnode.com",
  42161: "https://arbitrum-one-rpc.publicnode.com",
  10: "https://optimism-rpc.publicnode.com",
  43114: "https://avalanche-c-chain-rpc.publicnode.com",
  8453: "https://base-rpc.publicnode.com",
  59144: "https://linea-rpc.publicnode.com",
};

// Timeout for RPC calls (5 seconds)
const RPC_TIMEOUT_MS = 5000;

// ERC-20 balanceOf ABI
const ERC20_ABI = ["function balanceOf(address owner) view returns (uint256)"];

// Cache for balance results
let balanceCache: {
  data: TokenBalance[];
  timestamp: number;
  walletAddress: string;
} | null = null;

// Cache for discovered tokens
let discoveredTokensCache: {
  tokens: LiFiToken[];
  timestamp: number;
} | null = null;

const CACHE_TTL_MS = 30 * 1000; // 30 seconds
const DISCOVERED_TOKENS_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Create a promise that rejects after a timeout
 */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), ms)
    ),
  ]);
}

/**
 * Fetch a single token balance using ethers
 */
async function fetchSingleBalance(
  provider: ethers.JsonRpcProvider,
  walletAddress: string,
  token: LiFiToken
): Promise<bigint> {
  try {
    // Native token (ETH, MATIC, etc.)
    if (
      token.address === "0x0000000000000000000000000000000000000000" ||
      token.address.toLowerCase() === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
    ) {
      return await withTimeout(
        provider.getBalance(walletAddress),
        RPC_TIMEOUT_MS
      );
    }

    // ERC-20 token
    const contract = new ethers.Contract(token.address, ERC20_ABI, provider);
    return await withTimeout(contract.balanceOf(walletAddress), RPC_TIMEOUT_MS);
  } catch {
    return BigInt(0);
  }
}

/**
 * Fetch token balances for a list of tokens using direct RPC calls
 */
export async function fetchTokenBalances(
  walletAddress: string,
  tokens: LiFiToken[]
): Promise<TokenBalance[]> {
  if (!walletAddress || tokens.length === 0) {
    return [];
  }

  // Check cache
  const now = Date.now();
  if (
    balanceCache &&
    balanceCache.walletAddress === walletAddress &&
    now - balanceCache.timestamp < CACHE_TTL_MS
  ) {
    return balanceCache.data;
  }

  // Only run on client
  if (typeof window === "undefined") {
    return [];
  }

  // Group tokens by chain
  const tokensByChain: Record<number, LiFiToken[]> = {};
  for (const token of tokens) {
    if (!tokensByChain[token.chainId]) {
      tokensByChain[token.chainId] = [];
    }
    tokensByChain[token.chainId].push(token);
  }

  const balances: TokenBalance[] = [];

  // Fetch balances for each chain in parallel
  const chainPromises = Object.entries(tokensByChain).map(
    async ([chainIdStr, chainTokens]) => {
      const chainId = parseInt(chainIdStr);
      const rpcUrl = RPC_URLS[chainId];

      if (!rpcUrl) {
        return []; // Skip chains without RPC
      }

      try {
        // Use static network to avoid auto-detection which can fail
        const provider = new ethers.JsonRpcProvider(rpcUrl, chainId, {
          staticNetwork: true,
        });

        // Fetch balances for all tokens on this chain
        const tokenBalancePromises = chainTokens.map(async (token) => {
          const balance = await fetchSingleBalance(
            provider,
            walletAddress,
            token
          );

          if (balance <= BigInt(0)) {
            return null;
          }

          const priceUSD = parseFloat(token.priceUSD || "0");
          const amount = balance.toString();
          const decimals = token.decimals || 18;

          // Calculate USD value
          const amountDecimal = parseFloat(amount) / Math.pow(10, decimals);
          const amountInUSD = amountDecimal * priceUSD;

          return {
            address: token.address,
            symbol: token.symbol,
            name: token.name,
            decimals,
            chainId,
            amount,
            amountInUSD,
            logoURI: token.logoURI,
            priceUSD: token.priceUSD,
          } as TokenBalance;
        });

        const results = await Promise.all(tokenBalancePromises);
        return results.filter((b): b is TokenBalance => b !== null);
      } catch {
        return [];
      }
    }
  );

  const chainResults = await Promise.all(chainPromises);

  for (const chainBalances of chainResults) {
    balances.push(...chainBalances);
  }

  // Sort by USD value descending
  balances.sort((a, b) => b.amountInUSD - a.amountInUSD);

  // Update cache
  balanceCache = {
    data: balances,
    timestamp: now,
    walletAddress,
  };

  return balances;
}

/**
 * Clear the balance cache
 */
export function clearBalanceCache(): void {
  balanceCache = null;
}

/**
 * Get popular tokens to scan for existing balances
 */
export async function getPopularTokensToScan(): Promise<LiFiToken[]> {
  // Only run on client
  if (typeof window === "undefined") {
    return [];
  }

  // Check cache
  const now = Date.now();
  if (
    discoveredTokensCache &&
    now - discoveredTokensCache.timestamp < DISCOVERED_TOKENS_CACHE_TTL_MS
  ) {
    return discoveredTokensCache.tokens;
  }

  try {
    const { getTokens, createConfig, ChainType } = await import("@lifi/sdk");

    // Ensure SDK is configured
    try {
      createConfig({ integrator: "particle-ua-demo" });
    } catch {
      // Already configured
    }

    // Fetch all tokens from LI.FI
    const response = await getTokens({
      chains: LIFI_CHAIN_IDS as unknown as number[],
      chainTypes: [ChainType.EVM],
    });

    const allTokens = response.tokens as TokensByChain;
    const popularTokens: LiFiToken[] = [];

    // Find popular tokens across all chains
    for (const chainId of LIFI_CHAIN_IDS) {
      const chainTokens = allTokens[chainId] || [];

      for (const token of chainTokens) {
        const coinKey = (token.coinKey || token.symbol).toUpperCase();

        if (POPULAR_TOKENS_TO_SCAN.includes(coinKey)) {
          popularTokens.push({
            address: token.address,
            symbol: token.symbol,
            decimals: token.decimals,
            chainId: token.chainId,
            name: token.name,
            coinKey: token.coinKey,
            priceUSD: token.priceUSD,
            logoURI: token.logoURI,
          });
        }
      }
    }

    // Cache the result
    discoveredTokensCache = {
      tokens: popularTokens,
      timestamp: now,
    };

    return popularTokens;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Error fetching popular tokens:", error);
    }
    return [];
  }
}

/**
 * Scan wallet for existing balances of popular tokens
 */
export async function scanForExistingBalances(
  walletAddress: string
): Promise<TokenBalance[]> {
  if (!walletAddress) {
    return [];
  }

  const popularTokens = await getPopularTokensToScan();

  if (popularTokens.length === 0) {
    return [];
  }

  return fetchTokenBalances(walletAddress, popularTokens);
}
