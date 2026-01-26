// Supported LI.FI chains - filtered to only those supporting EIP-7702 mode
// Note: X Layer (196) is not supported by LI.FI API
export const LIFI_CHAINS = [
  { id: 1, name: "Ethereum", logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png" },
  { id: 10, name: "Optimism", logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/optimism/info/logo.png" },
  { id: 42161, name: "Arbitrum", logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png" },
  { id: 8453, name: "Base", logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png" },
  { id: 56, name: "BNB Chain", logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png" },
  { id: 80094, name: "Berachain", logo: "https://universalx.app/_next/image?url=https%3A%2F%2Fstatic.particle.network%2Fchains%2Fevm%2Ficons%2F80094.png&w=32&q=75" },
  { id: 146, name: "Sonic", logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/sonic/info/logo.png" },
  { id: 137, name: "Polygon", logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png" },
] as const;

export const LIFI_CHAIN_IDS = LIFI_CHAINS.map((c) => c.id);

type LiFiChain = (typeof LIFI_CHAINS)[number];

export function getLiFiChainById(chainId: number): LiFiChain | undefined {
  return LIFI_CHAINS.find((c) => c.id === chainId);
}
