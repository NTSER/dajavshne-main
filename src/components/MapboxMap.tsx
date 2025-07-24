import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Venue } from '@/hooks/useVenues';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface MapboxMapProps {
  venues: Venue[];
  onBoundsChange?: (bounds: { north: number; south: number; east: number; west: number }) => void;
  className?: string;
  height?: string;
}

const MapboxMap: React.FC<MapboxMapProps> = ({ 
  venues, 
  onBoundsChange, 
  className = "w-full", 
  height = "500px" 
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [showTokenInput, setShowTokenInput] = useState(true);

  // Initialize map when token is provided
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || map.current) return;

    mapboxgl.accessToken = mapboxToken;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [0, 0], // Default center
        zoom: 2
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Add fullscreen control
      map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

      // Handle bounds change
      map.current.on('moveend', () => {
        if (map.current && onBoundsChange) {
          const bounds = map.current.getBounds();
          onBoundsChange({
            north: bounds.getNorth(),
            south: bounds.getSouth(),
            east: bounds.getEast(),
            west: bounds.getWest()
          });
        }
      });

      setShowTokenInput(false);
    } catch (error) {
      console.error('Error initializing Mapbox:', error);
      setShowTokenInput(true);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapboxToken, onBoundsChange]);

  // Add venue markers
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Filter venues with coordinates
    const venuesWithCoords = venues.filter(venue => 
      venue.latitude && venue.longitude
    );

    if (venuesWithCoords.length === 0) return;

    // Add markers for venues
    venuesWithCoords.forEach(venue => {
      if (!map.current || !venue.latitude || !venue.longitude) return;

      // Create price marker element (Airbnb style)
      const markerElement = document.createElement('div');
      markerElement.className = 'venue-marker';
      markerElement.innerHTML = `
        <div class="bg-white border-2 border-primary rounded-full px-3 py-1 shadow-lg hover:shadow-xl transition-all cursor-pointer text-sm font-semibold text-primary hover:bg-primary hover:text-white">
          $${venue.price}
        </div>
      `;

      // Create popup
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div class="p-2">
          <h3 class="font-semibold text-sm mb-1">${venue.name}</h3>
          <p class="text-xs text-gray-600 mb-1">${venue.location}</p>
          <p class="text-xs text-gray-500">⭐ ${venue.rating} (${venue.review_count} reviews)</p>
          <p class="font-semibold text-sm mt-1">$${venue.price}/hour</p>
        </div>
      `);

      // Create marker
      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat([venue.longitude, venue.latitude])
        .setPopup(popup)
        .addTo(map.current);

      markers.current.push(marker);
    });

    // Fit map to show all venues
    if (venuesWithCoords.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      venuesWithCoords.forEach(venue => {
        if (venue.latitude && venue.longitude) {
          bounds.extend([venue.longitude, venue.latitude]);
        }
      });
      
      map.current.fitBounds(bounds, { 
        padding: 50,
        maxZoom: 15 
      });
    }
  }, [venues]);

  if (showTokenInput) {
    return (
      <Card className={`${className} p-6`} style={{ height }}>
        <div className="flex flex-col items-center justify-center h-full space-y-4">
          <MapPin className="h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Mapbox Token Required</h3>
          <p className="text-sm text-muted-foreground text-center">
            To display the interactive map, please enter your Mapbox public token.
          </p>
          <div className="flex flex-col space-y-2 w-full max-w-md">
            <Input
              type="password"
              placeholder="Enter your Mapbox public token"
              value={mapboxToken}
              onChange={(e) => setMapboxToken(e.target.value)}
            />
            <Button 
              onClick={() => setMapboxToken(mapboxToken)}
              disabled={!mapboxToken.trim()}
            >
              Initialize Map
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Get your token from{' '}
            <a 
              href="https://mapbox.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              mapbox.com
            </a>
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className={className} style={{ height }}>
      <div ref={mapContainer} className="w-full h-full rounded-lg" />
    </div>
  );
};

export default MapboxMap;