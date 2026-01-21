/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Copy, LogOut } from "lucide-react";
import { truncateAddress, copyToClipboard, LOGO_URLS } from "@/lib/utils";
import { TransactionList, type Transaction } from "@/components/TransactionList";
import type { IAssetsResponse } from "@particle-network/universal-account-sdk";

type TabType = "balance" | "history";

interface WalletSidebarProps {
  smartAccountAddresses: {
    ownerAddress?: string;
    evmUaAddress?: string;
    solanaUaAddress?: string;
  } | null;
  balance: IAssetsResponse | null;
  isLoadingBalance: boolean;
  onRefreshBalance: () => void;
  onLogout: () => void;
  transactions: Transaction[];
  isLoadingTransactions: boolean;
  hasNextPage: boolean;
  onLoadMoreTransactions?: () => void;
  isLoadingMoreTransactions?: boolean;
  onTabChange?: (tab: TabType) => void;
}

export function WalletSidebar({
  smartAccountAddresses,
  balance,
  isLoadingBalance,
  onRefreshBalance,
  onLogout,
  transactions,
  isLoadingTransactions,
  hasNextPage,
  onLoadMoreTransactions,
  isLoadingMoreTransactions,
  onTabChange,
}: WalletSidebarProps) {
  const [activeTab, setActiveTab] = useState<TabType>("balance");

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  return (
    <div className="w-72 shrink-0">
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl sticky top-4 h-[600px] flex flex-col">
        <div className="p-4 border-b border-white/10 shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-linear-to-br from-purple-500 to-purple-600 flex items-center justify-center shrink-0">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
              </div>
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-2">
                  <code className="text-sm text-white font-mono">
                    {truncateAddress(smartAccountAddresses?.ownerAddress || "")}
                  </code>
                  <Button
                    type="button"
                    onClick={() =>
                      copyToClipboard(smartAccountAddresses?.ownerAddress)
                    }
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-purple-300 transition-colors h-auto p-1 rounded hover:bg-white/5"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-xs text-gray-400 font-mono">
                    {truncateAddress(
                      smartAccountAddresses?.solanaUaAddress || ""
                    )}
                  </code>
                  <Button
                    type="button"
                    onClick={() =>
                      copyToClipboard(smartAccountAddresses?.solanaUaAddress)
                    }
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-purple-300 transition-colors h-auto p-1 rounded hover:bg-white/5"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
            <Button
              onClick={onLogout}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-red-400 transition-colors h-auto p-2 rounded-lg hover:bg-white/5 shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="p-4 border-b border-white/10 shrink-0">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-2">
            Wallet Balance
          </p>
          <div className="flex items-center justify-between">
            <span className="text-4xl font-bold text-white">
              {isLoadingBalance
                ? "..."
                : `$${(balance?.totalAmountInUSD || 0).toFixed(2)}`}
            </span>
            <Button
              onClick={onRefreshBalance}
              disabled={isLoadingBalance}
              size="sm"
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50 h-auto border border-white/10"
            >
              <RefreshCw
                className={`w-4 h-4 text-gray-300 ${
                  isLoadingBalance ? "animate-spin" : ""
                }`}
              />
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 shrink-0">
          <button
            onClick={() => handleTabChange("balance")}
            className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
              activeTab === "balance"
                ? "text-white"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            Assets
            {activeTab === "balance" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />
            )}
          </button>
          <button
            onClick={() => handleTabChange("history")}
            className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
              activeTab === "history"
                ? "text-white"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            History
            {activeTab === "history" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
          {activeTab === "balance" ? (
            balance?.assets &&
            balance.assets.filter((asset) => asset.amountInUSD > 0).length > 0 ? (
              <div className="space-y-2">
                {balance.assets
                  .filter((asset) => asset.amountInUSD > 0)
                  .map((asset, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-white/5 transition-colors"
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
                          <p className="font-semibold text-white text-sm">
                            {asset.tokenType.toUpperCase()}
                          </p>
                          <p className="text-xs text-gray-400">
                            {parseFloat(asset.amount.toString()).toFixed(4)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-white text-sm">
                          ${asset.amountInUSD.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-400">
                          {parseFloat(asset.amount.toString()).toFixed(4)}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm">
                No assets found
              </div>
            )
          ) : (
            <TransactionList
              transactions={transactions}
              isLoading={isLoadingTransactions}
              hasNextPage={hasNextPage}
              onLoadMore={onLoadMoreTransactions}
              isLoadingMore={isLoadingMoreTransactions}
            />
          )}
        </div>
      </div>
    </div>
  );
}
