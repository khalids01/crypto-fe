
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useObject } from "@/hooks/useObject";

interface PriceData {
  price: number;
  change24h: number;
}

interface ChartDataPoint {
  date: string;
  price: number;
}

interface BitcoinPriceFilters {
  currency?: string;
  days?: string;
}

export const useBitcoinPrice = (initialFilters?: BitcoinPriceFilters) => {
  const queryClient = useQueryClient();

  const { object: filters, setValues: setFilters } = useObject<BitcoinPriceFilters>({
    currency: 'usd',
    days: '7',
    ...initialFilters,
  });

  const fetchCurrentPrice = async () => {
    const response = await axios<{ bitcoin: Record<string, number> }>(
      `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=${filters.currency?.toLowerCase()}&include_24hr_change=true`
    );
    
    const price = response.data.bitcoin[filters.currency?.toLowerCase() || 'usd'];
    const change24h = response.data.bitcoin[`${filters.currency?.toLowerCase() || 'usd'}_24h_change`];

    if (price === undefined || change24h === undefined) {
      throw new Error('Invalid price data received');
    }

    return { price, change24h };
  };

  const fetchChartData = async () => {
    const response = await axios<{ prices: [number, number][] }>(
      `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=${filters.currency?.toLowerCase()}&days=${filters.days}`
    );

    if (!response.data.prices || !Array.isArray(response.data.prices)) {
      throw new Error('Invalid chart data format received');
    }

    return response.data.prices.map(([timestamp, price]) => ({
      date: new Date(timestamp).toISOString(),
      price: Math.round(price * 100) / 100,
    }));
  };

  const currentPriceQuery = useQuery<PriceData>({
    queryKey: ['bitcoin.price', filters.currency],
    queryFn: fetchCurrentPrice,
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000, // Data is fresh for 30 seconds
    retry: 3,
    retryDelay: 1000,
  });

  const chartDataQuery = useQuery<ChartDataPoint[]>({
    queryKey: ['bitcoin.chart', filters.currency, filters.days],
    queryFn: fetchChartData,
    staleTime: 300000, // Data is fresh for 5 minutes
    retry: 3,
    retryDelay: 1000,
  });

  const revalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['bitcoin.price'] });
    queryClient.invalidateQueries({ queryKey: ['bitcoin.chart'] });
  };

  return {
    filters,
    setFilters,
    currentPriceQuery,
    chartDataQuery,
    revalidate,
    isLoading: currentPriceQuery.isLoading || chartDataQuery.isLoading,
    isError: currentPriceQuery.isError || chartDataQuery.isError,
    error: currentPriceQuery.error || chartDataQuery.error,
  };
};