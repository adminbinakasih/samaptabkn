'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, getUser } from '@/lib/auth';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    const user = getUser();
    if (!token || !user) {
      router.replace('/login');
      return;
    }
    if (adminOnly && user.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, []);

  return <>{children}</>;
}
