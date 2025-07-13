import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import VenueCard from "@/components/VenueCard";
import { useVenues } from "@/hooks/useVenues";
import { Venue } from "@/hooks/useVenues";

const SearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: allVenues, isLoading } = useVenues();
  const [filteredVenues, setFilteredVenues] = useState<Venue[]>([]);
  
  // Get search parameters from URL
  const searchParams = new URLSearchParams(location.search);
  const businessName = searchParams.get('businessName') || '';
  const locationFilter = searchParams.get('location') || '';
  const date = searchParams.get('date') || '';
  const time = searchParams.get('time') || '';
  const guests = searchParams.get('guests') || '';

  useEffect(() => {
    if (!allVenues) return;

    let filtered = allVenues;

    // Filter by business name
    if (businessName) {
      filtered = filtered.filter(venue => 
        venue.name.toLowerCase().includes(businessName.toLowerCase())
      );
    }

    // Filter by location
    if (locationFilter) {
      filtered = filtered.filter(venue => 
        venue.location.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    // Additional filters can be added here for date, time, guests
    // For now, we'll keep the basic name and location filtering

    setFilteredVenues(filtered);
  }, [allVenues, businessName, locationFilter, date, time, guests]);

  const getSearchSummary = () => {
    const filters = [];
    if (businessName) filters.push(`"${businessName}"`);
    if (locationFilter) filters.push(`in ${locationFilter}`);
    if (date) filters.push(`on ${date}`);
    if (guests) filters.push(`for ${guests} guests`);
    
    return filters.length > 0 ? filters.join(' ') : 'all venues';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4 hover:bg-muted/50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Search
          </Button>
          
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Search Results
          </h1>
          <p className="text-muted-foreground text-lg">
            Found {filteredVenues.length} venues matching {getSearchSummary()}
          </p>
        </motion.div>

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-muted h-64 rounded-lg mb-4" />
                <div className="bg-muted h-4 rounded mb-2" />
                <div className="bg-muted h-4 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : filteredVenues.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredVenues.map((venue, index) => (
              <motion.div
                key={venue.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <VenueCard venue={venue} />
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center py-16"
          >
            <h3 className="text-xl font-semibold mb-2">No venues found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search criteria or browse all venues.
            </p>
            <Button onClick={() => navigate('/')} variant="outline">
              Back to Search
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
