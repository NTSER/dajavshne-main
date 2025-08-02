
import { motion } from "framer-motion";
import EnhancedSearchFilters from "@/components/EnhancedSearchFilters";
import VenueCard from "@/components/VenueCard";
import CategoryCard from "@/components/CategoryCard";
import Header from "@/components/Header";
import HomePageFilters from "@/components/HomePageFilters";
import { useVenues, useVenueServices } from "@/hooks/useVenues";
import { categories } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star, Zap, Trophy } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const { data: venues, isLoading } = useVenues();
  const [filteredVenues, setFilteredVenues] = useState(venues);

  // Fetch all venue services for filtering
  const { data: allVenueServices } = useQuery({
    queryKey: ['all-venue-services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('venue_services')
        .select('*');
      
      if (error) throw error;
      return data;
    }
  });

  // Update filtered venues when venues data changes
  useEffect(() => {
    setFilteredVenues(venues);
  }, [venues]);

  const handleFiltersChange = (filters: any) => {
    if (!venues || !allVenueServices) {
      setFilteredVenues(venues);
      return;
    }

    let filtered = venues;

    console.log('Applying filters:', filters);
    console.log('Total venues:', venues.length);
    console.log('Total services:', allVenueServices.length);

    // Apply category filter
    if (filters.category) {
      const venueIdsWithCategory = allVenueServices
        .filter(service => service.service_type === filters.category)
        .map(service => service.venue_id);
      
      filtered = filtered.filter(venue => venueIdsWithCategory.includes(venue.id));
      console.log('After category filter:', filtered.length, 'venues');
    }

    // Apply games filter
    if (filters.games && filters.games.length > 0) {
      const venueIdsWithGames = allVenueServices
        .filter(service => {
          // Check if service has any of the selected games
          const serviceGames = service.service_games || [];
          return filters.games.some((game: string) => 
            serviceGames.includes(game) || 
            service.service_type?.toLowerCase().includes(game.toLowerCase()) ||
            service.name?.toLowerCase().includes(game.toLowerCase())
          );
        })
        .map(service => service.venue_id);
      
      filtered = filtered.filter(venue => venueIdsWithGames.includes(venue.id));
      console.log('After games filter:', filtered.length, 'venues');
    }

    // Apply location filter
    if (filters.location) {
      filtered = filtered.filter(venue => 
        venue.location.toLowerCase().includes(filters.location.toLowerCase())
      );
      console.log('After location filter:', filtered.length, 'venues');
    }

    // Apply rating filter
    if (filters.rating) {
      const minRating = parseFloat(filters.rating);
      filtered = filtered.filter(venue => venue.rating >= minRating);
      console.log('After rating filter:', filtered.length, 'venues');
    }

    // Apply price range filter
    if (filters.priceRange) {
      const [minPrice, maxPrice] = filters.priceRange.split('-').map((p: string) => {
        if (p.includes('+')) return [parseInt(p.replace('+', '')), Infinity];
        return parseInt(p);
      });
      
      const venueIdsInPriceRange = allVenueServices
        .filter(service => {
          const price = service.price;
          if (maxPrice === undefined) return price >= minPrice; // For "50+" case
          return price >= minPrice && price <= maxPrice;
        })
        .map(service => service.venue_id);
      
      filtered = filtered.filter(venue => venueIdsInPriceRange.includes(venue.id));
      console.log('After price filter:', filtered.length, 'venues');
    }

    console.log('Final filtered venues:', filtered.length);
    setFilteredVenues(filtered);
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Admin Access Button - Mobile responsive */}
      <div className="fixed top-20 right-2 sm:right-4 z-40">
        <Button 
          onClick={() => window.location.href = '/admin'}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
          size="sm"
        >
          <span className="hidden sm:inline">Admin Panel</span>
          <span className="sm:hidden">Admin</span>
        </Button>
      </div>
      


      {/* Enhanced Featured Venues Section */}
      <section className="section-padding bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Filter Component - positioned on the left above venues */}
          <div className="flex justify-start mb-6 sm:mb-8">
            <HomePageFilters onFiltersChange={handleFiltersChange} />
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 h-48 sm:h-56 lg:h-64 rounded-2xl mb-4 shimmer" />
                  <div className="bg-gray-200 h-4 rounded mb-2 shimmer" />
                  <div className="bg-gray-200 h-4 rounded w-2/3 shimmer" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {(filteredVenues || venues)?.slice(0, 6).map((venue, index) => (
                <motion.div
                  key={venue.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="hover-lift"
                >
                  <VenueCard venue={venue} />
                </motion.div>
              ))}
            </div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className="text-center mt-16"
          >
            <Button 
              variant="outline" 
              size="lg" 
              className="group"
              onClick={() => window.location.href = '/search'}
            >
              View All Venues
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 section-padding">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl">D</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold gradient-text">
                    Dajavshne
                  </span>
                  <span className="text-sm text-gray-500">
                    Gaming Hub
                  </span>
                </div>
              </div>
              <p className="text-gray-600 mb-6 max-w-md">
                Your premier destination for discovering and booking exceptional gaming venues worldwide. 
                Experience the future of gaming entertainment.
              </p>
              <div className="flex space-x-3">
                <Button variant="outline" size="icon">
                  <span className="text-sm">f</span>
                </Button>
                <Button variant="outline" size="icon">
                  <span className="text-sm">t</span>
                </Button>
                <Button variant="outline" size="icon">
                  <span className="text-sm">i</span>
                </Button>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-6 text-blue-600">Quick Links</h3>
              <ul className="space-y-3 text-gray-600">
                <li><a href="/" className="hover:text-gray-900 transition-colors">Home</a></li>
                <li><a href="/search" className="hover:text-gray-900 transition-colors">Browse Venues</a></li>
                <li><a href="/categories" className="hover:text-gray-900 transition-colors">Categories</a></li>
                <li><a href="/about" className="hover:text-gray-900 transition-colors">About</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-6 text-indigo-600">Support</h3>
              <ul className="space-y-3 text-gray-600">
                <li><a href="#" className="hover:text-gray-900 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-8 text-center text-gray-500">
            <p>&copy; 2024 Dajavshne Gaming Hub. All rights reserved. Elevating your gaming experience worldwide.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
