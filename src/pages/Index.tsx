
import { motion } from "framer-motion";
import EnhancedSearchFilters from "@/components/EnhancedSearchFilters";
import VenueCard from "@/components/VenueCard";
import CategoryCard from "@/components/CategoryCard";
import Header from "@/components/Header";
import { useVenues } from "@/hooks/useVenues";
import { categories } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star, Zap, Trophy } from "lucide-react";

const Index = () => {
  const { data: venues, isLoading } = useVenues();

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Admin Access Button */}
      <div className="fixed top-20 right-4 z-50">
        <Button 
          onClick={() => window.location.href = '/admin'}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
        >
          Admin Panel
        </Button>
      </div>
      
      {/* Search Section */}
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="max-w-5xl mx-auto"
          >
            <EnhancedSearchFilters />
          </motion.div>
        </div>
      </section>


      {/* Enhanced Featured Venues Section */}
      <section className="section-padding bg-white">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-6 py-2 mb-6">
              <Star className="w-4 h-4 text-primary fill-current" />
              <span className="text-sm font-medium text-primary">Featured Venues</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-bold mb-8 gradient-text">
              Top Gaming Destinations
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12">
              Handpicked venues offering the ultimate gaming experience with cutting-edge technology and unbeatable atmosphere
            </p>
          </motion.div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 h-64 rounded-2xl mb-4 shimmer" />
                  <div className="bg-gray-200 h-4 rounded mb-2 shimmer" />
                  <div className="bg-gray-200 h-4 rounded w-2/3 shimmer" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {venues?.slice(0, 6).map((venue, index) => (
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
        <div className="container mx-auto">
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
