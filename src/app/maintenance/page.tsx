'use client';

import React from 'react';
import Image from 'next/image';

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
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

        {/* Icon */}
        <div className="mb-6">
          <svg
            className="w-24 h-24 mx-auto text-red-500 animate-pulse"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>

        {/* Content */}
        <h1 className="text-4xl font-bold text-white mb-4">
          System Maintenance in Progress
        </h1>
        
        <p className="text-gray-400 text-lg mb-8">
          We're currently performing scheduled maintenance to improve your experience. 
          The platform will be back online shortly.
        </p>

        {/* Status Box */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-3 h-3 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-3 h-3 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
          
          <p className="text-white font-semibold mb-2">Estimated Downtime</p>
          <p className="text-gray-400">30 minutes - 2 hours</p>
          
          <div className="mt-6 pt-6 border-t border-gray-800">
            <p className="text-sm text-gray-500">
              Last Updated: {new Date().toLocaleString('en-KE', { 
                timeZone: 'Africa/Nairobi',
                dateStyle: 'medium',
                timeStyle: 'short'
              })}
            </p>
          </div>
        </div>

        {/* What's Being Updated */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 text-left mb-8">
          <h2 className="text-white font-semibold mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
            What We're Working On
          </h2>
          <ul className="text-gray-400 text-sm space-y-2">
            <li className="flex items-start">
              <span className="text-red-500 mr-2">✓</span>
              Database optimization and performance improvements
            </li>
            <li className="flex items-start">
              <span className="text-red-500 mr-2">✓</span>
              Enhanced security features
            </li>
            <li className="flex items-start">
              <span className="text-red-500 mr-2">✓</span>
              New dashboard features for staff
            </li>
            <li className="flex items-start">
              <span className="text-red-500 mr-2">✓</span>
              System stability enhancements
            </li>
          </ul>
        </div>

        {/* Contact Info */}
        <div className="text-gray-400">
          <p className="mb-2">For urgent matters, please contact:</p>
          <p className="text-red-500 font-semibold">info@spatialcollective.co.ke</p>
          <p className="text-sm mt-4 text-gray-500">
            Thank you for your patience and understanding.
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 text-gray-500 text-sm">
          <p>Spatial Collective Learning Platform</p>
          <p className="mt-1">© {new Date().getFullYear()} Spatial Collective Ltd. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
