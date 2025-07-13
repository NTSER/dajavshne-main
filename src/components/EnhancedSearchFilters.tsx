
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, MapPin, Users, Clock, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SearchSuggestion {
  id: string;
  name: string;
  location: string;
  type: 'venue' | 'location';
}

const EnhancedSearchFilters = () => {
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [guests, setGuests] = useState("");
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
      const { data: venues, error } = await supabase
        .from('venues')
        .select('id, name, location')
        .or(`name.ilike.%${query}%,location.ilike.%${query}%`)
        .limit(5);

      if (error) {
        console.error('Error fetching suggestions:', error);
        return;
      }

      const venueSuggestions: SearchSuggestion[] = venues?.map(venue => ({
        id: venue.id,
        name: venue.name,
        location: venue.location,
        type: 'venue' as const
      })) || [];

      // Get unique locations
      const uniqueLocations = [...new Set(venues?.map(v => v.location) || [])];
      const locationSuggestions: SearchSuggestion[] = uniqueLocations
        .filter(loc => loc.toLowerCase().includes(query.toLowerCase()))
        .map(loc => ({
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
    setLocation(value);
    fetchSuggestions(value);
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'venue') {
      setLocation(suggestion.name);
    } else {
      setLocation(suggestion.location);
    }
    setShowSuggestions(false);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6 bg-background/80 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg">
      <div className="space-y-2 relative" ref={searchRef}>
        <Label className="text-sm font-medium flex items-center gap-2 text-foreground">
          <MapPin className="h-4 w-4" />
          Where
        </Label>
        <Input
          placeholder="Search destinations"
          value={location}
          onChange={(e) => handleLocationChange(e.target.value)}
          onFocus={() => location && setShowSuggestions(true)}
          className="bg-background/50 border-white/20 placeholder:text-muted-foreground"
        />
        
        {showSuggestions && suggestions.length > 0 && (
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
      
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2 text-foreground">
          <Calendar className="h-4 w-4" />
          Check-in
        </Label>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="bg-background/50 border-white/20"
        />
      </div>
      
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2 text-foreground">
          <Clock className="h-4 w-4" />
          Time
        </Label>
        <Input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="bg-background/50 border-white/20"
        />
      </div>
      
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2 text-foreground">
          <Users className="h-4 w-4" />
          Guests
        </Label>
        <Input
          type="number"
          placeholder="Add guests"
          value={guests}
          onChange={(e) => setGuests(e.target.value)}
          className="bg-background/50 border-white/20 placeholder:text-muted-foreground"
          min="1"
        />
      </div>
      
      <div className="sm:col-span-2 lg:col-span-4 pt-2">
        <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
          <Search className="h-4 w-4 mr-2" />
          Search Venues
        </Button>
      </div>
    </div>
  );
};

export default EnhancedSearchFilters;
