'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// NOTE: This is a client component that redirects to /login
// SEO metadata is handled by the login page

export default function SignInPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/login');
  }, [router]);
  return null;
} 