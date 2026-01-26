import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  fetchLiFiTokens,
  searchTokens as searchTokensUtil,
  getTopTokensForChain,
  getAllTokens,
  type LiFiToken,
  type TokensByChain,
} from "@/lib/lifi-tokens";

interface UseLiFiTokensReturn {
  tokens: TokensByChain;
  isLoading: boolean;
  error: Error | null;
  getTokensForChain: (chainId: number) => LiFiToken[];
  searchTokens: (query: string, chainId?: number) => LiFiToken[];
  getAllTokensSorted: () => LiFiToken[];
  refetch: () => Promise<void>;
  ensureTokensLoaded: () => Promise<void>;
}

export function useLiFiTokens(): UseLiFiTokensReturn {
  const [tokens, setTokens] = useState<TokensByChain>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const fetchPromiseRef = useRef<Promise<void> | null>(null);
  const hasFetchedRef = useRef(false);

  const fetchTokens = useCallback(async () => {
    // Prevent concurrent fetches
    if (fetchPromiseRef.current) {
      return fetchPromiseRef.current;
    }

    setIsLoading(true);
    setError(null);

    const promise = (async () => {
      try {
        const fetchedTokens = await fetchLiFiTokens();
        setTokens(fetchedTokens);
        hasFetchedRef.current = true;
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch tokens"));
        throw err;
      } finally {
        setIsLoading(false);
        fetchPromiseRef.current = null;
      }
    })();

    fetchPromiseRef.current = promise;
    return promise;
  }, []);

  // Ensure tokens are loaded - call this when panel opens
  const ensureTokensLoaded = useCallback(async () => {
    if (hasFetchedRef.current && Object.keys(tokens).length > 0) {
      return;
    }
    await fetchTokens();
  }, [fetchTokens, tokens]);

  // Initial fetch on mount
  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  const getTokensForChain = useCallback(
    (chainId: number): LiFiToken[] => {
      return getTopTokensForChain(tokens, chainId, 50);
    },
    [tokens]
  );

  const searchTokens = useCallback(
    (query: string, chainId?: number): LiFiToken[] => {
      return searchTokensUtil(tokens, query, chainId);
    },
    [tokens]
  );

  const getAllTokensSorted = useCallback((): LiFiToken[] => {
    return getAllTokens(tokens, 200);
  }, [tokens]);

  return useMemo(
    () => ({
      tokens,
      isLoading,
      error,
      getTokensForChain,
      searchTokens,
      getAllTokensSorted,
      refetch: fetchTokens,
      ensureTokensLoaded,
    }),
    [tokens, isLoading, error, getTokensForChain, searchTokens, getAllTokensSorted, fetchTokens, ensureTokensLoaded]
  );
}
