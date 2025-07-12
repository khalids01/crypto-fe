import React, { useEffect, useMemo, useRef } from "react";
import { useArbitrageFeed } from "./useArbitrageFeed";
import { CoinData } from "./type";
import {
  createChart,
  ColorType,
  IChartApi,
  AreaData,
  CandlestickSeries,
} from "lightweight-charts";
import dayjs from "dayjs";

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

export const ChartComponent: React.FC<ChartComponentProps> = ({
  data,
  colors: { backgroundColor = "black", textColor = "white" } = {},
}) => {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);

  const candleData = useMemo(
    () =>
      data.exchanges[0].marketSnapshots.map((snapshot) => ({
        time: dayjs(snapshot.openTime).format("YYYY-MM-DD"),
        openTime: snapshot.openTime,
        closeTime: snapshot.closeTime,
        open: snapshot.open,
        high: snapshot.high,
        low: snapshot.low,
        close: snapshot.close,
      })),
    [data]
  );

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: backgroundColor },
        textColor,
      },
      width: chartContainerRef.current.clientWidth,
      height: 300,
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false },
      },
      timeScale: {
        borderVisible: false,
      },
      rightPriceScale: {
        borderVisible: false,
      },
    });

    chartRef.current = chart;

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderVisible: false,
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });
    console.log(candleData)
    candlestickSeries.setData(candleData);

    chart.applyOptions({
      timeScale: { timeVisible: true },
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
  }, [backgroundColor, textColor]);

  return (
    <div ref={chartContainerRef} style={{ width: "100%", height: "100%" }} />
  );
};

export default ExchangeComparisonChart;
