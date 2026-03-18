'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
export default function ContractsRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/production'); }, [router]);
  return null;
}
