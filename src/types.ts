export interface Event_Bus_Options {
  url: string;
  maxlen?: number;
}

export interface Publish_Options {}

export interface Subscribe_Options {
  onError?: (err: unknown) => void;
}

export type Event_Handler<T = unknown> = (payload: T) => Promise<void>;

export interface Redis_Message {
  event: string;
  payload: unknown;
  timestamp: number;
}
