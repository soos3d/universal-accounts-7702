/* eslint-disable @next/next/no-img-element */
import { useState, useEffect } from "react";
import { X, Check, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LOGO_URLS } from "@/lib/utils";
import { getLiFiChainById } from "@/lib/lifi";
import type { TokenBalance } from "@/lib/lifi-balances";

interface SellTokenDialogProps {
  token: TokenBalance | null;
  onClose: () => void;
  onSell: (token: TokenBalance, amount: string) => Promise<void>;
  isSelling: boolean;
  transactionHash: string | null;
}

export function SellTokenDialog({
  token,
  onClose,
  onSell,
  isSelling,
  transactionHash,
}: SellTokenDialogProps) {
  const [amount, setAmount] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // Reset state when token changes
  useEffect(() => {
    setAmount("");
    setIsSuccess(false);
  }, [token]);

  // Track success state when transaction completes
  useEffect(() => {
    if (transactionHash && !isSelling) {
      setIsSuccess(true);
    }
  }, [transactionHash, isSelling]);

  if (!token) return null;

  const chain = getLiFiChainById(token.chainId);
  const decimals = token.decimals || 18;
  const rawBalance = parseFloat(token.amount);
  const formattedBalance = rawBalance / Math.pow(10, decimals);
  const priceUSD = parseFloat(token.priceUSD || "0");

  // Calculate USD value for input amount
  const inputAmount = parseFloat(amount) || 0;
  const inputUSDValue = inputAmount * priceUSD;

  // Check if input exceeds balance
  const exceedsBalance = inputAmount > formattedBalance;
  const hasValidAmount = inputAmount > 0 && !exceedsBalance;

  const handleMax = () => {
    setAmount(formattedBalance.toString());
  };

  const handleSell = async () => {
    if (!hasValidAmount) return;
    await onSell(token, amount);
  };

  const handleClose = () => {
    setAmount("");
    setIsSuccess(false);
    onClose();
  };

  // Success state
  if (isSuccess && transactionHash) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        />

        {/* Dialog */}
        <div className="relative w-full max-w-sm bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-5 pb-0">
            <h2 className="text-lg font-semibold text-white">Sell Complete</h2>
            <Button
              onClick={handleClose}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white h-auto p-1.5 rounded-lg hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-5 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
              <Check className="w-8 h-8 text-green-400" />
            </div>

            <div>
              <p className="text-xl font-semibold text-white mb-1">Success!</p>
              <p className="text-gray-400">
                Sold {amount} {token.symbol} for USDC
              </p>
            </div>

            <a
              href={`https://universalx.app/activity/details?id=${transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
            >
              View on Explorer
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {/* Footer */}
          <div className="p-5 pt-2">
            <Button
              onClick={handleClose}
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium transition-colors shadow-lg shadow-purple-500/30"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={isSelling ? undefined : handleClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-sm bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-4">
          <h2 className="text-lg font-semibold text-white">
            Sell {token.symbol}
          </h2>
          <Button
            onClick={handleClose}
            disabled={isSelling}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white h-auto p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="px-5 pb-5 space-y-4">
          {/* Token Sell Section - styled like "YOU RECEIVE" */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">
              You Sell
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                    {token.logoURI ? (
                      <img
                        src={token.logoURI}
                        alt={token.symbol}
                        width={40}
                        height={40}
                        className="rounded-full"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = LOGO_URLS.ETH;
                        }}
                      />
                    ) : (
                      <span className="text-sm font-bold text-gray-400">
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
                  <p className="font-medium text-white">{token.symbol}</p>
                  <p className="text-xs text-gray-400">
                    {chain?.name || `Chain ${token.chainId}`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Balance</p>
                <p className="text-white font-medium">
                  {formattedBalance.toFixed(4)}
                </p>
              </div>
            </div>
          </div>

          {/* Amount Input Section - styled like "YOU SPEND (USD)" */}
          <div className="bg-white/5 rounded-xl p-4 border border-purple-500/30">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">
              Amount
            </p>
            <div className="flex items-center justify-between gap-4">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                disabled={isSelling}
                className={`flex-1 bg-transparent text-3xl font-light text-white placeholder-gray-600 focus:outline-none disabled:opacity-50 w-full min-w-0 ${
                  exceedsBalance ? "text-red-400" : ""
                }`}
              />
              <button
                onClick={handleMax}
                disabled={isSelling}
                className="px-3 py-1.5 text-sm font-medium text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 rounded-lg transition-colors disabled:opacity-50 shrink-0"
              >
                MAX
              </button>
            </div>
            <div className="flex justify-between mt-2">
              <p className="text-sm text-gray-400">
                {inputAmount > 0
                  ? `≈ $${inputUSDValue.toFixed(2)}`
                  : `≈ $0.00`}
              </p>
              {exceedsBalance && (
                <p className="text-sm text-red-400">Exceeds balance</p>
              )}
            </div>
          </div>

          {/* Info text */}
          <p className="text-xs text-gray-500 text-center">
            Proceeds delivered as USDC to your wallet
          </p>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5">
          <Button
            onClick={handleSell}
            disabled={!hasValidAmount || isSelling}
            className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/30 disabled:shadow-none"
          >
            {isSelling ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Selling...
              </span>
            ) : !amount ? (
              "Enter amount"
            ) : exceedsBalance ? (
              "Insufficient balance"
            ) : (
              `Sell ${token.symbol}`
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
