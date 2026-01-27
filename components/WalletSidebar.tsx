/* eslint-disable @next/next/no-img-element */
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Copy, LogOut } from "lucide-react";
import { truncateAddress, copyToClipboard, LOGO_URLS } from "@/lib/utils";
import { TransactionList, type Transaction } from "@/components/TransactionList";
import type { IAssetsResponse } from "@particle-network/universal-account-sdk";
import type { TokenBalance } from "@/lib/lifi-balances";
import { getLiFiChainById } from "@/lib/lifi";

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
  lifiBalances?: TokenBalance[];
  isLoadingLifiBalances?: boolean;
  onTokenClick?: (token: TokenBalance) => void;
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
  lifiBalances = [],
  isLoadingLifiBalances = false,
  onTokenClick,
}: WalletSidebarProps) {
  const [activeTab, setActiveTab] = useState<TabType>("balance");

  // Filter LI.FI balances to exclude tokens already in primary assets and dust amounts
  const filteredLifiBalances = useMemo(() => {
    if (!lifiBalances.length) return [];

    const primarySymbols = new Set(
      (balance?.assets || []).map((a) => a.tokenType.toUpperCase())
    );

    // Minimum threshold: $0.01 USD or 0.0001 tokens (whichever is more permissive)
    const MIN_USD_VALUE = 0.01;
    const MIN_TOKEN_AMOUNT = 0.0001;

    return lifiBalances.filter((lb) => {
      // Exclude tokens already in primary assets
      if (primarySymbols.has(lb.symbol.toUpperCase())) return false;

      // Exclude dust amounts
      const formattedAmount = parseFloat(lb.amount) / Math.pow(10, lb.decimals);
      if (lb.amountInUSD < MIN_USD_VALUE && formattedAmount < MIN_TOKEN_AMOUNT) {
        return false;
      }

      return true;
    });
  }, [lifiBalances, balance?.assets]);

  // Calculate total balance including LI.FI tokens
  const totalBalance = useMemo(() => {
    const primaryTotal = balance?.totalAmountInUSD || 0;
    const lifiTotal = filteredLifiBalances.reduce(
      (sum, lb) => sum + lb.amountInUSD,
      0
    );
    return primaryTotal + lifiTotal;
  }, [balance?.totalAmountInUSD, filteredLifiBalances]);

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
              {isLoadingBalance || isLoadingLifiBalances
                ? "..."
                : `$${totalBalance.toFixed(2)}`}
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
            <div className="space-y-2">
              {/* Primary Assets from Particle SDK - filter out dust (< $0.01) */}
              {balance?.assets
                ?.filter((asset) => asset.amountInUSD >= 0.01)
                .map((asset) => (
                  <div
                    key={`primary-${asset.tokenType}`}
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

              {/* Separator and Other Tokens from LI.FI */}
              {filteredLifiBalances.length > 0 && (
                <>
                  <div className="flex items-center gap-2 pt-3 pb-1">
                    <div className="h-px flex-1 bg-white/10" />
                    <span className="text-xs text-gray-500 uppercase tracking-wider">
                      Other Tokens
                    </span>
                    <div className="h-px flex-1 bg-white/10" />
                  </div>

                  {filteredLifiBalances.map((token, index) => {
                    const chain = getLiFiChainById(token.chainId);
                    const amountFormatted =
                      parseFloat(token.amount) / Math.pow(10, token.decimals);

                    return (
                      <button
                        key={`lifi-${token.chainId}-${token.address}-${index}`}
                        onClick={() => onTokenClick?.(token)}
                        className="w-full flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-white/10 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                              {token.logoURI ? (
                                <img
                                  src={token.logoURI}
                                  alt={token.symbol}
                                  width={36}
                                  height={36}
                                  className="rounded-full"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src =
                                      LOGO_URLS.ETH;
                                  }}
                                />
                              ) : (
                                <span className="text-xs font-bold text-gray-400">
                                  {token.symbol.slice(0, 2)}
                                </span>
                              )}
                            </div>
                            {/* Chain badge */}
                            {chain && (
                              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center overflow-hidden">
                                <img
                                  src={chain.logo}
                                  alt={chain.name}
                                  width={12}
                                  height={12}
                                  className="rounded-full"
                                />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-white text-sm">
                              {token.symbol}
                            </p>
                            <p className="text-xs text-gray-400">
                              {amountFormatted.toFixed(4)} {chain ? `· ${chain.name}` : ""}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-white text-sm group-hover:text-purple-300 transition-colors">
                            ${token.amountInUSD.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-400 group-hover:text-purple-400 transition-colors">
                            Tap to sell
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </>
              )}

              {/* Loading state for LI.FI balances */}
              {isLoadingLifiBalances && filteredLifiBalances.length === 0 && (
                <div className="text-center py-2 text-gray-500 text-xs">
                  Loading other tokens...
                </div>
              )}

              {/* Empty state */}
              {!balance?.assets?.filter((a) => a.amountInUSD >= 0.01).length &&
                !filteredLifiBalances.length &&
                !isLoadingBalance &&
                !isLoadingLifiBalances && (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    No assets found
                  </div>
                )}
            </div>
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
