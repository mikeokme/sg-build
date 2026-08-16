'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  useEffect(() => {
    if (localStorage.getItem('token')) window.location.href = '/';
  }, []);
  return children;
}
