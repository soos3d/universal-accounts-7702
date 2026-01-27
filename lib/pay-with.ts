import {
  SUPPORTED_TOKEN_TYPE,
  type IAssetsResponse,
} from "@particle-network/universal-account-sdk";

/**
 * Pay with option for swap transactions.
 * - "any": SDK chooses the most efficient token (default)
 * - "specific": User selected a specific primary token
 */
export type PayWithOption =
  | { type: "any" }
  | { type: "specific"; token: SUPPORTED_TOKEN_TYPE };

/**
 * Represents an available primary token that the user holds
 */
export interface AvailablePrimaryToken {
  tokenType: SUPPORTED_TOKEN_TYPE;
  symbol: string;
  amountInUSD: number;
  amount: number;
  logoUrl: string;
}

/**
 * Map from asset tokenType (lowercase) to SUPPORTED_TOKEN_TYPE
 */
const TOKEN_TYPE_STRING_TO_ENUM: Record<string, SUPPORTED_TOKEN_TYPE> = {
  eth: SUPPORTED_TOKEN_TYPE.ETH,
  usdt: SUPPORTED_TOKEN_TYPE.USDT,
  usdc: SUPPORTED_TOKEN_TYPE.USDC,
  btc: SUPPORTED_TOKEN_TYPE.BTC,
  bnb: SUPPORTED_TOKEN_TYPE.BNB,
  sol: SUPPORTED_TOKEN_TYPE.SOL,
};

/**
 * Logo URLs for primary tokens
 */
const TOKEN_LOGOS: Partial<Record<SUPPORTED_TOKEN_TYPE, string>> = {
  [SUPPORTED_TOKEN_TYPE.ETH]:
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png",
  [SUPPORTED_TOKEN_TYPE.USDT]:
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png",
  [SUPPORTED_TOKEN_TYPE.USDC]:
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png",
  [SUPPORTED_TOKEN_TYPE.BTC]:
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoin/info/logo.png",
  [SUPPORTED_TOKEN_TYPE.BNB]:
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png",
  [SUPPORTED_TOKEN_TYPE.SOL]:
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png",
};

/**
 * Display names for primary tokens
 */
const TOKEN_SYMBOLS: Partial<Record<SUPPORTED_TOKEN_TYPE, string>> = {
  [SUPPORTED_TOKEN_TYPE.ETH]: "ETH",
  [SUPPORTED_TOKEN_TYPE.USDT]: "USDT",
  [SUPPORTED_TOKEN_TYPE.USDC]: "USDC",
  [SUPPORTED_TOKEN_TYPE.BTC]: "BTC",
  [SUPPORTED_TOKEN_TYPE.BNB]: "BNB",
  [SUPPORTED_TOKEN_TYPE.SOL]: "SOL",
};

/**
 * Extract available primary tokens from Universal Account balance.
 * Only returns tokens with balance > 0.
 */
export function getAvailablePrimaryTokens(
  balance: IAssetsResponse | null
): AvailablePrimaryToken[] {
  if (!balance?.assets) return [];

  const tokenMap = new Map<SUPPORTED_TOKEN_TYPE, AvailablePrimaryToken>();

  for (const asset of balance.assets) {
    // Asset has tokenType as lowercase string like "usdc", "usdt", "sol"
    const tokenTypeEnum = TOKEN_TYPE_STRING_TO_ENUM[asset.tokenType.toLowerCase()];
    if (!tokenTypeEnum) continue;

    // Aggregate amounts across chains for the same token type
    const existing = tokenMap.get(tokenTypeEnum);
    if (existing) {
      tokenMap.set(tokenTypeEnum, {
        ...existing,
        amountInUSD: existing.amountInUSD + asset.amountInUSD,
        amount: existing.amount + parseFloat(String(asset.amount)),
      });
    } else {
      tokenMap.set(tokenTypeEnum, {
        tokenType: tokenTypeEnum,
        symbol: TOKEN_SYMBOLS[tokenTypeEnum] ?? asset.tokenType.toUpperCase(),
        amountInUSD: asset.amountInUSD,
        amount: parseFloat(String(asset.amount)),
        logoUrl: TOKEN_LOGOS[tokenTypeEnum] ?? "",
      });
    }
  }

  // Filter out tokens with dust balance (< $0.01) and sort by USD value
  return Array.from(tokenMap.values())
    .filter((token) => token.amountInUSD >= 0.01)
    .sort((a, b) => b.amountInUSD - a.amountInUSD);
}

/**
 * Get the logo URL for a SUPPORTED_TOKEN_TYPE
 */
export function getTokenLogo(tokenType: SUPPORTED_TOKEN_TYPE): string {
  return TOKEN_LOGOS[tokenType] || "";
}

/**
 * Get the display symbol for a SUPPORTED_TOKEN_TYPE
 */
export function getTokenSymbol(tokenType: SUPPORTED_TOKEN_TYPE): string {
  return TOKEN_SYMBOLS[tokenType] || "";
}

/**
 * Convert PayWithOption to usePrimaryTokens array for SDK
 */
export function payWithOptionToTokenArray(
  option: PayWithOption
): SUPPORTED_TOKEN_TYPE[] {
  if (option.type === "any") {
    return [];
  }
  return [option.token];
}

/**
 * Get the available balance based on pay-with selection.
 * - "any": Returns total balance
 * - "specific": Returns only that token's balance
 */
export function getAvailableBalanceForPayWith(
  option: PayWithOption,
  balance: IAssetsResponse | null,
  availableTokens: AvailablePrimaryToken[]
): number {
  if (!balance) return 0;

  if (option.type === "any") {
    return balance.totalAmountInUSD;
  }

  // Debug logging
  console.log("[PayWith] Looking for token:", option.token, "type:", typeof option.token);
  console.log("[PayWith] Available tokens:", availableTokens.map(t => ({ tokenType: t.tokenType, typeOf: typeof t.tokenType, symbol: t.symbol })));

  const selectedToken = availableTokens.find(
    (t) => t.tokenType === option.token
  );

  console.log("[PayWith] Found token:", selectedToken);

  return selectedToken?.amountInUSD ?? 0;
}
