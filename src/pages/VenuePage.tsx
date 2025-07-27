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
  ArrowLeft,
  Clock,
  Users,
  Wifi,
  Car,
  Coffee,
  Shield
} from "lucide-react";
import { Link } from "react-router-dom";
import { useVenue, useVenueServices, VenueService } from "@/hooks/useVenues";
import BookingForm from "@/components/BookingForm";
import ServiceDiscountBanner from "@/components/ServiceDiscountBanner";
import ReviewsList from "@/components/ReviewsList";
import VenueMap from "@/components/VenueMap";
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

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case 'wifi': return <Wifi className="h-4 w-4" />;
      case 'parking': return <Car className="h-4 w-4" />;
      case 'food': case 'snacks': case 'catering': return <Coffee className="h-4 w-4" />;
      case 'security': return <Shield className="h-4 w-4" />;
      default: return <div className="h-4 w-4 bg-primary/20 rounded-full" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header Navigation */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to venues
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Service Discount Banner */}
        <ServiceDiscountBanner 
          services={services || []}
          selectedService={selectedService}
          className="mb-6"
        />
        
        {/* Main Content - Booking Focused Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
          
          {/* Left Side - Venue Information (3/5 width) */}
          <div className="xl:col-span-3 space-y-8">
            
            {/* Venue Header */}
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold text-foreground">{venue.name}</h1>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-primary text-primary" />
                      <span className="font-medium text-foreground">{venue.rating}</span>
                      <span className="text-muted-foreground">({venue.review_count} reviews)</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{venue.location}</span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="w-fit">
                    {venue.category}
                  </Badge>
                </div>
                
                {/* Quick Info Card */}
                <Card className="p-4 min-w-[200px]">
                  <div className="text-center space-y-2">
                    <div className="text-2xl font-bold text-primary">${venue.price}</div>
                    <div className="text-sm text-muted-foreground">per hour</div>
                    {venue.opening_time && venue.closing_time && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{venue.opening_time} - {venue.closing_time}</span>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </div>

            {/* Image Gallery */}
            <div className="rounded-xl overflow-hidden">
              <Carousel className="w-full">
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
                <CarouselPrevious className="left-4" />
                <CarouselNext className="right-4" />
              </Carousel>
            </div>

            {/* Venue Description */}
            {venue.description && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-3">About this venue</h3>
                  <p className="text-muted-foreground leading-relaxed">{venue.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Amenities */}
            {venue.amenities && venue.amenities.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">What this place offers</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {venue.amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                        {getAmenityIcon(amenity)}
                        <span className="text-sm font-medium">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Services Section */}
            {services && services.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Available Services</h3>
                  <div className="grid gap-4">
                    {services.map((service) => (
                      <div 
                        key={service.id}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedService?.id === service.id 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => setSelectedService(service)}
                      >
                        <div className="flex items-start gap-4">
                          {service.images && service.images.length > 0 && (
                            <img
                              src={service.images[0]}
                              alt={service.name}
                              className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                            />
                          )}
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg mb-1">{service.name}</h4>
                            <div className="flex items-center gap-4 mb-2">
                              <Badge variant="secondary">${service.price}/guest</Badge>
                              <Badge variant="outline">{service.duration}</Badge>
                            </div>
                            {service.description && (
                              <p className="text-sm text-muted-foreground">
                                {service.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Location Map */}
            <Card>
              <CardContent className="p-0">
                <VenueMap location={venue.location} venueName={venue.name} />
              </CardContent>
            </Card>

            {/* Reviews Section */}
            <div>
              <ReviewsList venueId={venue.id} />
            </div>
          </div>

          {/* Right Side - Booking Form (2/5 width) */}
          <div className="xl:col-span-2">
            <div className="sticky top-24">
              <Card className="border-2 border-primary/20 shadow-xl">
                <CardContent className="p-6">
                  <div className="mb-6 text-center">
                    <div className="text-3xl font-bold text-primary mb-2">
                      ${venue.price}
                      <span className="text-lg font-normal text-muted-foreground ml-1">per hour</span>
                    </div>
                    {venue.opening_time && venue.closing_time && (
                      <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Open {venue.opening_time} - {venue.closing_time}</span>
                      </div>
                    )}
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
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenuePage;