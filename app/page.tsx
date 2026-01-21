"use client";

import React, { useEffect, useState, useRef } from "react";
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
  UniversalAccount,
  type IAssetsResponse,
  UNIVERSAL_ACCOUNT_VERSION,
} from "@particle-network/universal-account-sdk";
import { SwapCard } from "@/components/SwapCard";
import { TransferCard } from "@/components/TransferCard";
import { LandingHero } from "@/components/LandingHero";
import { WalletSidebar } from "@/components/WalletSidebar";
import { SelectionPanel } from "@/components/SelectionPanel";
import { BackgroundDecoration } from "@/components/BackgroundDecoration";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { chainIdMap, tokenTypeMap } from "@/lib/utils";
import { handleEIP7702Authorizations } from "@/lib/eip7702";

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
  const [showSelectionPanel, setShowSelectionPanel] = useState<
    "token" | "chain" | null
  >(null);
  const [transactions, setTransactions] = useState<
    Array<{
      transactionId: string;
      tag: string;
      createdAt: string;
      updatedAt: string;
      targetToken: {
        name: string;
        type: string;
        image: string;
        price: number;
        symbol: string;
        address: string;
        assetId: string;
        chainId: number;
        decimals: number;
        realDecimals: number;
        isPrimaryToken: boolean;
        isSmartRouterSupported: boolean;
      };
      change: {
        amount: string;
        amountInUSD: string;
        from: string;
        to: string;
      };
      detail: {
        redPacketCount: number;
      };
      status: number;
      fromChains: number[];
      toChains: number[];
      exchangeRateUSD: Array<{
        type: string;
        exchangeRate: {
          type: string;
          price: number;
        };
      }>;
    }>
  >([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoadingMoreTransactions, setIsLoadingMoreTransactions] =
    useState(false);
  const walletCreationAttempted = useRef(false);

  // 1. Ensure embedded wallet exists after login
  useEffect(() => {
    const ensureWallet = async () => {
      if (!ready || !user) return;

      const embeddedWallet = wallets?.find(
        (w) => w.walletClientType === "privy",
      );

      if (embeddedWallet) {
        setWalletCreated(true);
        walletCreationAttempted.current = true;
      } else if (!walletCreated && !walletCreationAttempted.current) {
        walletCreationAttempted.current = true;
        try {
          await createWallet();
          setWalletCreated(true);
        } catch (err) {
          console.error("Wallet creation failed:", err);
          walletCreationAttempted.current = false;
        }
      }
    };
    ensureWallet();
  }, [ready, user, createWallet, walletCreated, wallets]);

  // 2. Initialize Universal Account with EIP-7702 enabled
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

  // 3. Fetch smart account addresses (EVM + Solana)
  useEffect(() => {
    (async () => {
      if (!universalAccount) return;
      try {
        const opts = await universalAccount.getSmartAccountOptions();
        const transactions = await universalAccount.getTransactions(1, 20);
        console.log("transactions", transactions);
        const embeddedWallet = wallets?.find(
          (w) => w.walletClientType === "privy",
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

  // 4. Fetch initial balance
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

  // Refresh balance on demand
  const fetchBalance = async () => {
    try {
      if (!universalAccount) return;
      setIsLoadingBalance(true);
      const primaryAssets = await universalAccount.getPrimaryAssets();
      setBalance(primaryAssets || null);
    } catch (error) {
      console.error("Error fetching balance:", error);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  // Fetch transaction history
  const fetchTransactions = async (
    page: number = 1,
    append: boolean = false,
  ) => {
    try {
      if (!universalAccount) return;

      if (append) {
        setIsLoadingMoreTransactions(true);
      } else {
        setIsLoadingTransactions(true);
      }

      const response = await universalAccount.getTransactions(page, 15);

      if (append) {
        setTransactions((prev) => [...prev, ...response.data]);
      } else {
        setTransactions(response.data);
      }

      setHasNextPage(response.hasNextPage);
      setTransactionsPage(response.currentPage);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setIsLoadingTransactions(false);
      setIsLoadingMoreTransactions(false);
    }
  };

  // Handle loading more transactions
  const handleLoadMoreTransactions = () => {
    if (hasNextPage && !isLoadingMoreTransactions) {
      fetchTransactions(transactionsPage + 1, true);
    }
  };

  // Handle tab change - fetch transactions when history tab is selected
  const handleTabChange = (tab: "balance" | "history") => {
    if (tab === "history" && transactions.length === 0) {
      fetchTransactions(1);
    }
  };

  // 5. Handle swap with EIP-7702 authorization
  // See lib/eip7702.ts for EIP-7702 authorization implementation details
  const handleSwap = async () => {
    const embeddedWallet = wallets?.find((w) => w.walletClientType === "privy");
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

      // Create the convert transaction
      const transaction = await universalAccount.createConvertTransaction({
        expectToken: { type: tokenType, amount: swapAmount },
        chainId: chainId,
      });

      if (!transaction) {
        throw new Error("Failed to create convert transaction");
      }

      // Handle EIP-7702 authorizations for the transaction
      const authorizations = await handleEIP7702Authorizations(
        transaction.userOps,
        signAuthorization,
        embeddedWallet.address,
      );

      // Sign the transaction root hash
      const { signature } = await signMessage(
        { message: transaction.rootHash },
        {
          uiOptions: {
            title: `Convert to ${selectedAsset} on ${selectedChain}`,
          },
          address: embeddedWallet.address,
        },
      );

      // Send the transaction with authorizations
      const sendResult = await universalAccount.sendTransaction(
        transaction,
        signature,
        authorizations,
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
        }`,
      );
    } finally {
      setIsSending(false);
    }
  };

  if (!ready)
    return (
      <div className="flex h-screen items-center justify-center text-gray-600">
        Initializing...
      </div>
    );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-linear-to-br from-[#0a0a1f] via-[#1a0f3e] to-[#0f0a2e] text-white relative overflow-hidden">
      <BackgroundDecoration />

      {!user ? (
        <LandingHero
          onLogin={() =>
            login({ loginMethods: ["email", "google", "twitter"] })
          }
          ready={ready}
          authenticated={authenticated}
        />
      ) : (
        <div className="w-full flex justify-center gap-6 relative z-10 px-4">
          <WalletSidebar
            smartAccountAddresses={smartAccountAddresses}
            balance={balance}
            isLoadingBalance={isLoadingBalance}
            onRefreshBalance={fetchBalance}
            onLogout={logout}
            transactions={transactions}
            isLoadingTransactions={isLoadingTransactions}
            hasNextPage={hasNextPage}
            onLoadMoreTransactions={handleLoadMoreTransactions}
            isLoadingMoreTransactions={isLoadingMoreTransactions}
            onTabChange={handleTabChange}
          />

          {/* Main Content - Exchange/Withdraw Widget */}
          <div className="w-full max-w-md">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-xl h-[600px] flex flex-col">
              <Tabs defaultValue="exchange" className="flex flex-col flex-1">
                <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10 p-1 h-auto mb-6">
                  <TabsTrigger
                    value="exchange"
                    className="data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/30 text-gray-400 py-2.5 rounded-lg transition-all duration-200"
                  >
                    Exchange
                  </TabsTrigger>
                  <TabsTrigger
                    value="withdraw"
                    className="data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/30 text-gray-400 py-2.5 rounded-lg transition-all duration-200"
                  >
                    Withdraw
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="exchange" className="flex-1 mt-0">
                  <SwapCard
                    selectedAsset={selectedAsset}
                    selectedChain={selectedChain}
                    swapAmount={swapAmount}
                    isSending={isSending}
                    transactionHash={transactionHash}
                    balance={balance}
                    onAssetChange={setSelectedAsset}
                    onChainChange={setSelectedChain}
                    onAmountChange={setSwapAmount}
                    onSwap={handleSwap}
                    onOpenTokenSelection={() => setShowSelectionPanel("token")}
                    onOpenChainSelection={() => setShowSelectionPanel("chain")}
                  />
                </TabsContent>

                <TabsContent value="withdraw" className="flex-1 mt-0">
                  <TransferCard
                    universalAccount={universalAccount}
                    totalBalance={balance?.totalAmountInUSD || 0}
                    isSending={isSending}
                    onSendingChange={setIsSending}
                    onSuccess={() => fetchBalance()}
                    onRefreshBalance={fetchBalance}
                    signMessage={signMessage}
                    signAuthorization={signAuthorization}
                    walletAddress={wallets?.find((w) => w.walletClientType === "privy")?.address || ""}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {showSelectionPanel && (
            <SelectionPanel
              type={showSelectionPanel}
              onSelect={(value) => {
                if (showSelectionPanel === "token") {
                  setSelectedAsset(value);
                } else {
                  setSelectedChain(value);
                }
              }}
              onClose={() => setShowSelectionPanel(null)}
            />
          )}
        </div>
      )}
    </div>
  );
}
