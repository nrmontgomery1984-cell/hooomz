'use client';

import { useEffect, useState } from 'react';
import { createTestWorker } from '@/lib/workers/createWorker';

export default function WorkerSpikePage() {
  const [result, setResult] = useState<string>('Testing web worker…');

  useEffect(() => {
    async function test() {
      try {
        const worker = createTestWorker();
        const ping = await worker.ping();
        const sum = await worker.add(2, 3);
        setResult(`✓ ping: "${ping}", 2+3=${sum}`);
      } catch (e) {
        setResult(`✗ ERROR: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
    test();
  }, []);

  return (
    <div style={{ padding: 40, fontFamily: 'monospace', fontSize: 14 }}>
      <div style={{ marginBottom: 8, fontWeight: 700 }}>Worker Spike Test</div>
      <div>{result}</div>
    </div>
  );
}
