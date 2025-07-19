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
  onBoundsChange?: (bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }) => void;
  height?: string;
}

const MapboxMap = ({ venues, onBoundsChange, height = 'h-full' }: MapboxMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [mapInitialized, setMapInitialized] = useState(false);

  // Your Mapbox public token
  const MAPBOX_TOKEN = 'pk.eyJ1IjoiZGFqYXZzaG5lIiwiYSI6ImNtZGE2eDE1eTBmMHEyd3F0b2g5MWsyeWwifQ.q8WNX31_PENI10UD6DD6Ig';

  // Helper function to generate mock coordinates based on location
  const getVenueCoordinates = (location: string) => {
    const hash = location.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return {
      lat: 40.7128 + (hash % 1000) / 10000, // Around NYC area
      lng: -74.0060 + (hash % 2000) / 10000
    };
  };

  // Initialize map
  const initializeMap = () => {
    if (!mapContainer.current || map.current) return;

    try {
      mapboxgl.accessToken = MAPBOX_TOKEN;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [-74.0060, 40.7128], // NYC center
        zoom: 12,
        pitch: 45,
      });

      // Add navigation controls
      map.current.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: true,
        }),
        'top-right'
      );

      // Add fullscreen control
      map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

      // Add geolocate control
      map.current.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true
          },
          trackUserLocation: true,
          showUserHeading: true
        }),
        'top-right'
      );

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

      // Add atmosphere and fog effects
      map.current.on('style.load', () => {
        map.current?.setFog({
          color: 'rgb(255, 255, 255)',
          'high-color': 'rgb(200, 200, 225)',
          'horizon-blend': 0.2,
        });
      });

      setMapInitialized(true);
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  };

  // Add venue markers
  useEffect(() => {
    if (!map.current || !mapInitialized || venues.length === 0) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add new markers
    venues.forEach(venue => {
      const coords = getVenueCoordinates(venue.location);
      
      // Create custom marker element
      const markerEl = document.createElement('div');
      markerEl.className = 'venue-marker';
      markerEl.innerHTML = `
        <div class="relative cursor-pointer hover:scale-110 transition-transform">
          <div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg">
            <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
          <div class="absolute -top-2 -right-2 w-6 h-6 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center text-xs font-bold">
            $${venue.price}
          </div>
        </div>
      `;

      // Create popup
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div class="p-3 max-w-xs">
          <div class="flex justify-between items-start mb-2">
            <h4 class="font-semibold text-lg">${venue.name}</h4>
            <span class="bg-secondary text-secondary-foreground px-2 py-1 rounded text-xs">${venue.category}</span>
          </div>
          <p class="text-sm text-muted-foreground mb-2">${venue.location}</p>
          <p class="text-sm mb-3 line-clamp-2">${venue.description || 'Premium gaming venue with excellent facilities.'}</p>
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-1">
              <span class="text-sm">⭐ ${venue.rating}</span>
              <span class="text-sm text-muted-foreground">(${venue.review_count})</span>
            </div>
            <div class="text-right">
              <span class="font-semibold text-primary">$${venue.price}</span>
              <span class="text-sm text-muted-foreground">/hour</span>
            </div>
          </div>
          <button 
            onclick="window.open('/venue/${venue.id}', '_blank')" 
            class="w-full mt-3 bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-2 rounded text-sm font-medium transition-colors"
          >
            View Details
          </button>
        </div>
      `);

      // Create marker
      const marker = new mapboxgl.Marker(markerEl)
        .setLngLat([coords.lng, coords.lat])
        .setPopup(popup)
        .addTo(map.current!);

      markers.current.push(marker);
    });

    // Fit map to show all venues
    if (venues.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      venues.forEach(venue => {
        const coords = getVenueCoordinates(venue.location);
        bounds.extend([coords.lng, coords.lat]);
      });
      map.current.fitBounds(bounds, { padding: 50 });
    }
  }, [venues, mapInitialized]);

  // Initialize map on component mount
  useEffect(() => {
    initializeMap();
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      markers.current.forEach(marker => marker.remove());
      map.current?.remove();
    };
  }, []);

  const handleTokenSubmit = () => {
    // This function is no longer needed since we have the token
  };

  return (
    <div className={`relative w-full ${height} bg-muted/20 rounded-lg overflow-hidden`}>
      {!mapInitialized && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/90 backdrop-blur-sm z-10">
          <div className="text-center">
            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
            <p className="text-lg font-medium mb-2">Loading Interactive Map</p>
            <p className="text-sm text-muted-foreground">
              Setting up your gaming venue map...
            </p>
          </div>
        </div>
      )}

      <div ref={mapContainer} className="absolute inset-0" />
      
      {mapInitialized && (
        <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-2 text-sm z-20">
          <p className="text-muted-foreground">
            {venues.length} venues shown • Click markers for details
          </p>
        </div>
      )}
    </div>
  );
};

export default MapboxMap;