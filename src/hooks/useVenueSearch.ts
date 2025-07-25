import { useState, useEffect, useMemo } from 'react';
import { useVenues, Venue } from './useVenues';

export const useVenueSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const { data: venues, isLoading } = useVenues(false); // Only show visible venues

  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || !venues) return [];
    
    const query = searchQuery.toLowerCase().trim();
    
    return venues.filter((venue: Venue) => 
      venue.name.toLowerCase().includes(query) ||
      venue.location.toLowerCase().includes(query) ||
      venue.category.toLowerCase().includes(query)
    ).slice(0, 8); // Limit to 8 results for better UX
  }, [searchQuery, venues]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setIsSearching(query.length > 0);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
  };

  return {
    searchQuery,
    searchResults,
    isSearching,
    isLoading,
    handleSearch,
    clearSearch
  };
};