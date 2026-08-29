"use client";

import { useEffect, useRef } from "react";

interface GPSTrackerProps {
  batchPublicId: string;
}

export default function GPSTracker({ batchPublicId }: GPSTrackerProps) {
  const hasTracked = useRef(false);

  useEffect(() => {
    // Check if this user has already visited this batch recently (within 24 hours)
    const visitKey = `traceeye_visit_${batchPublicId}`;
    const lastVisit = localStorage.getItem(visitKey);
    
    if (lastVisit) {
      const lastVisitTime = parseInt(lastVisit);
      const currentTime = Date.now();
      const hoursSinceLastVisit = (currentTime - lastVisitTime) / (1000 * 60 * 60);
      
      // If visited within last 24 hours, don't track again
      if (hoursSinceLastVisit < 24) {
        console.log(`Already visited ${batchPublicId} ${hoursSinceLastVisit.toFixed(1)} hours ago, skipping tracking`);
        return;
      }
    }

    // Prevent duplicate tracking within same page load
    if (hasTracked.current) {
      return;
    }
    hasTracked.current = true;

    const trackVisit = async () => {
      try {
        // Get GPS location
        if (!navigator.geolocation) {
          console.log("Geolocation not supported");
          return;
        }

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            
            console.log("GPS Position captured:", { latitude, longitude, accuracy });
            
            // Get location name using reverse geocoding with more specific parameters
            let locationName = null;
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
                {
                  headers: {
                    'User-Agent': 'TraceEye-Food-Tracking'
                  }
                }
              );
              const data = await response.json();
              
              // Try to get a more specific location name
              if (data.address) {
                const parts = [];
                if (data.address.city || data.address.town || data.address.village) {
                  parts.push(data.address.city || data.address.town || data.address.village);
                }
                if (data.address.state) {
                  parts.push(data.address.state);
                }
                if (data.address.country) {
                  parts.push(data.address.country);
                }
                locationName = parts.join(', ') || data.display_name;
              } else {
                locationName = data.display_name;
              }
              
              console.log("Reverse geocoded location:", locationName);
            } catch (error) {
              console.log("Reverse geocoding failed:", error);
            }

            // Send visit data to API
            await fetch("/api/card-visits", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                batch_public_id: batchPublicId,
                latitude,
                longitude,
                location_name: locationName,
                device_info: navigator.userAgent,
              }),
            });

            // Mark this batch as visited in localStorage
            localStorage.setItem(visitKey, Date.now().toString());
          },
          (error) => {
            console.log("GPS permission denied or error:", error);
            // Still record visit without GPS if permission denied
            fetch("/api/card-visits", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                batch_public_id: batchPublicId,
                latitude: 0,
                longitude: 0,
                location_name: "Location not available",
                device_info: navigator.userAgent,
              }),
            }).catch(console.error);
            
            // Still mark as visited even without GPS
            localStorage.setItem(visitKey, Date.now().toString());
          },
          { 
            enableHighAccuracy: true, 
            timeout: 15000, 
            maximumAge: 0
          }
        );
      } catch (error) {
        console.error("GPS tracking error:", error);
      }
    };

    trackVisit();
  }, [batchPublicId]);

  return null; // This component doesn't render anything
}
