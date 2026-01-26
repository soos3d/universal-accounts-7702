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
import { SellTokenDialog } from "@/components/SellTokenDialog";
import { BackgroundDecoration } from "@/components/BackgroundDecoration";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLiFiTokens } from "@/hooks/useLiFiTokens";
import { useLiFiBalances } from "@/hooks/useLiFiBalances";
import type { LiFiToken } from "@/lib/lifi-tokens";
import type { TokenBalance } from "@/lib/lifi-balances";
import { createBuyTransaction } from "@/lib/buy-transaction";
import { createSellTransaction } from "@/lib/sell-transaction";
import { handleEIP7702Authorizations } from "@/lib/eip7702";

export default function Home() {
  const { ready, authenticated, logout } = usePrivy();
  const { user } = useUser();
  const { login } = useLogin();
  const { createWallet } = useCreateWallet();
  const { signMessage } = useSignMessage();
  const { wallets } = useWallets();
  const { signAuthorization } = useSign7702Authorization();

  // LI.FI tokens hook (for token discovery only)
  const {
    isLoading: lifiTokensLoading,
    searchTokens,
    getAllTokensSorted,
    ensureTokensLoaded,
  } = useLiFiTokens();

  // Get embedded wallet address for LI.FI balance fetching
  const embeddedWalletAddress = wallets?.find(
    (w) => w.walletClientType === "privy"
  )?.address;

  // Token balances hook (fetches ALL ERC-20 tokens via Moralis)
  const {
    balances: lifiBalances,
    isLoading: isLoadingLifiBalances,
    refetch: refetchLifiBalances,
  } = useLiFiBalances(embeddedWalletAddress);

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

  // Destination selection - two-step: chain first, then token
  const [selectedDestChainId, setSelectedDestChainId] = useState<number | null>(
    null,
  );
  const [selectedDestToken, setSelectedDestToken] = useState<LiFiToken | null>(
    null,
  );
  const [swapAmount, setSwapAmount] = useState<string>("");

  // Withdraw state
  const [withdrawSelectedChain, setWithdrawSelectedChain] =
    useState<string>("Base");

  // Selection panel state
  const [showSelectionPanel, setShowSelectionPanel] = useState<
    "token" | "chain" | "withdrawChain" | "lifiChain" | "lifiToken" | "allTokens" | null
  >(null);

  // Sell token state
  const [selectedSellToken, setSelectedSellToken] = useState<TokenBalance | null>(null);
  const [isSelling, setIsSelling] = useState(false);
  const [sellTransactionHash, setSellTransactionHash] = useState<string | null>(null);

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
      // Also refresh LI.FI balances for non-primary tokens
      refetchLifiBalances();
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

  // Handle token selection - also sets chainId from token
  const handleTokenSelect = (tokenJson: string) => {
    try {
      const token = JSON.parse(tokenJson) as LiFiToken;
      setSelectedDestToken(token);
      // Set chainId from the selected token
      setSelectedDestChainId(token.chainId);
    } catch (e) {
      console.error("Failed to parse selected token:", e);
    }
  };

  // 5. Handle swap using createBuyTransaction
  const handleSwap = async () => {
    const embeddedWallet = wallets?.find((w) => w.walletClientType === "privy");

    if (!universalAccount || !selectedDestChainId || !selectedDestToken || !embeddedWallet) {
      return;
    }

    // Validate swap amount
    const parsedAmount = parseFloat(swapAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    // Validate sufficient balance
    const totalBalance = balance?.totalAmountInUSD ?? 0;
    if (parsedAmount > totalBalance) {
      alert("Insufficient balance");
      return;
    }

    setIsSending(true);
    setTransactionHash(null);

    try {
      // 1. Create buy transaction using UA's native method
      const { transaction, description } = await createBuyTransaction({
        chainId: selectedDestChainId,
        tokenAddress: selectedDestToken.address,
        amountInUSD: swapAmount,
        universalAccount,
      });

      // 2. Handle EIP-7702 authorizations if needed
      const authorizations = await handleEIP7702Authorizations(
        transaction.userOps,
        signAuthorization,
        embeddedWallet.address,
      );

      // 3. Sign the root hash
      const { signature } = await signMessage(
        { message: transaction.rootHash },
        {
          uiOptions: { title: `Buy ${selectedDestToken.symbol}` },
          address: embeddedWallet.address,
        },
      );

      // 4. Send the transaction
      const result = await universalAccount.sendTransaction(
        transaction,
        signature,
        authorizations,
      );

      // 5. Success - update UI
      setTransactionHash(result.transactionId || "Transaction submitted");

      // Reset form
      setSelectedDestChainId(null);
      setSelectedDestToken(null);
      setSwapAmount("");

      // Refresh balance after successful swap
      fetchBalance();
    } catch (error) {
      // Check for user rejection - don't show error in this case
      if (error instanceof Error) {
        const message = error.message.toLowerCase();
        if (
          message.includes("rejected") ||
          message.includes("denied") ||
          message.includes("cancelled")
        ) {
          return;
        }
      }
      alert(
        `Transaction failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    } finally {
      setIsSending(false);
    }
  };

  // Handle sell transaction for non-primary tokens
  const handleSell = async (token: TokenBalance, amount: string) => {
    const embeddedWallet = wallets?.find((w) => w.walletClientType === "privy");

    if (!universalAccount || !embeddedWallet) {
      return;
    }

    setIsSelling(true);
    setSellTransactionHash(null);

    try {
      // 1. Create sell transaction using UA's native method
      const { transaction } = await createSellTransaction({
        chainId: token.chainId,
        tokenAddress: token.address,
        amount,
        universalAccount,
      });

      // 2. Handle EIP-7702 authorizations if needed
      const authorizations = await handleEIP7702Authorizations(
        transaction.userOps,
        signAuthorization,
        embeddedWallet.address,
      );

      // 3. Sign the root hash
      const { signature } = await signMessage(
        { message: transaction.rootHash },
        {
          uiOptions: { title: `Sell ${token.symbol}` },
          address: embeddedWallet.address,
        },
      );

      // 4. Send the transaction
      const result = await universalAccount.sendTransaction(
        transaction,
        signature,
        authorizations,
      );

      // 5. Success - update UI
      setSellTransactionHash(result.transactionId || "Transaction submitted");

      // Refresh balance after successful sell
      fetchBalance();
    } catch (error) {
      // Check for user rejection - don't show error in this case
      if (error instanceof Error) {
        const message = error.message.toLowerCase();
        if (
          message.includes("rejected") ||
          message.includes("denied") ||
          message.includes("cancelled")
        ) {
          return;
        }
      }
      alert(
        `Sell failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    } finally {
      setIsSelling(false);
    }
  };

  // Handle closing sell dialog
  const handleCloseSellDialog = () => {
    setSelectedSellToken(null);
    setSellTransactionHash(null);
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
            lifiBalances={lifiBalances}
            isLoadingLifiBalances={isLoadingLifiBalances}
            onTokenClick={setSelectedSellToken}
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
                    selectedToken={selectedDestToken}
                    swapAmount={swapAmount}
                    isSending={isSending}
                    transactionHash={transactionHash}
                    balance={balance}
                    onAmountChange={setSwapAmount}
                    onSwap={handleSwap}
                    onOpenTokenSelection={() => {
                      ensureTokensLoaded();
                      setShowSelectionPanel("allTokens");
                    }}
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
                    walletAddress={
                      wallets?.find((w) => w.walletClientType === "privy")
                        ?.address || ""
                    }
                    selectedChain={withdrawSelectedChain}
                    onOpenChainSelection={() =>
                      setShowSelectionPanel("withdrawChain")
                    }
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {showSelectionPanel && (
            <SelectionPanel
              type={showSelectionPanel}
              onSelect={(value) => {
                if (showSelectionPanel === "allTokens" || showSelectionPanel === "lifiToken") {
                  handleTokenSelect(value);
                } else if (showSelectionPanel === "withdrawChain") {
                  setWithdrawSelectedChain(value);
                }
              }}
              onClose={() => setShowSelectionPanel(null)}
              lifiTokensLoading={lifiTokensLoading}
              onSearchTokens={searchTokens}
              onGetAllTokens={getAllTokensSorted}
              selectedChainId={selectedDestChainId ?? undefined}
            />
          )}

          {/* Sell Token Dialog */}
          <SellTokenDialog
            token={selectedSellToken}
            onClose={handleCloseSellDialog}
            onSell={handleSell}
            isSelling={isSelling}
            transactionHash={sellTransactionHash}
          />
        </div>
      )}
    </div>
  );
}
