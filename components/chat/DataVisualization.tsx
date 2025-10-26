'use client';

import { Card } from '@/components/ui/card';
import { Copy, ExternalLink, Check } from 'lucide-react';
import { useState } from 'react';

interface DataVisualizationProps {
  data: any;
  tool?: string;
}

export function DataVisualization({ data, tool }: DataVisualizationProps) {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  if (!data) return null;

  const renderAddressInfo = () => {
    if (!data || typeof data !== 'object') return null;

    return (
      <Card className="p-4 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <div className="space-y-3">
          {data.hash && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Address:</span>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded">
                  {data.hash.slice(0, 10)}...{data.hash.slice(-8)}
                </code>
                <button
                  onClick={() => copyToClipboard(data.hash, 'address')}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                >
                  {copiedText === 'address' ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-500" />
                  )}
                </button>
              </div>
            </div>
          )}

          {data.coin_balance && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Balance:</span>
              <span className="text-sm font-semibold">
                {(parseFloat(data.coin_balance) / 1e18).toFixed(4)} ETH
              </span>
            </div>
          )}

          {data.transactions_count !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Transactions:</span>
              <span className="text-sm font-semibold">{data.transactions_count}</span>
            </div>
          )}

          {data.token_balances && Array.isArray(data.token_balances) && (
            <div>
              <span className="text-sm text-slate-600 dark:text-slate-400 mb-2 block">
                Token Balances:
              </span>
              <div className="space-y-2">
                {data.token_balances.slice(0, 5).map((token: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 p-2 rounded"
                  >
                    <span className="text-xs font-medium">{token.token?.symbol || 'Unknown'}</span>
                    <span className="text-xs">{token.value || '0'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    );
  };

  const renderTransactions = () => {
    if (!data || !Array.isArray(data.items) || data.items.length === 0) return null;

    return (
      <Card className="p-4 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              <th className="text-left py-2 text-slate-600 dark:text-slate-400">Hash</th>
              <th className="text-left py-2 text-slate-600 dark:text-slate-400">From</th>
              <th className="text-left py-2 text-slate-600 dark:text-slate-400">To</th>
              <th className="text-right py-2 text-slate-600 dark:text-slate-400">Value</th>
            </tr>
          </thead>
          <tbody>
            {data.items.slice(0, 10).map((tx: any, idx: number) => (
              <tr key={idx} className="border-b border-slate-100 dark:border-slate-800">
                <td className="py-2">
                  <code className="text-xs bg-slate-100 dark:bg-slate-900 px-1 rounded">
                    {tx.hash?.slice(0, 8)}...
                  </code>
                </td>
                <td className="py-2">
                  <code className="text-xs">{tx.from?.hash?.slice(0, 8)}...</code>
                </td>
                <td className="py-2">
                  <code className="text-xs">{tx.to?.hash?.slice(0, 8)}...</code>
                </td>
                <td className="py-2 text-right">
                  {tx.value ? (parseFloat(tx.value) / 1e18).toFixed(4) : '0'} ETH
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    );
  };

  const renderTransactionSummary = () => {
    if (!data || typeof data !== 'object') return null;

    return (
      <Card className="p-4 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <div className="space-y-3">
          {data.hash && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Transaction:</span>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded">
                  {data.hash.slice(0, 10)}...{data.hash.slice(-8)}
                </code>
                <button
                  onClick={() => copyToClipboard(data.hash, 'tx')}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                >
                  {copiedText === 'tx' ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-500" />
                  )}
                </button>
              </div>
            </div>
          )}

          {data.status && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Status:</span>
              <span
                className={`text-sm font-semibold ${
                  data.status === 'ok' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {data.status === 'ok' ? 'Success' : 'Failed'}
              </span>
            </div>
          )}

          {data.value && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Value:</span>
              <span className="text-sm font-semibold">
                {(parseFloat(data.value) / 1e18).toFixed(4)} ETH
              </span>
            </div>
          )}

          {data.gas_used && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Gas Used:</span>
              <span className="text-sm">{data.gas_used}</span>
            </div>
          )}

          {data.block_number && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Block:</span>
              <span className="text-sm">{data.block_number}</span>
            </div>
          )}
        </div>
      </Card>
    );
  };

  const renderJSON = () => {
    return (
      <Card className="p-4 bg-slate-900 dark:bg-slate-950 border-slate-700 overflow-x-auto">
        <pre className="text-xs text-green-400 font-mono">
          {JSON.stringify(data, null, 2)}
        </pre>
      </Card>
    );
  };

  switch (tool) {
    case 'get_address_info':
      return renderAddressInfo();
    case 'get_transactions_by_address':
    case 'get_token_transfers_by_address':
      return renderTransactions();
    case 'transaction_summary':
      return renderTransactionSummary();
    default:
      return renderJSON();
  }
}
