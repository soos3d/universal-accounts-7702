// Supported LI.FI chains (verified against LI.FI API)
// Note: X Layer (196) and Merlin (4200) are NOT supported by LI.FI
export const LIFI_CHAINS = [
  { id: 1, name: "Ethereum", logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png" },
  { id: 56, name: "BNB Chain", logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png" },
  { id: 5000, name: "Mantle", logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/mantle/info/logo.png" },
  { id: 143, name: "Monad", logo: "https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/monad.svg" },
  { id: 9745, name: "Plasma", logo: "https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/plasma.svg" },
  { id: 8453, name: "Base", logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png" },
  { id: 42161, name: "Arbitrum", logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png" },
  { id: 43114, name: "Avalanche", logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchec/info/logo.png" },
  { id: 10, name: "Optimism", logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/optimism/info/logo.png" },
  { id: 137, name: "Polygon", logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png" },
  { id: 999, name: "HyperEVM", logo: "https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/chains/hyperevm.svg" },
  { id: 80094, name: "Berachain", logo: "https://universalx.app/_next/image?url=https%3A%2F%2Fstatic.particle.network%2Fchains%2Fevm%2Ficons%2F80094.png&w=32&q=75" },
  { id: 59144, name: "Linea", logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/linea/info/logo.png" },
  { id: 146, name: "Sonic", logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/sonic/info/logo.png" },
] as const;

export const LIFI_CHAIN_IDS = LIFI_CHAINS.map((c) => c.id);

export type LiFiChain = (typeof LIFI_CHAINS)[number];

export function getLiFiChainById(chainId: number): LiFiChain | undefined {
  return LIFI_CHAINS.find((c) => c.id === chainId);
}
