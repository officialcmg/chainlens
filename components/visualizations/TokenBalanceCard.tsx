'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Coins, TrendingUp, TrendingDown } from 'lucide-react';
import { TokenBalance } from '@/lib/types/visualization';

interface TokenBalanceCardProps {
  token: TokenBalance;
  valueUsd?: number;
  priceChange24h?: number;
}

export function TokenBalanceCard({ token, valueUsd, priceChange24h }: TokenBalanceCardProps) {
  const balance = Number(token.value) / Math.pow(10, Number(token.token.decimals));
  const isPositive = priceChange24h ? priceChange24h > 0 : null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
              <Coins className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-white text-lg">{token.token.name}</CardTitle>
              <CardDescription className="text-slate-400">
                {token.token.symbol}
              </CardDescription>
            </div>
          </div>
          {isPositive !== null && (
            <div className={`flex items-center gap-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isPositive ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">
                {Math.abs(priceChange24h || 0).toFixed(2)}%
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <div className="text-2xl font-bold text-white">
              {balance.toLocaleString(undefined, { maximumFractionDigits: 6 })}
            </div>
            <div className="text-sm text-slate-400">{token.token.symbol}</div>
          </div>
          {valueUsd !== undefined && (
            <div>
              <div className="text-xl font-semibold text-blue-400">
                {formatCurrency(valueUsd)}
              </div>
              <div className="text-xs text-slate-400">USD Value</div>
            </div>
          )}
          <div className="pt-2 border-t border-slate-800">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Token Type</span>
              <span className="text-white">{token.token.type || 'ERC-20'}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
