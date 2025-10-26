export interface TokenBalance {
  token: {
    address: string;
    name: string;
    symbol: string;
    decimals: string;
    type?: string;
    exchange_rate?: string;
  };
  value: string;
  token_id?: string;
}

export interface TokenHolding {
  name: string;
  symbol: string;
  balance: number;
  value_usd: number;
  percentage: number;
  color: string;
}

export interface PortfolioData {
  total_value_usd: number;
  tokens: TokenHolding[];
  address: string;
  chain_id: string;
}

export interface TransactionSummary {
  hash: string;
  from: string;
  to: string;
  value: string;
  value_usd?: string;
  timestamp: string;
  status: 'success' | 'failed' | 'pending';
  method?: string;
  type?: string;
}

export interface BalanceData {
  address: string;
  balance: string;
  balance_usd?: string;
  token_balances?: TokenBalance[];
}

export interface HistoricalPortfolioPoint {
  timestamp: string;
  value_usd: number;
  date_label: string;
}

export interface VisualizationData {
  category: 'portfolio' | 'balance' | 'transactions' | 'transaction_detail' | 'address_info' | 'general';
  data: PortfolioData | BalanceData | TransactionSummary[] | any;
  metadata?: {
    address?: string;
    chain_id?: string;
    chain_name?: string;
  };
}
