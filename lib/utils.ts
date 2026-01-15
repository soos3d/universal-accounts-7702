import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { CHAIN_ID, SUPPORTED_TOKEN_TYPE } from "@particle-network/universal-account-sdk";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const truncateAddress = (addr: string) =>
  addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";

export const copyToClipboard = async (value?: string) => {
  if (!value) return;
  try {
    await navigator.clipboard.writeText(value);
  } catch (error) {
    console.error("Failed to copy address", error);
  }
};

export const getChainName = (chainId: number): string => {
  const chainNames: Record<number, string> = {
    1: "Ethereum",
    10: "Optimism",
    56: "BNB Chain",
    137: "Polygon",
    8453: "Base",
    42161: "Arbitrum",
    43114: "Avalanche",
    59144: "Linea",
    80094: "Berachain",
    101: "Solana",
    146: "Sonic",
    196: "X Layer",
    143: "Blast",
    999: "Zora",
    5000: "Mantle",
    9745: "Plume",
  };
  return chainNames[chainId] || `Chain ${chainId}`;
};

export const LOGO_URLS: Record<string, string> = {
  // Chains
  Ethereum:
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png",
  Arbitrum:
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png",
  Base:
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png",
  Polygon:
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png",
  "BNB Chain":
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png",
  Solana:
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png",
  Optimism:
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/optimism/info/logo.png",
  Avalanche:
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchec/info/logo.png",
  Linea:
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/linea/info/logo.png",
  Mantle:
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/mantle/info/logo.png",
  Zora:
    "https://universalx.app/_next/image?url=https%3A%2F%2Fstatic.particle.network%2Fchains%2Fevm%2Ficons%2F999.png&w=32&q=75",
  "X Layer":
    "https://universalx.app/_next/image?url=https%3A%2F%2Fstatic.particle.network%2Fchains%2Fevm%2Ficons%2F196.png&w=32&q=75",
  Sonic:
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/sonic/info/logo.png",
  Berachain:
    "https://universalx.app/_next/image?url=https%3A%2F%2Fstatic.particle.network%2Fchains%2Fevm%2Ficons%2F80094.png&w=32&q=75",
  // Tokens
  ETH: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png",
  USDC: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png",
  USDT: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png",
  BTC: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoin/info/logo.png",
  SOL: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png",
  BNB: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png",
};

export const chainIdMap: Record<string, number> = {
  Ethereum: CHAIN_ID.ETHEREUM_MAINNET,
  Optimism: CHAIN_ID.OPTIMISM_MAINNET,
  Arbitrum: CHAIN_ID.ARBITRUM_MAINNET_ONE,
  Base: CHAIN_ID.BASE_MAINNET,
  "BNB Chain": CHAIN_ID.BSC_MAINNET,
  Berachain: CHAIN_ID.BERACHAIN_MAINNET,
  Sonic: CHAIN_ID.SONIC_MAINNET,
  Polygon: CHAIN_ID.POLYGON_MAINNET,
  "X Layer": CHAIN_ID.XLAYER_MAINNET,
  Solana: CHAIN_ID.SOLANA_MAINNET,
};

export const tokenTypeMap: Record<string, SUPPORTED_TOKEN_TYPE> = {
  USDC: SUPPORTED_TOKEN_TYPE.USDC,
  USDT: SUPPORTED_TOKEN_TYPE.USDT,
  ETH: SUPPORTED_TOKEN_TYPE.ETH,
  BTC: SUPPORTED_TOKEN_TYPE.BTC,
  SOL: SUPPORTED_TOKEN_TYPE.SOL,
  BNB: SUPPORTED_TOKEN_TYPE.BNB,
};

export const availableAssets = ["USDC", "USDT", "ETH", "BTC", "SOL", "BNB"];
export const availableChains = Object.keys(chainIdMap);

export const chainAssetAvailability: Record<string, string[]> = {
  Solana: ["USDC", "USDT", "SOL"],
  Ethereum: ["USDC", "USDT", "ETH", "BTC"],
  Base: ["USDC", "ETH", "BTC"],
  "BNB Chain": ["USDC", "USDT", "ETH", "BTC", "BNB"],
  Mantle: ["USDT"],
  "X Layer": ["USDC", "USDT"],
  Sonic: ["USDC"],
  Berachain: ["USDC"],
  Avalanche: ["USDC", "USDT", "ETH", "BTC"],
  Arbitrum: ["USDC", "USDT", "ETH", "BTC"],
  Optimism: ["USDC", "USDT", "ETH", "BTC"],
  Polygon: ["USDC", "USDT", "ETH", "BTC"],
};

export const getAvailableAssetsForChain = (chain: string): string[] => {
  return chainAssetAvailability[chain] || [];
};
