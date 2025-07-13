
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
      <div className="min-h-screen bg-gradient-to-br from-background to-background/95 p-4">
        <div className="container mx-auto py-8">
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
      <div className="min-h-screen bg-gradient-to-br from-background to-background/95 p-4">
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
    <div className="min-h-screen bg-gradient-to-br from-background to-background/95">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to venues
        </Link>

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

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Venue Details */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-2 space-y-8"
          >
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {venue.category}
                </Badge>
              </div>
              
              <h1 className="text-4xl font-bold mb-4">{venue.name}</h1>
              
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
            <Card className="border-white/10 bg-card/50">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">About this venue</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {venue.description || "Experience premium gaming in a state-of-the-art facility designed for both casual and competitive gaming."}
                </p>
              </CardContent>
            </Card>

            {/* Amenities */}
            {venue.amenities && venue.amenities.length > 0 && (
              <Card className="border-white/10 bg-card/50">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Amenities</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {venue.amenities.map((amenity) => {
                      const IconComponent = amenityIcons[amenity];
                      return (
                        <div key={amenity} className="flex items-center gap-2">
                          {IconComponent && <IconComponent className="h-5 w-5 text-primary" />}
                          <span>{amenity}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Services */}
            {!servicesLoading && services && services.length > 0 && (
              <VenueServices
                services={services}
                onServiceSelect={setSelectedService}
                selectedService={selectedService}
              />
            )}
          </motion.div>

          {/* Right Column - Booking Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="lg:sticky lg:top-8"
          >
            <BookingForm 
              venue={venue} 
              service={selectedService}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default VenuePage;
