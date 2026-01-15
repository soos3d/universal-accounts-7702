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
    <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-800">
      <h2 className="text-lg font-semibold mb-4">Swap</h2>

      <div className="bg-gray-800/50 rounded-xl p-4 mb-3">
        <span className="text-xs text-gray-400 uppercase tracking-wide">
          Receive
        </span>
        <div className="flex items-center justify-between mt-2">
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
                      <span className="ml-auto text-xs text-gray-500">N/A</span>
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
          {selectedAssetBalance && (
            <span className="text-sm text-gray-400">
              Balance:{" "}
              {parseFloat(selectedAssetBalance.amount.toString()).toFixed(4)}
            </span>
          )}
        </div>
      </div>

      <div className="flex justify-center -my-1 relative z-10">
        <div className="bg-gray-800 rounded-lg p-2 border border-gray-700">
          <ArrowDown className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      <div className="bg-gray-800/50 rounded-xl p-4 mt-3">
        <span className="text-xs text-gray-400 uppercase tracking-wide">
          On Chain
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full h-auto p-0 mt-2 hover:bg-transparent text-lg font-medium text-white justify-start"
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
      </div>

      <div className="bg-gray-800/50 rounded-xl p-4 mt-3">
        <span className="text-xs text-gray-400 uppercase tracking-wide">
          Amount
        </span>
        <div className="flex items-center gap-2 mt-2">
          <input
            type="number"
            placeholder="0"
            value={swapAmount}
            onChange={(e) => onAmountChange(e.target.value)}
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

      <Button
        onClick={onSwap}
        disabled={!selectedChain || !selectedAsset || !swapAmount || isSending}
        className="w-full mt-4 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold py-4 rounded-xl transition-all duration-200 h-auto"
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
      </Button>

      {transactionHash && (
        <div className="mt-4 p-4 bg-green-900/20 border border-green-800 rounded-xl">
          <p className="text-sm text-green-400 font-medium">Swap Successful!</p>
          <a
            href={`https://universalx.app/activity/details?id=${transactionHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-purple-400 hover:text-purple-300 mt-2 inline-flex items-center gap-1"
          >
            View on Explorer
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  );
}
