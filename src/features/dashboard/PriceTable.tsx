"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, ArrowUpDown, AlertTriangle, DollarSign } from "lucide-react";
import { CoinData, Exchange } from "./type";

interface PriceDifference {
  exchange1: string;
  exchange2: string;
  price1: number;
  price2: number;
  difference: number;
  differencePercent: number;
  buyFrom: string;
  sellTo: string;
  buyPrice: number;
  sellPrice: number;
  potentialProfit: number;
  timestamp: number;
}

interface ExchangeSnapshot {
  exchange: string;
  price: number;
  timestamp: number;
  color: string;
}

interface PriceTableProps {
  coinData?: CoinData;
  isLoading: boolean;
  chartSymbol?: string;
  chartInterval?: string;
}

export function PriceTable({ coinData, isLoading, chartSymbol, chartInterval }: PriceTableProps) {
  const [sortBy, setSortBy] = useState<'difference' | 'percent'>('percent');
  const [showOpportunities, setShowOpportunities] = useState<boolean>(false);

  // Generate random colors for exchanges (for visualization)
  const exchangeColors = useMemo(() => {
    if (!coinData?.exchanges) return {};
    return coinData.exchanges.reduce((acc: Record<string, string>, exchange: Exchange, index: number) => {
      const hue = (index * 137.5) % 360; // Golden angle approximation for good distribution
      acc[exchange.exchange] = `hsl(${hue}, 70%, 60%)`;
      return acc;
    }, {} as Record<string, string>);
  }, [coinData?.exchanges]);

  // Format currency with appropriate precision
  const formatCurrency = (value: number): string => {
    if (value >= 1000) return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (value >= 100) return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 3 });
    if (value >= 1) return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 });
  };

  // Filter data based on chartSymbol and showOpportunities
  const relevantExchanges = useMemo(() => {
    if (!coinData?.exchanges || coinData.exchanges.length === 0) return [];
    
    // If chartSymbol is provided, filter exchanges that match the symbol
    if (chartSymbol) {
      // Try to find exact matches first
      const exactMatches = coinData.exchanges.filter((exchange: Exchange) => 
        exchange.coinSymbol.toUpperCase() === chartSymbol.toUpperCase());
      
      // If we found exact matches, use those
      if (exactMatches.length > 0) {
        console.log(`Filtered to ${exactMatches.length} exchanges matching symbol ${chartSymbol}`);
        return exactMatches;
      } 
      
      // Otherwise try partial matches (e.g., BTC in BTCUSDT)
      const partialMatches = coinData.exchanges.filter((exchange: Exchange) => 
        exchange.coinSymbol.toUpperCase().includes(chartSymbol.toUpperCase()));
      
      if (partialMatches.length > 0) {
        console.log(`Filtered to ${partialMatches.length} exchanges partially matching symbol ${chartSymbol}`);
        return partialMatches;
      }
      
      // If no matches, keep all exchanges but log a warning
      console.log(`No exchanges found matching symbol ${chartSymbol}, showing all exchanges`);
    }
    
    return coinData.exchanges;
  }, [coinData?.exchanges, chartSymbol]);
  
  // Create snapshots for visualization with proper typing
  const latestSnapshots = useMemo(() => {
    if (!relevantExchanges || relevantExchanges.length === 0) return [];
    
    return relevantExchanges.map((exchange: Exchange, index: number): ExchangeSnapshot => {
      // Get the latest market snapshot if available
      const latestSnapshot = exchange.marketSnapshots && exchange.marketSnapshots.length > 0 
        ? exchange.marketSnapshots[exchange.marketSnapshots.length - 1] 
        : null;
      
      return {
        exchange: exchange.exchange,
        // Use close price from latest snapshot or default to 0
        price: latestSnapshot ? latestSnapshot.close : 0,
        // Use timestamp from snapshot or current time
        timestamp: latestSnapshot ? new Date(latestSnapshot.closeTime).getTime() : Date.now(),
        color: exchangeColors[exchange.exchange] || `hsl(${index * 30}, 70%, 60%)`
      };
    });
  }, [relevantExchanges, exchangeColors]);
  
  // Process exchange data with price differences
  const processedData = useMemo(() => {
    if (relevantExchanges.length === 0) return [];
    
    const exchangeData = relevantExchanges.map((exchange: Exchange) => {
      // Get the latest market snapshot if available
      const latestSnapshot = exchange.marketSnapshots && exchange.marketSnapshots.length > 0 
        ? exchange.marketSnapshots[exchange.marketSnapshots.length - 1] 
        : null;
      
      return {
        exchange: exchange.exchange,
        price: latestSnapshot ? latestSnapshot.close : 0,
        coinSymbol: exchange.coinSymbol,
        timestamp: latestSnapshot ? new Date(latestSnapshot.closeTime).getTime() : Date.now()
      };
    });
    
    // Sort by price to find min and max
    const sortedByPrice = [...exchangeData].sort((a, b) => a.price - b.price);
    const lowestPrice = sortedByPrice[0];
    const highestPrice = sortedByPrice[sortedByPrice.length - 1];
    
    // Calculate differences
    return exchangeData.map((item) => {
      const priceDifference = highestPrice.price - item.price;
      const percentDifference = (priceDifference / item.price) * 100;
      
      return {
        ...item,
        priceDifference,
        percentDifference,
        isBuyFrom: item.price === lowestPrice.price,
        isSellTo: item.price === highestPrice.price
      };
    });
  }, [relevantExchanges]);
  
  // Generate arbitrage opportunities between exchanges
  const priceDifferences = useMemo(() => {
    const differences: PriceDifference[] = [];
    
    // Calculate all possible exchange pairs
    for (let i = 0; i < processedData.length; i++) {
      for (let j = i + 1; j < processedData.length; j++) {
        const exchange1 = processedData[i];
        const exchange2 = processedData[j];
        const price1 = exchange1.price;
        const price2 = exchange2.price;
        const difference = Math.abs(price1 - price2);
        const avgPrice = (price1 + price2) / 2;
        const differencePercent = (difference / avgPrice) * 100;
        
        // Determine which exchange has the lower price (buy from) and higher price (sell to)
        const buyFrom = price1 < price2 ? exchange1.exchange : exchange2.exchange;
        const sellTo = price1 < price2 ? exchange2.exchange : exchange1.exchange;
        const buyPrice = price1 < price2 ? price1 : price2;
        const sellPrice = price1 < price2 ? price2 : price1;

        differences.push({
          exchange1: exchange1.exchange,
          exchange2: exchange2.exchange,
          price1,
          price2,
          difference,
          differencePercent,
          buyFrom,
          sellTo,
          buyPrice,
          sellPrice,
          potentialProfit: difference,
          timestamp: Math.min(exchange1.timestamp, exchange2.timestamp)
        });
      }
    }
    
    return differences;
  }, [processedData]);
  
  // Sort and filter opportunities
  const opportunities = useMemo(() => {
    // Sort by selected criteria
    const sorted = [...priceDifferences];
    if (sortBy === 'difference') {
      sorted.sort((a, b) => b.difference - a.difference);
    } else {
      sorted.sort((a, b) => b.differencePercent - a.differencePercent);
    }
    
    // Filter opportunities if enabled
    return showOpportunities 
      ? sorted.filter(diff => diff.differencePercent > 0.1) 
      : sorted;
  }, [priceDifferences, sortBy, showOpportunities]);

  if (isLoading || !coinData) {
    return (
      <Card className="w-full shadow-md">
        <CardHeader className="bg-card/5">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Arbitrage Opportunities
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const { symbol, coinName } = coinData;
  
  // We already have latestSnapshots defined above, no need to redefine it
  // Filter out any snapshots with zero price
  const filteredSnapshots = latestSnapshots.filter(snapshot => snapshot.price > 0);

  // Calculate price differences
  const highestDiff = opportunities.length > 0 ? opportunities[0].differencePercent : 0;
  const avgDiff = opportunities.length > 0 
    ? opportunities.reduce((sum, diff) => sum + diff.differencePercent, 0) / opportunities.length 
    : 0;

  return (
    <div className="space-y-6">
      <Card className="w-full shadow-lg border-t-4 border-primary">
        <CardHeader className="bg-card/5 pb-2">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              {coinName} ({symbol}) Arbitrage Opportunities
            </CardTitle>
            
            <div className="flex flex-wrap items-center gap-2">
              <Button 
                variant={sortBy === 'percent' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setSortBy('percent')}
                className="h-8"
              >
                <ArrowUpDown className="mr-1 h-3 w-3" /> Sort by %
              </Button>
              <Button 
                variant={sortBy === 'difference' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setSortBy('difference')}
                className="h-8"
              >
                <DollarSign className="mr-1 h-3 w-3" /> Sort by Value
              </Button>
              <Button 
                variant={showOpportunities ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setShowOpportunities(!showOpportunities)}
                className="h-8"
              >
                <AlertTriangle className="mr-1 h-3 w-3" /> 
                {showOpportunities ? 'Show All' : 'Opportunities Only'}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {/* Stats summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/20">
            <div className="p-2 rounded-md bg-card">
              <p className="text-xs text-muted-foreground">Exchanges</p>
              <p className="text-2xl font-bold">{filteredSnapshots.length}</p>
            </div>
            <div className="p-2 rounded-md bg-card">
              <p className="text-xs text-muted-foreground">Opportunities</p>
              <p className="text-2xl font-bold">{priceDifferences.filter(d => d.differencePercent > 0.1).length}</p>
            </div>
            <div className="p-2 rounded-md bg-card">
              <p className="text-xs text-muted-foreground">Highest Difference</p>
              <p className="text-2xl font-bold">{highestDiff.toFixed(2)}%</p>
            </div>
            <div className="p-2 rounded-md bg-card">
              <p className="text-xs text-muted-foreground">Average Difference</p>
              <p className="text-2xl font-bold">{avgDiff.toFixed(2)}%</p>
            </div>
          </div>
          
          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-muted/50">
                  <TableHead>Buy From</TableHead>
                  <TableHead>Buy Price</TableHead>
                  <TableHead>Sell To</TableHead>
                  <TableHead>Sell Price</TableHead>
                  <TableHead>Difference</TableHead>
                  <TableHead className="text-right">% Difference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {opportunities.length > 0 ? (
                  opportunities.map((diff, index) => (
                    <TableRow key={index} className={diff.differencePercent > 0.5 ? 'bg-green-500/5 hover:bg-green-500/10' : ''}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: filteredSnapshots.find(e => e.exchange === diff.buyFrom)?.color || '#ccc' }}
                          />
                          {diff.buyFrom}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">{formatCurrency(diff.buyPrice)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: filteredSnapshots.find(e => e.exchange === diff.sellTo)?.color || '#ccc' }}
                          />
                          {diff.sellTo}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">{formatCurrency(diff.sellPrice)}</TableCell>
                      <TableCell className="font-mono">{formatCurrency(diff.difference)}</TableCell>
                      <TableCell className="text-right">
                        <Badge 
                          variant={diff.differencePercent > 0.5 ? 'destructive' : diff.differencePercent > 0.1 ? 'default' : 'outline'}
                          className={diff.differencePercent > 0.5 ? 'bg-green-500 hover:bg-green-600' : ''}
                        >
                          {diff.differencePercent.toFixed(4)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No arbitrage opportunities found matching your criteria
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
