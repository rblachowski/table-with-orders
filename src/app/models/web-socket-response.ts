export interface WebSocketResponse {
  d: WebSocketResponseData[] | string[];
  p: string;
}


export interface WebSocketResponseData {
  s: string;
  b: number;
  a: number;
  t: number;
}
