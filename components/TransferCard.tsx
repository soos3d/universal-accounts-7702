/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowDown, ExternalLink, Info } from "lucide-react";
import { LOGO_URLS } from "@/lib/utils";
import { CHAIN_ID, UniversalAccount } from "@particle-network/universal-account-sdk";
import { handleEIP7702Authorizations } from "@/lib/eip7702";

const USDC_BASE_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

interface TransferCardProps {
  universalAccount: UniversalAccount | null;
  totalBalance: number;
  isSending: boolean;
  onSendingChange: (sending: boolean) => void;
  onSuccess: (txHash: string) => void;
  onRefreshBalance: () => void;
  signMessage: (
    params: { message: string },
    options: { uiOptions: { title: string }; address: string }
  ) => Promise<{ signature: string }>;
  signAuthorization: (
    params: { contractAddress: `0x${string}`; chainId: number; nonce: number },
    options: { address: string }
  ) => Promise<{ r: string; s: string; v?: bigint; yParity: number }>;
  walletAddress: string;
}

export function TransferCard({
  universalAccount,
  totalBalance,
  isSending,
  onSendingChange,
  onSuccess,
  onRefreshBalance,
  signMessage,
  signAuthorization,
  walletAddress,
}: TransferCardProps) {
  const [receiverAddress, setReceiverAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  const isValidAddress = (address: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const handleMaxClick = () => {
    setAmount(totalBalance.toFixed(2));
  };

  const handleTransfer = async () => {
    if (!universalAccount || !receiverAddress || !amount || !walletAddress) {
      return;
    }

    if (!isValidAddress(receiverAddress)) {
      alert("Invalid Ethereum address");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert("Invalid amount");
      return;
    }

    if (amountNum > totalBalance) {
      alert("Insufficient balance");
      return;
    }

    onSendingChange(true);
    setTransactionHash(null);

    try {
      const transaction = await universalAccount.createTransferTransaction({
        token: {
          chainId: CHAIN_ID.BASE_MAINNET,
          address: USDC_BASE_ADDRESS,
        },
        amount: amount,
        receiver: receiverAddress,
      });

      if (!transaction) {
        throw new Error("Failed to create transfer transaction");
      }

      const authorizations = await handleEIP7702Authorizations(
        transaction.userOps,
        signAuthorization,
        walletAddress
      );

      const { signature } = await signMessage(
        { message: transaction.rootHash },
        {
          uiOptions: {
            title: `Withdraw ${amount} USDC to ${receiverAddress.slice(0, 6)}...${receiverAddress.slice(-4)}`,
          },
          address: walletAddress,
        }
      );

      const sendResult = await universalAccount.sendTransaction(
        transaction,
        signature,
        authorizations
      );

      setTransactionHash(sendResult.transactionId || "Transaction submitted");
      onSuccess(sendResult.transactionId || "");

      setReceiverAddress("");
      setAmount("");
      onRefreshBalance();
    } catch (error) {
      console.error("Transfer failed:", error);
      alert(
        `Transfer failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      onSendingChange(false);
    }
  };

  const getButtonText = () => {
    if (isSending) return "Processing...";
    if (!receiverAddress) return "Enter recipient address";
    if (!isValidAddress(receiverAddress)) return "Invalid address";
    if (!amount) return "Enter amount";
    return "Withdraw";
  };

  const isButtonDisabled =
    !receiverAddress ||
    !isValidAddress(receiverAddress) ||
    !amount ||
    parseFloat(amount) <= 0 ||
    parseFloat(amount) > totalBalance ||
    isSending;

  return (
    <div className="flex flex-col flex-1">
      <div className="bg-white/5 rounded-xl p-5 mb-3 border border-white/10">
        <span className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-3 block">
          To Address
        </span>
        <input
          type="text"
          placeholder="0x..."
          value={receiverAddress}
          onChange={(e) => setReceiverAddress(e.target.value)}
          className="w-full bg-transparent text-lg font-medium focus:outline-none text-white placeholder:text-gray-600"
        />
        {receiverAddress && !isValidAddress(receiverAddress) && (
          <p className="text-sm text-red-400 mt-2">Invalid Ethereum address</p>
        )}
      </div>

      <div className="flex justify-center -my-2 relative z-10">
        <div className="bg-white/10 rounded-lg p-2 border border-white/20 backdrop-blur-sm">
          <ArrowDown className="w-4 h-4 text-gray-300" />
        </div>
      </div>

      <div className="bg-white/5 rounded-xl p-5 mt-3 border border-white/10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">
            Amount
          </span>
          <button
            onClick={handleMaxClick}
            className="text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors"
          >
            MAX
          </button>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="number"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-transparent text-3xl font-semibold focus:outline-none text-white placeholder:text-gray-600"
          />
        </div>
        {amount && (
          <p className="text-sm text-gray-400 mt-2">≈ ${parseFloat(amount).toFixed(2)}</p>
        )}
        <p className="text-xs text-gray-500 mt-2">
          Available: ${totalBalance.toFixed(2)}
        </p>
      </div>

      <div className="bg-purple-500/10 rounded-xl p-4 mt-4 border border-purple-500/20 flex items-start gap-3">
        <Info className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="text-sm text-purple-300">
            Recipient will receive{" "}
            <span className="inline-flex items-center gap-1.5">
              <img
                src={LOGO_URLS["USDC"]}
                alt="USDC"
                width={16}
                height={16}
                className="rounded-full inline"
              />
              <span className="font-medium">USDC</span>
            </span>{" "}
            on{" "}
            <span className="inline-flex items-center gap-1.5">
              <img
                src={LOGO_URLS["Base"]}
                alt="Base"
                width={16}
                height={16}
                className="rounded-full inline"
              />
              <span className="font-medium">Base</span>
            </span>
          </p>
        </div>
      </div>

      <div className="mt-auto pt-4">
        <Button
          onClick={handleTransfer}
          disabled={isButtonDisabled}
          className="w-full bg-linear-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 disabled:from-gray-700 disabled:to-gray-600 disabled:text-gray-500 text-white font-semibold py-4 rounded-xl transition-all duration-200 h-auto shadow-lg hover:shadow-purple-500/30 disabled:shadow-none"
        >
          {getButtonText()}
        </Button>
      </div>

      {transactionHash && (
        <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl backdrop-blur-sm">
          <p className="text-sm text-green-400 font-semibold mb-2">
            Withdrawal Successful!
          </p>
          <a
            href={`https://universalx.app/activity/details?id=${transactionHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-purple-400 hover:text-purple-300 inline-flex items-center gap-1.5 transition-colors"
          >
            View on Explorer
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      )}
    </div>
  );
}
