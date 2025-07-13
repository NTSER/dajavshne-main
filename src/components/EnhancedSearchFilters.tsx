
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, MapPin, Users, Clock, Search, Building } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SearchSuggestion {
  id: string;
  name: string;
  location: string;
  type: 'venue' | 'location';
}

interface SearchFilters {
  businessName: string;
  location: string;
  date: string;
  time: string;
  guests: string;
}

interface VenueData {
  id: string;
  name: string;
  location: string;
}

const EnhancedSearchFilters = () => {
  const [filters, setFilters] = useState<SearchFilters>({
    businessName: "",
    location: "",
    date: "",
    time: "",
    guests: ""
  });
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionField, setActiveSuggestionField] = useState<'businessName' | 'location' | null>(null);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setActiveSuggestionField(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = async (query: string, type: 'businessName' | 'location') => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      let searchQuery;
      
      if (type === 'businessName') {
        searchQuery = supabase
          .from('venues')
          .select('id, name, location')
          .ilike('name', `%${query}%`)
          .limit(5);
      } else {
        searchQuery = supabase
          .from('venues')
          .select('id, name, location')
          .or(`name.ilike.%${query}%,location.ilike.%${query}%`)
          .limit(5);
      }

      const { data: venues, error } = await searchQuery;

      if (error) {
        console.error('Error fetching suggestions:', error);
        return;
      }

      // Type guard to ensure venues data is properly typed
      const typedVenues: VenueData[] = (venues || []).filter((venue): venue is VenueData => {
        return venue && 
               typeof venue.id === 'string' && 
               typeof venue.name === 'string' && 
               typeof venue.location === 'string';
      });

      if (type === 'businessName') {
        const venueSuggestions: SearchSuggestion[] = typedVenues.map(venue => ({
          id: venue.id,
          name: venue.name,
          location: venue.location,
          type: 'venue' as const
        }));
        setSuggestions(venueSuggestions);
      } else {
        const venueSuggestions: SearchSuggestion[] = typedVenues.map(venue => ({
          id: venue.id,
          name: venue.name,
          location: venue.location,
          type: 'venue' as const
        }));

        // Get unique locations with proper type checking
        const uniqueLocations = [...new Set(
          typedVenues
            .map(v => v.location)
            .filter(loc => loc && loc.toLowerCase().includes(query.toLowerCase()))
        )];
        
        const locationSuggestions: SearchSuggestion[] = uniqueLocations.map(loc => ({
          id: `location-${loc}`,
          name: loc,
          location: loc,
          type: 'location' as const
        }));

        setSuggestions([...venueSuggestions, ...locationSuggestions]);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    
    if (field === 'businessName' || field === 'location') {
      fetchSuggestions(value, field);
      setShowSuggestions(true);
      setActiveSuggestionField(field);
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    if (activeSuggestionField === 'businessName') {
      setFilters(prev => ({ ...prev, businessName: suggestion.name }));
    } else if (activeSuggestionField === 'location') {
      if (suggestion.type === 'venue') {
        setFilters(prev => ({ ...prev, location: suggestion.name }));
      } else {
        setFilters(prev => ({ ...prev, location: suggestion.location }));
      }
    }
    setShowSuggestions(false);
    setActiveSuggestionField(null);
  };

  const handleSearch = () => {
    console.log('Search filters:', filters);
    // Here you would implement the actual search logic
    // For now, we'll just log the filters
  };

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 p-6 bg-background/80 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg">
      {/* Business Name Search */}
      <div className="space-y-2 relative" ref={searchRef}>
        <Label className="text-sm font-medium flex items-center gap-2 text-foreground">
          <Building className="h-4 w-4" />
          Business Name
        </Label>
        <Input
          placeholder="Search by business name"
          value={filters.businessName}
          onChange={(e) => handleInputChange('businessName', e.target.value)}
          onFocus={() => filters.businessName && activeSuggestionField === 'businessName' && setShowSuggestions(true)}
          className="bg-background/50 border-white/20 placeholder:text-muted-foreground"
        />
        
        {showSuggestions && suggestions.length > 0 && activeSuggestionField === 'businessName' && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-border rounded-lg shadow-lg overflow-hidden">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full px-4 py-3 text-left hover:bg-muted/50 flex items-center gap-3 transition-colors"
              >
                <div className="flex-shrink-0">
                  <Building className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="font-medium text-sm">{suggestion.name}</div>
                  <div className="text-xs text-muted-foreground">{suggestion.location}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Location Search */}
      <div className="space-y-2 relative">
        <Label className="text-sm font-medium flex items-center gap-2 text-foreground">
          <MapPin className="h-4 w-4" />
          Location
        </Label>
        <Input
          placeholder="Search destinations"
          value={filters.location}
          onChange={(e) => handleInputChange('location', e.target.value)}
          onFocus={() => filters.location && activeSuggestionField === 'location' && setShowSuggestions(true)}
          className="bg-background/50 border-white/20 placeholder:text-muted-foreground"
        />
        
        {showSuggestions && suggestions.length > 0 && activeSuggestionField === 'location' && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-border rounded-lg shadow-lg overflow-hidden">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full px-4 py-3 text-left hover:bg-muted/50 flex items-center gap-3 transition-colors"
              >
                <div className="flex-shrink-0">
                  {suggestion.type === 'venue' ? (
                    <Search className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <div className="font-medium text-sm">{suggestion.name}</div>
                  {suggestion.type === 'venue' && (
                    <div className="text-xs text-muted-foreground">{suggestion.location}</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Check-in Date */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2 text-foreground">
          <Calendar className="h-4 w-4" />
          Check-in Date
        </Label>
        <Input
          type="date"
          value={filters.date}
          onChange={(e) => handleInputChange('date', e.target.value)}
          min={today}
          className="bg-background/50 border-white/20"
        />
      </div>
      
      {/* Time */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2 text-foreground">
          <Clock className="h-4 w-4" />
          Preferred Time
        </Label>
        <Input
          type="time"
          value={filters.time}
          onChange={(e) => handleInputChange('time', e.target.value)}
          className="bg-background/50 border-white/20"
        />
      </div>
      
      {/* Guests */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2 text-foreground">
          <Users className="h-4 w-4" />
          Guests
        </Label>
        <Input
          type="number"
          placeholder="Number of guests"
          value={filters.guests}
          onChange={(e) => handleInputChange('guests', e.target.value)}
          className="bg-background/50 border-white/20 placeholder:text-muted-foreground"
          min="1"
          max="50"
        />
      </div>
      
      {/* Search Button */}
      <div className="sm:col-span-2 lg:col-span-5 pt-2">
        <Button 
          onClick={handleSearch}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          disabled={loading}
        >
          <Search className="h-4 w-4 mr-2" />
          {loading ? 'Searching...' : 'Search Venues'}
        </Button>
      </div>
    </div>
  );
};

export default EnhancedSearchFilters;
