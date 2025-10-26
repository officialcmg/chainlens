'use client';

import { Button } from '@/components/ui/button';
import { History } from 'lucide-react';
import { useTransactionPopup } from '@blockscout/app-sdk';

interface TransactionHistoryButtonProps {
  chainId: string;
  address?: string;
  label?: string;
}

export function TransactionHistoryButton({
  chainId,
  address,
  label = 'View Transaction History'
}: TransactionHistoryButtonProps) {
  const { openPopup } = useTransactionPopup();

  const handleClick = () => {
    openPopup({
      chainId,
      address,
    });
  };

  return (
    <Button
      onClick={handleClick}
      variant="outline"
      className="border-slate-700 bg-slate-900/50 text-slate-300 hover:text-white hover:bg-slate-800 hover:border-slate-600"
    >
      <History className="w-4 h-4 mr-2" />
      {label}
    </Button>
  );
}
