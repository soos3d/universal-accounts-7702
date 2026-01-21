/* eslint-disable @next/next/no-img-element */
"use client";

import React from "react";
import {
  availableAssets,
  availableChains,
  LOGO_URLS,
  getAvailableAssetsForChain,
} from "@/lib/utils";
import type { IAssetsResponse } from "@particle-network/universal-account-sdk";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, ArrowDown, ExternalLink } from "lucide-react";

interface SwapCardProps {
  selectedAsset: string;
  selectedChain: string;
  swapAmount: string;
  isSending: boolean;
  transactionHash: string | null;
  balance: IAssetsResponse | null;
  onAssetChange: (asset: string) => void;
  onChainChange: (chain: string) => void;
  onAmountChange: (amount: string) => void;
  onSwap: () => void;
  onOpenTokenSelection?: () => void;
  onOpenChainSelection?: () => void;
}

export function SwapCard({
  selectedAsset,
  selectedChain,
  swapAmount,
  isSending,
  transactionHash,
  balance,
  onAssetChange,
  onChainChange,
  onAmountChange,
  onSwap,
  onOpenTokenSelection,
  onOpenChainSelection,
}: SwapCardProps) {
  const getAssetBalance = (assetType: string) => {
    if (!balance?.assets) return null;
    return balance.assets.find(
      (a) => a.tokenType.toUpperCase() === assetType.toUpperCase()
    );
  };

  const selectedAssetBalance = selectedAsset
    ? getAssetBalance(selectedAsset)
    : null;

  const availableAssetsForChain = selectedChain
    ? getAvailableAssetsForChain(selectedChain)
    : availableAssets;

  const handleChainChange = (chain: string) => {
    onChainChange(chain);
    const assetsForChain = getAvailableAssetsForChain(chain);
    if (selectedAsset && !assetsForChain.includes(selectedAsset)) {
      onAssetChange("");
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="bg-white/5 rounded-xl p-5 mb-3 border border-white/10">
        <span className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-3 block">
          Receive
        </span>
        <div className="flex items-center justify-between">
          {onOpenTokenSelection ? (
            <Button
              variant="ghost"
              onClick={onOpenTokenSelection}
              className="h-auto p-0 hover:bg-transparent text-lg font-medium text-white"
            >
              {selectedAsset ? (
                <div className="flex items-center gap-3">
                  <img
                    src={LOGO_URLS[selectedAsset]}
                    alt={selectedAsset}
                    width={28}
                    height={28}
                    className="rounded-full"
                  />
                  <span className="text-lg">{selectedAsset}</span>
                  <ChevronDown className="w-4 h-4 text-gray-400 ml-1" />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Select chain and token</span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </div>
              )}
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-auto p-0 hover:bg-transparent text-lg font-medium text-white"
                >
                  {selectedAsset ? (
                    <div className="flex items-center gap-2">
                      <img
                        src={LOGO_URLS[selectedAsset]}
                        alt={selectedAsset}
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                      <span>{selectedAsset}</span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">Select token</span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 bg-gray-900 border-gray-800">
                {availableAssets.map((asset) => {
                  const isAvailable = availableAssetsForChain.includes(asset);
                  return (
                    <DropdownMenuItem
                      key={asset}
                      onClick={() => isAvailable && onAssetChange(asset)}
                      disabled={!isAvailable}
                      className={`flex items-center gap-2 ${
                        isAvailable
                          ? "cursor-pointer hover:bg-gray-800 focus:bg-gray-800"
                          : "opacity-40 cursor-not-allowed"
                      }`}
                    >
                      <img
                        src={LOGO_URLS[asset]}
                        alt={asset}
                        width={20}
                        height={20}
                        className="rounded-full"
                      />
                      <span>{asset}</span>
                      {!isAvailable && selectedChain && (
                        <span className="ml-auto text-xs text-gray-500">
                          N/A
                        </span>
                      )}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <div className="flex justify-center -my-2 relative z-10">
        <div className="bg-white/10 rounded-lg p-2 border border-white/20 backdrop-blur-sm">
          <ArrowDown className="w-4 h-4 text-gray-300" />
        </div>
      </div>

      <div className="bg-white/5 rounded-xl p-5 mt-3 border border-white/10">
        <span className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-3 block">
          On Chain
        </span>
        {onOpenChainSelection ? (
          <Button
            variant="ghost"
            onClick={onOpenChainSelection}
            className="w-full h-auto p-0 hover:bg-transparent text-base font-medium text-white justify-start"
          >
            {selectedChain ? (
              <div className="flex items-center gap-3 w-full">
                <img
                  src={LOGO_URLS[selectedChain]}
                  alt={selectedChain}
                  width={28}
                  height={28}
                  className="rounded-full"
                />
                <span className="text-lg">{selectedChain}</span>
                <ChevronDown className="w-4 h-4 text-gray-400 ml-auto" />
              </div>
            ) : (
              <div className="flex items-center gap-2 w-full">
                <span className="text-gray-400">Select chain</span>
                <ChevronDown className="w-4 h-4 text-gray-400 ml-auto" />
              </div>
            )}
          </Button>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full h-auto p-0 hover:bg-transparent text-lg font-medium text-white justify-start"
              >
                {selectedChain ? (
                  <div className="flex items-center gap-2">
                    <img
                      src={LOGO_URLS[selectedChain]}
                      alt={selectedChain}
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                    <span>{selectedChain}</span>
                    <ChevronDown className="w-4 h-4 text-gray-400 ml-auto" />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 w-full">
                    <span className="text-gray-400">Select chain</span>
                    <ChevronDown className="w-4 h-4 text-gray-400 ml-auto" />
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 bg-gray-900 border-gray-800">
              {availableChains.map((chain) => (
                <DropdownMenuItem
                  key={chain}
                  onClick={() => handleChainChange(chain)}
                  className="flex items-center gap-2 cursor-pointer hover:bg-gray-800 focus:bg-gray-800"
                >
                  <img
                    src={LOGO_URLS[chain]}
                    alt={chain}
                    width={20}
                    height={20}
                    className="rounded-full"
                  />
                  <span>{chain}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="bg-white/5 rounded-xl p-5 mt-3 border border-white/10">
        <span className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-3 block">
          Send
        </span>
        <div className="flex items-center gap-3 mt-2">
          <input
            type="number"
            placeholder="0"
            value={swapAmount}
            onChange={(e) => onAmountChange(e.target.value)}
            className="w-full bg-transparent text-3xl font-semibold focus:outline-none text-white placeholder:text-gray-600"
          />
        </div>
        {selectedAssetBalance && swapAmount && (
          <p className="text-sm text-gray-400 mt-2">
            ≈ $
            {(
              parseFloat(swapAmount || "0") *
              (selectedAssetBalance.amountInUSD /
                parseFloat(selectedAssetBalance.amount.toString()))
            ).toFixed(2)}
          </p>
        )}
      </div>

      <Button
        onClick={onSwap}
        disabled={!selectedChain || !selectedAsset || !swapAmount || isSending}
        className="w-full mt-6 bg-linear-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 disabled:from-gray-700 disabled:to-gray-600 disabled:text-gray-500 text-white font-semibold py-4 rounded-xl transition-all duration-200 h-auto shadow-lg hover:shadow-purple-500/30 disabled:shadow-none"
      >
        {isSending
          ? "Processing..."
          : !selectedAsset || !selectedChain
          ? "Select asset and chain"
          : !swapAmount
          ? "Enter amount"
          : "Exchange"}
      </Button>

      {transactionHash && (
        <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl backdrop-blur-sm">
          <p className="text-sm text-green-400 font-semibold mb-2">
            Swap Successful!
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
