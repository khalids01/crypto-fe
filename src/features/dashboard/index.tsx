"use client";
import { Graph } from "./graph";
import { PriceTable } from "./PriceTable";
import { useArbitrageFeed } from "./useArbitrageFeed";
import { ExchangeComparisonChart } from "./ExchangeComparisonChart";

export function DashboardData() {
  const {
    arbitrageFeedQuery: { data: coinData, isLoading },
  } = useArbitrageFeed();
  return (
    <div className="flex flex-col gap-6">
      {/* <Graph coinData={coinData} isLoading={isLoading} /> */}
      <ExchangeComparisonChart coinId={coinData?.id} />
      <PriceTable coinData={coinData} isLoading={isLoading} />
    </div>
  );
}
