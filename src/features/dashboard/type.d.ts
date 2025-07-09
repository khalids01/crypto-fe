export interface MarketSnapshot {
  id: string;
  openTime: string; // When this 1-minute candle started (formatted as date-time)
  closeTime: string; // When this 1-minute candle ended (formatted as date-time)
  rawJson?: string;
  parsedJson?: string;

  open: number; // Price when the minute started
  high: number; // Highest price during the minute
  low: number; // Lowest price during the minute
  close: number; // Price when the minute ended
  volume: number; // Total BTC traded during the minute
  quoteVolume: number;
  arbitrageId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Arbitrage {
  id: string;
  exchange: string;
  coinSymbol: string;
  createdAt: string;
  updatedAt: string;
  coinDataId: string;
  color: string;
  marketSnapshots: MarketSnapshot[];
}

export interface CoinData {
  id: string;
  symbol: string;
  coinName: string;
  createdAt: string;
  updatedAt: string;
  arbitrages: Arbitrage[];
}

export interface ArbitrageFeedList {
  total: number;
  symbol: string;
  interval: string;
  limit: number;
  data: CoinData;
}
