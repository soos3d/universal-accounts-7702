import { useState, useEffect, useCallback, useRef } from "react";
import type { LiFiToken } from "@/lib/lifi-tokens";
import {
  fetchTokenBalances,
  clearBalanceCache,
  scanForExistingBalances,
  type TokenBalance,
} from "@/lib/lifi-balances";

const STORAGE_KEY = "lifi-tracked-tokens";
const MAX_TRACKED_TOKENS = 20;

interface UseLiFiBalancesReturn {
  balances: TokenBalance[];
  isLoading: boolean;
  error: Error | null;
  addTrackedToken: (token: LiFiToken) => void;
  removeTrackedToken: (chainId: number, address: string) => void;
  clearTrackedTokens: () => void;
  refetch: () => Promise<void>;
  trackedTokens: LiFiToken[];
}

function getStoredTokens(): LiFiToken[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function setStoredTokens(tokens: LiFiToken[]): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
  } catch (error) {
    // Storage quota exceeded - could implement pruning if needed
    if (process.env.NODE_ENV === "development") {
      console.warn("Failed to persist tracked tokens:", error);
    }
  }
}

// Merge balances, preferring the first occurrence (to avoid duplicates)
function mergeBalances(
  scannedBalances: TokenBalance[],
  trackedBalances: TokenBalance[]
): TokenBalance[] {
  const seen = new Set<string>();
  const merged: TokenBalance[] = [];

  // Helper to create unique key
  const getKey = (b: TokenBalance) =>
    `${b.chainId}-${b.address.toLowerCase()}`;

  // Add scanned balances first (existing holdings)
  for (const balance of scannedBalances) {
    const key = getKey(balance);
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(balance);
    }
  }

  // Add tracked balances that aren't already included
  for (const balance of trackedBalances) {
    const key = getKey(balance);
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(balance);
    }
  }

  // Sort by USD value descending
  return merged.sort((a, b) => b.amountInUSD - a.amountInUSD);
}

export function useLiFiBalances(
  walletAddress: string | undefined
): UseLiFiBalancesReturn {
  const [trackedTokens, setTrackedTokens] = useState<LiFiToken[]>([]);
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Prevent concurrent fetches
  const fetchingRef = useRef(false);
  const mountedRef = useRef(true);
  const initialScanDoneRef = useRef(false);

  // Load tracked tokens from storage on mount
  useEffect(() => {
    const stored = getStoredTokens();
    setTrackedTokens(stored);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Main fetch function - scans for popular tokens AND fetches tracked token balances
  const fetchAllBalances = useCallback(async () => {
    if (!walletAddress || fetchingRef.current) {
      return;
    }

    fetchingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      // Run both fetches in parallel
      const [scannedBalances, trackedBalances] = await Promise.all([
        // Scan for existing balances of popular tokens
        scanForExistingBalances(walletAddress),
        // Fetch balances for manually tracked tokens (if any)
        trackedTokens.length > 0
          ? fetchTokenBalances(walletAddress, trackedTokens)
          : Promise.resolve([]),
      ]);

      if (mountedRef.current) {
        // Merge and deduplicate balances
        const merged = mergeBalances(scannedBalances, trackedBalances);
        setBalances(merged);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(
          err instanceof Error ? err : new Error("Failed to fetch balances")
        );
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
      fetchingRef.current = false;
      initialScanDoneRef.current = true;
    }
  }, [walletAddress, trackedTokens]);

  // Initial scan when wallet connects
  useEffect(() => {
    if (walletAddress && !initialScanDoneRef.current) {
      fetchAllBalances();
    }
  }, [walletAddress, fetchAllBalances]);

  // Refetch when tracked tokens change (after initial scan)
  useEffect(() => {
    if (walletAddress && initialScanDoneRef.current && trackedTokens.length > 0) {
      fetchAllBalances();
    }
  }, [walletAddress, trackedTokens, fetchAllBalances]);

  const addTrackedToken = useCallback((token: LiFiToken) => {
    setTrackedTokens((prev) => {
      // Check if token already exists
      const exists = prev.some(
        (t) =>
          t.chainId === token.chainId &&
          t.address.toLowerCase() === token.address.toLowerCase()
      );

      if (exists) {
        return prev;
      }

      // Add new token, respecting max limit
      const updated = [token, ...prev].slice(0, MAX_TRACKED_TOKENS);
      setStoredTokens(updated);

      // Clear cache to force refetch with new token
      clearBalanceCache();

      return updated;
    });
  }, []);

  const removeTrackedToken = useCallback(
    (chainId: number, address: string) => {
      setTrackedTokens((prev) => {
        const updated = prev.filter(
          (t) =>
            !(
              t.chainId === chainId &&
              t.address.toLowerCase() === address.toLowerCase()
            )
        );
        setStoredTokens(updated);
        return updated;
      });
    },
    []
  );

  const clearTrackedTokens = useCallback(() => {
    setTrackedTokens([]);
    setBalances([]);
    setStoredTokens([]);
    clearBalanceCache();
  }, []);

  const refetch = useCallback(async () => {
    clearBalanceCache();
    await fetchAllBalances();
  }, [fetchAllBalances]);

  return {
    balances,
    isLoading,
    error,
    addTrackedToken,
    removeTrackedToken,
    clearTrackedTokens,
    refetch,
    trackedTokens,
  };
}
