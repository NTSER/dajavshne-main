
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Minus, Plus, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AuthDialog from "./AuthDialog";
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
  const [showAuthDialog, setShowAuthDialog] = useState(false);
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
    
    if (!user) {
      setShowAuthDialog(true);
      return;
    }

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
      const { error } = await supabase
        .from('bookings')
        .insert([
          {
            user_id: user.id,
            venue_id: venue.id,
            service_id: service?.id || null,
            booking_date: format(formData.date, 'yyyy-MM-dd'),
            booking_time: formData.time,
            guest_count: formData.guests,
            total_price: totalPrice,
            special_requests: formData.specialRequests || null,
            status: 'pending'
          }
        ]);

      if (error) {
        throw error;
      }

      toast({
        title: "Booking Confirmed!",
        description: "Your booking has been submitted successfully. You'll receive a confirmation email shortly.",
      });

      setIsOpen(false);
      setFormData({
        date: undefined,
        time: '',
        guests: 1,
        specialRequests: '',
      });

    } catch (error) {
      console.error('Booking error:', error);
      toast({
        title: "Booking Failed",
        description: "There was an error processing your booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card className="border-white/10 bg-card/50">
        <CardContent className="p-6">
          <Button 
            onClick={() => setIsOpen(true)}
            className="w-full" 
            size="lg"
          >
            Reserve Now
          </Button>
        </CardContent>
      </Card>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Schedule your booking</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6 space-y-6">
              {/* Guest Counter */}
              <div className="flex items-center justify-between py-4 border-b">
                <span className="text-lg">{formData.guests} guest{formData.guests > 1 ? 's' : ''}</span>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleGuestChange(false)}
                    disabled={formData.guests <= 1}
                    className="h-8 w-8 rounded-full"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center font-medium">{formData.guests}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleGuestChange(true)}
                    className="h-8 w-8 rounded-full"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Date Selection */}
              <div className="space-y-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-between text-left font-normal h-12",
                        !formData.date && "text-muted-foreground"
                      )}
                    >
                      {formData.date ? format(formData.date, "MMMM yyyy") : "Select date"}
                      <CalendarIcon className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.date}
                      onSelect={(date) => {
                        setFormData(prev => ({ ...prev, date, time: '' })); // Reset time when date changes
                      }}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Service Info */}
              {service && (
                <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <span className="text-xs font-medium">SV</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{service.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      ${service.price} / guest • {service.duration}
                    </p>
                  </div>
                </div>
              )}

              {/* Time Slots */}
              {formData.date && (
                <div className="space-y-4">
                  <Label className="text-sm font-medium">Available times</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {availableTimeSlots.map((time) => {
                      const isUnavailable = unavailableSlots.includes(time);
                      const isSelected = formData.time === time;
                      
                      return (
                        <Button
                          key={time}
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleTimeSelect(time)}
                          disabled={isUnavailable}
                          className={cn(
                            "text-xs h-10",
                            isUnavailable && "opacity-30 cursor-not-allowed",
                            isSelected && "bg-primary text-primary-foreground"
                          )}
                        >
                          {time}
                        </Button>
                      );
                    })}
                  </div>
                  
                  {unavailableSlots.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Grayed out times are unavailable for the selected date
                    </p>
                  )}
                </div>
              )}

              {/* Special Requests */}
              <div className="space-y-2">
                <Label>Special requests (Optional)</Label>
                <Textarea
                  placeholder="Any special requirements or requests..."
                  value={formData.specialRequests}
                  onChange={(e) => setFormData(prev => ({ ...prev, specialRequests: e.target.value }))}
                  rows={3}
                />
              </div>

              {/* Total and Submit */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium">Total:</span>
                  <span className="text-xl font-bold text-primary">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>
                
                <Button 
                  onClick={handleSubmit}
                  className="w-full" 
                  disabled={loading || !formData.date || !formData.time}
                  size="lg"
                >
                  {loading ? 'Processing...' : user ? 'Confirm Booking' : 'Sign In to Book'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <AuthDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        defaultMode="signin"
      />
    </>
  );
};

export default BookingForm;
