"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MapperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    // Role-based access control: Only mapper role can access this route
    const youthDataStr = localStorage.getItem('youthData');
    
    if (!youthDataStr) {
      router.push('/');
      return;
    }

    try {
      const youthData = JSON.parse(youthDataStr);
      
      // Check if user is digitization program
      if (youthData.programType !== 'digitization') {
        router.push('/dashboard');
        return;
      }

      // Check if user has mapper role
      if (youthData.moduleAssignment !== 'mapper') {
        console.warn('[MAPPER LAYOUT] Access denied: User is not a mapper');
        // Redirect validators to their training page
        if (youthData.moduleAssignment === 'validator') {
          router.push('/digitization/validator');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (error) {
      console.error('[MAPPER LAYOUT] Error checking role:', error);
      router.push('/');
    }
  }, [router]);

  return <>{children}</>;
}
