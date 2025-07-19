
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, MapPin, Users, Search, Building } from "lucide-react";
import { cn } from "@/lib/utils";
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
  date: Date | undefined;
  guests: string;
}

interface VenueData {
  id: string;
  name: string;
  location: string;
}

const EnhancedSearchFilters = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<SearchFilters>({
    businessName: "",
    location: "",
    date: undefined,
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

  const handleDateChange = (date: Date | undefined) => {
    setFilters(prev => ({ ...prev, date }));
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
    
    // Build search parameters
    const searchParams = new URLSearchParams();
    
    if (filters.businessName) {
      searchParams.append('businessName', filters.businessName);
    }
    if (filters.location) {
      searchParams.append('location', filters.location);
    }
    if (filters.date) {
      searchParams.append('date', format(filters.date, 'yyyy-MM-dd'));
    }
    if (filters.guests) {
      searchParams.append('guests', filters.guests);
    }
    
    // Navigate to search results page with filters
    navigate(`/search?${searchParams.toString()}`);
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-full border border-border/20 shadow-xl max-w-4xl mx-auto">
      <div className="flex items-center divide-x divide-border/20" ref={searchRef}>
        {/* Where */}
        <div className="flex-1 relative">
          <button 
            className="w-full text-left p-4 hover:bg-muted/30 rounded-l-full transition-colors"
            onClick={() => {
              setActiveSuggestionField('location');
              if (filters.location) setShowSuggestions(true);
            }}
          >
            <div className="text-xs font-semibold text-foreground/80 mb-1">Where</div>
            <div className="text-sm text-foreground">
              {filters.location || "Search destinations"}
            </div>
          </button>
          
          {/* Location Input Overlay */}
          {activeSuggestionField === 'location' && (
            <div className="absolute inset-0 z-10">
              <Input
                placeholder="Search destinations"
                value={filters.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                onBlur={() => {
                  setTimeout(() => {
                    setShowSuggestions(false);
                    setActiveSuggestionField(null);
                  }, 200);
                }}
                className="w-full h-full border-0 bg-transparent focus:ring-0 focus:outline-none rounded-l-full px-4"
                autoFocus
              />
            </div>
          )}
          
          {showSuggestions && suggestions.length > 0 && activeSuggestionField === 'location' && (
            <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white border border-border rounded-xl shadow-lg overflow-hidden max-h-60 overflow-y-auto">
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

        {/* Date */}
        <div className="flex-1">
          <Popover>
            <PopoverTrigger asChild>
              <button className="w-full text-left p-4 hover:bg-muted/30 transition-colors">
                <div className="text-xs font-semibold text-foreground/80 mb-1">Date</div>
                <div className="text-sm text-foreground">
                  {filters.date ? format(filters.date, "MMM d") : "Add dates"}
                </div>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.date}
                onSelect={handleDateChange}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Type of service */}
        <div className="flex-1 relative">
          <button 
            className="w-full text-left p-4 hover:bg-muted/30 transition-colors"
            onClick={() => {
              setActiveSuggestionField('businessName');
              if (filters.businessName) setShowSuggestions(true);
            }}
          >
            <div className="text-xs font-semibold text-foreground/80 mb-1">Type of service</div>
            <div className="text-sm text-foreground">
              {filters.businessName || "Add service"}
            </div>
          </button>
          
          {/* Business Name Input Overlay */}
          {activeSuggestionField === 'businessName' && (
            <div className="absolute inset-0 z-10">
              <Input
                placeholder="Add service"
                value={filters.businessName}
                onChange={(e) => handleInputChange('businessName', e.target.value)}
                onBlur={() => {
                  setTimeout(() => {
                    setShowSuggestions(false);
                    setActiveSuggestionField(null);
                  }, 200);
                }}
                className="w-full h-full border-0 bg-transparent focus:ring-0 focus:outline-none px-4"
                autoFocus
              />
            </div>
          )}
          
          {showSuggestions && suggestions.length > 0 && activeSuggestionField === 'businessName' && (
            <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white border border-border rounded-xl shadow-lg overflow-hidden max-h-60 overflow-y-auto">
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

        {/* Search Button */}
        <div className="flex items-center pr-2">
          <Button 
            onClick={handleSearch}
            size="icon"
            className="w-12 h-12 rounded-full bg-destructive hover:bg-destructive/90 text-white shadow-lg"
            disabled={loading}
          >
            <Search className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedSearchFilters;
