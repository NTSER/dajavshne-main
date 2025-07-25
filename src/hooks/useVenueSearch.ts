import { useState, useEffect, useMemo } from 'react';
import { useVenues, Venue } from './useVenues';

export const useVenueSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const { data: venues, isLoading } = useVenues(false); // Only show visible venues

  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || !venues || venues.length === 0) return [];
    
    const query = searchQuery.toLowerCase().trim();
    console.log('Searching for:', query, 'in venues:', venues.length);
    
    const results = venues.filter((venue: Venue) => {
      const nameMatch = venue.name.toLowerCase().includes(query);
      const locationMatch = venue.location.toLowerCase().includes(query);
      const categoryMatch = venue.category.toLowerCase().includes(query);
      
      if (nameMatch || locationMatch || categoryMatch) {
        console.log('Match found:', venue.name, { nameMatch, locationMatch, categoryMatch });
      }
      
      return nameMatch || locationMatch || categoryMatch;
    }).slice(0, 8);
    
    console.log('Search results:', results.length);
    return results;
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