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
    
    const youthDataStr = localStorage.getItem('youthData');
    
    if (!youthDataStr) {
      router.push('/');
      return;
    }

    try {
      const youthData = JSON.parse(youthDataStr);
      
      
      if (youthData.programType !== 'digitization') {
        router.push('/dashboard');
        return;
      }

      
      if (youthData.moduleAssignment !== 'validator') {
        
        if (youthData.moduleAssignment === 'mapper') {
          router.push('/digitization/mapper');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (error) {
      
      router.push('/');
    }
  }, [router]);

  return <>{children}</>;
}
