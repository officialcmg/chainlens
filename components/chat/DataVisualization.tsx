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
    // Handle the actual API structure where data.data is the array
    const items = Array.isArray(data.data) ? data.data : (data.data?.items || data.items || null);
    if (!items || !Array.isArray(items)) return null;

    // Map the API response structure to our TokenBalance type
    const tokenBalances: TokenBalance[] = items.map((item: any) => ({
      token: {
        address: item.address,
        name: item.name,
        symbol: item.symbol,
        decimals: item.decimals,
        type: 'ERC-20',
        exchange_rate: item.exchange_rate
      },
      value: item.balance
    })).filter((item: any) => item.value);

    if (tokenBalances.length === 0) return null;

    let totalValueUsd = 0;
    const tokenHoldings: TokenHolding[] = tokenBalances.map((tb, index) => {
      const balance = Number(tb.value) / Math.pow(10, Number(tb.token.decimals));
      const exchangeRate = tb.token.exchange_rate ? parseFloat(tb.token.exchange_rate) : 0;
      const valueUsd = balance * exchangeRate;
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

    // Filter holdings with meaningful balances - be more lenient with the threshold
    const validHoldings = tokenHoldings.filter(th => th.balance > 0.000001);

    // Calculate percentages based on USD value if available, otherwise by count
    if (totalValueUsd > 0.01) {
      validHoldings.forEach(th => {
        th.percentage = (th.value_usd / totalValueUsd) * 100;
      });
      validHoldings.sort((a, b) => b.value_usd - a.value_usd);
    } else {
      // No USD values available - distribute evenly for visualization
      const equalPercentage = 100 / validHoldings.length;
      validHoldings.forEach(th => {
        th.percentage = equalPercentage;
      });
      validHoldings.sort((a, b) => b.balance - a.balance);
    }

    if (validHoldings.length === 0) return null;

    return (
      <div className="space-y-4">
        {totalValueUsd > 0.01 ? (
          <PortfolioPieChart tokens={validHoldings} totalValue={totalValueUsd} />
        ) : (
          <Card className="p-6 bg-slate-900/50 border-slate-800">
            <div className="text-center">
              <p className="text-slate-300 mb-2">Portfolio Tokens Detected</p>
              <p className="text-slate-400 text-sm">USD values not available for price visualization</p>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {validHoldings.slice(0, 6).map((holding, index) => {
            const token = tokenBalances.find(t => t.token.symbol === holding.symbol);
            if (!token) return null;
            return (
              <TokenBalanceCard
                key={index}
                token={token}
                valueUsd={holding.value_usd > 0.01 ? holding.value_usd : undefined}
              />
            );
          })}
        </div>
      </div>
    );
  };

  const renderTransactions = () => {
    const items = data.data?.items || data.items || (Array.isArray(data.data) ? data.data : null);
    if (!items || !Array.isArray(items) || items.length === 0) return null;

    const transactionsWithSummaries = items.slice(0, 10).map((tx: any) => {
      let status: 'success' | 'failed' | 'pending' = 'pending';
      if (tx.result === 'success' || tx.status === 'ok' || tx.status === '0x1') {
        status = 'success';
      } else if (tx.result === 'error' || tx.status === '0x0') {
        status = 'failed';
      }
      
      return {
        transaction: {
          hash: tx.hash || '',
          from: tx.from?.hash || tx.from_address || tx.from || '',
          to: tx.to?.hash || tx.to_address || tx.to || '',
          value: tx.value || '0',
          value_usd: tx.exchange_rate ? (Number(tx.value) / 1e18 * Number(tx.exchange_rate)).toFixed(2) : undefined,
          timestamp: tx.timestamp || new Date().toISOString(),
          status,
          method: tx.method || undefined,
          type: tx.type || undefined,
        },
        aiSummary: tx.aiSummary || undefined,
      };
    });

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
    const items = data.data?.items || data.items || (Array.isArray(data.data) ? data.data : null);
    if (!items || !Array.isArray(items) || items.length === 0) return null;

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

  const renderSingleTransaction = () => {
    const tx = data.data || data;
    if (!tx || !tx.hash) return null;

    let status: 'success' | 'failed' | 'pending' = 'pending';
    if (tx.result === 'success' || tx.status === 'ok' || tx.status === '0x1') {
      status = 'success';
    } else if (tx.result === 'error' || tx.status === '0x0') {
      status = 'failed';
    }

    const transaction: TransactionSummary = {
      hash: tx.hash || '',
      from: tx.from?.hash || tx.from_address || tx.from || '',
      to: tx.to?.hash || tx.to_address || tx.to || '',
      value: tx.value || '0',
      value_usd: undefined,
      timestamp: tx.timestamp || new Date().toISOString(),
      status,
      method: tx.method || undefined,
      type: tx.type || undefined,
    };

    return (
      <div className="grid grid-cols-1 gap-4">
        <TransactionCard
          transaction={transaction}
          chainId="1"
          aiSummary={tx.aiSummary}
        />
      </div>
    );
  };

  switch (tool) {
    case 'get_tokens_by_address':
      return renderPortfolio();
    case 'get_transactions_by_address':
      return renderTransactions();
    case 'get_transaction_info':
      return renderSingleTransaction();
    case 'get_token_transfers_by_address':
      return renderTokenTransfers();
    default:
      if (category === 'portfolio') return renderPortfolio();
      if (category === 'transactions') return renderTransactions();
      return renderJSON();
  }
}
