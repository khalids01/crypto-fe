import React, { useState, useCallback } from "react";
import { useArbitrageFeed } from "./useArbitrageFeed";
import TradingViewWidget from "./TradingViewWidget";

interface ExchangeComparisonChartProps {
  onSymbolChange?: (symbol: string) => void;
  onIntervalChange?: (interval: string) => void;
}

export function ExchangeComparisonChart({
  onSymbolChange,
  onIntervalChange
}: ExchangeComparisonChartProps = {}) {
  const {
    arbitrageFeedQuery: { data, isLoading, error },
  } = useArbitrageFeed();

  const [chartSymbol, setChartSymbol] = useState<string | undefined>(undefined);
  const [chartInterval, setChartInterval] = useState<string>("15");
  const [isChartReady, setIsChartReady] = useState(false);

  // Handle symbol change from TradingView widget
  const handleSymbolChange = useCallback((symbol: string) => {
    setChartSymbol(symbol);
    if (onSymbolChange) onSymbolChange(symbol);
    console.log("Chart symbol changed to:", symbol);
  }, [onSymbolChange]);

  // Handle interval change from TradingView widget
  const handleIntervalChange = useCallback((interval: string) => {
    setChartInterval(interval);
    if (onIntervalChange) onIntervalChange(interval);
    console.log("Chart interval changed to:", interval);
  }, [onIntervalChange]);

  // Handle chart ready event
  const handleChartReady = useCallback(() => {
    setIsChartReady(true);
    console.log("Chart is ready and initialized");
  }, []);

  // Show loading state
  if (isLoading) {
    return (
      <div className="w-full rounded-lg h-full px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading chart data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="w-full rounded-lg h-full px-4 flex items-center justify-center">
        <div className="text-center text-red-500">
          <p className="text-xl">Error loading chart data</p>
          <p className="mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  // Show no data state
  if (!data || !data.exchanges || data.exchanges.length === 0) {
    return (
      <div className="w-full rounded-lg h-full px-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl">No data available</p>
          <p className="mt-2">Please try again later</p>
        </div>
      </div>
    );
  }

  // Format symbol for TradingView
  const symbol = chartSymbol || data.symbol;
  console.log("Symbol for TradingView:", symbol);
  console.log("Exchanges for TradingView:", data.exchanges);

  return (
    <div className="w-full rounded-lg h-full px-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">
          {data.coinName} ({symbol}) Price Comparison
        </h2>
        {isChartReady && (
          <div className="text-sm text-muted-foreground">
            Interval: {chartInterval}m
          </div>
        )}
      </div>

      <div className="w-full h-[500px]" style={{ minHeight: '500px' }}>
        <TradingViewWidget
          symbol={symbol}
          exchanges={data.exchanges}
          theme="dark"
          interval={chartInterval}
          onSymbolChange={handleSymbolChange}
          onIntervalChange={handleIntervalChange}
          onChartReady={handleChartReady}
        />
      </div>
    </div>
  );
};
export default ExchangeComparisonChart;
