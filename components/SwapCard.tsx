/* eslint-disable @next/next/no-img-element */
"use client";

import React from "react";
import type { IAssetsResponse } from "@particle-network/universal-account-sdk";
import { Button } from "@/components/ui/button";
import { ChevronDown, ArrowDown, ExternalLink } from "lucide-react";
import type { LiFiToken } from "@/lib/lifi-tokens";
import { getLiFiChainById } from "@/lib/lifi";

const PLACEHOLDER_TOKEN_LOGO = "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png";

interface SwapCardProps {
  selectedToken: LiFiToken | null;
  swapAmount: string;
  isSending: boolean;
  transactionHash: string | null;
  balance: IAssetsResponse | null;
  onAmountChange: (amount: string) => void;
  onSwap: () => void;
  onOpenTokenSelection: () => void;
}

export function SwapCard({
  selectedToken,
  swapAmount,
  isSending,
  transactionHash,
  balance,
  onAmountChange,
  onSwap,
  onOpenTokenSelection,
}: SwapCardProps) {
  // Get chain from selected token
  const selectedChain = selectedToken ? getLiFiChainById(selectedToken.chainId) : null;

  // Get total balance from Universal Account
  const totalBalance = balance?.totalAmountInUSD ?? 0;

  // Send amount in USD
  const sendAmountUSD = swapAmount ? parseFloat(swapAmount) : 0;

  // Check if amount exceeds balance
  const insufficientBalance = sendAmountUSD > totalBalance;

  return (
    <div className="flex flex-col flex-1">
      {/* Destination Token Selection */}
      <div className="bg-white/5 rounded-xl p-5 mb-3 border border-white/10">
        <span className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-3 block">
          You Receive
        </span>
        <div className="flex items-center justify-between gap-4">
          {/* Token Selector */}
          <Button
            variant="ghost"
            onClick={onOpenTokenSelection}
            className="h-auto p-0 hover:bg-transparent text-lg font-medium text-white"
          >
            {selectedToken ? (
              <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 border border-white/10">
                {/* Token logo with chain badge */}
                <div className="relative">
                  <img
                    src={selectedToken.logoURI || PLACEHOLDER_TOKEN_LOGO}
                    alt={selectedToken.symbol}
                    width={24}
                    height={24}
                    className="rounded-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = PLACEHOLDER_TOKEN_LOGO;
                    }}
                  />
                  {/* Chain badge */}
                  {selectedChain && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center overflow-hidden">
                      <img
                        src={selectedChain.logo}
                        alt={selectedChain.name}
                        width={10}
                        height={10}
                        className="rounded-full"
                      />
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-base">{selectedToken.symbol}</span>
                  {selectedChain && (
                    <span className="text-xs text-gray-500">{selectedChain.name}</span>
                  )}
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 border border-white/10">
                <span className="text-gray-400">Select token</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            )}
          </Button>
        </div>
      </div>

      {/* Arrow Separator */}
      <div className="flex justify-center -my-2 relative z-10">
        <div className="bg-white/10 rounded-lg p-2 border border-white/20 backdrop-blur-sm">
          <ArrowDown className="w-4 h-4 text-gray-300" />
        </div>
      </div>

      {/* Spend Amount (USD) */}
      <div className="bg-white/5 rounded-xl p-5 mt-3 border border-white/10">
        <span className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-3 block">
          You Spend (USD)
        </span>
        <div className="flex items-center gap-3">
          <span className="text-3xl font-semibold text-gray-400">$</span>
          <input
            type="number"
            placeholder="0"
            value={swapAmount}
            onChange={(e) => onAmountChange(e.target.value)}
            className="flex-1 bg-transparent text-3xl font-semibold focus:outline-none text-white placeholder:text-gray-600 min-w-0"
          />
        </div>

        {/* Balance Info */}
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className={insufficientBalance ? "text-red-400" : "text-gray-400"}>
            {insufficientBalance ? "Insufficient balance" : `Available: $${totalBalance.toFixed(2)}`}
          </span>
          {totalBalance > 0 && (
            <button
              onClick={() => onAmountChange(totalBalance.toFixed(2))}
              className="text-purple-400 hover:text-purple-300 text-xs font-medium transition-colors"
            >
              MAX
            </button>
          )}
        </div>
      </div>

      {/* Exchange Button */}
      <Button
        onClick={onSwap}
        disabled={
          !selectedToken ||
          !swapAmount ||
          parseFloat(swapAmount) <= 0 ||
          insufficientBalance ||
          isSending
        }
        className="w-full mt-6 bg-linear-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 disabled:from-gray-700 disabled:to-gray-600 disabled:text-gray-500 text-white font-semibold py-4 rounded-xl transition-all duration-200 h-auto shadow-lg hover:shadow-purple-500/30 disabled:shadow-none"
      >
        {isSending
          ? "Processing..."
          : !selectedToken
          ? "Select token"
          : !swapAmount || parseFloat(swapAmount) <= 0
          ? "Enter amount"
          : insufficientBalance
          ? "Insufficient balance"
          : `Buy ${selectedToken.symbol}`}
      </Button>

      {/* Success Notification */}
      {transactionHash && (
        <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl backdrop-blur-sm">
          <p className="text-sm text-green-400 font-semibold mb-2">
            Transaction Submitted!
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
