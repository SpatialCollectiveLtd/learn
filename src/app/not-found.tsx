'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <div className="relative w-32 h-32">
            <Image
              src="/spatial-collective-logo.jpg"
              alt="Spatial Collective"
              fill
              className="object-contain rounded-full"
            />
          </div>
        </div>

        {/* 404 Number */}
        <div className="mb-6">
          <h1 className="text-9xl font-bold text-red-600">404</h1>
        </div>

        {/* Content */}
        <h2 className="text-3xl font-bold text-white mb-4">
          Page Not Found
        </h2>
        
        <p className="text-gray-400 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            href="/"
            className="block bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
          >
            Go to Homepage
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="block w-full bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>

        {/* Quick Links */}
        <div className="mt-12 bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h3 className="text-white font-semibold mb-4">Quick Links</h3>
          <div className="space-y-2 text-sm">
            <Link href="/" className="block text-red-500 hover:text-red-400 transition-colors">
              Youth Login
            </Link>
            <Link href="/digitization" className="block text-red-500 hover:text-red-400 transition-colors">
              Digitization Training
            </Link>
            <Link href="/dashboard/staff" className="block text-red-500 hover:text-red-400 transition-colors">
              Staff Portal
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-gray-500 text-sm">
          <p>Spatial Collective Learning Platform</p>
          <p className="mt-1">Need help? Contact: info@spatialcollective.co.ke</p>
        </div>
      </div>
    </div>
  );
}
