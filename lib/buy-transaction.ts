import {
  CHAIN_ID,
  type UniversalAccount,
} from "@particle-network/universal-account-sdk";

/**
 * Map LI.FI chain IDs to Universal Account CHAIN_ID enum values.
 * This allows us to translate between the two systems.
 */
const LIFI_TO_UA_CHAIN_ID: Record<number, CHAIN_ID> = {
  1: CHAIN_ID.ETHEREUM_MAINNET,
  56: CHAIN_ID.BSC_MAINNET,
  137: CHAIN_ID.POLYGON_MAINNET,
  42161: CHAIN_ID.ARBITRUM_MAINNET_ONE,
  10: CHAIN_ID.OPTIMISM_MAINNET,
  8453: CHAIN_ID.BASE_MAINNET,
  43114: CHAIN_ID.AVALANCHE_MAINNET,
  59144: CHAIN_ID.LINEA_MAINNET,
  5000: CHAIN_ID.MANTLE_MAINNET,
  146: CHAIN_ID.SONIC_MAINNET,
  80094: CHAIN_ID.BERACHAIN_MAINNET,
};

export interface BuyTransactionParams {
  /** LI.FI chain ID for the destination chain */
  chainId: number;
  /** Token contract address on the destination chain */
  tokenAddress: string;
  /** Amount in USD to spend from primary assets */
  amountInUSD: string;
  /** Universal Account instance */
  universalAccount: UniversalAccount;
}

export interface BuyTransactionResult {
  transaction: Awaited<ReturnType<UniversalAccount["createBuyTransaction"]>>;
  description: string;
}

/**
 * Creates a buy transaction using Universal Account's native createBuyTransaction.
 *
 * This function handles the conversion from LI.FI chain IDs to UA chain IDs
 * and creates a transaction that will purchase the specified token using
 * the user's primary assets (USDC/USDT across all chains).
 *
 * The UA SDK handles all complexity internally:
 * - Routing from source assets to destination token
 * - Cross-chain bridging if needed
 * - Optimal path selection
 *
 * @param params - Buy transaction parameters
 * @returns Transaction object ready for signing and sending
 * @throws Error if chain is unsupported
 */
export async function createBuyTransaction(
  params: BuyTransactionParams
): Promise<BuyTransactionResult> {
  const { chainId, tokenAddress, amountInUSD, universalAccount } = params;

  const uaChainId = LIFI_TO_UA_CHAIN_ID[chainId];
  if (!uaChainId) {
    throw new Error(
      `Unsupported chain ID: ${chainId}. This chain is not supported for swaps.`
    );
  }

  const transaction = await universalAccount.createBuyTransaction({
    token: {
      chainId: uaChainId,
      address: tokenAddress,
    },
    amountInUSD,
  });

  const description = `Buy $${amountInUSD} of tokens`;

  return { transaction, description };
}
