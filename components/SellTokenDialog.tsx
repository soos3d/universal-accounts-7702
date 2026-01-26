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
        <div className="relative w-full max-w-sm bg-[#1a1a2e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
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
          <div className="p-6 text-center space-y-4">
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
          <div className="p-4 border-t border-white/10">
            <Button
              onClick={handleClose}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium transition-colors"
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
      <div className="relative w-full max-w-sm bg-[#1a1a2e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
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
        <div className="p-4 space-y-4">
          {/* Token Info */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                {token.logoURI ? (
                  <img
                    src={token.logoURI}
                    alt={token.symbol}
                    width={48}
                    height={48}
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
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center overflow-hidden">
                  <img
                    src={chain.logo}
                    alt={chain.name}
                    width={16}
                    height={16}
                    className="rounded-full"
                  />
                </div>
              )}
            </div>
            <div>
              <p className="font-semibold text-white">{token.name}</p>
              <p className="text-sm text-gray-400">
                on {chain?.name || `Chain ${token.chainId}`}
              </p>
            </div>
          </div>

          {/* Balance Display */}
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <p className="text-xs text-gray-400 mb-1">Your Balance</p>
            <p className="text-white font-medium">
              {formattedBalance.toFixed(4)} {token.symbol}
              <span className="text-gray-400 ml-2">
                (${token.amountInUSD.toFixed(2)})
              </span>
            </p>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Amount to Sell
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                disabled={isSelling}
                className={`w-full bg-white/5 border rounded-xl px-4 py-3 pr-16 text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-colors disabled:opacity-50 ${
                  exceedsBalance
                    ? "border-red-500/50 focus:ring-red-500/50"
                    : "border-white/10 focus:ring-purple-500/50"
                }`}
              />
              <button
                onClick={handleMax}
                disabled={isSelling}
                className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-medium text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 rounded transition-colors disabled:opacity-50"
              >
                MAX
              </button>
            </div>
            <div className="flex justify-between mt-2">
              <p className="text-sm text-gray-400">
                {inputAmount > 0
                  ? `≈ $${inputUSDValue.toFixed(2)} Delivered as a primary asset`
                  : "≈ $0.00"}
              </p>
              {exceedsBalance && (
                <p className="text-sm text-red-400">Exceeds balance</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <Button
            onClick={handleSell}
            disabled={!hasValidAmount || isSelling}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSelling ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Selling...
              </span>
            ) : !amount ? (
              "Enter amount"
            ) : exceedsBalance ? (
              "Insufficient balance"
            ) : (
              `Sell ${token?.symbol}`
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
