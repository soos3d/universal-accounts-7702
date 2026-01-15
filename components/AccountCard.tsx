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
    <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Account</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            {userEmail || "No email"}
          </span>
          <Button
            onClick={onLogout}
            variant="ghost"
            size="sm"
            className="text-xs text-gray-400 hover:text-red-400 transition-colors h-auto px-2 py-1"
          >
            <LogOut className="w-3 h-3 mr-1" />
            Disconnect
          </Button>
        </div>
      </div>

      {smartAccountAddresses && (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">EVM</span>
            <div className="flex items-center gap-2">
              <code className="text-gray-300">
                {truncateAddress(smartAccountAddresses.ownerAddress || "")}
              </code>
              <Button
                type="button"
                onClick={() =>
                  copyToClipboard(smartAccountAddresses.ownerAddress)
                }
                variant="ghost"
                size="sm"
                className="text-xs text-gray-400 hover:text-purple-300 transition-colors h-auto p-1"
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Solana</span>
            <div className="flex items-center gap-2">
              <code className="text-gray-300">
                {truncateAddress(smartAccountAddresses.solanaUaAddress || "")}
              </code>
              <Button
                type="button"
                onClick={() =>
                  copyToClipboard(smartAccountAddresses.solanaUaAddress)
                }
                variant="ghost"
                size="sm"
                className="text-xs text-gray-400 hover:text-purple-300 transition-colors h-auto p-1"
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-800">
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-sm">Total Balance</span>
          <div className="flex items-center gap-2">
            <Button
              onClick={onShowBalanceDialog}
              disabled={balance === 0}
              variant="ghost"
              className="text-xl font-bold hover:text-purple-400 transition-colors disabled:cursor-default disabled:hover:text-white h-auto p-0"
            >
              {isLoadingBalance ? "..." : `$${balance.toFixed(2)}`}
            </Button>
            <Button
              onClick={onRefreshBalance}
              disabled={isLoadingBalance}
              size="sm"
              className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors disabled:opacity-50 h-auto"
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoadingBalance ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
