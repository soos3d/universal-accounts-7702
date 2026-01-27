/* eslint-disable @next/next/no-img-element */
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { availableAssets, availableChains, withdrawChains, LOGO_URLS } from "@/lib/utils";
import { LIFI_CHAINS, getLiFiChainById } from "@/lib/lifi";
import type { LiFiToken } from "@/lib/lifi-tokens";
import type { AvailablePrimaryToken } from "@/lib/pay-with";
import { Search, Wallet } from "lucide-react";

interface SelectionPanelProps {
  type: "token" | "chain" | "withdrawChain" | "lifiChain" | "lifiToken" | "allTokens" | "payWith";
  onSelect: (value: string) => void;
  onClose: () => void;
  // LI.FI token props (for lifiToken and allTokens types)
  lifiTokensLoading?: boolean;
  onSearchTokens?: (query: string, chainId?: number) => LiFiToken[];
  onGetAllTokens?: () => LiFiToken[];
  selectedChainId?: number; // Required for lifiToken to filter tokens
  // Pay-with props
  availablePrimaryTokens?: AvailablePrimaryToken[];
}

const PLACEHOLDER_TOKEN_LOGO = "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png";

export function SelectionPanel({
  type,
  onSelect,
  onClose,
  lifiTokensLoading,
  onSearchTokens,
  onGetAllTokens,
  selectedChainId,
  availablePrimaryTokens,
}: SelectionPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // For legacy token/chain selection
  const getLegacyItems = () => {
    switch (type) {
      case "token":
        return availableAssets;
      case "withdrawChain":
        return withdrawChains;
      case "chain":
        return availableChains;
      default:
        return [];
    }
  };

  // Get filtered LI.FI tokens for selected chain
  const filteredLiFiTokens = useMemo(() => {
    if (type !== "lifiToken" || !onSearchTokens || !selectedChainId) return [];
    return onSearchTokens(searchQuery, selectedChainId);
  }, [type, onSearchTokens, searchQuery, selectedChainId]);

  // Get all tokens across all chains (for allTokens type)
  const filteredAllTokens = useMemo(() => {
    if (type !== "allTokens") return [];

    // If searching, use searchTokens without chainId to search all chains
    if (searchQuery && onSearchTokens) {
      return onSearchTokens(searchQuery);
    }

    // Otherwise, return all tokens sorted by priority
    if (onGetAllTokens) {
      return onGetAllTokens();
    }

    return [];
  }, [type, onSearchTokens, onGetAllTokens, searchQuery]);

  const items = ["token", "chain", "withdrawChain"].includes(type) ? getLegacyItems() : [];

  const getTitle = () => {
    switch (type) {
      case "token":
        return "Select Token";
      case "lifiChain":
        return "Select Chain";
      case "lifiToken":
        return "Select Token";
      case "allTokens":
        return "Select Token";
      case "withdrawChain":
        return "Select Chain";
      case "chain":
        return "Select Chain";
      case "payWith":
        return "Pay With";
      default:
        return "Select";
    }
  };

  const handleLiFiTokenSelect = (token: LiFiToken) => {
    onSelect(JSON.stringify(token));
    onClose();
  };

  const handleLiFiChainSelect = (chainId: number) => {
    onSelect(chainId.toString());
    onClose();
  };

  return (
    <div className="w-72 shrink-0">
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl sticky top-4 h-[600px] flex flex-col p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">{getTitle()}</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white h-auto p-2"
          >
            ✕
          </Button>
        </div>

        {/* Search Input for LI.FI tokens */}
        {(type === "lifiToken" || type === "allTokens") && (
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tokens..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors text-sm"
              />
            </div>
          </div>
        )}

        {/* List Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {type === "lifiChain" ? (
            // LI.FI Chain List - Simple scrollable list like the screenshot
            <div className="space-y-2">
              {LIFI_CHAINS.map((chain) => (
                <button
                  key={chain.id}
                  onClick={() => handleLiFiChainSelect(chain.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors text-left"
                >
                  <img
                    src={chain.logo}
                    alt={chain.name}
                    width={32}
                    height={32}
                    className="rounded-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = PLACEHOLDER_TOKEN_LOGO;
                    }}
                  />
                  <span className="text-white font-medium">{chain.name}</span>
                </button>
              ))}
            </div>
          ) : type === "lifiToken" ? (
            // LI.FI Token List for selected chain
            <div className="space-y-1">
              {lifiTokensLoading ? (
                // Loading skeleton
                <div className="space-y-2">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-lg animate-pulse"
                    >
                      <div className="w-8 h-8 bg-white/10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-white/10 rounded w-20" />
                        <div className="h-3 bg-white/5 rounded w-32" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredLiFiTokens.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  {searchQuery ? "No tokens found" : "No tokens available"}
                </div>
              ) : (
                filteredLiFiTokens.slice(0, 50).map((token) => (
                  <button
                    key={`${token.chainId}-${token.address}`}
                    onClick={() => handleLiFiTokenSelect(token)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors text-left"
                  >
                    <img
                      src={token.logoURI || PLACEHOLDER_TOKEN_LOGO}
                      alt={token.symbol}
                      width={32}
                      height={32}
                      className="rounded-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = PLACEHOLDER_TOKEN_LOGO;
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-white font-medium">{token.symbol}</span>
                      <p className="text-xs text-gray-500 truncate">{token.name}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          ) : type === "allTokens" ? (
            // All tokens across all chains with chain badge
            <div className="space-y-1">
              {lifiTokensLoading ? (
                // Loading skeleton
                <div className="space-y-2">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-lg animate-pulse"
                    >
                      <div className="w-8 h-8 bg-white/10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-white/10 rounded w-20" />
                        <div className="h-3 bg-white/5 rounded w-32" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredAllTokens.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  {searchQuery ? "No tokens found" : "No tokens available"}
                </div>
              ) : (
                filteredAllTokens.slice(0, 50).map((token) => {
                  const chain = getLiFiChainById(token.chainId);
                  return (
                    <button
                      key={`${token.chainId}-${token.address}`}
                      onClick={() => handleLiFiTokenSelect(token)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors text-left"
                    >
                      {/* Token logo with chain badge */}
                      <div className="relative">
                        <img
                          src={token.logoURI || PLACEHOLDER_TOKEN_LOGO}
                          alt={token.symbol}
                          width={32}
                          height={32}
                          className="rounded-full"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = PLACEHOLDER_TOKEN_LOGO;
                          }}
                        />
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
                      <div className="flex-1 min-w-0">
                        <span className="text-white font-medium">{token.symbol}</span>
                        <p className="text-xs text-gray-500 truncate">
                          {chain ? chain.name : token.name}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          ) : type === "payWith" ? (
            // Pay With Token List
            <div className="space-y-1">
              {/* Any Token option */}
              <button
                onClick={() => {
                  onSelect("any");
                  onClose();
                }}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-full bg-purple-600/30 flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-white font-medium">Any Token</span>
                  <p className="text-xs text-gray-500">Most efficient routing</p>
                </div>
              </button>

              {/* Divider */}
              {availablePrimaryTokens && availablePrimaryTokens.length > 0 && (
                <div className="border-t border-white/10 my-2" />
              )}

              {/* Available primary tokens */}
              {availablePrimaryTokens?.map((token) => (
                <button
                  key={token.tokenType}
                  onClick={() => {
                    onSelect(token.tokenType.toString());
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors text-left"
                >
                  <img
                    src={token.logoUrl}
                    alt={token.symbol}
                    width={32}
                    height={32}
                    className="rounded-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = PLACEHOLDER_TOKEN_LOGO;
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-white font-medium">{token.symbol}</span>
                    <p className="text-xs text-gray-500">
                      ${token.amountInUSD.toFixed(2)} available
                    </p>
                  </div>
                </button>
              ))}

              {/* Empty state when no tokens available */}
              {(!availablePrimaryTokens || availablePrimaryTokens.length === 0) && (
                <div className="text-center py-4 text-gray-400 text-sm">
                  No tokens with balance
                </div>
              )}
            </div>
          ) : (
            // Legacy Token/Chain List
            <div className="space-y-2">
              {items.map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    onSelect(item);
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors text-left"
                >
                  <img
                    src={LOGO_URLS[item]}
                    alt={item}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                  <span className="text-white font-medium">{item}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
