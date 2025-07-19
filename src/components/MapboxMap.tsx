import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Venue } from '@/hooks/useVenues';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { MapPin, Settings } from 'lucide-react';

interface MapboxMapProps {
  venues: Venue[];
  selectedVenue?: Venue;
  showPrices?: boolean;
  onBoundsChange?: (bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }) => void;
  height?: string;
}

const MapboxMap = ({ venues, selectedVenue, showPrices = false, onBoundsChange, height = 'h-full' }: MapboxMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [isDestroyed, setIsDestroyed] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Your Mapbox public token - verified working token
  const MAPBOX_TOKEN = 'pk.eyJ1IjoiZGFqYXZzaG5lIiwiYSI6ImNtZGE2eDE1eTBmMHEyd3F0b2g5MWsyeWwifQ.q8WNX31_PENI10UD6DD6Ig';

  // Helper function to generate coordinates in Georgia (country)
  const getVenueCoordinates = (location: string) => {
    const hash = location.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    // Georgia coordinates: Latitude 42.3154, Longitude 43.3569 (Tbilisi center)
    return {
      lat: 41.7151 + (hash % 1000) / 5000, // Around Georgia area (41.7 - 42.0)
      lng: 44.7371 + (hash % 2000) / 10000 // Around Georgia area (44.7 - 45.0)
    };
  };

  // Initialize map
  const initializeMap = () => {
    if (!mapContainer.current || map.current || isDestroyed) {
      console.log('Map initialization skipped:', {
        hasContainer: !!mapContainer.current,
        hasMap: !!map.current,
        isDestroyed
      });
      return;
    }

    console.log('Initializing Mapbox map...');

    try {
      // Ensure Mapbox token is set BEFORE creating map
      if (!MAPBOX_TOKEN) {
        throw new Error('Mapbox token is missing');
      }
      
      mapboxgl.accessToken = MAPBOX_TOKEN;
      console.log('Mapbox token set successfully');
      
      // Create the map instance centered on Tbilisi, Georgia
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12', // Use streets style for better visibility
        center: [44.7937, 41.7151], // Tbilisi, Georgia coordinates
        zoom: 12,
        pitch: 0,
        bearing: 0,
        attributionControl: false, // Remove attribution for cleaner look
      });

      console.log('Map instance created successfully');

      // Add error handler first
      map.current.on('error', (e) => {
        console.error('Mapbox error:', e);
        setMapError(`Map loading error: ${e.error?.message || 'Failed to load map tiles'}`);
      });

      // Add load handler
      map.current.on('load', () => {
        console.log('Map loaded successfully');
        setMapInitialized(true);
        setMapError(null);
        setIsDestroyed(false); // Ensure we're not in destroyed state
      });

      // Add style load handler
      map.current.on('style.load', () => {
        console.log('Map style loaded successfully');
      });

      // Add navigation controls
      map.current.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: false,
        }),
        'top-right'
      );

      // Add fullscreen control
      map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

      // Handle map move events for bounds change
      if (onBoundsChange) {
        map.current.on('moveend', () => {
          if (!map.current) return;
          const bounds = map.current.getBounds();
          onBoundsChange({
            north: bounds.getNorth(),
            south: bounds.getSouth(),
            east: bounds.getEast(),
            west: bounds.getWest(),
          });
        });
      }

    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError(`Failed to initialize map: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Add venue markers
  useEffect(() => {
    if (!map.current || !mapInitialized || venues.length === 0 || isDestroyed) {
      console.log('Skipping marker creation:', {
        hasMap: !!map.current,
        mapInitialized,
        venueCount: venues.length,
        isDestroyed
      });
      return;
    }

    console.log('Adding venue markers...', venues.length, 'venues');

    // Clear existing markers safely
    try {
      markers.current.forEach(marker => {
        if (marker && typeof marker.remove === 'function') {
          marker.remove();
        }
      });
      markers.current = [];
      console.log('Existing markers cleared');
    } catch (error) {
      console.warn('Error clearing existing markers:', error);
      markers.current = [];
    }

    // Add new markers with Airbnb-style design
    venues.forEach(venue => {
      const coords = getVenueCoordinates(venue.location);
      const isSelected = selectedVenue?.id === venue.id;
      
      // Create custom marker element with Airbnb-style design
      const markerEl = document.createElement('div');
      markerEl.className = 'venue-marker';
      markerEl.style.cssText = `
        cursor: pointer;
        transform-origin: center bottom;
        transition: transform 0.2s ease;
      `;
      
      markerEl.innerHTML = `
        <div style="
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          background: ${isSelected ? '#222' : '#fff'};
          color: ${isSelected ? '#fff' : '#222'};
          border: 2px solid ${isSelected ? '#222' : '#fff'};
          border-radius: 24px;
          padding: 8px 12px;
          font-size: 14px;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          min-width: 40px;
          white-space: nowrap;
          z-index: 1;
        ">
          $${venue.price}
        </div>
        <div style="
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 8px solid ${isSelected ? '#222' : '#fff'};
          z-index: 0;
        "></div>
      `;

      // Add hover effects
      markerEl.addEventListener('mouseenter', () => {
        markerEl.style.transform = 'scale(1.1)';
        markerEl.style.zIndex = '1000';
      });
      
      markerEl.addEventListener('mouseleave', () => {
        markerEl.style.transform = 'scale(1)';
        markerEl.style.zIndex = '1';
      });

      // Create popup with Airbnb-style design
      const popup = new mapboxgl.Popup({ 
        offset: 25,
        closeButton: false,
        className: 'airbnb-popup'
      }).setHTML(`
        <div style="
          padding: 16px;
          max-width: 280px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        ">
          <div style="
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 8px;
          ">
            <h4 style="
              font-size: 16px;
              font-weight: 600;
              margin: 0;
              color: #222;
              line-height: 1.2;
            ">${venue.name}</h4>
            <span style="
              background: #f7f7f7;
              color: #717171;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: 500;
              margin-left: 8px;
              white-space: nowrap;
            ">${venue.category}</span>
          </div>
          <p style="
            font-size: 14px;
            color: #717171;
            margin: 0 0 8px 0;
            line-height: 1.3;
          ">${venue.location}</p>
          <p style="
            font-size: 14px;
            color: #222;
            margin: 0 0 12px 0;
            line-height: 1.4;
            overflow: hidden;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
          ">${venue.description || 'Premium gaming venue with excellent facilities.'}</p>
          <div style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
          ">
            <div style="display: flex; align-items: center; gap: 4px;">
              <span style="font-size: 14px;">⭐</span>
              <span style="font-size: 14px; font-weight: 500; color: #222;">${venue.rating}</span>
              <span style="font-size: 14px; color: #717171;">(${venue.review_count})</span>
            </div>
            <div>
              <span style="
                font-size: 16px;
                font-weight: 600;
                color: #222;
              ">$${venue.price}</span>
              <span style="
                font-size: 14px;
                color: #717171;
              ">/hour</span>
            </div>
          </div>
          <button 
            onclick="window.open('/venue/${venue.id}', '_blank')" 
            style="
              width: 100%;
              background: #222;
              color: white;
              border: none;
              padding: 12px 16px;
              border-radius: 8px;
              font-size: 14px;
              font-weight: 600;
              cursor: pointer;
              transition: background-color 0.2s ease;
            "
            onmouseover="this.style.backgroundColor='#404040'"
            onmouseout="this.style.backgroundColor='#222'"
          >
            View Details
          </button>
        </div>
      `);

      // Create marker safely
      try {
        const marker = new mapboxgl.Marker(markerEl)
          .setLngLat([coords.lng, coords.lat])
          .setPopup(popup)
          .addTo(map.current!);

        markers.current.push(marker);
      } catch (error) {
        console.warn('Error creating marker for venue:', venue.name, error);
      }
    });

    // Fit map to show all venues safely
    if (venues.length > 0 && map.current) {
      try {
        const bounds = new mapboxgl.LngLatBounds();
        venues.forEach(venue => {
          const coords = getVenueCoordinates(venue.location);
          bounds.extend([coords.lng, coords.lat]);
        });
        
        // Add padding and ensure bounds are valid
        map.current.fitBounds(bounds, { 
          padding: 50,
          maxZoom: 14 // Don't zoom too close
        });
        console.log('Map bounds fitted to venues');
      } catch (error) {
        console.warn('Error fitting map bounds:', error);
      }
    }

    console.log(`Added ${markers.current.length} venue markers`);
  }, [venues, selectedVenue, showPrices, mapInitialized, isDestroyed]);

  // Initialize map on component mount
  useEffect(() => {
    console.log('MapboxMap component mounted, initializing map...');
    setIsDestroyed(false); // Reset destroyed state on mount
    setMapError(null); // Clear any previous errors
    
    // Small delay to ensure container is fully rendered
    const timeoutId = setTimeout(() => {
      initializeMap();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      console.log('MapboxMap cleanup starting...');
      setIsDestroyed(true);
      
      // Clean up markers first
      try {
        markers.current.forEach(marker => {
          if (marker && typeof marker.remove === 'function') {
            marker.remove();
          }
        });
        markers.current = [];
        console.log('Markers cleaned up successfully');
      } catch (error) {
        console.warn('Error cleaning up markers:', error);
      }
      
      // Clean up map with proper checks
      try {
        if (map.current && typeof map.current.remove === 'function') {
          // Check if map is in a valid state before removing
          if (map.current.getContainer && map.current.getContainer()) {
            console.log('Removing map...');
            map.current.remove();
            console.log('Map removed successfully');
          }
        }
        map.current = null;
      } catch (error) {
        console.warn('Error cleaning up map:', error);
        // Force cleanup by setting to null even if remove fails
        map.current = null;
      }
      
      console.log('MapboxMap cleanup completed');
    };
  }, []);

  return (
    <div className={`relative w-full ${height} bg-muted/20 rounded-lg overflow-hidden`}>
      {/* Error State */}
      {mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/90 backdrop-blur-sm z-10">
          <div className="text-center p-6">
            <MapPin className="w-12 h-12 text-destructive mx-auto mb-4" />
            <p className="text-lg font-medium mb-2 text-destructive">Map Loading Error</p>
            <p className="text-sm text-muted-foreground mb-4 max-w-md">{mapError}</p>
            <div className="space-y-2">
              <Button onClick={() => {
                setMapError(null);
                setMapInitialized(false);
                setIsDestroyed(false);
                if (map.current) {
                  map.current.remove();
                  map.current = null;
                }
                setTimeout(() => initializeMap(), 500);
              }}>
                Retry Map Loading
              </Button>
              <p className="text-xs text-muted-foreground">
                Make sure you have an internet connection
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {!mapInitialized && !mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/90 backdrop-blur-sm z-10">
          <div className="text-center">
            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
            <p className="text-lg font-medium mb-2">Loading Georgia Map</p>
            <p className="text-sm text-muted-foreground">
              Setting up gaming venues in Tbilisi...
            </p>
            <div className="mt-4 w-32 h-1 bg-muted rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-primary rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      )}

      <div ref={mapContainer} className="absolute inset-0" />
      
      {mapInitialized && !mapError && venues.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-2 text-sm z-20 border">
          <p className="text-muted-foreground">
            {venues.length} gaming venues in Georgia • Click markers for details
          </p>
        </div>
      )}
    </div>
  );
};

export default MapboxMap;
