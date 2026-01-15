"use client";

import React, { useEffect, useState } from "react";
import {
  usePrivy,
  useLogin,
  useCreateWallet,
  useUser,
  useSignMessage,
  useWallets,
  useSign7702Authorization,
} from "@privy-io/react-auth";
import {
  CHAIN_ID,
  UniversalAccount,
  type IAssetsResponse,
  UNIVERSAL_ACCOUNT_VERSION,
  SUPPORTED_TOKEN_TYPE,
} from "@particle-network/universal-account-sdk";
import { Signature } from "ethers";

type EIP7702Authorization = {
  userOpHash: string;
  signature: string;
};

export default function Home() {
  const { ready, authenticated, logout } = usePrivy();
  const { user } = useUser();
  const { login } = useLogin();
  const { createWallet } = useCreateWallet();
  const { signMessage } = useSignMessage();
  const { wallets } = useWallets();
  const { signAuthorization } = useSign7702Authorization();

  const [walletCreated, setWalletCreated] = useState(false);
  const [balance, setBalance] = useState<IAssetsResponse | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState<boolean>(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [universalAccount, setUniversalAccount] =
    useState<UniversalAccount | null>(null);
  const [initializedOwner, setInitializedOwner] = useState<string | null>(null);
  const [smartAccountAddresses, setSmartAccountAddresses] = useState<{
    ownerAddress?: string;
    evmUaAddress?: string;
    solanaUaAddress?: string;
  } | null>(null);
  const [selectedChain, setSelectedChain] = useState<string>("");
  const [selectedAsset, setSelectedAsset] = useState<string>("");
  const [swapAmount, setSwapAmount] = useState<string>("");
  const [showBalanceDialog, setShowBalanceDialog] = useState<boolean>(false);
  const [expandedAssets, setExpandedAssets] = useState<Set<number>>(new Set());

  const truncateAddress = (addr: string) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";

  const copyToClipboard = async (value?: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
    } catch (error) {
      console.error("Failed to copy address", error);
    }
  };

  const getChainName = (chainId: number): string => {
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

  const toggleAssetExpansion = (index: number) => {
    setExpandedAssets((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  useEffect(() => {
    const ensureWallet = async () => {
      if (!ready || !user || walletCreated) return;

      const embeddedWallet = wallets?.find(
        (w) => w.walletClientType === "privy"
      );

      if (!embeddedWallet) {
        try {
          await createWallet();
          setWalletCreated(true);
        } catch (err) {
          console.error("Wallet creation failed:", err);
        }
      } else {
        setWalletCreated(true);
      }
    };
    ensureWallet();
  }, [ready, user, createWallet, walletCreated, wallets]);

  useEffect(() => {
    const embeddedWallet = wallets?.find((w) => w.walletClientType === "privy");
    const owner = embeddedWallet?.address;

    if (!owner) return;

    if (initializedOwner === owner) return;

    const ua = new UniversalAccount({
      projectId: process.env.NEXT_PUBLIC_PROJECT_ID!,
      projectClientKey: process.env.NEXT_PUBLIC_CLIENT_KEY!,
      projectAppUuid: process.env.NEXT_PUBLIC_APP_ID!,
      smartAccountOptions: {
        useEIP7702: true,
        name: "UNIVERSAL",
        version:
          process.env.UNIVERSAL_ACCOUNT_VERSION || UNIVERSAL_ACCOUNT_VERSION,
        ownerAddress: owner,
      },
      tradeConfig: { slippageBps: 100, universalGas: true },
    });

    setUniversalAccount(ua);
    setInitializedOwner(owner);
  }, [wallets, initializedOwner]);

  useEffect(() => {
    (async () => {
      if (!universalAccount) return;
      try {
        const opts = await universalAccount.getSmartAccountOptions();
        const embeddedWallet = wallets?.find(
          (w) => w.walletClientType === "privy"
        );
        const owner = embeddedWallet?.address;
        if (!owner) return;
        setSmartAccountAddresses({
          ownerAddress: owner,
          evmUaAddress: opts?.smartAccountAddress || "",
          solanaUaAddress: opts?.solanaSmartAccountAddress || "",
        });
      } catch (e) {
        console.error("Error fetching smart account options", e);
      }
    })();
  }, [universalAccount, wallets]);

  useEffect(() => {
    (async () => {
      if (!universalAccount) return;
      try {
        const res = await universalAccount.getPrimaryAssets();
        setBalance(res);
      } catch (err) {
        console.error("Error fetching assets", err);
        setBalance({ assets: [], totalAmountInUSD: 0 });
      }
    })();
  }, [universalAccount]);

  const fetchBalance = async () => {
    try {
      if (!universalAccount) return;
      setIsLoadingBalance(true);
      const primaryAssets = await universalAccount.getPrimaryAssets();
      console.log("Unified Balance:", primaryAssets);
      setBalance(primaryAssets || null);
    } catch (error) {
      console.error("Error fetching balance:", error);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const chainIdMap: Record<string, number> = {
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

  const tokenTypeMap: Record<string, SUPPORTED_TOKEN_TYPE> = {
    USDC: SUPPORTED_TOKEN_TYPE.USDC,
    USDT: SUPPORTED_TOKEN_TYPE.USDT,
    ETH: SUPPORTED_TOKEN_TYPE.ETH,
    BTC: SUPPORTED_TOKEN_TYPE.BTC,
    SOL: SUPPORTED_TOKEN_TYPE.SOL,
    BNB: SUPPORTED_TOKEN_TYPE.BNB,
  };

  const handleSwap = async () => {
    const embeddedWallet = wallets?.find((w) => w.walletClientType === "privy");
    const deployments = await universalAccount?.getEIP7702Deployments();
    console.log("Deployments:", deployments);
    if (
      !universalAccount ||
      !selectedChain ||
      !selectedAsset ||
      !swapAmount ||
      !embeddedWallet
    ) {
      console.error("Missing required data for swap");
      return;
    }

    setIsSending(true);
    setTransactionHash(null);

    try {
      const chainId = chainIdMap[selectedChain];
      const tokenType = tokenTypeMap[selectedAsset];

      console.log("Creating convert transaction:", {
        chain: selectedChain,
        chainId,
        asset: selectedAsset,
        tokenType,
        amount: swapAmount,
      });

      const transaction = await universalAccount.createConvertTransaction({
        expectToken: { type: tokenType, amount: swapAmount },
        chainId: chainId,
      });

      console.log("Convert transaction created:", transaction);

      if (!transaction) {
        throw new Error("Failed to create convert transaction");
      }

      // Handle 7702 Authorization using Privy's signAuthorization
      const authorizations: EIP7702Authorization[] = [];
      const nonceMap = new Map<number, string>();

      for (const userOp of transaction.userOps) {
        if (!!userOp.eip7702Auth && !userOp.eip7702Delegated) {
          let signatureSerialized = nonceMap.get(userOp.eip7702Auth.nonce);
          if (!signatureSerialized) {
            // Use Privy's signAuthorization hook which handles nonces properly
            const authorization = await signAuthorization(
              {
                contractAddress: userOp.eip7702Auth.address as `0x${string}`,
                chainId: Number(userOp.eip7702Auth.chainId),
                nonce: userOp.eip7702Auth.nonce,
              },
              {
                address: embeddedWallet.address,
              }
            );

            // Serialize the authorization signature (r, s, v components) into a hex string
            const sig = Signature.from({
              r: authorization.r,
              s: authorization.s,
              v: authorization.v ?? BigInt(authorization.yParity),
              yParity: authorization.yParity as 0 | 1,
            });
            signatureSerialized = sig.serialized;
            nonceMap.set(userOp.eip7702Auth.nonce, signatureSerialized);
          }

          if (signatureSerialized) {
            authorizations.push({
              userOpHash: userOp.userOpHash,
              signature: signatureSerialized,
            });
          }
        }
      }

      const { signature } = await signMessage(
        { message: transaction.rootHash },
        {
          uiOptions: {
            title: `Convert to ${selectedAsset} on ${selectedChain}`,
          },
          address: embeddedWallet.address,
        }
      );

      const sendResult = await universalAccount.sendTransaction(
        transaction,
        signature,
        authorizations
      );

      console.log("Swap transaction sent:", sendResult);
      setTransactionHash(sendResult.transactionId || "Transaction submitted");

      setSelectedChain("");
      setSelectedAsset("");
      setSwapAmount("");
    } catch (error) {
      console.error("Error executing swap:", error);
      alert(
        `Swap failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsSending(false);
    }
  };

  const availableAssets = ["USDC", "USDT", "ETH", "BTC", "SOL", "BNB"];
  const availableChains = Object.keys(chainIdMap);

  const getAssetBalance = (assetType: string) => {
    if (!balance?.assets) return null;
    return balance.assets.find(
      (a) => a.tokenType.toUpperCase() === assetType.toUpperCase()
    );
  };

  const selectedAssetBalance = selectedAsset
    ? getAssetBalance(selectedAsset)
    : null;

  if (!ready)
    return (
      <div className="flex h-screen items-center justify-center text-gray-600">
        Initializing...
      </div>
    );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-gray-800 text-white">
      {!user ? (
        <div className="flex flex-col items-center gap-6">
          <h1 className="text-3xl font-bold from-purple-400 to-purple-600 bg-clip-text text-transparent">
            Universal Accounts
          </h1>
          <p className="text-gray-400 text-center max-w-md">
            Convert your EOA into a Universal Account with EIP-7702
          </p>
          <button
            onClick={() =>
              login({ loginMethods: ["email", "google", "twitter"] })
            }
            disabled={!ready || authenticated}
            className="bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200"
          >
            {ready ? "Sign in with Privy" : "Loading..."}
          </button>
        </div>
      ) : (
        <div className="w-full max-w-md space-y-4">
          {/* Account Card */}
          <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Account</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">
                  {user.email?.address || "No email"}
                </span>
                <button
                  onClick={() => logout()}
                  className="text-xs text-gray-400 hover:text-red-400 transition-colors px-2 py-1"
                >
                  Disconnect
                </button>
              </div>
            </div>

            {smartAccountAddresses && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">EVM</span>
                  <div className="flex items-center gap-2">
                    <code className="text-gray-300">
                      {truncateAddress(
                        smartAccountAddresses.ownerAddress || ""
                      )}
                    </code>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(smartAccountAddresses.ownerAddress)
                      }
                      className="text-xs text-gray-400 hover:text-purple-300 transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Solana</span>
                  <div className="flex items-center gap-2">
                    <code className="text-gray-300">
                      {truncateAddress(
                        smartAccountAddresses.solanaUaAddress || ""
                      )}
                    </code>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(smartAccountAddresses.solanaUaAddress)
                      }
                      className="text-xs text-gray-400 hover:text-purple-300 transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-800">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Total Balance</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => balance && setShowBalanceDialog(true)}
                    disabled={!balance}
                    className="text-xl font-bold hover:text-purple-400 transition-colors disabled:cursor-default disabled:hover:text-white"
                  >
                    {isLoadingBalance
                      ? "..."
                      : balance
                      ? `$${balance.totalAmountInUSD.toFixed(2)}`
                      : "$0.00"}
                  </button>
                  <button
                    onClick={fetchBalance}
                    disabled={isLoadingBalance}
                    className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    <svg
                      className={`w-4 h-4 ${
                        isLoadingBalance ? "animate-spin" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Swap Card */}
          <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-800">
            <h2 className="text-lg font-semibold mb-4">Swap</h2>

            {/* Asset Selection */}
            <div className="bg-gray-800/50 rounded-xl p-4 mb-3">
              <span className="text-xs text-gray-400 uppercase tracking-wide">
                Receive
              </span>
              <div className="flex items-center justify-between mt-2">
                <select
                  value={selectedAsset}
                  onChange={(e) => setSelectedAsset(e.target.value)}
                  className="bg-transparent text-lg font-medium focus:outline-none cursor-pointer"
                >
                  <option value="" className="bg-gray-900">
                    Select token
                  </option>
                  {availableAssets.map((asset) => (
                    <option key={asset} value={asset} className="bg-gray-900">
                      {asset}
                    </option>
                  ))}
                </select>
                {selectedAssetBalance && (
                  <span className="text-sm text-gray-400">
                    Balance:{" "}
                    {parseFloat(selectedAssetBalance.amount.toString()).toFixed(
                      4
                    )}
                  </span>
                )}
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center -my-1 relative z-10">
              <div className="bg-gray-800 rounded-lg p-2 border border-gray-700">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
              </div>
            </div>

            {/* Chain Selection */}
            <div className="bg-gray-800/50 rounded-xl p-4 mt-3">
              <span className="text-xs text-gray-400 uppercase tracking-wide">
                On Chain
              </span>
              <select
                value={selectedChain}
                onChange={(e) => setSelectedChain(e.target.value)}
                className="w-full bg-transparent text-lg font-medium mt-2 focus:outline-none cursor-pointer"
              >
                <option value="" className="bg-gray-900">
                  Select chain
                </option>
                {availableChains.map((chain) => (
                  <option key={chain} value={chain} className="bg-gray-900">
                    {chain}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount Input */}
            <div className="bg-gray-800/50 rounded-xl p-4 mt-3">
              <span className="text-xs text-gray-400 uppercase tracking-wide">
                Amount
              </span>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="number"
                  placeholder="0"
                  value={swapAmount}
                  onChange={(e) => setSwapAmount(e.target.value)}
                  className="w-full bg-transparent text-2xl font-medium focus:outline-none"
                />
                {selectedAsset && (
                  <span className="text-gray-400 text-sm">{selectedAsset}</span>
                )}
              </div>
              {selectedAssetBalance && (
                <p className="text-xs text-gray-500 mt-1">
                  ≈ $
                  {(
                    parseFloat(swapAmount || "0") *
                    (selectedAssetBalance.amountInUSD /
                      parseFloat(selectedAssetBalance.amount.toString()))
                  ).toFixed(2)}
                </p>
              )}
            </div>

            {/* Swap Button */}
            <button
              onClick={handleSwap}
              disabled={
                !selectedChain || !selectedAsset || !swapAmount || isSending
              }
              className="w-full mt-4 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold py-4 rounded-xl transition-all duration-200"
            >
              {isSending
                ? "Processing..."
                : !selectedAsset
                ? "Select asset"
                : !selectedChain
                ? "Select chain"
                : !swapAmount
                ? "Enter amount"
                : `Swap to ${selectedChain}`}
            </button>

            {/* Transaction Success */}
            {transactionHash && (
              <div className="mt-4 p-4 bg-green-900/20 border border-green-800 rounded-xl">
                <p className="text-sm text-green-400 font-medium">
                  Swap Successful!
                </p>
                <a
                  href={`https://universalx.app/activity/details?id=${transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-purple-400 hover:text-purple-300 mt-2 inline-flex items-center gap-1"
                >
                  View on Explorer
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Balance Breakdown Dialog */}
      {showBalanceDialog && balance && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setShowBalanceDialog(false)}
        >
          <div
            className="bg-gray-900 rounded-2xl p-6 border border-gray-800 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Balance Breakdown</h3>
              <button
                onClick={() => setShowBalanceDialog(false)}
                className="text-gray-400 hover:text-white transition-colors p-1"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-3 mb-6 max-h-[60vh] overflow-y-auto">
              {balance.assets.map((asset, index) => {
                const isExpanded = expandedAssets.has(index);
                const hasChains =
                  asset.chainAggregation && asset.chainAggregation.length > 0;
                const chainsWithBalance =
                  asset.chainAggregation?.filter((chain) => chain.amount > 0) ||
                  [];

                return (
                  <div
                    key={index}
                    className="bg-gray-800/50 rounded-xl overflow-hidden"
                  >
                    <div
                      className={`p-4 flex items-center justify-between ${
                        hasChains && chainsWithBalance.length > 0
                          ? "cursor-pointer hover:bg-gray-800/70"
                          : ""
                      }`}
                      onClick={() =>
                        hasChains &&
                        chainsWithBalance.length > 0 &&
                        toggleAssetExpansion(index)
                      }
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-600/20 flex items-center justify-center">
                          <span className="text-purple-400 font-bold text-sm">
                            {asset.tokenType.slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">
                              {asset.tokenType.toUpperCase()}
                            </p>
                            {hasChains && chainsWithBalance.length > 0 && (
                              <svg
                                className={`w-4 h-4 text-gray-400 transition-transform ${
                                  isExpanded ? "rotate-180" : ""
                                }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 9l-7 7-7-7"
                                />
                              </svg>
                            )}
                          </div>
                          <p className="text-sm text-gray-400">
                            {parseFloat(asset.amount.toString()).toFixed(6)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          ${asset.amountInUSD.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-400">
                          {(
                            (asset.amountInUSD / balance.totalAmountInUSD) *
                            100
                          ).toFixed(1)}
                          %
                        </p>
                      </div>
                    </div>

                    {isExpanded && chainsWithBalance.length > 0 && (
                      <div className="border-t border-gray-700/50 bg-gray-900/30">
                        <div className="p-3 space-y-2">
                          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium px-2">
                            Chain Breakdown
                          </p>
                          {chainsWithBalance.map((chain, chainIndex) => (
                            <div
                              key={chainIndex}
                              className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-gray-800/30"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                <span className="text-sm text-gray-300">
                                  {getChainName(chain.token.chainId)}
                                </span>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium text-gray-200">
                                  {parseFloat(chain.amount.toString()).toFixed(
                                    6
                                  )}
                                </p>
                                <p className="text-xs text-gray-500">
                                  ${chain.amountInUSD.toFixed(2)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-gray-800">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 font-medium">Total Value</span>
                <span className="text-2xl font-bold text-purple-400">
                  ${balance.totalAmountInUSD.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
