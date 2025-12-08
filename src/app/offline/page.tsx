'use client';

import React from 'react';
import Image from 'next/image';

export default function NoInternet() {
  const handleRetry = () => {
    window.location.reload();
  };

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

        {/* Icon */}
        <div className="mb-6">
          <svg
            className="w-24 h-24 mx-auto text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
            />
          </svg>
        </div>

        {/* Content */}
        <h1 className="text-3xl font-bold text-white mb-4">
          No Internet Connection
        </h1>
        
        <p className="text-gray-400 mb-8">
          Unable to connect to Spatial Collective servers. Please check your internet connection and try again.
        </p>

        {/* Retry Button */}
        <button
          onClick={handleRetry}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors mb-6"
        >
          Retry Connection
        </button>

        {/* Troubleshooting Tips */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 text-left">
          <h2 className="text-white font-semibold mb-3 flex items-center">
            <svg className="w-5 h-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Troubleshooting
          </h2>
          <ul className="text-gray-400 text-sm space-y-2">
            <li className="flex items-start">
              <span className="text-red-500 mr-2">•</span>
              Check if your WiFi or mobile data is turned on
            </li>
            <li className="flex items-start">
              <span className="text-red-500 mr-2">•</span>
              Try switching between WiFi and mobile data
            </li>
            <li className="flex items-start">
              <span className="text-red-500 mr-2">•</span>
              Restart your router or modem
            </li>
            <li className="flex items-start">
              <span className="text-red-500 mr-2">•</span>
              Contact your network provider if the issue persists
            </li>
          </ul>
        </div>

        {/* Footer */}
        <div className="mt-8 text-gray-500 text-sm">
          <p>Spatial Collective Learning Platform</p>
          <p className="mt-1">For support: info@spatialcollective.co.ke</p>
        </div>
      </div>
    </div>
  );
}
