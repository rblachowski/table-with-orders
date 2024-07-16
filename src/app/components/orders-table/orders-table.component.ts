import { Component, OnInit, OnDestroy } from '@angular/core';
import { reduce, Subscription } from 'rxjs';
import { OrderService } from 'src/app/services/order.service';
import { Order } from 'src/app/models/order';
import { WebSocketResponseData } from 'src/app/models/web-socket-response';
import { GroupedOrder } from 'src/app/models/grouped-order';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-orders-table',
  templateUrl: './orders-table.component.html',
  styleUrls: ['./orders-table.component.scss'],
})
export class OrdersTableComponent implements OnInit, OnDestroy {
  groupedOrders: { [key: string]: GroupedOrder } = {};
  quoteSubscription: Subscription | null = null;
  rowNames: string[] = [];
  listSymbols: string[] = [];

  constructor(
    private orderService: OrderService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.orderService.getOrders().subscribe((orders: Order[]) => {
      orders.forEach((order) => {
        if (!this.listSymbols.includes(order.symbol)) {
          this.listSymbols.push(order.symbol);
        }
      });
      this.groupOrders(orders);
      this.setRownames(orders);
      this.orderService.subscribeToQuotes(this.listSymbols);
    });

    this.quoteSubscription = this.orderService
      .getQuotes()
      .subscribe((quoteData) => {
        quoteData.d?.forEach((quote) => {
          this.updateOrderPrices(<WebSocketResponseData>quote);
        });
      });
  }

  ngOnDestroy() {
    this.orderService.unsubscribeFromQuotes(this.listSymbols);
    (<Subscription>this.quoteSubscription).unsubscribe();
  }

  groupOrders(orders: Order[]) {
    orders.forEach((order) => {
      if (!this.groupedOrders[order.symbol]) {
        this.groupedOrders[order.symbol] = {
          symbol: order.symbol,
          size: 0,
          side: '',
          id: '',
          openTime: '',
          openPrice: 0,
          swap: 0,
          profit: 0,
          expanded: false,
          orders: [],
        };
      }

      const group = this.groupedOrders[order.symbol];

      group.size += order.size;
      group.id = '';
      group.openPrice += order.openPrice;
      group.swap += order.swap;
      group.profit += this.calculateProfit(order);
      order.symbol = '';
      group.orders.push(order);
    });
  }

  setRownames(orders: Order[]) {
    const order = orders[0];
    this.rowNames = Object.keys(order);
  }

  updateOrderPrices(quote: WebSocketResponseData): void {
    const group = this.groupedOrders[quote.s];

    if (group) {
      group.orders.forEach((order) => {
        order.closePrice = quote.a;
      });
      group.profit = group.orders.reduce((sum, order) => {
        return sum + this.calculateProfit(order);
      }, 0);
    }
  }

  toggleGroup(symbol: string) {
    this.groupedOrders[symbol].expanded = !this.groupedOrders[symbol].expanded;
  }

  deleteGroup(symbol: string) {
    const orderIds = this.groupedOrders[symbol].orders
      .map((order) => order.id)
      .join(', ');
    delete this.groupedOrders[symbol];
    this.snackBar.open(`Closed orders no ${orderIds}`, 'Close', {
      duration: 2000,
    });
  }

  objectKeys(obj: any) {
    return Object.keys(obj);
  }

  deleteOrder(orderId: number, symbol: string) {
    const group = this.groupedOrders[symbol];
    if (group) {
      const orderIndex = group.orders.findIndex(
        (order) => order.id === orderId
      );
      if (orderIndex > -1) {
        const order = group.orders[orderIndex];
        group.size += order.size;
        group.openPrice += order.openPrice;
        group.swap += order.swap;
        group.profit = this.calculateProfit(order);
        group.orders.splice(orderIndex, 1);
        if (group.orders.length === 0) {
          this.deleteGroup(symbol);
        }

        this.snackBar.open(`Closed order no ${orderId}`, 'Close', {
          duration: 2000,
        });
      }
    }
  }

  calculateProfit(order: Order): number {
    const multiplier =
      order.symbol === 'BTCUSD'
        ? Math.pow(10, 2)
        : order.symbol === 'ETHUSD'
        ? Math.pow(10, 3)
        : Math.pow(10, 1);
    const sideMultiplier = order.side === 'BUY' ? 1 : -1;
    return (
      ((order.closePrice - order.openPrice) * multiplier * sideMultiplier) / 100
    );
  }
}
