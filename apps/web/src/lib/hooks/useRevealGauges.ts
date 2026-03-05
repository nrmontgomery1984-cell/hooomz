'use client';

import { useContext } from 'react';
import { RevealGaugeContext } from '../contexts/RevealGaugeContext';

export function useRevealGauges() {
  return useContext(RevealGaugeContext);
}
