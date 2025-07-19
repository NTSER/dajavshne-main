
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useVenues } from "@/hooks/useVenues";
import VenueCard from "@/components/VenueCard";
import MapboxMap from "@/components/MapboxMap";
import SearchFilters from "@/components/SearchFilters";
import { Button } from "@/components/ui/button";
import { Map, List, Filter } from "lucide-react";

const SearchResults = () => {
  const { data: allVenues, isLoading } = useVenues();
  const [filteredVenues, setFilteredVenues] = useState(allVenues || []);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'split' | 'list' | 'map'>('split');
  const [mapBounds, setMapBounds] = useState<{
    north: number;
    south: number;
    east: number;
    west: number;
  } | null>(null);

  useEffect(() => {
    if (allVenues) {
      // Filter venues based on map bounds when they change
      if (mapBounds) {
        const venuesInBounds = allVenues.filter(venue => {
          // For demo purposes, we'll use a simple coordinate system
          // In a real app, you'd have actual coordinates for each venue
          const venueCoords = getVenueCoordinates(venue.location);
          return (
            venueCoords.lat >= mapBounds.south &&
            venueCoords.lat <= mapBounds.north &&
            venueCoords.lng >= mapBounds.west &&
            venueCoords.lng <= mapBounds.east
          );
        });
        setFilteredVenues(venuesInBounds);
      } else {
        setFilteredVenues(allVenues);
      }
    }
  }, [allVenues, mapBounds]);

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

  const handleMapBoundsChange = (bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }) => {
    setMapBounds(bounds);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">
              Browse Gaming Venues
            </h1>
            <p className="text-muted-foreground">
              {filteredVenues.length} venues found
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={showFilters ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
            
            <div className="flex rounded-lg border overflow-hidden">
              <Button
                variant={viewMode === 'list' ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-none"
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'split' ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode('split')}
                className="rounded-none"
              >
                <Map className="w-4 h-4 mr-1" />
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'map' ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode('map')}
                className="rounded-none"
              >
                <Map className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8"
          >
            <SearchFilters />
          </motion.div>
        )}

        {/* Content */}
        <div className="flex gap-6 h-[calc(100vh-300px)]">
          {/* Venues List */}
          {(viewMode === 'split' || viewMode === 'list') && (
            <div className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} overflow-hidden`}>
              <div className="h-full overflow-y-auto pr-4 space-y-6">
                {filteredVenues.map((venue, index) => (
                  <motion.div
                    key={venue.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <VenueCard venue={venue} />
                  </motion.div>
                ))}
                
                {filteredVenues.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground text-lg">
                      No venues found in this area. Try zooming out on the map.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Interactive Map */}
          {(viewMode === 'split' || viewMode === 'map') && (
            <div className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} rounded-lg overflow-hidden border bg-muted/10`}>
              <MapboxMap
                venues={filteredVenues}
                onBoundsChange={handleMapBoundsChange}
                height="h-full"
                showPrices={true}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchResults;
