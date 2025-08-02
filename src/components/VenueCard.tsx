
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Wifi, Car, Tag, Zap } from "lucide-react";
import { Venue, useVenueServices } from "@/hooks/useVenues";
import FavoriteButton from "./FavoriteButton";
import { getServiceDisplayPrice } from "@/utils/guestPricing";

interface VenueCardProps {
  venue: Venue;
}

const VenueCard = ({ venue }: VenueCardProps) => {
  const { data: services } = useVenueServices(venue.id);
  
  // Check if venue has services with potential offers
  const hasServiceOffers = services && services.length > 0;
  const serviceCount = services?.length || 0;

  return (
    <Link to={`/venue/${venue.id}`}>
      <Card className="hover-lift cursor-pointer group border-gray-200 bg-white hover:bg-gray-50 transition-all duration-300 overflow-hidden shadow-sm hover:shadow-lg">
        {/* Service Offer Banner - At top of venue card */}
        {hasServiceOffers && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
            <div className="px-3 sm:px-4 py-2 flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Zap className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 animate-pulse" />
                <Tag className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-blue-600" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-blue-600">
                {serviceCount} Service{serviceCount > 1 ? 's' : ''} Available
              </span>
              <Badge variant="secondary" className="ml-auto bg-blue-100 text-blue-700 text-xs px-2 py-1">
                <span className="hidden sm:inline">View Details</span>
                <span className="sm:hidden">Details</span>
              </Badge>
            </div>
          </div>
        )}
        
        <div className="aspect-[4/3] relative overflow-hidden">
          <img
            src={venue.images?.[0] || "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800"}
            alt={venue.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-2 sm:top-3 left-2 sm:left-3">
            <FavoriteButton venueId={venue.id} size="sm" />
          </div>
        </div>
        
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-sm sm:text-lg text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
              {venue.name}
            </h3>
            <div className="flex items-center gap-1 text-xs sm:text-sm flex-shrink-0 ml-2">
              <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-gray-900">{venue.rating}</span>
              <span className="text-gray-500 hidden sm:inline">({venue.review_count})</span>
            </div>
          </div>
          
          <div className="flex items-center text-gray-500 mb-2 sm:mb-3">
            <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
            <span className="text-xs sm:text-sm truncate">{venue.location}</span>
          </div>
          
          {/* Show service names instead of description */}
          <div className="mb-2 sm:mb-3 min-h-[32px] sm:min-h-[40px]">
            {services && services.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {services.slice(0, 3).map((service) => (
                  <Badge key={service.id} variant="outline" className="text-xs px-2 py-0.5">
                    {service.name}
                  </Badge>
                ))}
                {services.length > 3 && (
                  <Badge variant="outline" className="text-xs px-2 py-0.5">
                    +{services.length - 3} more
                  </Badge>
                )}
              </div>
            ) : (
              <div className="text-xs sm:text-sm text-gray-400">No services available</div>
            )}
          </div>
          
          <div className="flex items-center justify-end">
            <div className="text-right">
              <span className="font-semibold text-blue-600 text-sm sm:text-base">
                {services && services.length > 0 
                  ? (() => {
                      const prices = services.map(service => {
                        const displayPrice = getServiceDisplayPrice(service);
                        // Extract numeric value from "From X₾" or "X₾/guest" format
                        const numericMatch = displayPrice.match(/(\d+)₾/);
                        return numericMatch ? parseInt(numericMatch[1]) : service.price;
                      });
                      return `From ${Math.min(...prices)}₾`;
                    })()
                  : 'Contact'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default VenueCard;
