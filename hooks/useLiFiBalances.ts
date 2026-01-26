import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchAllParticleBalances,
  clearParticleBalanceCache,
  type TokenBalance,
} from "@/lib/particle-balances";

interface UseLiFiBalancesReturn {
  balances: TokenBalance[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useLiFiBalances(
  walletAddress: string | undefined
): UseLiFiBalancesReturn {
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Prevent concurrent fetches
  const fetchingRef = useRef(false);
  const mountedRef = useRef(true);
  const initialScanDoneRef = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Main fetch function - uses Particle to get ALL tokens
  const fetchAllBalances = useCallback(async () => {
    if (!walletAddress || fetchingRef.current) {
      return;
    }

    fetchingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      // Fetch all token balances across all chains using Particle
      const allBalances = await fetchAllParticleBalances(walletAddress);

      if (mountedRef.current) {
        setBalances(allBalances);
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
  }, [walletAddress]);

  // Initial scan when wallet connects
  useEffect(() => {
    if (walletAddress && !initialScanDoneRef.current) {
      fetchAllBalances();
    }
  }, [walletAddress, fetchAllBalances]);

  const refetch = useCallback(async () => {
    clearParticleBalanceCache();
    await fetchAllBalances();
  }, [fetchAllBalances]);

  return {
    balances,
    isLoading,
    error,
    refetch,
  };
}

// Re-export TokenBalance type for convenience
export type { TokenBalance } from "@/lib/particle-balances";
