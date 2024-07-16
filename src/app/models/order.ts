export interface Order {
  openTime: number;
  openPrice: number;
  swap: number;
  closePrice: number;
  id: number;
  symbol: string;
  side: 'BUY' | 'SELL';
  size: number;
}