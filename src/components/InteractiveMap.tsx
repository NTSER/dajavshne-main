
import { useEffect, useRef, useState } from "react";
import { Venue } from "@/hooks/useVenues";
import { MapPin, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface InteractiveMapProps {
  venues: Venue[];
  onBoundsChange: (bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }) => void;
}

interface VenueMarker extends Venue {
  x: number;
  y: number;
  lat: number;
  lng: number;
}

const InteractiveMap = ({ venues, onBoundsChange }: InteractiveMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [venueMarkers, setVenueMarkers] = useState<VenueMarker[]>([]);

  // Generate venue markers with coordinates
  useEffect(() => {
    const markers = venues.map(venue => {
      const hash = venue.location.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      
      const lat = 40.7128 + (hash % 1000) / 10000;
      const lng = -74.0060 + (hash % 2000) / 10000;
      
      // Convert lat/lng to screen coordinates (simplified projection)
      const x = ((lng + 74.0060) * 10000) % 800;
      const y = ((lat - 40.7128) * 10000) % 600;
      
      return {
        ...venue,
        x,
        y,
        lat,
        lng
      };
    });
    
    setVenueMarkers(markers);
  }, [venues]);

  // Update bounds when zoom or center changes
  useEffect(() => {
    const mapWidth = 800 * zoom;
    const mapHeight = 600 * zoom;
    
    const bounds = {
      north: 40.7628 + (center.y + mapHeight/2) / 10000,
      south: 40.6628 + (center.y - mapHeight/2) / 10000,
      east: -73.9060 + (center.x + mapWidth/2) / 10000,
      west: -74.1060 + (center.x - mapWidth/2) / 10000
    };
    
    onBoundsChange(bounds);
  }, [zoom, center, onBoundsChange]);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.5, 5));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.5, 0.5));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - center.x, y: e.clientY - center.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setCenter({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  return (
    <div className="relative w-full h-full bg-muted/20 overflow-hidden">
      {/* Map Background */}
      <div
        ref={mapRef}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        style={{
          transform: `translate(${center.x}px, ${center.y}px) scale(${zoom})`,
          transition: isDragging ? 'none' : 'transform 0.2s ease-out'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* Map Grid */}
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Venue Markers */}
        {venueMarkers.map((venue) => (
          <HoverCard key={venue.id}>
            <HoverCardTrigger asChild>
              <div
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:scale-110 transition-transform z-10"
                style={{
                  left: venue.x,
                  top: venue.y
                }}
              >
                <div className="relative">
                  <MapPin className="w-8 h-8 text-primary fill-primary drop-shadow-lg" />
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                    ${venue.price}
                  </div>
                </div>
              </div>
            </HoverCardTrigger>
            <HoverCardContent className="w-80 p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <h4 className="font-semibold text-lg">{venue.name}</h4>
                  <Badge variant="secondary">{venue.category}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{venue.location}</p>
                <p className="text-sm line-clamp-2">{venue.description}</p>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1">
                    <span className="text-sm">⭐ {venue.rating}</span>
                    <span className="text-sm text-muted-foreground">({venue.review_count})</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-primary">${venue.price}</span>
                    <span className="text-sm text-muted-foreground">/hour</span>
                  </div>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        ))}
      </div>

      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
        <Button
          size="icon"
          variant="outline"
          onClick={handleZoomIn}
          className="bg-background/90 backdrop-blur-sm"
        >
          <Plus className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          variant="outline"
          onClick={handleZoomOut}
          className="bg-background/90 backdrop-blur-sm"
        >
          <Minus className="w-4 h-4" />
        </Button>
      </div>

      {/* Map Info */}
      <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-2 text-sm z-20">
        <p className="text-muted-foreground">
          Zoom: {zoom.toFixed(1)}x • {venueMarkers.length} venues shown
        </p>
      </div>

      {/* Instructions */}
      <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-muted-foreground z-20">
        Drag to pan • Scroll to zoom • Hover markers for details
      </div>
    </div>
  );
};

export default InteractiveMap;
