"use client";

import { useState, useEffect } from "react";
import { X, AlertCircle } from "lucide-react";

export function OsmUsernameNotification() {
  const [show, setShow] = useState(false);
  const [needsOsmUsername, setNeedsOsmUsername] = useState(false);

  useEffect(() => {
    // Check if youth needs to set OSM username
    const checkOsmUsername = async () => {
      const youthData = localStorage.getItem('youthData');
      if (!youthData) return;

      try {
        const youth = JSON.parse(youthData);
        
        // Check if OSM username is missing
        const token = localStorage.getItem('youthToken');
        if (token) {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/youth/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          const data = await response.json();
          if (data.success && !data.data.osm_username) {
            setNeedsOsmUsername(true);
            
            // Check if notification was dismissed recently
            const dismissed = localStorage.getItem('osm-notification-dismissed');
            const dismissedTime = dismissed ? parseInt(dismissed) : 0;
            const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
            
            // Show notification if not dismissed or if dismissed more than 1 day ago
            if (dismissedTime < oneDayAgo) {
              setTimeout(() => setShow(true), 1000); // Show after 1 second
            }
          }
        }
      } catch (error) {
        console.error('Error checking OSM username:', error);
      }
    };

    checkOsmUsername();
  }, []);

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('osm-notification-dismissed', Date.now().toString());
  };

  const handleGoToTraining = () => {
    localStorage.removeItem('osm-notification-dismissed'); // Clear dismissal when taking action
    window.location.href = '/digitization/mapper/2';
  };

  if (!needsOsmUsername || !show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md animate-slide-up">
      <div className="bg-gradient-to-r from-[#dc2626] to-[#ef4444] rounded-lg shadow-2xl border border-[#dc2626]/50 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-4 pb-3">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-heading font-bold text-lg mb-1">
                Action Required: OSM Username
              </h3>
              <p className="text-white/90 text-sm leading-relaxed">
                Your OpenStreetMap username was not verified. Please update it to continue your training.
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white/80 hover:text-white transition-colors ml-2"
            aria-label="Dismiss notification"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 pb-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-md p-3 mb-3">
            <p className="text-white/95 text-xs mb-2">
              <strong>How to find your OSM username:</strong>
            </p>
            <ol className="text-white/80 text-xs space-y-1 list-decimal list-inside">
              <li>Go to openstreetmap.org and login</li>
              <li>Click "My Profile" (top right)</li>
              <li>Copy the <strong className="text-white">last part of the URL</strong></li>
              <li>Example: openstreetmap.org/user/<span className="text-[#22c55e] font-semibold">YourUsername</span></li>
            </ol>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleGoToTraining}
              className="flex-1 px-4 py-2.5 bg-white text-[#dc2626] rounded-md font-semibold text-sm hover:bg-white/90 transition-colors"
            >
              Update Username Now
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2.5 bg-white/20 text-white rounded-md font-medium text-sm hover:bg-white/30 transition-colors"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
