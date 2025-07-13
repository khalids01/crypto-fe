"use client";
import { PriceTable } from "./PriceTable";
import { useArbitrageFeed } from "./useArbitrageFeed";
import { ExchangeComparisonChart } from "./ExchangeComparisonChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpDown, TrendingUp, BarChart3, RefreshCcw, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";

export function DashboardData() {
  const {
    arbitrageFeedQuery: { data: coinData, isLoading, refetch },
  } = useArbitrageFeed();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [chartSymbol, setChartSymbol] = useState<string | undefined>(undefined);
  const [chartInterval, setChartInterval] = useState<string>("15");

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Handle symbol change from TradingView chart
  const handleSymbolChange = useCallback((symbol: string) => {
    setChartSymbol(symbol);
    console.log("Dashboard received symbol change:", symbol);
  }, []);

  // Handle interval change from TradingView chart
  const handleIntervalChange = useCallback((interval: string) => {
    setChartInterval(interval);
    console.log("Dashboard received interval change:", interval);
  }, []);

  return (
    <div className="space-y-6 pb-10">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pb-2 border-b">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Crypto Arbitrage Dashboard</h1>
          <p className="text-muted-foreground">Monitor price differences across exchanges in real-time</p>
        </div>
        <div className="flex items-center gap-2">
          {chartSymbol && chartSymbol !== coinData?.symbol && (
            <Badge variant="outline" className="gap-1">
              <Info className="h-3 w-3" />
              Custom Symbol: {chartSymbol}
            </Badge>
          )}
          {chartInterval && chartInterval !== "15" && (
            <Badge variant="outline" className="gap-1">
              <Info className="h-3 w-3" />
              Interval: {chartInterval}m
            </Badge>
          )}
          <Button 
            onClick={handleRefresh} 
            disabled={isRefreshing || isLoading} 
            className="gap-2"
          >
            <RefreshCcw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6">
        {/* Chart Section */}
        <Card className="shadow-md border-t-4 border-blue-500">
          <CardHeader className="bg-card/5 pb-2">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              Price Chart
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-hidden">
            <div className="h-[500px]">
              <ExchangeComparisonChart 
                onSymbolChange={handleSymbolChange}
                onIntervalChange={handleIntervalChange}
              />
            </div>
          </CardContent>
        </Card>

        {/* Arbitrage Table */}
        <PriceTable 
          coinData={coinData} 
          isLoading={isLoading} 
          chartSymbol={chartSymbol}
          chartInterval={chartInterval}
        />
      </div>
    </div>
  );
}
