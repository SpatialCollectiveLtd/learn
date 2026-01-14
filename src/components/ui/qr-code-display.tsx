'use client';

import { useEffect, useRef } from 'react';

interface QRCodeDisplayProps {
  data: string;
  size?: number;
  className?: string;
}

/**
 * Simple QR Code display using a canvas-based generator
 * No external dependencies - generates QR code purely in browser
 */
export function QRCodeDisplay({ data, size = 200, className = '' }: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !data) return;
    
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
    };

    img.onerror = () => {
      // Fallback: show text if QR generation fails
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = '#dc2626';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('QR Code Error', size / 2, size / 2);
    };
  }, [data, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={`rounded-lg ${className}`}
    />
  );
}
