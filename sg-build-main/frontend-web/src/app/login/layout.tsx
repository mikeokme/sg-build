'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  useEffect(() => {
    if (localStorage.getItem('token')) window.location.href = '/';
  }, []);
  return children;
}
