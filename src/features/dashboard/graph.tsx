"use client";
import { useArbitrageFeed } from "./useArbitrageFeed";
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import dayjs from "dayjs";
import calendar from "dayjs/plugin/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { CoinData } from "./type";

dayjs.extend(calendar);

export function Graph({
  coinData,
  isLoading,
}: {
  coinData?: CoinData;
  isLoading: boolean;
}) {
  const [selectedPeriod, setSelectedPeriod] = useState("1D");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([
    "binance",
    "kucoin"
  ]);


  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const platforms = useMemo(() => {
    return (
      coinData?.exchanges
        ?.filter((platform) => selectedPlatforms.includes(platform.exchange))
        ?.map((platform) => ({
          name: platform.exchange,
          color: platform.color,
          data: platform.marketSnapshots,
        })) || []
    );
  }, [coinData?.exchanges, selectedPlatforms]);

  console.log(platforms)

  const calculateYAxisDomain = () => {
    if (!chartData.length) return [0, 100];

    // Get all price values
    const allPrices = chartData
      .flatMap((dataPoint) =>
        selectedPlatforms.map((platform) =>
          Number(dataPoint[`${platform}_price`])
        )
      )
      .filter((price) => !isNaN(price));

    if (allPrices.length === 0) return [0, 100];

    const average = allPrices.reduce((a, b) => a + b, 0) / allPrices.length;
    // ^ 2% of average price
    const range = average * 0.02;
    const min = average - range / 2; // Center the range around the average
    const max = average + range / 2;

    return [min, max];
  };

  const chartData = useMemo(() => {
    if (!platforms.length || !platforms[0]?.data?.length) return [];

    const length = platforms[0].data.length;

    return Array.from({ length }).map((_, index) => {
      const timestamp = new Date(platforms[0].data[index]?.openTime).getTime();
      const time = dayjs(platforms[0].data[index]?.openTime).calendar();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const entry: Record<string, any> = {
        timestamp,
        time,
      };

      platforms.forEach(({ name, data }) => {
        const point = data[index];
        if (point) {
          entry[`${name}_price`] = point.close;
          entry[`${name}_volume`] = point.volume;
        }
      });

      return entry;
    });
  }, [platforms]);

  const formatCurrency = (value: number) => {
    if (value >= 1) return `$${value.toFixed(2)}`;
    return `$${value.toFixed(6).replace(/\.?0+$/, "")}`; // Remove trailing zeros for small numbers
  };

  const periods = ["1D", "7D", "1M", "3M"];

  if (isLoading) {
    return <Skeleton className="h-[400px] w-full" />;
  }

  return (
    <div className="bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Platform Selector */}
        <div className="flex flex-wrap gap-2">
          <h2 className="text-primary p-2 rounded-lg font-bold bg-purple-500">
            {coinData?.coinName}
          </h2>

          {/* {platforms.map((platform) => (
            <Button
              key={platform.name}
              variant={
                selectedPlatforms.includes(platform.name)
                  ? "default"
                  : "outline"
              }
              size="sm"
              onClick={() => togglePlatform(platform.name)}
              className="capitalize"
              style={{
                backgroundColor: selectedPlatforms.includes(platform.name)
                  ? platform.color
                  : "transparent",
                borderColor: platform.color,
                color: selectedPlatforms.includes(platform.name)
                  ? "white"
                  : "currentColor",
              }}
            >
              {platform.name}
            </Button>
          ))} */}
        </div>

        {/* Price Chart */}
        <Card className="bg-background border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-primary">
                Price Chart
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {chartData.length} data points • {selectedPlatforms.length}{" "}
                platform{selectedPlatforms.length !== 1 ? "s" : ""}
              </p>
              {chartData.length > 0 && (
                <p className="text-lg font-semibold text-primary mt-2">
                  {formatCurrency(chartData[chartData.length - 1].price || 0)}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {periods.map((period) => (
                <Button
                  key={period}
                  variant={selectedPeriod === period ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedPeriod(period)}
                >
                  {period}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="1 1"
                    stroke="#334155"
                    horizontal={true}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="time"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    domain={calculateYAxisDomain()}
                    tickFormatter={(value) => formatCurrency(Number(value))}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      borderColor: "#334155",
                      borderRadius: "0.5rem",
                    }}
                    formatter={(value: number, name: string) => [
                      formatCurrency(Number(value)),
                      name.replace("_price", "").charAt(0).toUpperCase() +
                        name.replace("_price", "").slice(1),
                    ]}
                    labelFormatter={(label) => `Time: ${label}`}
                  />
                  {selectedPlatforms.map((platform) => (
                    <Line
                      key={platform}
                      type="monotone"
                      dataKey={`${platform}_price`}
                      name={platform}
                      stroke={
                        coinData?.exchanges?.find(
                          (p) => p.exchange === platform
                        )?.color || "#8884d8"
                      }
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                      isAnimationActive={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Volume Chart
            <div className="h-[100px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="1 1"
                    stroke="#334155"
                    horizontal={true}
                    vertical={false}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    width={40}
                    tickFormatter={(value) => {
                      if (value >= 1000000)
                        return `${(value / 1000000).toFixed(1)}M`;
                      if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                      return value;
                    }}
                  />
                  {selectedPlatforms.map((platform) => (
                    <Line
                      key={`${platform}-volume`}
                      type="monotone"
                      dataKey={`${platform}_volume`}
                      stroke={
                        platformData?.data?.arbitrages?.find(
                          (p) => p.exchange === platform
                        )?.color || "#8884d8"
                      }
                      strokeWidth={1}
                      dot={false}
                      isAnimationActive={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div> */}

            {/* Legend */}
            <div className="flex justify-center gap-6 mt-4">
              {selectedPlatforms.map((platform) => (
                <div
                  key={`legend-${platform}`}
                  className="flex items-center gap-2"
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor:
                        coinData?.exchanges?.find(
                          (p) => p.exchange === platform
                        )?.color || "#8884d8",
                    }}
                  />
                  <span className="text-sm text-slate-400 capitalize">
                    {platform}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
