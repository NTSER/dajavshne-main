import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MapPin, Search } from 'lucide-react';
import { toast } from 'sonner';

interface LocationInputProps {
  value: string;
  onChange: (location: string, coordinates?: { lat: number; lng: number }) => void;
  placeholder?: string;
  className?: string;
}

interface Suggestion {
  place_name: string;
  center: [number, number]; // [longitude, latitude]
}

const LocationInput: React.FC<LocationInputProps> = ({
  value,
  onChange,
  placeholder = "Enter location...",
  className = ""
}) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [showTokenInput, setShowTokenInput] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Try to geocode without token first (fallback to mock coordinates)
  const handleInputChange = (inputValue: string) => {
    onChange(inputValue);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (inputValue.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    timeoutRef.current = setTimeout(() => {
      if (mapboxToken) {
        fetchMapboxSuggestions(inputValue);
      } else {
        // Fallback to mock suggestions
        generateMockSuggestions(inputValue);
      }
    }, 300);
  };

  const fetchMapboxSuggestions = async (query: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&autocomplete=true&limit=5`
      );
      
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.features || []);
        setShowSuggestions(true);
      } else {
        throw new Error('Geocoding failed');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      generateMockSuggestions(query);
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockSuggestions = (query: string) => {
    // Generate mock suggestions with pseudo-random coordinates
    const mockSuggestions: Suggestion[] = [
      {
        place_name: `${query}, Downtown`,
        center: [Math.random() * 360 - 180, Math.random() * 180 - 90]
      },
      {
        place_name: `${query}, City Center`,
        center: [Math.random() * 360 - 180, Math.random() * 180 - 90]
      },
      {
        place_name: `${query}, Business District`,
        center: [Math.random() * 360 - 180, Math.random() * 180 - 90]
      }
    ];
    setSuggestions(mockSuggestions);
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    onChange(suggestion.place_name, {
      lat: suggestion.center[1],
      lng: suggestion.center[0]
    });
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleTokenSubmit = () => {
    if (mapboxToken.trim()) {
      setShowTokenInput(false);
      toast.success('Mapbox token added! Location suggestions will now be more accurate.');
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Input
          type="text"
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={placeholder}
          className="pl-10"
        />
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          </div>
        )}
      </div>

      {!mapboxToken && !showTokenInput && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2 text-xs"
          onClick={() => setShowTokenInput(true)}
        >
          <Search className="h-3 w-3 mr-1" />
          Add Mapbox token for better suggestions
        </Button>
      )}

      {showTokenInput && (
        <Card className="mt-2 p-3">
          <div className="flex flex-col space-y-2">
            <Input
              type="password"
              placeholder="Enter Mapbox public token"
              value={mapboxToken}
              onChange={(e) => setMapboxToken(e.target.value)}
            />
            <div className="flex space-x-2">
              <Button size="sm" onClick={handleTokenSubmit}>
                Add Token
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowTokenInput(false)}>
                Cancel
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
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
      )}

      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="p-3 hover:bg-accent cursor-pointer border-b last:border-b-0"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{suggestion.place_name}</span>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
};

export default LocationInput;