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
import { AccountCard } from "@/components/AccountCard";
import { SwapCard } from "@/components/SwapCard";
import { BalanceDialog } from "@/components/BalanceDialog";
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
  const [showBalanceDialog, setShowBalanceDialog] = useState<boolean>(false);
  const walletCreationAttempted = useRef(false);

  // 1. Ensure embedded wallet exists after login
  useEffect(() => {
    const ensureWallet = async () => {
      if (!ready || !user) return;

      const embeddedWallet = wallets?.find(
        (w) => w.walletClientType === "privy"
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
      console.log("Unified Balance:", primaryAssets);
      setBalance(primaryAssets || null);
    } catch (error) {
      console.error("Error fetching balance:", error);
    } finally {
      setIsLoadingBalance(false);
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
        embeddedWallet.address
      );

      // Sign the transaction root hash
      const { signature } = await signMessage(
        { message: transaction.rootHash },
        {
          uiOptions: {
            title: `Convert to ${selectedAsset} on ${selectedChain}`,
          },
          address: embeddedWallet.address,
        }
      );

      // Send the transaction with authorizations
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
          <AccountCard
            userEmail={user.email?.address}
            smartAccountAddresses={smartAccountAddresses}
            balance={balance?.totalAmountInUSD || 0}
            isLoadingBalance={isLoadingBalance}
            onLogout={logout}
            onRefreshBalance={fetchBalance}
            onShowBalanceDialog={() => balance && setShowBalanceDialog(true)}
          />

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
          />
        </div>
      )}

      {showBalanceDialog && balance && (
        <BalanceDialog
          balance={balance}
          onClose={() => setShowBalanceDialog(false)}
        />
      )}
    </div>
  );
}
