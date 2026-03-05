import * as Comlink from 'comlink';
import type { TestWorkerAPI } from './test.worker';

export function createTestWorker(): Comlink.Remote<TestWorkerAPI> {
  const worker = new Worker(new URL('./test.worker.ts', import.meta.url), {
    type: 'module',
  });
  return Comlink.wrap<TestWorkerAPI>(worker);
}
