import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { WebSocketSubject, webSocket } from 'rxjs/webSocket';
import { map } from 'rxjs/operators';
import { WebSocketResponse } from '../models/web-socket-response';
import { Order } from '../models/order';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private apiUrl = 'https://geeksoft.pl/assets/order-data.json';
  private wsUrl = 'wss://webquotes.geeksoft.pl/websocket/quotes';
  private socket: WebSocketSubject<WebSocketResponse>;

  constructor(private http: HttpClient) {
    this.socket = webSocket<WebSocketResponse>(this.wsUrl);
  }

  getOrders(): Observable<Order[]> {
    return this.http
      .get<{ data: Order[] }>(this.apiUrl)
      .pipe(map((response) => response.data));
  }

  subscribeToQuotes(symbols: string[]): void {
    this.socket.next({
      p: '/subscribe/addlist',
      d: symbols,
    });
  }

  unsubscribeFromQuotes(symbols: string[]): void {
    this.socket.next({
      p: '/subscribe/removelist',
      d: symbols,
    });
  }

  getQuotes(): Observable<WebSocketResponse> {
    return this.socket.asObservable();
  }
}
