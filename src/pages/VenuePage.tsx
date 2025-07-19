
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Star, 
  MapPin, 
  Wifi, 
  Car, 
  ArrowLeft,
  Share,
  Heart,
  Filter
} from "lucide-react";
import { Link } from "react-router-dom";
import { useVenue, useVenueServices, useVenues } from "@/hooks/useVenues";
import MapboxMap from "@/components/MapboxMap";
import { useState } from "react";

const VenuePage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: venue, isLoading: venueLoading, error: venueError } = useVenue(id!);
  const { data: allVenues } = useVenues();
  const [showFilters, setShowFilters] = useState(false);

  if (venueLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-muted rounded w-1/4" />
            <div className="h-96 bg-muted rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (venueError || !venue) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 text-center">
          <h1 className="text-2xl font-bold mb-4 text-foreground">Venue not found</h1>
          <Link to="/">
            <Button>Return to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const amenityIcons: { [key: string]: any } = {
    'WiFi': Wifi,
    'Parking': Car,
  };

  // Get related venues (excluding current venue)
  const relatedVenues = allVenues?.filter(v => v.id !== venue.id).slice(0, 10) || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header Navigation */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/search" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Back to results
            </Link>
            
            <div className="flex items-center gap-2">
              <Button
                variant={showFilters ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Split Layout Container */}
      <div className="flex h-[calc(100vh-80px)]">
        
        {/* Left Side - Venue Details and Related Venues */}
        <div className="w-1/2 overflow-y-auto">
          <div className="p-6 space-y-6">
            
            {/* Current Venue Highlight */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="secondary" className="bg-primary/20 text-primary">
                  Current Selection
                </Badge>
              </div>
              
              <div className="aspect-[4/3] relative overflow-hidden rounded-lg mb-4">
                <img
                  src={venue.images?.[0] || "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800"}
                  alt={venue.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <Badge variant="secondary" className="bg-black/60 text-white border-white/20">
                    {venue.category}
                  </Badge>
                </div>
                <div className="absolute top-3 left-3">
                  <Button variant="ghost" size="sm" className="bg-white/20 hover:bg-white/30 text-white">
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <h2 className="text-xl font-semibold text-foreground">{venue.name}</h2>
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{venue.rating}</span>
                    <span className="text-muted-foreground">({venue.review_count})</span>
                  </div>
                </div>
                
                <div className="flex items-center text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span className="text-sm">{venue.location}</span>
                </div>
                
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {venue.description || "Premium gaming venue with state-of-the-art facilities"}
                </p>
                
                <div className="flex items-center justify-between pt-2">
                  <div className="flex gap-2">
                    {venue.amenities?.slice(0, 2).map((amenity) => {
                      const IconComponent = amenityIcons[amenity];
                      return (
                        <div key={amenity} className="flex items-center text-xs text-muted-foreground">
                          {IconComponent && <IconComponent className="h-3 w-3 mr-1" />}
                          <span>{amenity}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-semibold text-primary">${venue.price}</span>
                    <span className="text-sm text-muted-foreground">/hour</span>
                  </div>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button className="flex-1">
                    Reserve Now
                  </Button>
                  <Button variant="outline" size="sm">
                    <Share className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Header for Related Venues */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Similar venues nearby</h3>
                <p className="text-sm text-muted-foreground">{relatedVenues.length} venues found</p>
              </div>
            </div>

            {/* Related Venues Grid */}
            <div className="space-y-4">
              {relatedVenues.map((relatedVenue, index) => (
                <motion.div
                  key={relatedVenue.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Link to={`/venue/${relatedVenue.id}`}>
                    <Card className="hover-lift cursor-pointer group border-border bg-card hover:border-primary/30 transition-all duration-300">
                      <div className="flex gap-4 p-4">
                        <div className="w-32 h-24 flex-shrink-0">
                          <img
                            src={relatedVenue.images?.[0] || "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=400"}
                            alt={relatedVenue.name}
                            className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                              {relatedVenue.name}
                            </h4>
                            <div className="flex items-center gap-1 text-sm">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="font-medium">{relatedVenue.rating}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center text-muted-foreground">
                            <MapPin className="h-3 w-3 mr-1" />
                            <span className="text-xs">{relatedVenue.location}</span>
                          </div>
                          
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {relatedVenue.description}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex gap-2">
                              {relatedVenue.amenities?.slice(0, 2).map((amenity) => {
                                const IconComponent = amenityIcons[amenity];
                                return (
                                  <div key={amenity} className="flex items-center text-xs text-muted-foreground">
                                    {IconComponent && <IconComponent className="h-3 w-3 mr-1" />}
                                    <span>{amenity}</span>
                                  </div>
                                );
                              })}
                            </div>
                            <div className="text-right">
                              <span className="font-semibold text-primary">${relatedVenue.price}</span>
                              <span className="text-xs text-muted-foreground">/hour</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Interactive Map */}
        <div className="w-1/2 relative">
          <div className="h-full sticky top-0">
            <MapboxMap
              venues={[venue, ...relatedVenues]}
              selectedVenue={venue}
              height="h-full"
              showPrices={true}
            />
            
            {/* Map Controls Overlay */}
            <div className="absolute top-4 left-4 bg-background/95 backdrop-blur-sm rounded-lg p-2 shadow-lg border border-border">
              <p className="text-sm text-muted-foreground">
                {relatedVenues.length + 1} venues shown • Click markers for details
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenuePage;
