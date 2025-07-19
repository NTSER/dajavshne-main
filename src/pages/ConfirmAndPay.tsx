import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Star, MapPin, Users, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useVenue } from "@/hooks/useVenues";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import AuthDialog from "@/components/AuthDialog";

interface BookingData {
  venueId: string;
  venueName: string;
  serviceIds: string[];
  date: string;
  arrivalTime: string;
  departureTime: string;
  serviceBookings: Array<{
    serviceId: string;
    arrivalTime: string;
    departureTime: string;
  }>;
  guests: number;
  specialRequests?: string;
  totalPrice: number;
}

interface LocationState {
  bookingData: BookingData;
  requiresAuth?: boolean;
}

const ConfirmAndPay = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const locationState = location.state as LocationState;
  const bookingData = locationState?.bookingData;
  
  const { data: venue } = useVenue(bookingData?.venueId);
  
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    if (!bookingData) {
      navigate('/');
      return;
    }
  }, [bookingData, navigate]);

  if (!bookingData || !venue) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Booking not found</h1>
          <Button onClick={() => navigate('/')}>Return to Home</Button>
        </div>
      </div>
    );
  }

  const handleContinue = async () => {
    if (!user && currentStep === 1) {
      // Show auth dialog requirement
      toast({
        title: "Authentication Required",
        description: "Please sign in to continue with your booking.",
      });
      return;
    }
    
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      // Process the actual booking when user confirms payment
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to complete your booking.",
          variant: "destructive",
        });
        return;
      }

      try {
        // Validate booking data before proceeding
        if (!bookingData.date || !bookingData.arrivalTime || !bookingData.departureTime) {
          toast({
            title: "Invalid booking data",
            description: "Please go back and ensure all booking times are selected.",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Processing booking...",
          description: "Creating your booking and processing payment...",
        });

        // Create the booking in the database
        const { data: booking, error: bookingError } = await supabase
          .from('bookings')
          .insert({
            user_id: user.id,
            user_email: user.email,
            venue_id: bookingData.venueId,
            service_id: bookingData.serviceIds.length > 0 ? bookingData.serviceIds[0] : null,
            booking_date: bookingData.date,
            booking_time: bookingData.arrivalTime,
            guest_count: bookingData.guests,
            total_price: bookingData.totalPrice,
            special_requests: (bookingData.specialRequests || '') + 
              `\nArrival: ${bookingData.arrivalTime}, Departure: ${bookingData.departureTime}` +
              (bookingData.serviceBookings.length > 0 ? 
                `\nService Times: ${bookingData.serviceBookings.map(sb => 
                  `Service ${sb.serviceId}: ${sb.arrivalTime} - ${sb.departureTime}`
                ).join(', ')}` : ''),
            status: 'pending'
          })
          .select()
          .single();

        if (bookingError) {
          throw bookingError;
        }

        // Note: No notifications sent at booking creation
        // Confirmation/rejection notifications will be sent only when partner takes action

        toast({
          title: "Booking Request Submitted!",
          description: "Your booking request has been sent to the venue owner for approval.",
        });
        
        setTimeout(() => {
          navigate('/');
        }, 2000);
        
      } catch (error: any) {
        console.error("Booking error:", error);
        toast({
          title: "Booking Failed",
          description: error.message || "Failed to create booking. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "EEEE, MMM d, yyyy");
  };

  const formatTime = (timeString: string) => {
    if (!timeString || timeString === '') {
      return 'Not selected';
    }
    const [hours, minutes] = timeString.split(':');
    if (!hours || !minutes) {
      return 'Invalid time';
    }
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const calculateDuration = (startTime: string, endTime: string) => {
    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(`2000-01-01T${endTime}:00`);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    } else {
      return `${diffMinutes}m`;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold gradient-text">Confirm and pay</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Side - Steps */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Step 1 - Login */}
            <Card className={`glass-effect transition-all duration-200 ${currentStep === 1 ? 'border-primary/50' : 'border-border/50'}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      user ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                      1
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Log in or sign up</h3>
                      {user && (
                        <p className="text-sm text-muted-foreground">Logged in as {user.email}</p>
                      )}
                    </div>
                  </div>
                   {currentStep === 1 && (
                     <>
                       {user ? (
                         <Button 
                           onClick={handleContinue}
                           className="pulse-glow"
                         >
                           Continue
                         </Button>
                       ) : (
                         <div className="flex gap-2">
                           <AuthDialog defaultMode="signin">
                             <Button className="pulse-glow">
                               Log in
                             </Button>
                           </AuthDialog>
                           <AuthDialog defaultMode="signup">
                             <Button variant="outline">
                               Sign up
                             </Button>
                           </AuthDialog>
                         </div>
                       )}
                     </>
                   )}
                </div>
              </CardContent>
            </Card>

            {/* Step 2 - Payment Method */}
            <Card className={`glass-effect transition-all duration-200 ${
              currentStep === 2 ? 'border-primary/50' : currentStep > 2 ? 'border-primary/30' : 'border-border/30 opacity-60'
            }`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                      2
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Add a payment method</h3>
                      {currentStep > 2 && (
                        <p className="text-sm text-muted-foreground">Test payment method added</p>
                      )}
                    </div>
                  </div>
                  {currentStep === 2 && (
                    <Button 
                      onClick={handleContinue}
                      className="pulse-glow"
                    >
                      Add Payment
                    </Button>
                  )}
                </div>
                {currentStep === 2 && (
                  <div className="mt-4 p-4 bg-muted/20 rounded-xl">
                    <p className="text-sm text-muted-foreground">
                      🧪 This is a test environment. No real payment will be processed.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Step 3 - Review */}
            <Card className={`glass-effect transition-all duration-200 ${
              currentStep === 3 ? 'border-primary/50' : 'border-border/30 opacity-60'
            }`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      currentStep >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                      3
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Review your request</h3>
                      <p className="text-sm text-muted-foreground">Confirm booking details</p>
                    </div>
                  </div>
                  {currentStep === 3 && (
                    <Button 
                      onClick={handleContinue}
                      className="pulse-glow bg-gradient-to-r from-primary to-secondary"
                    >
                      Confirm Payment
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Booking Summary */}
          <div className="lg:col-span-5">
            <Card className="glass-effect border-primary/20 sticky top-24">
              <CardContent className="p-6 space-y-6">
                
                {/* Venue Info */}
                <div className="flex gap-4">
                  <div className="w-20 h-20 bg-muted rounded-xl flex items-center justify-center">
                    {venue.images && venue.images[0] ? (
                      <img 
                        src={venue.images[0]} 
                        alt={venue.name}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <span className="text-muted-foreground text-sm">Gaming</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{venue.name}</h3>
                    <p className="text-sm text-muted-foreground">Premium gaming experience</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-4 h-4 fill-primary text-primary" />
                      <span className="text-sm font-medium">{venue.rating}</span>
                      <span className="text-sm text-muted-foreground">({venue.review_count})</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border/50 pt-4 space-y-4">
                  <p className="text-sm text-muted-foreground">This reservation is non-refundable.</p>
                  
                  {/* Date and Time */}
                  <div>
                    <h4 className="font-medium text-foreground mb-1">Date</h4>
                    <p className="text-sm text-muted-foreground">{formatDate(bookingData.date)}</p>
                    <div className="mt-2">
                      <h5 className="text-sm font-medium text-foreground mb-1">Booking Time</h5>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {formatTime(bookingData.arrivalTime)} - {formatTime(bookingData.departureTime)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Duration: {calculateDuration(bookingData.arrivalTime, bookingData.departureTime)}
                      </p>
                    </div>
                  </div>

                  {/* Guests */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-foreground">Guests</h4>
                      <p className="text-sm text-muted-foreground">{bookingData.guests} guest{bookingData.guests > 1 ? 's' : ''}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="text-primary">
                      Change
                    </Button>
                  </div>

                  {/* Location */}
                  <div>
                    <h4 className="font-medium text-foreground mb-1">Location</h4>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">{venue.location}</p>
                    </div>
                  </div>
                </div>

                {/* Price Details */}
                <div className="border-t border-border/50 pt-4 space-y-3">
                  <h4 className="font-medium text-foreground">Price details</h4>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      ${venue.price} × {bookingData.guests} guest{bookingData.guests > 1 ? 's' : ''}
                    </span>
                    <span className="text-sm text-foreground">${bookingData.totalPrice}</span>
                  </div>
                  
                  <div className="border-t border-border/50 pt-3 flex justify-between font-semibold">
                    <span className="text-foreground">Total USD</span>
                    <span className="text-foreground gradient-text text-lg">${bookingData.totalPrice}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmAndPay;
