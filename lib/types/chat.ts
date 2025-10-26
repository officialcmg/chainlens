export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  data?: any;
  type?: string;
  tool?: string;
}

export interface Chain {
  id: number;
  name: string;
  icon: string;
  color: string;
}

export const SUPPORTED_CHAINS: Chain[] = [
  { id: 1, name: 'Ethereum', icon: '⟠', color: '#627EEA' },
  { id: 42161, name: 'Arbitrum', icon: '◆', color: '#28A0F0' },
  { id: 10, name: 'Optimism', icon: '●', color: '#FF0420' },
  { id: 137, name: 'Polygon', icon: '⬢', color: '#8247E5' },
];

export interface BlockscoutResponse {
  response: string;
  data?: any;
  type?: string;
  tool?: string;
  error?: string;
}
