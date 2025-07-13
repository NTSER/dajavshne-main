
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
import VenueServices from "@/components/VenueServices";
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
          <h1 className="text-2xl font-bold mb-4">Venue not found</h1>
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
      {/* Fixed Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to venues
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Image Gallery */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <Carousel className="w-full max-w-5xl mx-auto">
            <CarouselContent>
              {venue.images?.map((image, index) => (
                <CarouselItem key={index}>
                  <div className="aspect-[16/9] relative overflow-hidden rounded-xl">
                    <img
                      src={image}
                      alt={`${venue.name} - Image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </CarouselItem>
              )) || (
                <CarouselItem>
                  <div className="aspect-[16/9] bg-muted rounded-xl flex items-center justify-center">
                    <span className="text-muted-foreground">No images available</span>
                  </div>
                </CarouselItem>
              )}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </motion.div>

        {/* Main Content Layout - Airbnb Style */}
        <div className="flex flex-col lg:flex-row gap-8 relative">
          {/* Left Column - Scrollable Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex-1 lg:max-w-2xl space-y-8"
          >
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {venue.category}
                </Badge>
              </div>
              
              <h1 className="text-3xl lg:text-4xl font-bold mb-4">{venue.name}</h1>
              
              <div className="flex items-center gap-6 text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{venue.rating}</span>
                  <span>({venue.review_count} reviews)</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <MapPin className="h-5 w-5" />
                  <span>{venue.location}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="border-b pb-8">
              <h2 className="text-xl font-semibold mb-4">About this venue</h2>
              <p className="text-muted-foreground leading-relaxed">
                {venue.description || "Experience premium gaming in a state-of-the-art facility designed for both casual and competitive gaming."}
              </p>
            </div>

            {/* Amenities */}
            {venue.amenities && venue.amenities.length > 0 && (
              <div className="border-b pb-8">
                <h2 className="text-xl font-semibold mb-4">What this place offers</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {venue.amenities.map((amenity) => {
                    const IconComponent = amenityIcons[amenity];
                    return (
                      <div key={amenity} className="flex items-center gap-3 py-2">
                        {IconComponent && <IconComponent className="h-5 w-5 text-muted-foreground" />}
                        <span>{amenity}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Services */}
            {!servicesLoading && services && services.length > 0 && (
              <div className="border-b pb-8">
                <VenueServices
                  services={services}
                  onServiceSelect={setSelectedService}
                  selectedService={selectedService}
                />
              </div>
            )}

            {/* Additional spacing for mobile */}
            <div className="lg:hidden h-20" />
          </motion.div>

          {/* Right Column - Sticky Booking Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="lg:w-96 lg:sticky lg:top-24 lg:self-start"
          >
            <div className="lg:shadow-lg lg:border lg:rounded-xl lg:p-6 bg-background">
              <BookingForm 
                venue={venue} 
                service={selectedService}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default VenuePage;
