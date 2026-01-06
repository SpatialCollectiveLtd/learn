"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ValidatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    // Role-based access control: Only validator role can access this route
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

      // Check if user has validator role
      if (youthData.moduleAssignment !== 'validator') {
        console.warn('[VALIDATOR LAYOUT] Access denied: User is not a validator');
        // Redirect mappers to their training page
        if (youthData.moduleAssignment === 'mapper') {
          router.push('/digitization/mapper');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (error) {
      console.error('[VALIDATOR LAYOUT] Error checking role:', error);
      router.push('/');
    }
  }, [router]);

  return <>{children}</>;
}
