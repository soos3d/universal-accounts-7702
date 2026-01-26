import {
  CHAIN_ID,
  type UniversalAccount,
} from "@particle-network/universal-account-sdk";

/**
 * Map numeric chain IDs to Universal Account CHAIN_ID enum values.
 * This allows us to translate from LI.FI/standard chain IDs to the SDK enum.
 */
const NUMERIC_TO_UA_CHAIN_ID: Record<number, CHAIN_ID> = {
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

export interface SellTransactionParams {
  /** Numeric chain ID where the token exists */
  chainId: number;
  /** Token contract address */
  tokenAddress: string;
  /** Amount of tokens to sell (raw amount, no decimals adjustment needed per SDK docs) */
  amount: string;
  /** Universal Account instance */
  universalAccount: UniversalAccount;
}

export interface SellTransactionResult {
  transaction: Awaited<ReturnType<UniversalAccount["createSellTransaction"]>>;
  description: string;
}

/**
 * Creates a sell transaction using Universal Account's createSellTransaction method.
 *
 * This function handles the conversion from numeric chain IDs to UA chain IDs
 * and creates a transaction that will sell the specified token back to a primary asset
 * (USDC/USDT) through Particle's Chain Abstraction layer.
 *
 * The amount specified is the raw token amount to be sold (no decimals adjustment needed).
 * The UA SDK handles all complexity internally:
 * - Routing from source token to primary assets
 * - Cross-chain bridging if needed
 * - Optimal path selection
 *
 * @param params - Sell transaction parameters
 * @returns Transaction object ready for signing and sending
 * @throws Error if chain is unsupported
 */
export async function createSellTransaction(
  params: SellTransactionParams
): Promise<SellTransactionResult> {
  const { chainId, tokenAddress, amount, universalAccount } = params;

  const uaChainId = NUMERIC_TO_UA_CHAIN_ID[chainId];
  if (!uaChainId) {
    throw new Error(
      `Unsupported chain ID: ${chainId}. This chain is not supported for selling.`
    );
  }

  const transaction = await universalAccount.createSellTransaction({
    token: {
      chainId: uaChainId,
      address: tokenAddress,
    },
    amount,
  });

  const description = `Sell ${amount} tokens`;

  return { transaction, description };
}
