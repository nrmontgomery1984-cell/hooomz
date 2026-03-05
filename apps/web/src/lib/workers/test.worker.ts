/// <reference lib="webworker" />

import * as Comlink from 'comlink';

const api = {
  ping(): string {
    return 'pong from worker';
  },
  add(a: number, b: number): number {
    return a + b;
  },
};

Comlink.expose(api);

export type TestWorkerAPI = typeof api;
