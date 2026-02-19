'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface QRCodeDisplayProps {
  data: string;
  size?: number;
  className?: string;
  onLoad?: () => void;
}


export function QRCodeDisplay({ data, size = 200, className = '', onLoad }: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || !data) return;
    
    setIsLoading(true);
    setHasError(false);
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const encodedData = encodeURIComponent(data);
    
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedData}&format=png`;
    
    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      setIsLoading(false);
      onLoad?.();
    };

    img.onerror = () => {
      
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);
      setIsLoading(false);
      setHasError(true);
    };
  }, [data, size, onLoad]);

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className={`rounded-lg ${isLoading ? 'invisible' : 'visible'}`}
      />
      
      {isLoading && (
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center bg-white rounded-lg"
          style={{ width: size, height: size }}
        >
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
          <p className="text-sm text-gray-600">Generating QR code...</p>
        </div>
      )}
      
      {}
      {hasError && !isLoading && (
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center bg-white rounded-lg"
          style={{ width: size, height: size }}
        >
          <p className="text-sm text-red-600 font-medium">QR Code Error</p>
          <p className="text-xs text-gray-500 mt-1">Please refresh and try again</p>
        </div>
      )}
    </div>
  );
}
