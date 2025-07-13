import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Minus, Plus, X, Clock, Users, Star } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface BookingFormProps {
  venue: {
    id: string;
    name: string;
    price: number;
  };
  service?: {
    id: string;
    name: string;
    price: number;
    duration: string;
  };
}

// Organized time slots in a more user-friendly format
const availableTimeSlots = [
  "12:45PM", "1:15PM", "1:45PM", "2:15PM", "2:45PM", "3:00PM",
  "3:15PM", "3:45PM", "4:00PM", "4:15PM", "4:45PM", "5:00PM",
  "5:15PM", "5:45PM", "6:00PM", "6:15PM", "6:45PM", "7:00PM",
  "7:15PM", "7:45PM", "8:15PM"
];

// Mock unavailable times - in a real app, this would come from your backend
const getUnavailableSlots = (date: Date | undefined) => {
  if (!date) return [];
  
  // Mock logic: some slots are unavailable on weekends
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  if (isWeekend) {
    return ["12:45PM", "1:15PM", "7:45PM", "8:15PM"];
  }
  
  // Mock some random unavailable slots for weekdays
  return ["2:15PM", "4:00PM", "6:15PM"];
};

const BookingForm = ({ venue, service }: BookingFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    date: undefined as Date | undefined,
    time: '',
    guests: 1,
    specialRequests: '',
  });

  const basePrice = service ? service.price : venue.price;
  const totalPrice = basePrice * formData.guests;
  const unavailableSlots = getUnavailableSlots(formData.date);

  const handleGuestChange = (increment: boolean) => {
    setFormData(prev => ({
      ...prev,
      guests: increment ? prev.guests + 1 : Math.max(1, prev.guests - 1)
    }));
  };

  const handleTimeSelect = (time: string) => {
    if (unavailableSlots.includes(time)) return; // Prevent selection of unavailable slots
    
    setFormData(prev => ({
      ...prev,
      time
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.date || !formData.time) {
      toast({
        title: "Missing Information",
        description: "Please select both date and time for your booking.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      // Navigate to confirm and pay page with booking data
      navigate('/confirm-and-pay', {
        state: {
          venueId: venue.id,
          serviceId: service?.id || null,
          date: format(formData.date, 'yyyy-MM-dd'),
          time: formData.time,
          guests: formData.guests,
          specialRequests: formData.specialRequests || null,
          totalPrice: totalPrice
        }
      });

      setIsOpen(false);

    } catch (error) {
      console.error('Navigation error:', error);
      toast({
        title: "Error",
        description: "There was an error processing your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Enhanced Reserve Button */}
      <Card className="glass-effect border-primary/20 hover-lift">
        <CardContent className="p-8">
          <div className="space-y-6">
            {/* Price Display */}
            <div className="text-center">
              <div className="text-4xl font-bold gradient-text mb-2">
                ${basePrice}
              </div>
              <div className="text-muted-foreground">per hour · per guest</div>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-primary text-primary" />
                <span>4.9</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>Max 8 guests</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>Instant booking</span>
              </div>
            </div>

            <Button 
              onClick={() => setIsOpen(true)}
              className="w-full h-14 text-lg pulse-glow"
              size="lg"
            >
              Reserve Your Spot
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Booking Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background/95 backdrop-blur-xl border border-primary/20 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl shadow-primary/10">
            {/* Enhanced Header */}
            <div className="flex items-center justify-between p-8 border-b border-border/50">
              <div>
                <h2 className="text-2xl font-bold gradient-text">Reserve Your Experience</h2>
                <p className="text-muted-foreground mt-1">Book your gaming session</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="rounded-full hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-8 space-y-8">
              {/* Enhanced Guest Counter */}
              <div className="flex items-center justify-between p-6 bg-muted/20 rounded-2xl border border-border/50">
                <div>
                  <span className="text-lg font-semibold">Guests</span>
                  <p className="text-sm text-muted-foreground">How many will join?</p>
                </div>
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleGuestChange(false)}
                    disabled={formData.guests <= 1}
                    className="rounded-full border-primary/30 hover:border-primary/50"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-bold text-xl text-primary">{formData.guests}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleGuestChange(true)}
                    className="rounded-full border-primary/30 hover:border-primary/50"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Enhanced Date Selection */}
              <div className="space-y-4">
                <Label className="text-lg font-semibold">Select Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-between text-left font-normal h-14 rounded-xl border-primary/30 hover:border-primary/50",
                        !formData.date && "text-muted-foreground"
                      )}
                    >
                      {formData.date ? format(formData.date, "EEEE, MMMM do, yyyy") : "Choose your date"}
                      <CalendarIcon className="h-5 w-5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 glass-effect border-primary/20" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.date}
                      onSelect={(date) => {
                        setFormData(prev => ({ ...prev, date, time: '' }));
                      }}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Enhanced Service Info */}
              {service && (
                <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-primary/10 via-secondary/5 to-primary/10 rounded-2xl border border-primary/20">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
                    <span className="text-white font-bold text-lg">SV</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-foreground">{service.name}</h3>
                    <p className="text-muted-foreground">
                      ${service.price} per guest • {service.duration}
                    </p>
                  </div>
                </div>
              )}

              {/* Enhanced Time Slots */}
              {formData.date && (
                <div className="space-y-6">
                  <Label className="text-lg font-semibold">Available Times</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {availableTimeSlots.map((time) => {
                      const isUnavailable = unavailableSlots.includes(time);
                      const isSelected = formData.time === time;
                      
                      return (
                        <Button
                          key={time}
                          variant={isSelected ? "default" : "outline"}
                          onClick={() => handleTimeSelect(time)}
                          disabled={isUnavailable}
                          className={cn(
                            "h-12 text-sm font-medium rounded-xl transition-all duration-200",
                            isUnavailable && "opacity-30 cursor-not-allowed",
                            isSelected && "shadow-lg shadow-primary/30 scale-105",
                            !isSelected && !isUnavailable && "border-primary/30 hover:border-primary/50 hover:scale-105"
                          )}
                        >
                          {time}
                        </Button>
                      );
                    })}
                  </div>
                  
                  {unavailableSlots.length > 0 && (
                    <p className="text-sm text-muted-foreground bg-muted/20 p-3 rounded-xl">
                      ℹ️ Grayed out times are unavailable for the selected date
                    </p>
                  )}
                </div>
              )}

              {/* Enhanced Special Requests */}
              <div className="space-y-4">
                <Label className="text-lg font-semibold">Special Requests <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                <Textarea
                  placeholder="Any special requirements, dietary restrictions, or requests..."
                  value={formData.specialRequests}
                  onChange={(e) => setFormData(prev => ({ ...prev, specialRequests: e.target.value }))}
                  rows={4}
                  className="resize-none rounded-xl border-primary/30 focus:border-primary/50"
                />
              </div>

              {/* Enhanced Total and Submit */}
              <div className="space-y-6 pt-6 border-t border-border/50">
                <div className="flex justify-between items-center p-6 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl">
                  <div>
                    <span className="text-lg font-semibold">Total Amount</span>
                    <p className="text-sm text-muted-foreground">{formData.guests} guest{formData.guests > 1 ? 's' : ''} × ${basePrice}</p>
                  </div>
                  <span className="text-3xl font-bold gradient-text">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>
                
                <Button 
                  onClick={handleSubmit}
                  className="w-full h-14 text-lg pulse-glow" 
                  disabled={loading || !formData.date || !formData.time}
                  size="lg"
                >
                  {loading ? 'Processing...' : 'Confirm Booking'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BookingForm;
