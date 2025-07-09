import { useState, useEffect } from 'react';
import { useConfig } from '../context/ConfigContext';

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

export interface ChartData {
  date: string;
  [key: string]: number | string; // Dynamic keys for each cryptocurrency
}

export interface CryptoPriceData {
  [cryptoId: string]: PriceData | null;
}

// List of supported cryptocurrencies
export const supportedCryptos: CryptoInfo[] = [
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', color: '#F7931A' },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', color: '#627EEA' },
  { id: 'tether', name: 'Tether', symbol: 'USDT', color: '#26A17B' },
  { id: 'binancecoin', name: 'BNB', symbol: 'BNB', color: '#F0B90B' },
  // { id: 'solana', name: 'Solana', symbol: 'SOL', color: '#00FFA3' },
  // { id: 'ripple', name: 'XRP', symbol: 'XRP', color: '#23292F' },
  // { id: 'usd-coin', name: 'USDC', symbol: 'USDC', color: '#2775CA' },
  // { id: 'cardano', name: 'Cardano', symbol: 'ADA', color: '#0033AD' },
  // { id: 'dogecoin', name: 'Dogecoin', symbol: 'DOGE', color: '#C2A633' },
  // { id: 'avalanche-2', name: 'Avalanche', symbol: 'AVAX', color: '#E84142' },
];

const useCryptoPrices = (currency: string, selectedCryptos: string[] = ['bitcoin']) => {
  const [priceData, setPriceData] = useState<CryptoPriceData>({});
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<string>('');

  // Helper function to get crypto name from ID
  const getCryptoName = (cryptoId: string): string => {
    const crypto = supportedCryptos.find(c => c.id === cryptoId);
    return crypto ? crypto.name : cryptoId;
  };

  // Use a proxy server to avoid CORS issues
  const getProxiedUrl = (url: string): string => {
    // Option 1: Use a CORS proxy (for development only)
    return `https://corsproxy.io/?${encodeURIComponent(url)}`;
    
    // Alternative options (commented out):
    // return `https://cors-anywhere.herokuapp.com/${url}`; // Requires requesting temporary access
    // return url; // Direct access (will have CORS issues)
  };
  
  const fetchWithRetry = async (url: string, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        // Add exponential backoff for retries
        if (i > 0) {
          const backoffDelay = delay * Math.pow(2, i - 1);
          console.log(`Waiting ${backoffDelay}ms before retry ${i + 1}`);
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
        }
        
        console.log(`Fetching (attempt ${i + 1}/${retries}):`, url);
        const proxiedUrl = getProxiedUrl(url);
        const response = await fetch(proxiedUrl);
        
        if (!response.ok) {
          // Handle rate limiting specifically
          if (response.status === 429) {
            console.log('Rate limit hit, will retry with longer delay');
            // Force a longer wait for rate limits
            await new Promise(resolve => setTimeout(resolve, 2000 + (i * 1000)));
            continue;
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Fetch successful');
        return data;
      } catch (err) {
        console.log(`Fetch attempt ${i + 1} failed:`, err);
        
        if (i === retries - 1) {
          throw err;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
    return null; // TypeScript requires a return here
  };

  const fetchPriceData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const newPriceData: CryptoPriceData = {};
      
      // Add a small delay between requests to avoid rate limiting
      for (let i = 0; i < selectedCryptos.length; i++) {
        const cryptoId = selectedCryptos[i];
        setLoadingStatus(`Fetching ${getCryptoName(cryptoId)} price...`);
        
        try {
          // Add a delay between requests to avoid rate limiting
          if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
          const data = await fetchWithRetry(
            `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoId}&vs_currencies=${currency.toLowerCase()}&include_24h_change=true`
          );
          
          if (data && data[cryptoId]) {
            newPriceData[cryptoId] = {
              price: data[cryptoId][currency.toLowerCase()],
              change24h: data[cryptoId][`${currency.toLowerCase()}_24h_change`]
            };
          } else {
            newPriceData[cryptoId] = null;
          }
        } catch (err) {
          console.error(`Error fetching ${cryptoId} price:`, err);
          newPriceData[cryptoId] = null;
        }
      }
      
      setPriceData(newPriceData);
    } catch (err) {
      console.error('Error fetching price data:', err);
      setError('Failed to fetch price data');
    } finally {
      setLoadingStatus('');
    }
  };

  const fetchChartData = async (days: string) => {
    if (selectedCryptos.length === 0) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Create a map to store all price data by timestamp
      const pricesByTimestamp: { [timestamp: number]: { [cryptoId: string]: number } } = {};
      
      // Fetch data for each selected cryptocurrency
      for (let i = 0; i < selectedCryptos.length; i++) {
        const cryptoId = selectedCryptos[i];
        setLoadingStatus(`Fetching ${getCryptoName(cryptoId)} price history...`);
        
        try {
          // Add a delay between requests to avoid rate limiting
          if (i > 0) {
            // Add progressively longer delays between requests
            const delay = 1500 * i;
            console.log(`Waiting ${delay}ms before fetching next crypto chart data`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
          const data = await fetchWithRetry(
            `https://api.coingecko.com/api/v3/coins/${cryptoId}/market_chart?vs_currency=${currency.toLowerCase()}&days=${days}`
          );
          
          if (data && data.prices && Array.isArray(data.prices)) {
            data.prices.forEach(([timestamp, price]: [number, number]) => {
              // Round timestamp to nearest hour to align data points across different cryptos
              const roundedTimestamp = Math.floor(timestamp / 3600000) * 3600000;
              
              if (!pricesByTimestamp[roundedTimestamp]) {
                pricesByTimestamp[roundedTimestamp] = {};
              }
              
              pricesByTimestamp[roundedTimestamp][cryptoId] = Math.round(price * 100) / 100;
            });
          }
        } catch (err) {
          console.error(`Error fetching ${cryptoId} chart data:`, err);
        }
      }
      
      // Convert the map to the chart data format
      const formattedData: ChartData[] = Object.entries(pricesByTimestamp)
        .map(([timestamp, prices]) => {
          const entry: ChartData = {
            date: new Date(parseInt(timestamp)).toISOString(),
            ...prices
          };
          return entry;
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      console.log(`Chart data processed: ${formattedData.length} points`);
      setChartData(formattedData);
      setError(null);
    } catch (err) {
      console.error('Error fetching chart data:', err);
      
      // Keep existing chart data if available
      if (chartData.length === 0) {
        setChartData([]);
      }
    } finally {
      setIsLoading(false);
      setLoadingStatus('');
    }
  };

  // Get config from context
  const { config } = useConfig();

  useEffect(() => {
    console.log(`Currency changed to: ${currency} or selected cryptos changed`);
    
    // Clear error when currency or selected cryptos change
    setError(null);
    
    // Fetch initial data
    fetchPriceData();
    fetchChartData('7');

    // Set up polling for real-time price updates based on config
    let priceInterval: NodeJS.Timeout | null = null;
    
    if (config.autoRefreshEnabled) {
      console.log(`Auto-refresh enabled with interval: ${config.refreshIntervalMs}ms`);
      priceInterval = setInterval(fetchPriceData, config.refreshIntervalMs);
    } else {
      console.log('Auto-refresh disabled');
    }

    return () => {
      if (priceInterval) {
        clearInterval(priceInterval);
      }
    };
  }, [currency, selectedCryptos.join(','), config.autoRefreshEnabled, config.refreshIntervalMs]);

  return {
    priceData,
    chartData,
    isLoading,
    error,
    loadingStatus,
    fetchChartData
  };
};

export default useCryptoPrices;
