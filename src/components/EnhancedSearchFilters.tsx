import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, MapPin, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface SearchSuggestion {
  id: string;
  name: string;
  location: string;
  type: 'venue' | 'location';
}

interface SearchFilters {
  location: string;
  date: Date | undefined;
}

interface VenueData {
  id: string;
  name: string;
  location: string;
}

const EnhancedSearchFilters = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<SearchFilters>({
    location: "",
    date: undefined,
  });
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const searchQuery = supabase
        .from('venues')
        .select('id, name, location')
        .or(`name.ilike.%${query}%,location.ilike.%${query}%`)
        .limit(5);

      const { data: venues, error } = await searchQuery;

      if (error) {
        console.error('Error fetching suggestions:', error);
        return;
      }

      const typedVenues: VenueData[] = (venues || []).filter((venue): venue is VenueData => {
        return venue && 
               typeof venue.id === 'string' && 
               typeof venue.name === 'string' && 
               typeof venue.location === 'string';
      });

      const venueSuggestions: SearchSuggestion[] = typedVenues.map(venue => ({
        id: venue.id,
        name: venue.name,
        location: venue.location,
        type: 'venue' as const
      }));

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
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationChange = (value: string) => {
    setFilters(prev => ({ ...prev, location: value }));
    fetchSuggestions(value);
    setShowSuggestions(true);
  };

  const handleDateChange = (date: Date | undefined) => {
    setFilters(prev => ({ ...prev, date }));
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'venue') {
      setFilters(prev => ({ ...prev, location: suggestion.name }));
    } else {
      setFilters(prev => ({ ...prev, location: suggestion.location }));
    }
    setShowSuggestions(false);
  };

  const handleSearch = () => {
    console.log('Search filters:', filters);
    
    const searchParams = new URLSearchParams();
    
    if (filters.location) {
      searchParams.append('location', filters.location);
    }
    if (filters.date) {
      searchParams.append('date', format(filters.date, 'yyyy-MM-dd'));
    }
    
    navigate(`/search?${searchParams.toString()}`);
  };

  return (
    <div className="flex flex-col md:flex-row items-center gap-0 bg-white rounded-full shadow-lg border border-gray-200 p-2 max-w-4xl mx-auto">
      {/* Where */}
      <div className="flex-1 relative" ref={searchRef}>
        <div className="px-6 py-4">
          <div className="text-xs font-semibold text-gray-800 mb-1">Where</div>
          <Input
            placeholder="Search destinations"
            value={filters.location}
            onChange={(e) => handleLocationChange(e.target.value)}
            className="border-0 p-0 text-sm font-medium text-gray-600 placeholder:text-gray-400 focus-visible:ring-0 bg-transparent"
          />
        </div>
        
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
              >
                <div className="flex-shrink-0">
                  <MapPin className="h-4 w-4 text-gray-400" />
                </div>
                <div>
                  <div className="font-medium text-sm text-gray-800">{suggestion.name}</div>
                  {suggestion.type === 'venue' && (
                    <div className="text-xs text-gray-400">{suggestion.location}</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="hidden md:block w-px h-8 bg-gray-200" />

      {/* Date */}
      <div className="flex-1">
        <div className="px-6 py-4">
          <div className="text-xs font-semibold text-gray-800 mb-1">Date</div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start text-left font-medium p-0 h-auto hover:bg-transparent",
                  !filters.date && "text-gray-400"
                )}
              >
                {filters.date ? format(filters.date, "MMM d") : "Add dates"}
              </Button>
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
      </div>

      {/* Search Button */}
      <div className="px-2">
        <Button 
          onClick={handleSearch}
          className="bg-red-500 hover:bg-red-600 text-white rounded-full w-12 h-12 p-0 shadow-md"
          disabled={loading}
        >
          <Search className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default EnhancedSearchFilters;