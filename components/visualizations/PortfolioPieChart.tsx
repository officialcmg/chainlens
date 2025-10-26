'use client';

import { Pie, PieChart, Cell, Legend, Tooltip } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { TokenHolding } from '@/lib/types/visualization';
import { Wallet } from 'lucide-react';

interface PortfolioPieChartProps {
  tokens: TokenHolding[];
  totalValue: number;
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export function PortfolioPieChart({ tokens, totalValue }: PortfolioPieChartProps) {
  const chartData = tokens.slice(0, 5).map((token, index) => ({
    name: token.symbol,
    value: token.value_usd,
    percentage: token.percentage,
    fill: COLORS[index % COLORS.length],
  }));

  const chartConfig = tokens.slice(0, 5).reduce((acc, token, index) => {
    acc[token.symbol] = {
      label: token.symbol,
      color: COLORS[index % COLORS.length],
    };
    return acc;
  }, {} as ChartConfig);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <Card className="flex flex-col bg-slate-900/50 border-slate-800">
      <CardHeader className="items-center pb-4">
        <div className="flex items-center gap-2 mb-2">
          <Wallet className="w-5 h-5 text-blue-400" />
          <CardTitle className="text-white">Portfolio Distribution</CardTitle>
        </div>
        <CardDescription className="text-slate-400">
          Top 5 tokens by value
        </CardDescription>
        <div className="mt-2 text-center">
          <div className="text-3xl font-bold text-white">
            {formatCurrency(totalValue)}
          </div>
          <div className="text-sm text-slate-400">Total Portfolio Value</div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[300px]"
        >
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value, name) => (
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold">{name}</span>
                      <span>{formatCurrency(Number(value))}</span>
                      <span className="text-xs text-slate-400">
                        {chartData.find((d) => d.name === name)?.percentage.toFixed(2)}%
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              label={({ percentage }) => `${percentage.toFixed(1)}%`}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>

        <div className="mt-4 space-y-2">
          {tokens.slice(0, 5).map((token, index) => (
            <div
              key={token.symbol}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-white font-medium">{token.symbol}</span>
              </div>
              <div className="text-right">
                <div className="text-white">{formatCurrency(token.value_usd)}</div>
                <div className="text-xs text-slate-400">
                  {token.balance.toLocaleString()} {token.symbol}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
