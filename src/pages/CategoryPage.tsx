
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import VenueCard from "@/components/VenueCard";
import { categories } from "@/data/mockData";
import { useVenues } from "@/hooks/useVenues";

const CategoryPage = () => {
  const { category } = useParams();
  const { data: venues, isLoading } = useVenues();
  
  const categoryData = categories.find(c => c.id === category);
  
  // Filter venues from database instead of mock data
  const filteredVenues = venues?.filter(venue => 
    venue.category.toLowerCase().includes(category?.replace('-', ' ') || '')
  ) || [];

  if (!categoryData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Category not found</h1>
          <Link to="/">
            <Button>Return Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const Icon = categoryData.icon;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-effect border-b border-white/10">
        <div className="px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 hover:text-primary transition-colors">
              <ArrowLeft className="h-5 w-5" />
              <span>Back to home</span>
            </Link>
            <h1 className="font-semibold text-lg gradient-text">Dajavshne</h1>
          </div>
        </div>
      </header>

      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Category Header */}
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div 
              className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${categoryData.color}20`, color: categoryData.color }}
            >
              <Icon className="h-8 w-8" />
            </div>
            <h1 className="text-4xl font-bold mb-4">{categoryData.name}</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {categoryData.description}
            </p>
            <p className="text-muted-foreground mt-2">
              {filteredVenues.length} venue{filteredVenues.length !== 1 ? 's' : ''} available
            </p>
          </motion.div>

          {/* Venues Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-muted h-64 rounded-lg mb-4" />
                  <div className="bg-muted h-4 rounded mb-2" />
                  <div className="bg-muted h-4 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : filteredVenues.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredVenues.map((venue, index) => (
                <motion.div
                  key={venue.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <VenueCard venue={venue} />
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div 
              className="text-center py-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="glass-effect rounded-2xl p-12 max-w-md mx-auto">
                <Icon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No venues found</h3>
                <p className="text-muted-foreground mb-6">
                  We're working on adding more {categoryData.name.toLowerCase()} in your area.
                </p>
                <Link to="/">
                  <Button>Explore Other Categories</Button>
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;
