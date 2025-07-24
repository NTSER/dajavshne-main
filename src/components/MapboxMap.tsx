import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Venue } from '@/hooks/useVenues';
import { Card } from '@/components/ui/card';
import { MapPin, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch Mapbox token and initialize map
  useEffect(() => {
    const initializeMap = async () => {
      console.log('MapboxMap: Starting initialization...');
      if (!mapContainer.current || map.current) {
        console.log('MapboxMap: Skipping - container missing or map already exists');
        return;
      }

      try {
        console.log('MapboxMap: Fetching token from edge function...');
        // Fetch Mapbox token from Supabase Edge Function
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        
        console.log('MapboxMap: Edge function response:', { data, error });
        
        if (error) {
          console.error('MapboxMap: Edge function error:', error);
          throw new Error(`Failed to get Mapbox token: ${error.message}`);
        }

        const token = data?.token;
        console.log('MapboxMap: Token received:', token ? 'YES' : 'NO');
        
        if (!token) {
          throw new Error('Mapbox token not configured');
        }

        console.log('MapboxMap: Setting Mapbox access token...');
        mapboxgl.accessToken = token;

        console.log('MapboxMap: Creating map instance...');
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/light-v11',
          center: [0, 0], // Default center
          zoom: 2
        });

        console.log('MapboxMap: Map created, adding controls...');
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

        console.log('MapboxMap: Initialization complete!');
        setIsLoading(false);
        setError(null);
      } catch (err) {
        console.error('MapboxMap: Error during initialization:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize map');
        setIsLoading(false);
      }
    };

    initializeMap();

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [onBoundsChange]);

  // Add venue markers
  useEffect(() => {
    if (!map.current || isLoading) return;

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
  }, [venues, isLoading]);

  if (isLoading) {
    return (
      <Card className={`${className} p-6`} style={{ height }}>
        <div className="flex flex-col items-center justify-center h-full space-y-4">
          <MapPin className="h-12 w-12 text-muted-foreground animate-pulse" />
          <h3 className="text-lg font-semibold">Loading Map...</h3>
          <p className="text-sm text-muted-foreground text-center">
            Initializing interactive map
          </p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`${className} p-6`} style={{ height }}>
        <div className="flex flex-col items-center justify-center h-full space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h3 className="text-lg font-semibold">Map Unavailable</h3>
          <p className="text-sm text-muted-foreground text-center">
            {error}
          </p>
          <p className="text-xs text-muted-foreground text-center">
            Please configure the Mapbox token in your project settings.
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