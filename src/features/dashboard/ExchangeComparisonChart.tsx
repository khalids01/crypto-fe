import React, { useEffect, useMemo, useRef } from "react";
import { useArbitrageFeed } from "./useArbitrageFeed";
import { CoinData } from "./type";
import {
  createChart,
  ColorType,
  IChartApi,
  AreaData,
  CandlestickSeries,
  Time,
  CandlestickSeriesPartialOptions,
  CandlestickData,
  SeriesOptionsMap,
  SeriesDefinition,
} from "lightweight-charts";
import dayjs from "dayjs";
import { ArrowDown, ArrowUp } from "lucide-react";

interface ExchangeComparisonChartProps {
  coinId?: string; // This prop is not needed anymore since we get a single coin's data
}

export const ExchangeComparisonChart: React.FC<
  ExchangeComparisonChartProps
> = () => {
  const { arbitrageFeedQuery } = useArbitrageFeed();
  const { data, isLoading, error } = arbitrageFeedQuery;

  // Handle loading and error states first
  if (isLoading) {
    return <div className="p-4 text-center">Loading market data...</div>;
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        Error loading market data: {error.message}
      </div>
    );
  }

  // Check if we have valid data
  if (!data || !data.exchanges || data.exchanges.length === 0) {
    return (
      <div className="p-4 text-center">
        <div>No exchange data available</div>
        <div className="text-sm text-gray-500 mt-2">
          The API returned no exchange data for this coin.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-lg h-full px-4">
      <h2 className="text-xl font-semibold mb-4">
        {data.coinName} ({data.symbol}) Price Comparison
      </h2>

      <div className="w-full h-[calc(100%-40px)]">
        <ChartComponent data={data}></ChartComponent>
      </div>
    </div>
  );
};

type ChartComponentProps = {
  data: CoinData;
  colors?: {
    backgroundColor?: string;
    textColor?: string;
  };
};

const defaultExchangeColors = [
  // [upColor, downColor]
  ["#AF2AE9", "#E70D9F"], // binance: purple, red
  ["#06D6CC", "#FC5F2F"], // kucoin: cyan, orange
  ["#43a047", "#e53935"], // more exchanges...
  ["#f9c846", "#f55c47"],
];

export const ChartComponent: React.FC<ChartComponentProps> = ({
  data,
  colors: { backgroundColor = "black", textColor = "white" } = {},
}) => {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: backgroundColor },
        textColor,
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: true,
        tickMarkFormatter: (
          time: Time,
          tickMarkType: string,
          locale: string
        ) => {
          const date = new Date((time as number) * 1000);
          return date.toLocaleTimeString(locale, {
            hour: "2-digit",
            minute: "2-digit",
          });
        },
      },
      rightPriceScale: {
        borderVisible: false,
      },
    });

    chartRef.current = chart;

    // Dynamically add a candlestick series for each exchange
    data.exchanges.forEach((exchange, idx) => {
      const [upColor, downColor] =
        defaultExchangeColors[idx % defaultExchangeColors.length];

      const candlestickSeries = chart.addSeries(CandlestickSeries, {
        upColor,
        downColor,
        borderVisible: false,
        wickUpColor: upColor,
        wickDownColor: downColor,
      });

      const seriesData: CandlestickData[] = exchange.marketSnapshots.map(
        (snapshot) => ({
          time: Math.floor(dayjs(snapshot.openTime).unix()) as Time,
          open: snapshot.open,
          high: snapshot.high,
          low: snapshot.low,
          close: snapshot.close,
        })
      );

      candlestickSeries.setData(seriesData);
    });

    const handleResize = () => {
      if (chartContainerRef.current && chart) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [data, backgroundColor, textColor]);

  return (
    <>
      <div ref={chartContainerRef} style={{ width: "100%", height: "100%" }} />
      <ul className="flex gap-4 justify-center mt-4">
        {data.exchanges.map((ex, idx) => {
          // Pick colors for this exchange
          const [upColor, downColor] =
            defaultExchangeColors[idx % defaultExchangeColors.length];
          return (
            <li key={ex.id} style={{ display: "flex", alignItems: "center" }}>
              <span
                style={{
                  backgroundColor: upColor,
                  fontWeight: "bold",
                  marginRight: 2,
                }}
              >
                <ArrowUp />
              </span>
              <span
                style={{
                  backgroundColor: downColor,
                  fontWeight: "bold",
                  marginRight: 6,
                }}
              >
                <ArrowDown />
              </span>
              <span style={{ color: upColor, fontWeight: 500 }}>
                {ex.exchange}
              </span>
            </li>
          );
        })}
      </ul>
    </>
  );
};

export default ExchangeComparisonChart;
