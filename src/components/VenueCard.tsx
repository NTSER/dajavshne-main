
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Wifi, Car, Tag, Zap } from "lucide-react";
import { Venue, useVenueServices } from "@/hooks/useVenues";
import FavoriteButton from "./FavoriteButton";

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
            <div className="px-4 py-2 flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Zap className="h-4 w-4 text-blue-600 animate-pulse" />
                <Tag className="h-3 w-3 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-blue-600">
                {serviceCount} Service{serviceCount > 1 ? 's' : ''} Available
              </span>
              <Badge variant="secondary" className="ml-auto bg-blue-100 text-blue-700 text-xs">
                View Details
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
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <Badge variant="secondary" className="bg-white/90 text-gray-700 border-gray-200 shadow-sm">
              {venue.category}
            </Badge>
          </div>
          <div className="absolute top-3 left-3">
            <FavoriteButton venueId={venue.id} size="sm" />
          </div>
        </div>
        
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
              {venue.name}
            </h3>
            <div className="flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-gray-900">{venue.rating}</span>
              <span className="text-gray-500">({venue.review_count})</span>
            </div>
          </div>
          
          <div className="flex items-center text-gray-500 mb-3">
            <MapPin className="h-4 w-4 mr-1" />
            <span className="text-sm">{venue.location}</span>
          </div>
          
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {venue.description}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {venue.amenities?.slice(0, 2).map((amenity) => (
                <div key={amenity} className="flex items-center text-xs text-gray-500">
                  {amenity === 'WiFi' && <Wifi className="h-3 w-3 mr-1" />}
                  {amenity === 'Parking' && <Car className="h-3 w-3 mr-1" />}
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
            <div className="text-right">
              <span className="font-semibold text-blue-600">${venue.price}</span>
              <span className="text-sm text-gray-500">/hour</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default VenueCard;
