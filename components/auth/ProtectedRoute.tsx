'use client';

import { useAuth } from '@/lib/firebase/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedRoute({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const publicPaths = ['/signin'];
  const isPublicPath = publicPaths.includes(pathname);

  useEffect(() => {
    if (!loading && !user && !isPublicPath) {
      router.push('/signin');
    }
  }, [user, loading, router, isPublicPath]);

  if (isPublicPath) return <>{children}</>;

  if (loading) return <p className="text-center mt-10">Loading...</p>;

  if (!user) return null;

  return <>{children}</>;
}
