"use client";

import React from "react";
import { truncateAddress, copyToClipboard } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RefreshCw, Copy, LogOut } from "lucide-react";

interface AccountCardProps {
  userEmail?: string;
  smartAccountAddresses: {
    ownerAddress?: string;
    evmUaAddress?: string;
    solanaUaAddress?: string;
  } | null;
  balance: number;
  isLoadingBalance: boolean;
  onLogout: () => void;
  onRefreshBalance: () => void;
  onShowBalanceDialog: () => void;
}

export function AccountCard({
  userEmail,
  smartAccountAddresses,
  balance,
  isLoadingBalance,
  onLogout,
  onRefreshBalance,
  onShowBalanceDialog,
}: AccountCardProps) {
  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-xl">
      {/* Header with address and disconnect */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-linear-to-br from-purple-500 to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {smartAccountAddresses?.ownerAddress?.slice(2, 4).toUpperCase() ||
                "UA"}
            </span>
          </div>
          <div>
            <code className="text-sm text-white font-mono">
              {truncateAddress(smartAccountAddresses?.ownerAddress || "")}
            </code>
            <p className="text-xs text-gray-400 mt-0.5">
              {userEmail || "No email"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={() => copyToClipboard(smartAccountAddresses?.ownerAddress)}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-purple-300 transition-colors h-auto p-2 rounded-lg hover:bg-white/5"
          >
            <Copy className="w-4 h-4" />
          </Button>
          <Button
            onClick={onLogout}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-red-400 transition-colors h-auto p-2 rounded-lg hover:bg-white/5"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Wallet Balance */}
      <div className="mb-6">
        <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-2">
          Wallet Balance
        </p>
        <div className="flex items-center justify-between">
          <Button
            onClick={onShowBalanceDialog}
            disabled={balance === 0}
            variant="ghost"
            className="text-4xl font-bold text-white hover:text-purple-400 transition-colors disabled:cursor-default disabled:hover:text-white h-auto p-0"
          >
            {isLoadingBalance ? "..." : `$${balance.toFixed(2)}`}
          </Button>
          <Button
            onClick={onRefreshBalance}
            disabled={isLoadingBalance}
            size="sm"
            className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50 h-auto border border-white/10"
          >
            <RefreshCw
              className={`w-4 h-4 text-gray-300 ${
                isLoadingBalance ? "animate-spin" : ""
              }`}
            />
          </Button>
        </div>
      </div>

      {/* Chain Addresses */}
      {smartAccountAddresses && (
        <div className="space-y-2">
          <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
                <span className="text-purple-400 text-xs font-bold">EVM</span>
              </div>
              <code className="text-sm text-gray-300 font-mono">
                {truncateAddress(smartAccountAddresses.ownerAddress || "")}
              </code>
            </div>
            <Button
              type="button"
              onClick={() =>
                copyToClipboard(smartAccountAddresses.ownerAddress)
              }
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-purple-300 transition-colors h-auto p-1.5 rounded-lg hover:bg-white/5"
            >
              <Copy className="w-3.5 h-3.5" />
            </Button>
          </div>
          <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                <span className="text-green-400 text-xs font-bold">SOL</span>
              </div>
              <code className="text-sm text-gray-300 font-mono">
                {truncateAddress(smartAccountAddresses.solanaUaAddress || "")}
              </code>
            </div>
            <Button
              type="button"
              onClick={() =>
                copyToClipboard(smartAccountAddresses.solanaUaAddress)
              }
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-purple-300 transition-colors h-auto p-1.5 rounded-lg hover:bg-white/5"
            >
              <Copy className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
