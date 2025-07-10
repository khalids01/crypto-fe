"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CoinData } from "./type";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface PriceDifference {
  exchange1: string;
  exchange2: string;
  price1: number;
  price2: number;
  difference: number;
  differencePercent: number;
}

interface PriceTableProps {
  coinData?: CoinData;
  isLoading: boolean;
}

export function PriceTable({ coinData, isLoading }: PriceTableProps) {
  if (isLoading || !coinData) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Price Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const { exchanges } = coinData;
  
  // Get the latest snapshot from each exchange
  const latestSnapshots = exchanges.map(exchange => {
    const latestSnapshot = exchange.marketSnapshots[0]; // Assuming snapshots are ordered by newest first
    return {
      exchange: exchange.exchange,
      price: latestSnapshot?.close || 0,
      color: exchange.color,
    };
  }).filter(snapshot => snapshot.price > 0); // Only include exchanges with valid prices

  // Calculate price differences
  const priceDifferences: PriceDifference[] = [];
  
  for (let i = 0; i < latestSnapshots.length; i++) {
    for (let j = i + 1; j < latestSnapshots.length; j++) {
      const exchange1 = latestSnapshots[i];
      const exchange2 = latestSnapshots[j];
      const price1 = exchange1.price;
      const price2 = exchange2.price;
      const difference = Math.abs(price1 - price2);
      const avgPrice = (price1 + price2) / 2;
      const differencePercent = (difference / avgPrice) * 100;

      priceDifferences.push({
        exchange1: exchange1.exchange,
        exchange2: exchange2.exchange,
        price1,
        price2,
        difference,
        differencePercent,
      });
    }
  }

  // Sort by difference percentage (highest first)
  priceDifferences.sort((a, b) => b.differencePercent - a.differencePercent);

  return (
    <>
    <div className="container max-w-7xl mx-auto pb-16">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Price Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exchange 1</TableHead>
                  <TableHead>Price 1</TableHead>
                  <TableHead>Exchange 2</TableHead>
                  <TableHead>Price 2</TableHead>
                  <TableHead>Difference</TableHead>
                  <TableHead className="text-right">% Difference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {priceDifferences.map((diff, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: latestSnapshots.find(e => e.exchange === diff.exchange1)?.color }}
                        />
                        {diff.exchange1}
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(diff.price1)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: latestSnapshots.find(e => e.exchange === diff.exchange2)?.color }}
                        />
                        {diff.exchange2}
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(diff.price2)}</TableCell>
                    <TableCell>{formatCurrency(diff.difference)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={diff.differencePercent > 0.1 ? 'destructive' : 'default'}>
                        {diff.differencePercent.toFixed(4)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
    </div>
    </>
  );
}
