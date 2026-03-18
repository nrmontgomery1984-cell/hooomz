'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
export default function EstimatesRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/estimates'); }, [router]);
  return null;
}
