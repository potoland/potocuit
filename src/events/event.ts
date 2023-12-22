import type { PotoClient, WorkerClient } from "../client";
import type { PotocuitEvents } from "./hooks";

export interface DeclareEventsOptions {
  name: `${keyof PotocuitEvents}`;
  once?: boolean;
}
export type PotoNameEvents = Extract<keyof PotocuitEvents, string>;

export interface PotocuitDataEvent {
  name: PotoNameEvents;
  once: boolean;
}

export interface IClientEvents {
  client: PotoClient;
  worker: WorkerClient;
}

export type Handler<T extends PotoClient | WorkerClient> = {
  [K in keyof PotocuitEvents]: (...data: [PotocuitEvents[K], T, number]) => unknown;
};
export type EventContext<K extends keyof IClientEvents, T extends { data: { name: PotoNameEvents } }> = Parameters<
  Handler<IClientEvents[K]>[T["data"]["name"]]
>;
export interface PotocuitEvent {
  data: PotocuitDataEvent;
  run(...args: EventContext<"client", any>): any;
}
