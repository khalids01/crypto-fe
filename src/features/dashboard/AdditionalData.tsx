import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArbitrageOpportunity } from "./type";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export const AdditionalData = ({ data }: { data: ArbitrageOpportunity }) => {
  return (
    <>
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Arbitrage Opportunity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-slate-400">Binance Price:</span>
              <span className="text-white font-semibold">
                {formatCurrency(data?.binancePrice ?? 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">DEX Price:</span>
              <span className="text-white font-semibold">
                {formatCurrency(data?.dexPrice ?? 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Spread:</span>
              <span className="text-green-400 font-semibold">
                {(
                  (data?.priceDifference ?? 0 / data?.binancePrice ?? 0) * 100
                ).toFixed(2)}
                %
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Fees:</span>
              <span className="text-red-400 font-semibold">
                {formatCurrency(data?.fees ?? 0)}
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-600 pt-4">
              <span className="text-slate-400">Net Profit:</span>
              <span className="text-green-400 font-bold text-lg">
                {formatCurrency(data?.netProfit ?? 0)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Trading Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-slate-400">Status:</span>
              <Badge variant={data?.isProfitable ? "default" : "destructive"}>
                {data?.isProfitable ? "Profitable" : "Not Profitable"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Last Updated:</span>
              <span className="text-white text-sm">
                {new Date(data?.timestamp ?? 0).toLocaleTimeString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Pair:</span>
              <span className="text-white font-semibold">{data?.symbol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Market Cap:</span>
              <span className="text-white">$2.4B</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};
