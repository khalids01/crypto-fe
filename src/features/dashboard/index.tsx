"use client"
import { Graph } from "./graph";
import { PriceTable } from "./PriceTable";
import { useArbitrageFeed } from "./useArbitrageFeed";

export function DashboardData() {
  const {
    arbitrageFeedQuery: { data: coinData, isLoading },
  } = useArbitrageFeed();
  return (
    <div className="flex flex-col min-h-screen">
      <Graph coinData={coinData} isLoading={isLoading} />
      <PriceTable coinData={coinData} isLoading={isLoading} />
    </div>
  );
}
