import { Order } from './order';

export interface GroupedOrder {
  symbol: string;
  openPrice: number;
  id: string;
  swap: number;
  openTime: string;
  size: number;
  side: string;
  expanded: boolean;
  orders: Order[];
  profit: number;
}
