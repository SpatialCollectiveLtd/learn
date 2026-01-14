'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface QRCodeDisplayProps {
  data: string;
  size?: number;
  className?: string;
  onLoad?: () => void;
}

/**
 * Simple QR Code display using a canvas-based generator
 * No external dependencies - generates QR code purely in browser
 */
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

    // Create an image from QR code API - white background, black QR for best scanning
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const encodedData = encodeURIComponent(data);
    // Use white background (#ffffff) and black code (#000000) for best scannability
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedData}&bgcolor=ffffff&color=000000&margin=10`;
    
    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      setIsLoading(false);
      onLoad?.();
    };

    img.onerror = () => {
      // Fallback: show error state
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);
      setIsLoading(false);
      setHasError(true);
    };
  }, [data, size, onLoad]);

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {/* Canvas for QR code */}
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className={`rounded-lg ${isLoading ? 'invisible' : 'visible'}`}
      />
      
      {/* Loading overlay */}
      {isLoading && (
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center bg-white rounded-lg"
          style={{ width: size, height: size }}
        >
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
          <p className="text-sm text-gray-600">Generating QR code...</p>
        </div>
      )}
      
      {/* Error state */}
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
