
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Star, 
  MapPin, 
  Wifi, 
  Car, 
  Coffee,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { popularVenues } from "@/data/mockData";

const VenuePage = () => {
  const { id } = useParams();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  
  const venue = popularVenues.find(v => v.id === id);
  
  if (!venue) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Venue not found</h1>
          <Link to="/">
            <Button>Return Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === venue.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? venue.images.length - 1 : prev - 1
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-effect border-b border-white/10">
        <div className="px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 hover:text-primary transition-colors">
              <ArrowLeft className="h-5 w-5" />
              <span>Back to search</span>
            </Link>
            <h1 className="font-semibold text-lg gradient-text">Dajavshne</h1>
          </div>
        </div>
      </header>

      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Left Column - Images and Basic Info */}
            <div className="lg:col-span-3 space-y-6">
              {/* Image Carousel */}
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
                <img
                  src={venue.images[currentImageIndex]}
                  alt={venue.name}
                  className="w-full h-full object-cover"
                />
                
                {venue.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 glass-effect p-2 rounded-full hover:bg-white/20 transition-colors"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 glass-effect p-2 rounded-full hover:bg-white/20 transition-colors"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                      {venue.images.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Venue Info */}
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-3xl font-bold">{venue.name}</h1>
                      <Badge variant="secondary" className="text-sm">
                        {venue.category}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{venue.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{venue.rating} ({venue.reviewCount} reviews)</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      {venue.price}<span className="text-base text-muted-foreground">/hour</span>
                    </div>
                  </div>
                </div>

                <p className="text-muted-foreground text-lg leading-relaxed">
                  {venue.description}
                </p>

                {/* Amenities */}
                <div className="flex flex-wrap gap-3">
                  {venue.amenities.map((amenity) => (
                    <div key={amenity} className="flex items-center gap-2 px-3 py-2 bg-card/50 rounded-lg">
                      {amenity === 'WiFi' && <Wifi className="h-4 w-4" />}
                      {amenity === 'Parking' && <Car className="h-4 w-4" />}
                      {amenity === 'Food' && <Coffee className="h-4 w-4" />}
                      <span className="text-sm">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Booking and Services */}
            <div className="lg:col-span-2 space-y-6">
              {/* Booking Card */}
              <Card className="glass-effect border-white/10 sticky top-24">
                <CardContent className="p-6 space-y-4">
                  <h3 className="text-xl font-semibold">Book Your Session</h3>
                  
                  {/* Quick Booking Form */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Date</label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <input
                            type="date"
                            className="w-full pl-10 pr-3 py-2 bg-background/50 border border-white/20 rounded-lg focus:ring-2 focus:ring-primary/50"
                            defaultValue={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Time</label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <input
                            type="time"
                            className="w-full pl-10 pr-3 py-2 bg-background/50 border border-white/20 rounded-lg focus:ring-2 focus:ring-primary/50"
                            defaultValue="18:00"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Duration</label>
                      <select className="w-full px-3 py-2 bg-background/50 border border-white/20 rounded-lg focus:ring-2 focus:ring-primary/50">
                        <option>1 hour</option>
                        <option>2 hours</option>
                        <option>3 hours</option>
                        <option>4 hours</option>
                      </select>
                    </div>

                    <Button className="w-full bg-primary hover:bg-primary/90 text-lg py-3">
                      Book Now - {venue.price}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Services */}
              <Card className="glass-effect border-white/10">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4">Available Services</h3>
                  <div className="space-y-3">
                    {venue.services.map((service, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border transition-all cursor-pointer ${
                          selectedService === service.name
                            ? 'border-primary bg-primary/10'
                            : 'border-white/20 hover:border-white/40 bg-background/30'
                        }`}
                        onClick={() => setSelectedService(
                          selectedService === service.name ? null : service.name
                        )}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium">{service.name}</h4>
                            <p className="text-sm text-muted-foreground">{service.duration}</p>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold text-lg">${service.price}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Reviews Preview */}
              <Card className="glass-effect border-white/10">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4">Recent Reviews</h3>
                  <div className="space-y-4">
                    {venue.reviews.slice(0, 2).map((review) => (
                      <div key={review.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{review.author}</span>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-600'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{review.comment}</p>
                      </div>
                    ))}
                    <Button variant="outline" className="w-full border-white/20">
                      View All Reviews
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Map Preview */}
              <Card className="glass-effect border-white/10">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4">Location</h3>
                  <div className="aspect-video bg-background/30 rounded-lg flex items-center justify-center border border-white/20">
                    <div className="text-center text-muted-foreground">
                      <MapPin className="h-8 w-8 mx-auto mb-2" />
                      <p>Interactive map coming soon</p>
                      <p className="text-sm">{venue.location}</p>
                    </div>
                  </div>
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
