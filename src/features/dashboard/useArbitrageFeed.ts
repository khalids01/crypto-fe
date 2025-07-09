import { endpoints } from "@/constants/endpoints";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { ArbitrageFeedList } from "./type";

export const useArbitrageFeed = () => {
  const arbitrageFeedQuery = useQuery({
    queryKey: ["arbitrage-feed"],
    queryFn: () =>
      api<ArbitrageFeedList>(endpoints.arbitrageFeed, { method: "GET" }),
  });

  return {
    arbitrageFeedQuery,
  };
};
