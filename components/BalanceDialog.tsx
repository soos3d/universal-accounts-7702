"use client";

import React, { useState } from "react";
import { getChainName, LOGO_URLS } from "@/lib/utils";
import type { IAssetsResponse } from "@particle-network/universal-account-sdk";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronDown } from "lucide-react";

interface BalanceDialogProps {
  balance: IAssetsResponse;
  onClose: () => void;
}

export function BalanceDialog({ balance, onClose }: BalanceDialogProps) {
  const [expandedAssets, setExpandedAssets] = useState<Set<number>>(new Set());

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

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Balance Breakdown
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mb-4 max-h-[60vh] overflow-y-auto">
          {balance.assets.map((asset, index) => {
            const isExpanded = expandedAssets.has(index);
            const hasChains =
              asset.chainAggregation && asset.chainAggregation.length > 0;
            const chainsWithBalance =
              asset.chainAggregation?.filter((chain) => chain.amount > 0) || [];

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
                    <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden">
                      <img
                        src={
                          LOGO_URLS[asset.tokenType.toUpperCase()] ||
                          LOGO_URLS.ETH
                        }
                        alt={asset.tokenType}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">
                          {asset.tokenType.toUpperCase()}
                        </p>
                        {hasChains && chainsWithBalance.length > 0 && (
                          <ChevronDown
                            className={`w-4 h-4 text-gray-400 transition-transform ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          />
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
                            <img
                              src={
                                LOGO_URLS[getChainName(chain.token.chainId)] ||
                                LOGO_URLS.Ethereum
                              }
                              alt={getChainName(chain.token.chainId)}
                              width={16}
                              height={16}
                              className="rounded-full"
                            />
                            <span className="text-sm text-gray-300">
                              {getChainName(chain.token.chainId)}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-200">
                              {parseFloat(chain.amount.toString()).toFixed(6)}
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
      </DialogContent>
    </Dialog>
  );
}
