import type { TokenBalance } from "./lifi-balances";
import { fetchLiFiTokens, type TokensByChain } from "./lifi-tokens";
export type { TokenBalance } from "./lifi-balances";

// Particle RPC endpoint
const PARTICLE_RPC_URL = "https://rpc.particle.network/evm-chain";

// Chain IDs to scan for balances
const SUPPORTED_CHAIN_IDS = [
  1, // Ethereum
  56, // BNB Chain
  137, // Polygon
  42161, // Arbitrum
  10, // Optimism
  43114, // Avalanche
  8453, // Base
  59144, // Linea
  80094, // Berachain
  146, // Sonic
];

// Native token metadata by chain
const NATIVE_TOKENS: Record<
  number,
  { symbol: string; name: string; logoURI: string }
> = {
  1: {
    symbol: "ETH",
    name: "Ethereum",
    logoURI:
      "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  },
  56: {
    symbol: "BNB",
    name: "BNB",
    logoURI:
      "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png",
  },
  137: {
    symbol: "POL",
    name: "Polygon",
    logoURI:
      "https://assets.coingecko.com/coins/images/4713/small/polygon.png",
  },
  42161: {
    symbol: "ETH",
    name: "Ethereum",
    logoURI:
      "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  },
  10: {
    symbol: "ETH",
    name: "Ethereum",
    logoURI:
      "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  },
  43114: {
    symbol: "AVAX",
    name: "Avalanche",
    logoURI:
      "https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png",
  },
  8453: {
    symbol: "ETH",
    name: "Ethereum",
    logoURI:
      "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  },
  59144: {
    symbol: "ETH",
    name: "Ethereum",
    logoURI:
      "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  },
  80094: {
    symbol: "BERA",
    name: "Berachain",
    logoURI:
      "https://assets.coingecko.com/coins/images/36006/small/bera.png",
  },
  146: {
    symbol: "S",
    name: "Sonic",
    logoURI:
      "https://assets.coingecko.com/coins/images/38034/small/sonic.png",
  },
};

// Cache for balance results
let particleBalanceCache: {
  data: TokenBalance[];
  timestamp: number;
  walletAddress: string;
} | null = null;

const CACHE_TTL_MS = 30 * 1000; // 30 seconds

interface ParticleToken {
  decimals: number;
  amount: string;
  address: string;
  name: string;
  symbol: string;
  image?: string;
}

interface ParticleTokensResponse {
  native: string;
  tokens: ParticleToken[];
}

/**
 * Get Particle credentials from environment
 */
function getParticleCredentials(): { projectId: string; clientKey: string } {
  const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;
  const clientKey = process.env.NEXT_PUBLIC_CLIENT_KEY;

  if (!projectId || !clientKey) {
    throw new Error("Particle credentials not configured in environment");
  }

  return { projectId, clientKey };
}

/**
 * Fetch tokens for a wallet on a specific chain using Particle RPC
 */
async function fetchChainTokens(
  walletAddress: string,
  chainId: number
): Promise<TokenBalance[]> {
  try {
    const { projectId, clientKey } = getParticleCredentials();

    const response = await fetch(PARTICLE_RPC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa(`${projectId}:${clientKey}`)}`,
      },
      body: JSON.stringify({
        chainId,
        jsonrpc: "2.0",
        id: 1,
        method: "particle_getTokens",
        params: [walletAddress],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.warn(`Rate limited on chain ${chainId}, skipping...`);
        return [];
      }
      return [];
    }

    const data = await response.json();

    if (data.error) {
      if (process.env.NODE_ENV === "development") {
        console.warn(`Particle API error for chain ${chainId}:`, data.error);
      }
      return [];
    }

    const result: ParticleTokensResponse = data.result;
    const balances: TokenBalance[] = [];

    // Add native token balance if > 0
    const nativeBalance = BigInt(result.native || "0");
    if (nativeBalance > BigInt(0)) {
      const nativeToken = NATIVE_TOKENS[chainId];
      if (nativeToken) {
        balances.push({
          address: "0x0000000000000000000000000000000000000000",
          symbol: nativeToken.symbol,
          name: nativeToken.name,
          decimals: 18,
          chainId,
          amount: result.native,
          amountInUSD: 0, // Particle doesn't return prices, would need separate API
          logoURI: nativeToken.logoURI,
        });
      }
    }

    // Add ERC-20 tokens
    for (const token of result.tokens || []) {
      const tokenBalance = BigInt(token.amount || "0");
      if (tokenBalance > BigInt(0)) {
        balances.push({
          address: token.address,
          symbol: token.symbol,
          name: token.name,
          decimals: token.decimals,
          chainId,
          amount: token.amount,
          amountInUSD: 0, // Particle doesn't return prices
          logoURI: token.image,
        });
      }
    }

    return balances;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`Error fetching tokens for chain ${chainId}:`, error);
    }
    return [];
  }
}

/**
 * Enrich token balances with price data from LI.FI
 */
async function enrichWithPrices(
  balances: TokenBalance[]
): Promise<TokenBalance[]> {
  try {
    const lifiTokens = await fetchLiFiTokens();

    // Build a lookup map: chainId-address -> priceUSD
    const priceMap = new Map<string, { priceUSD: string; logoURI?: string }>();

    for (const chainIdStr of Object.keys(lifiTokens)) {
      const chainId = parseInt(chainIdStr);
      const tokens = lifiTokens[chainId] || [];

      for (const token of tokens) {
        if (token.priceUSD) {
          const key = `${chainId}-${token.address.toLowerCase()}`;
          priceMap.set(key, {
            priceUSD: token.priceUSD,
            logoURI: token.logoURI,
          });
        }
      }
    }

    // Enrich balances with prices
    return balances.map((balance) => {
      const key = `${balance.chainId}-${balance.address.toLowerCase()}`;
      const priceData = priceMap.get(key);

      if (priceData) {
        const priceUSD = parseFloat(priceData.priceUSD);
        const amountDecimal =
          parseFloat(balance.amount) / Math.pow(10, balance.decimals);
        const amountInUSD = amountDecimal * priceUSD;

        return {
          ...balance,
          amountInUSD,
          priceUSD: priceData.priceUSD,
          logoURI: balance.logoURI || priceData.logoURI,
        };
      }

      return balance;
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Failed to enrich balances with prices:", error);
    }
    return balances;
  }
}

/**
 * Fetch all token balances for a wallet across all supported chains using Particle
 */
export async function fetchAllParticleBalances(
  walletAddress: string
): Promise<TokenBalance[]> {
  if (!walletAddress) {
    return [];
  }

  // Only run on client
  if (typeof window === "undefined") {
    return [];
  }

  // Check cache
  const now = Date.now();
  if (
    particleBalanceCache &&
    particleBalanceCache.walletAddress === walletAddress &&
    now - particleBalanceCache.timestamp < CACHE_TTL_MS
  ) {
    return particleBalanceCache.data;
  }

  // Fetch balances from all chains in parallel, along with LI.FI token prices
  const [chainResults] = await Promise.all([
    Promise.all(
      SUPPORTED_CHAIN_IDS.map((chainId) =>
        fetchChainTokens(walletAddress, chainId)
      )
    ),
  ]);

  // Flatten all results
  let allBalances: TokenBalance[] = chainResults.flat();

  // Enrich with LI.FI price data
  allBalances = await enrichWithPrices(allBalances);

  // Sort by USD value descending (tokens without price go to end)
  allBalances.sort((a, b) => {
    // Primary sort: by USD value
    if (a.amountInUSD !== b.amountInUSD) {
      return b.amountInUSD - a.amountInUSD;
    }
    // Secondary sort: by symbol for equal values
    return a.symbol.localeCompare(b.symbol);
  });

  // Update cache
  particleBalanceCache = {
    data: allBalances,
    timestamp: now,
    walletAddress,
  };

  return allBalances;
}

/**
 * Clear the Particle balance cache
 */
export function clearParticleBalanceCache(): void {
  particleBalanceCache = null;
}

/**
 * Get supported chain IDs
 */
export function getParticleSupportedChains(): number[] {
  return [...SUPPORTED_CHAIN_IDS];
}
