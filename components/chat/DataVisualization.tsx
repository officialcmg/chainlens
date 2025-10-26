'use client';

import { Card } from '@/components/ui/card';
import { PortfolioPieChart } from '@/components/visualizations/PortfolioPieChart';
import { TokenBalanceCard } from '@/components/visualizations/TokenBalanceCard';
import { TransactionCard } from '@/components/visualizations/TransactionCard';
import { TokenHolding, TokenBalance, TransactionSummary } from '@/lib/types/visualization';

interface DataVisualizationProps {
  data: any;
  tool?: string;
  category?: string;
}

export function DataVisualization({ data, tool, category }: DataVisualizationProps) {
  if (!data) return null;

  const renderPortfolio = () => {
    const items = data.items || data;
    if (!Array.isArray(items)) return null;

    const tokenBalances: TokenBalance[] = items.filter((item: any) => item.token && item.value);

    if (tokenBalances.length === 0) return null;

    let totalValueUsd = 0;
    const tokenHoldings: TokenHolding[] = tokenBalances.map((tb, index) => {
      const balance = Number(tb.value) / Math.pow(10, Number(tb.token.decimals));
      const valueUsd = Number(tb.value) || 0;
      totalValueUsd += valueUsd;

      return {
        name: tb.token.name,
        symbol: tb.token.symbol,
        balance,
        value_usd: valueUsd,
        percentage: 0,
        color: '',
      };
    });

    tokenHoldings.forEach(th => {
      th.percentage = totalValueUsd > 0 ? (th.value_usd / totalValueUsd) * 100 : 0;
    });

    tokenHoldings.sort((a, b) => b.value_usd - a.value_usd);

    return (
      <div className="space-y-4">
        <PortfolioPieChart tokens={tokenHoldings} totalValue={totalValueUsd} />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tokenBalances.slice(0, 6).map((token, index) => {
            const holding = tokenHoldings.find(h => h.symbol === token.token.symbol);
            return (
              <TokenBalanceCard
                key={index}
                token={token}
                valueUsd={holding?.value_usd}
              />
            );
          })}
        </div>
      </div>
    );
  };

  const renderTransactions = () => {
    const items = data.items || data;
    if (!Array.isArray(items) || items.length === 0) return null;

    const transactionsWithSummaries = items.slice(0, 10).map((tx: any) => ({
      transaction: {
        hash: tx.hash || '',
        from: tx.from?.hash || tx.from || '',
        to: tx.to?.hash || tx.to || '',
        value: tx.value || '0',
        value_usd: tx.exchange_rate ? (Number(tx.value) / 1e18 * Number(tx.exchange_rate)).toFixed(2) : undefined,
        timestamp: tx.timestamp || new Date().toISOString(),
        status: tx.status === 'ok' ? 'success' : tx.status || 'pending',
        method: tx.method || undefined,
        type: tx.type || undefined,
      },
      aiSummary: tx.aiSummary || undefined,
    }));

    return (
      <div className="grid grid-cols-1 gap-4">
        {transactionsWithSummaries.map((item, index) => (
          <TransactionCard
            key={index}
            transaction={item.transaction}
            chainId="1"
            aiSummary={item.aiSummary}
          />
        ))}
      </div>
    );
  };

  const renderTokenTransfers = () => {
    const items = data.items || data;
    if (!Array.isArray(items) || items.length === 0) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.slice(0, 8).map((transfer: any, index: number) => {
          if (!transfer.token) return null;

          const tokenBalance: TokenBalance = {
            token: {
              address: transfer.token.address || '',
              name: transfer.token.name || 'Unknown',
              symbol: transfer.token.symbol || '???',
              decimals: transfer.token.decimals || '18',
              type: transfer.token.type || 'ERC-20',
            },
            value: transfer.total?.value || transfer.value || '0',
          };

          return (
            <TokenBalanceCard
              key={index}
              token={tokenBalance}
              valueUsd={transfer.total?.value ? Number(transfer.total.value) : undefined}
            />
          );
        })}
      </div>
    );
  };

  const renderJSON = () => {
    return (
      <Card className="p-4 bg-slate-900/50 border-slate-800 overflow-x-auto max-h-96">
        <pre className="text-xs text-green-400 font-mono">
          {JSON.stringify(data, null, 2)}
        </pre>
      </Card>
    );
  };

  switch (tool) {
    case 'get_tokens_by_address':
      return renderPortfolio();
    case 'get_transactions_by_address':
      return renderTransactions();
    case 'get_token_transfers_by_address':
      return renderTokenTransfers();
    default:
      if (category === 'portfolio') return renderPortfolio();
      if (category === 'transactions') return renderTransactions();
      return renderJSON();
  }
}
