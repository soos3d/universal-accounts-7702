/**
 * Token balance interface used across the application.
 * Balance fetching is now done via lib/particle-balances.ts
 */
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
