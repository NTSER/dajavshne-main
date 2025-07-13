
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Wifi, Car } from "lucide-react";

interface Venue {
  id: string;
  name: string;
  category: string;
  location: string;
  rating: number;
  reviewCount: number;
  price: string;
  image: string;
  amenities: string[];
  description: string;
}

interface VenueCardProps {
  venue: Venue;
}

const VenueCard = ({ venue }: VenueCardProps) => {
  return (
    <Link to={`/venue/${venue.id}`}>
      <Card className="hover-lift cursor-pointer group border-white/10 bg-card/50 hover:bg-card/70 transition-all duration-300 overflow-hidden">
        <div className="aspect-[4/3] relative overflow-hidden">
          <img
            src={venue.image}
            alt={venue.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-3 right-3">
            <Badge variant="secondary" className="bg-black/60 text-white border-white/20">
              {venue.category}
            </Badge>
          </div>
        </div>
        
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
              {venue.name}
            </h3>
            <div className="flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span>{venue.rating}</span>
              <span className="text-muted-foreground">({venue.reviewCount})</span>
            </div>
          </div>
          
          <div className="flex items-center text-muted-foreground mb-3">
            <MapPin className="h-4 w-4 mr-1" />
            <span className="text-sm">{venue.location}</span>
          </div>
          
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {venue.description}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {venue.amenities.slice(0, 2).map((amenity) => (
                <div key={amenity} className="flex items-center text-xs text-muted-foreground">
                  {amenity === 'WiFi' && <Wifi className="h-3 w-3 mr-1" />}
                  {amenity === 'Parking' && <Car className="h-3 w-3 mr-1" />}
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
            <div className="text-right">
              <span className="font-semibold text-primary">{venue.price}</span>
              <span className="text-sm text-muted-foreground">/hour</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default VenueCard;
