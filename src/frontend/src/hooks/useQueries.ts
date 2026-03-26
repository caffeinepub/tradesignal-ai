import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";

// Legacy single-key hooks (backwards compat)
export function useGetApiKey() {
  const { actor, isFetching } = useActor();
  return useQuery<string>({
    queryKey: ["apiKey"],
    queryFn: async () => {
      if (!actor) return "";
      return actor.getApiKey();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveApiKey() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (apiKey: string) => {
      if (!actor) throw new Error("No actor");
      return actor.saveApiKey(apiKey);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apiKey"] });
    },
  });
}

// Per-provider key hooks
export function useGetProviderApiKey(provider: string) {
  const { actor, isFetching } = useActor();
  return useQuery<string>({
    queryKey: ["providerApiKey", provider],
    queryFn: async () => {
      if (!actor) return "";
      return actor.getProviderApiKey(provider);
    },
    enabled: !!actor && !isFetching && !!provider,
  });
}

export function useSaveProviderApiKey() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { provider: string; apiKey: string }) => {
      if (!actor) throw new Error("No actor");
      return actor.saveProviderApiKey(params.provider, params.apiKey);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["providerApiKey", variables.provider],
      });
    },
  });
}

export function useGetSignalHistory() {
  const { actor, isFetching } = useActor();
  return useQuery<string[]>({
    queryKey: ["signalHistory"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSignalHistory();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveSignal() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (signalJson: string) => {
      if (!actor) throw new Error("No actor");
      return actor.saveSignal(signalJson);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["signalHistory"] });
    },
  });
}

export function useAnalyzeChart() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (params: {
      symbol: string;
      timeframe: string;
      marketData: string;
      provider: string;
      apiKey: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.analyzeChart(
        params.symbol,
        params.timeframe,
        params.marketData,
        params.provider,
        params.apiKey,
      );
    },
  });
}

export function useChatWithAI() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (params: {
      messages: string;
      provider: string;
      apiKey: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.chatWithAI(params.messages, params.provider, params.apiKey);
    },
  });
}
