'use client';

import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle, XCircle, Clock, ExternalLink, Eye } from 'lucide-react';
import { TransactionSummary } from '@/lib/types/visualization';
import { useNotification } from '@blockscout/app-sdk';

interface TransactionCardProps {
  transaction: TransactionSummary;
  currentAddress?: string;
  chainId?: string;
}

export function TransactionCard({ transaction, currentAddress, chainId = '1' }: TransactionCardProps) {
  const { openTxToast } = useNotification();

  const handleViewDetails = async () => {
    try {
      await openTxToast(chainId, transaction.hash);
    } catch (error) {
      console.error('Failed to open transaction toast:', error);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatValue = (value: string) => {
    const ethValue = Number(value) / 1e18;
    return ethValue.toFixed(6);
  };

  const getStatusIcon = () => {
    switch (transaction.status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusColor = () => {
    switch (transaction.status) {
      case 'success':
        return 'bg-green-400/10 text-green-400 border-green-400/20';
      case 'failed':
        return 'bg-red-400/10 text-red-400 border-red-400/20';
      case 'pending':
        return 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20';
      default:
        return 'bg-slate-400/10 text-slate-400 border-slate-400/20';
    }
  };

  const isOutgoing = currentAddress && transaction.from.toLowerCase() === currentAddress.toLowerCase();

  return (
    <Card className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <Badge className={getStatusColor()}>
              {transaction.status.toUpperCase()}
            </Badge>
            {transaction.method && (
              <Badge variant="outline" className="border-slate-700 text-slate-300">
                {transaction.method}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleViewDetails}
              className="text-blue-400 hover:text-blue-300 hover:bg-slate-800"
            >
              <Eye className="w-4 h-4 mr-1" />
              Details
            </Button>
            <a
              href={`https://eth.blockscout.com/tx/${transaction.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors p-2"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`px-2 py-1 rounded text-xs font-medium ${
              isOutgoing ? 'bg-red-400/10 text-red-400' : 'bg-green-400/10 text-green-400'
            }`}>
              {isOutgoing ? 'OUT' : 'IN'}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-400">From</span>
              <code className="text-white bg-slate-800 px-2 py-1 rounded">
                {formatAddress(transaction.from)}
              </code>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <ArrowRight className="w-4 h-4 text-slate-600" />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">To</span>
            <code className="text-white bg-slate-800 px-2 py-1 rounded">
              {formatAddress(transaction.to)}
            </code>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-white">
                {formatValue(transaction.value)} ETH
              </div>
              {transaction.value_usd && (
                <div className="text-sm text-slate-400">
                  ${Number(transaction.value_usd).toLocaleString()}
                </div>
              )}
            </div>
            <div className="text-right text-xs text-slate-400">
              {new Date(transaction.timestamp).toLocaleString()}
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-mono">
          {formatAddress(transaction.hash)}
        </div>
      </CardContent>
    </Card>
  );
}
