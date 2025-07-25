import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, MapPin, Search, Building, Map } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import InteractiveMap from "./InteractiveMap";
import { categories } from "@/data/mockData";

interface SearchSuggestion {
  id: string;
  name: string;
  location: string;
  type: 'venue' | 'location';
}

interface SearchFilters {
  businessName: string;
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
  });
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionField, setActiveSuggestionField] = useState<'businessName' | null>(null);
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
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
        .ilike('name', `%${query}%`)
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
      setSuggestions(venueSuggestions);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (value: string) => {
    setFilters(prev => ({ ...prev, businessName: value }));
    fetchSuggestions(value);
    setShowSuggestions(true);
    setActiveSuggestionField('businessName');
  };


  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setFilters(prev => ({ ...prev, businessName: suggestion.name }));
    setShowSuggestions(false);
    setActiveSuggestionField(null);
  };

  const handleSearch = async () => {
    console.log('Search filters:', filters);
    
    // Check if business name exactly matches a venue name
    if (filters.businessName.trim()) {
      try {
        const { data: venues, error } = await supabase
          .from('venues')
          .select('id, name')
          .ilike('name', filters.businessName.trim())
          .limit(1);

        if (!error && venues && venues.length > 0) {
          const exactMatch = venues.find(venue => 
            venue.name.toLowerCase() === filters.businessName.toLowerCase().trim()
          );
          
          if (exactMatch) {
            // Open venue page in new tab for exact match
            window.open(`/venue/${exactMatch.id}`, '_blank');
            return;
          }
        }
      } catch (error) {
        console.error('Error checking for exact venue match:', error);
      }
    }
    
    // If no exact match, proceed with regular search
    const searchParams = new URLSearchParams();
    
    if (filters.businessName) {
      searchParams.append('businessName', filters.businessName);
    }
    
    navigate(`/search?${searchParams.toString()}`);
  };

  const handleMapLocationSelect = (location: string) => {
    setFilters(prev => ({ ...prev, businessName: location }));
    setShowMap(false);
  };

  return (
    <>
      {/* Horizontal Search Bar for All Screen Sizes */}
      <div className="flex flex-row items-center gap-0 bg-card/80 backdrop-blur-sm rounded-full border border-border p-1.5 max-w-2xl mx-auto glass-effect">
        {/* Map Icon */}
        <div className="px-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowMap(true)}
            className="h-10 w-10 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full"
          >
            <Map className="h-5 w-5" />
          </Button>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-border" />

        {/* Business Name */}
        <div className="flex-1 relative" ref={searchRef}>
          <div className="px-4 py-3">
            <div className="text-xs font-semibold text-muted-foreground mb-1">Search venues</div>
            <Input
              placeholder="Enter business name or location"
              value={filters.businessName}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={() => filters.businessName && setShowSuggestions(true)}
              className="border-0 p-0 text-sm font-medium text-foreground placeholder:text-muted-foreground focus-visible:ring-0 bg-transparent"
            />
          </div>
          
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full px-4 py-3 text-left hover:bg-muted/50 flex items-center gap-3 transition-colors"
                >
                  <div className="flex-shrink-0">
                    <Building className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-sm text-foreground">{suggestion.name}</div>
                    <div className="text-xs text-muted-foreground">{suggestion.location}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search Button */}
        <div className="px-2">
          <Button 
            onClick={handleSearch}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-10 h-10 p-0 shadow-lg"
            disabled={loading}
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Map Modal */}
      {showMap && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl w-full max-w-4xl h-[80vh] border border-border overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Select Location</h3>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowMap(false)}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4">
              <p className="text-sm text-muted-foreground mb-4">
                To use the map feature, you'll need to add your Mapbox token. For now, you can select from these popular venues:
              </p>
              <div className="grid grid-cols-2 gap-4">
                {['Downtown District', 'Tech Park', 'Old Town', 'Gaming District'].map((location) => (
                  <Button
                    key={location}
                    variant="outline"
                    onClick={() => handleMapLocationSelect(location)}
                    className="justify-start"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    {location}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EnhancedSearchFilters;