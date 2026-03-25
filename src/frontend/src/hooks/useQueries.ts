import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";

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
      apiKey: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.analyzeChart(
        params.symbol,
        params.timeframe,
        params.marketData,
        params.apiKey,
      );
    },
  });
}

export function useChatWithAI() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (params: { messages: string; apiKey: string }) => {
      if (!actor) throw new Error("No actor");
      return actor.chatWithAI(params.messages, params.apiKey);
    },
  });
}
