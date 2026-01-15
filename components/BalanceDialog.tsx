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
      <DialogContent className="bg-[#1a0f3e] border-white/20 max-w-md backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">
            Wallet Balance
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2 mb-4 max-h-[65vh] overflow-y-auto pr-2">
          {balance.assets.map((asset, index) => {
            const isExpanded = expandedAssets.has(index);
            const hasChains =
              asset.chainAggregation && asset.chainAggregation.length > 0;
            const chainsWithBalance =
              asset.chainAggregation?.filter((chain) => chain.amount > 0) || [];

            return (
              <div
                key={index}
                className="bg-white/5 rounded-xl overflow-hidden border border-white/10 hover:border-white/20 transition-colors"
              >
                <div
                  className={`p-4 flex items-center justify-between ${
                    hasChains && chainsWithBalance.length > 0
                      ? "cursor-pointer hover:bg-white/5"
                      : ""
                  }`}
                  onClick={() =>
                    hasChains &&
                    chainsWithBalance.length > 0 &&
                    toggleAssetExpansion(index)
                  }
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                      <img
                        src={
                          LOGO_URLS[asset.tokenType.toUpperCase()] ||
                          LOGO_URLS.ETH
                        }
                        alt={asset.tokenType}
                        width={36}
                        height={36}
                        className="rounded-full"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-white">
                          {asset.tokenType.toUpperCase()}
                        </p>
                        {hasChains && chainsWithBalance.length > 0 && (
                          <ChevronDown
                            className={`w-3.5 h-3.5 text-gray-400 transition-transform ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          />
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {parseFloat(asset.amount.toString()).toFixed(4)}{" "}
                        {asset.tokenType.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-white">
                      ${asset.amountInUSD.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {parseFloat(asset.amount.toString()).toFixed(4)}
                    </p>
                  </div>
                </div>

                {isExpanded && chainsWithBalance.length > 0 && (
                  <div className="border-t border-white/10 bg-white/5">
                    <div className="p-3 space-y-1.5">
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-medium px-2 mb-2">
                        On Chains
                      </p>
                      {chainsWithBalance.map((chain, chainIndex) => (
                        <div
                          key={chainIndex}
                          className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <img
                              src={
                                LOGO_URLS[getChainName(chain.token.chainId)] ||
                                LOGO_URLS.Ethereum
                              }
                              alt={getChainName(chain.token.chainId)}
                              width={18}
                              height={18}
                              className="rounded-full"
                            />
                            <span className="text-sm text-gray-200 font-medium">
                              {getChainName(chain.token.chainId)}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-white">
                              ${chain.amountInUSD.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-400">
                              {parseFloat(chain.amount.toString()).toFixed(4)}
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

        <div className="pt-4 border-t border-white/20">
          <div className="flex items-center justify-between">
            <span className="text-gray-300 font-medium">Total Value</span>
            <span className="text-3xl font-bold text-white">
              ${balance.totalAmountInUSD.toFixed(2)}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
