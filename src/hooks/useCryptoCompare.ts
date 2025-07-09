import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useObject } from "@/hooks/useObject";

export interface CryptoInfo {
  id: string;
  name: string;
  symbol: string;
  color: string;
}

export interface PriceData {
  price: number;
  change24h: number;
}

export interface ChartDataPoint {
  date: string;
  [key: string]: number | string; // Dynamic keys for each cryptocurrency
}

export interface CryptoPriceData {
  [cryptoId: string]: PriceData | null;
}

// List of supported cryptocurrencies
export const supportedCryptos: CryptoInfo[] = [
  { id: 'BTC', name: 'Bitcoin', symbol: 'BTC', color: '#F7931A' },
  { id: 'ETH', name: 'Ethereum', symbol: 'ETH', color: '#627EEA' },
  { id: 'USDT', name: 'Tether', symbol: 'USDT', color: '#26A17B' },
  { id: 'BNB', name: 'BNB', symbol: 'BNB', color: '#F0B90B' },
  { id: 'SOL', name: 'Solana', symbol: 'SOL', color: '#00FFA3' },
];

// Map CoinGecko IDs to CryptoCompare symbols
const cryptoIdMap: Record<string, string> = {
  'bitcoin': 'BTC',
  'ethereum': 'ETH',
  'tether': 'USDT',
  'binancecoin': 'BNB',
  'solana': 'SOL',
  'ripple': 'XRP',
  'usd-coin': 'USDC',
  'cardano': 'ADA',
  'dogecoin': 'DOGE',
  'avalanche-2': 'AVAX'
};

// Map CryptoCompare symbols to CoinGecko IDs
const reverseCryptoIdMap: Record<string, string> = Object.entries(cryptoIdMap)
  .reduce((acc, [key, value]) => ({ ...acc, [value]: key }), {});

interface CryptoCompareFilters {
  currency?: string;
  days?: string;
  selectedCryptos?: string[];
}

export const useCryptoCompare = (initialFilters?: CryptoCompareFilters) => {
  const queryClient = useQueryClient();

  const { object: filters, setValues: setFilters } = useObject<CryptoCompareFilters>({
    currency: 'usd',
    days: '7',
    selectedCryptos: ['bitcoin'],
    ...initialFilters,
  });

  const fetchPriceData = async (): Promise<CryptoPriceData> => {
    const newPriceData: CryptoPriceData = {};
    const symbols = filters.selectedCryptos?.map(id => cryptoIdMap[id] || id) || [];
    
    if (symbols.length === 0) return {};

    try {
      const symbolsParam = symbols.join(',');
      const response = await axios.get(
        `https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${symbolsParam}&tsyms=${filters.currency}`
      );
      
      if (response.data?.RAW) {
        filters.selectedCryptos?.forEach((cryptoId, index) => {
          const symbol = symbols[index];
          
          if (response.data.RAW[symbol]?.[filters.currency || 'USD']) {
            const cryptoData = response.data.RAW[symbol][filters.currency || 'USD'];
            newPriceData[cryptoId] = {
              price: cryptoData.PRICE,
              change24h: cryptoData.CHANGEPCT24HOUR
            };
          } else {
            newPriceData[cryptoId] = null;
          }
        });
      }
      return newPriceData;
    } catch (error) {
      console.error('Error fetching price data:', error);
      // Return default values on error
      return filters.selectedCryptos?.reduce((acc, cryptoId) => ({
        ...acc,
        [cryptoId]: null
      }), {}) || {};
    }
  };

  const fetchChartData = async (): Promise<ChartDataPoint[]> => {
    if (!filters.selectedCryptos?.length) return [];
    
    const pricesByTimestamp: { [timestamp: number]: { [cryptoId: string]: number } } = {};
    const limit = filters.days === '1' ? 24 : 
                 filters.days === '7' ? 168 : 
                 filters.days === '30' ? 30 : 
                 filters.days === '90' ? 90 : 365;
    
    const interval = filters.days === '1' ? 'hour' : 'day';
    const results: ChartDataPoint[] = [];

    for (const cryptoId of filters.selectedCryptos) {
      const symbol = cryptoIdMap[cryptoId] || cryptoId;
      const endpoint = interval === 'hour' ? 'histohour' : 'histoday';
      
      try {
        const response = await axios.get(
          `https://min-api.cryptocompare.com/data/v2/${endpoint}?fsym=${symbol}&tsym=${filters.currency}&limit=${limit}`
        );
        
        if (response.data?.Response === 'Success' && response.data?.Data?.Data) {
          response.data.Data.Data.forEach((item: any) => {
            const timestamp = item.time * 1000;
            
            if (!pricesByTimestamp[timestamp]) {
              pricesByTimestamp[timestamp] = { date: timestamp };
            }
            
            pricesByTimestamp[timestamp][cryptoId] = item.close;
          });
        }
      } catch (error) {
        console.error(`Error fetching chart data for ${cryptoId}:`, error);
        continue;
      }
    }

    // Convert the timestamp map to an array of ChartDataPoint
    Object.values(pricesByTimestamp).forEach(timestampData => {
      const date = new Date(timestampData.date).toISOString().split('T')[0];
      const entry: ChartDataPoint = { date };
      
      filters.selectedCryptos?.forEach(cryptoId => {
        entry[cryptoId] = timestampData[cryptoId] || 0;
      });
      
      results.push(entry);
    });

    return results.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // Price data query
  const priceDataQuery = useQuery<CryptoPriceData>({
    queryKey: ['crypto.prices', filters.currency, ...(filters.selectedCryptos || [])],
    queryFn: fetchPriceData,
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000, // Data is fresh for 30 seconds
    retry: 3,
    retryDelay: 1000,
  });

  // Chart data query
  const chartDataQuery = useQuery<ChartDataPoint[]>({
    queryKey: ['crypto.chart', filters.currency, filters.days, ...(filters.selectedCryptos || [])],
    queryFn: fetchChartData,
    staleTime: 300000, // Data is fresh for 5 minutes
    retry: 3,
    retryDelay: 1000,
  });

  // Invalidate and refetch data
  const revalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['crypto.prices'] });
    queryClient.invalidateQueries({ queryKey: ['crypto.chart'] });
  };

  return {
    filters,
    setFilters,
    priceDataQuery,
    chartDataQuery,
    revalidate,
    isLoading: priceDataQuery.isLoading || chartDataQuery.isLoading,
    isError: priceDataQuery.isError || chartDataQuery.isError,
    error: priceDataQuery.error || chartDataQuery.error,
  };
};