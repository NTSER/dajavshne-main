import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from "@/components/ui/carousel";
import { 
  Star, 
  MapPin, 
  Wifi, 
  Car, 
  ArrowLeft
} from "lucide-react";
import { Link } from "react-router-dom";
import { useVenue, useVenueServices, VenueService } from "@/hooks/useVenues";
import BookingForm from "@/components/BookingForm";
import VenueMap from "@/components/VenueMap";
import ServiceDiscountBanner from "@/components/ServiceDiscountBanner";
import { useState } from "react";

const VenuePage = () => {
  const { id } = useParams<{ id: string }>();
  const [selectedService, setSelectedService] = useState<VenueService | undefined>();
  
  const { data: venue, isLoading: venueLoading, error: venueError } = useVenue(id!);
  const { data: services, isLoading: servicesLoading } = useVenueServices(id!);

  if (venueLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-muted rounded w-1/4" />
            <div className="h-96 bg-muted rounded-lg" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-8 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-20 bg-muted rounded" />
              </div>
              <div className="h-96 bg-muted rounded-lg" />
            </div>
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header Navigation */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to venues
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Service Discount Banner - Top of venue */}
        <ServiceDiscountBanner 
          services={services || []}
          selectedService={selectedService}
          className="mb-6"
        />
        
        {/* Main Layout - Airbnb Style */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-140px)]">
          
          {/* Left Side - Stationary Content */}
          <div className="lg:col-span-7 h-full overflow-hidden">
            <div className="h-full overflow-y-auto pr-4 space-y-8">
              
              {/* Title and Actions */}
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-semibold text-foreground mb-2">{venue.name}</h1>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-primary text-primary" />
                      <span className="font-medium text-foreground">{venue.rating}</span>
                      <span>·</span>
                      <span className="underline hover:text-foreground transition-colors cursor-pointer">{venue.review_count} reviews</span>
                    </div>
                    <span>·</span>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span className="underline hover:text-foreground transition-colors cursor-pointer">{venue.location}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Image Gallery */}
              <div className="rounded-xl overflow-hidden bg-card">
                <Carousel className="w-full">
                  <CarouselContent>
                    {venue.images?.map((image, index) => (
                      <CarouselItem key={index}>
                        <div className="aspect-[16/10] relative overflow-hidden">
                          <img
                            src={image}
                            alt={`${venue.name} - Image ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </CarouselItem>
                    )) || (
                      <CarouselItem>
                        <div className="aspect-[16/10] bg-muted rounded-xl flex items-center justify-center">
                          <span className="text-muted-foreground">No images available</span>
                        </div>
                      </CarouselItem>
                    )}
                  </CarouselContent>
                  <CarouselPrevious className="left-4" />
                  <CarouselNext className="right-4" />
                </Carousel>
              </div>

              {/* Host Info */}
              <div className="flex items-center gap-4 py-6 border-b border-border">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground font-medium">H</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Hosted by Venue Manager</h3>
                  <p className="text-sm text-muted-foreground">Superhost · 2 years hosting</p>
                </div>
              </div>

              {/* Description */}
              <div className="py-6 border-b border-border">
                <p className="text-muted-foreground leading-relaxed text-base">
                  {venue.description || "Experience premium gaming in a state-of-the-art facility designed for both casual and competitive gaming. Our venue offers cutting-edge equipment and an atmosphere perfect for tournaments and casual gaming sessions."}
                </p>
              </div>

              {/* Amenities */}
              {venue.amenities && venue.amenities.length > 0 && (
                <div className="py-6 border-b border-border">
                  <h2 className="text-xl font-semibold mb-6 text-foreground">What this place offers</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {venue.amenities.map((amenity) => {
                      const IconComponent = amenityIcons[amenity];
                      return (
                        <div key={amenity} className="flex items-center gap-4 py-3">
                          {IconComponent && <IconComponent className="h-6 w-6 text-muted-foreground" />}
                          <span className="text-foreground">{amenity}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Right Side - Booking Form */}
          <div className="lg:col-span-5 h-full flex flex-col">
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto space-y-6 pb-20">
              
              {/* Price and Basic Info - Enhanced prominence */}
              <div className="bg-card border-2 border-primary/20 rounded-2xl p-8 shadow-2xl glass-effect ring-2 ring-primary/10 hover:ring-primary/20 transition-all duration-300">
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-3xl font-bold text-foreground">${venue.price}</span>
                  <span className="text-lg text-muted-foreground">per hour</span>
                </div>
                
                <BookingForm 
                  venueId={venue.id}
                  venueName={venue.name}
                  venuePrice={venue.price}
                  defaultDiscount={venue.default_discount_percentage || 0}
                  openingTime={venue.opening_time}
                  closingTime={venue.closing_time}
                  services={services}
                  selectedServiceId={selectedService?.id}
                />
              </div>


              {/* Venue Location Map */}
              <VenueMap location={venue.location} venueName={venue.name} />

              {/* Additional Info */}
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  You can message the host to customize or make changes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenuePage;
