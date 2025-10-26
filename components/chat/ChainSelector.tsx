'use client';

import { SUPPORTED_CHAINS, Chain } from '@/lib/types/chat';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ChainSelectorProps {
  selectedChainId: number;
  onSelectChain: (chainId: number) => void;
}

export function ChainSelector({ selectedChainId, onSelectChain }: ChainSelectorProps) {
  const selectedChain = SUPPORTED_CHAINS.find((c) => c.id === selectedChainId);

  return (
    <Select
      value={selectedChainId.toString()}
      onValueChange={(value) => onSelectChain(parseInt(value))}
    >
      <SelectTrigger className="w-[180px] bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700">
        <SelectValue>
          <div className="flex items-center gap-2">
            <span style={{ color: selectedChain?.color }}>{selectedChain?.icon}</span>
            <span>{selectedChain?.name}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {SUPPORTED_CHAINS.map((chain) => (
          <SelectItem key={chain.id} value={chain.id.toString()}>
            <div className="flex items-center gap-2">
              <span style={{ color: chain.color }}>{chain.icon}</span>
              <span>{chain.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
