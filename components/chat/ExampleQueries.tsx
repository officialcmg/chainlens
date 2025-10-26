'use client';

import { Sparkles } from 'lucide-react';

interface ExampleQueriesProps {
  onSelectQuery: (query: string) => void;
  disabled?: boolean;
}

const EXAMPLE_QUERIES = [
  "What tokens does 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 hold?",
  "Show latest transactions for 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  "Explain transaction 0x5c504ed432cb51138bcf09aa5e8a410dd4a1e204ef84bfed1be16dfba1b22060",
  "What is the latest block on Ethereum?"
];

export function ExampleQueries({ onSelectQuery, disabled }: ExampleQueriesProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-blue-500" />
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Try these examples:
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {EXAMPLE_QUERIES.map((query, index) => (
          <button
            key={index}
            onClick={() => !disabled && onSelectQuery(query)}
            disabled={disabled}
            className="px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {query}
          </button>
        ))}
      </div>
    </div>
  );
}
