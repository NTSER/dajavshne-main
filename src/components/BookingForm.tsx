
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TimeInput } from "@/components/ui/time-picker";
import { CalendarDays, Clock, Users, MessageSquare, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import AuthDialog from "./AuthDialog";

interface BookingFormProps {
  venueId: string;
  venueName: string;
  venuePrice: number;
  services?: Array<{
    id: string;
    name: string;
    price: number;
    duration: string;
  }>;
}

const BookingForm = ({ venueId, venueName, venuePrice, services = [] }: BookingFormProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    date: undefined as Date | undefined,
    time: "",
    guests: 1,
    serviceId: "",
    specialRequests: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedService = services.find(s => s.id === formData.serviceId);
  const totalPrice = selectedService ? selectedService.price : venuePrice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Instead of requiring auth upfront, proceed to payment step
    // where authentication will be handled
    const bookingData = {
      venueId,
      venueName,
      date: formData.date ? format(formData.date, 'yyyy-MM-dd') : "",
      time: formData.time,
      guests: formData.guests,
      serviceId: formData.serviceId,
      totalPrice,
      specialRequests: formData.specialRequests,
    };

    // Navigate to payment page with booking data
    navigate('/confirm-and-pay', { 
      state: { 
        bookingData,
        requiresAuth: !user // Flag to show auth dialog on payment page
      } 
    });
  };

  const handleAuthRequired = () => {
    // This is now just for showing auth dialog if user wants to login early
    toast({
      title: "Login Optional",
      description: "You can complete the booking and login at the payment step.",
    });
  };


  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-2xl font-medium">Book Your Session</CardTitle>
      </CardHeader>
      <CardContent className="px-0 space-y-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Guest Counter */}
          <div className="flex items-center justify-between py-4 border-b border-border">
            <span className="text-lg">{formData.guests} guest{formData.guests !== 1 ? 's' : ''}</span>
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => setFormData(prev => ({ ...prev, guests: Math.max(1, prev.guests - 1) }))}
                disabled={formData.guests <= 1}
              >
                -
              </Button>
              <span className="w-8 text-center font-medium">{formData.guests}</span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => setFormData(prev => ({ ...prev, guests: Math.min(20, prev.guests + 1) }))}
                disabled={formData.guests >= 20}
              >
                +
              </Button>
            </div>
          </div>

          {/* Date Selection */}
          <div className="space-y-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-between text-left font-normal h-14 text-lg",
                    !formData.date && "text-muted-foreground"
                  )}
                >
                  {formData.date ? format(formData.date, "MMMM yyyy") : "Select date"}
                  <CalendarIcon className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.date}
                  onSelect={(date) => setFormData(prev => ({ ...prev, date }))}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Services Selection */}
          {services.length > 0 && (
            <div className="space-y-4">
              {services.map((service) => (
                <div 
                  key={service.id}
                  className={cn(
                    "flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                    formData.serviceId === service.id
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50"
                  )}
                  onClick={() => setFormData(prev => ({ ...prev, serviceId: service.id }))}
                >
                  <div className="w-16 h-16 bg-muted rounded-xl flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-lg mb-1">{service.name}</h4>
                    <p className="text-muted-foreground">
                      ${service.price} / guest · {service.duration}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Basic Service Option */}
          {services.length === 0 && (
            <div className="flex items-start gap-4 p-4 rounded-xl border-2 border-primary bg-primary/5">
              <div className="w-16 h-16 bg-muted rounded-xl flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-lg mb-1">Basic Session</h4>
                <p className="text-muted-foreground">
                  ${venuePrice} / guest · Standard gaming session
                </p>
              </div>
            </div>
          )}

          {/* Time Slots */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Available Times</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                "1:15PM", "1:45PM", "2:15PM", "2:45PM", "3:15PM", "3:45PM",
                "4:15PM", "4:45PM", "5:15PM", "5:45PM", "6:15PM", "6:45PM",
                "7:15PM", "7:45PM", "8:15PM"
              ].map((timeSlot) => {
                const [time, period] = timeSlot.split(/(?=[AP]M)/);
                const hour24 = period === 'PM' && time !== '12:' 
                  ? String(parseInt(time.split(':')[0]) + 12).padStart(2, '0')
                  : time === '12:' && period === 'AM' 
                  ? '00'
                  : time.split(':')[0].padStart(2, '0');
                const minute = time.split(':')[1];
                const time24 = `${hour24}:${minute || '00'}`;
                
                return (
                  <Button
                    key={timeSlot}
                    type="button"
                    variant={formData.time === time24 ? "default" : "outline"}
                    className="h-12 rounded-full font-medium"
                    onClick={() => setFormData(prev => ({ ...prev, time: time24 }))}
                  >
                    {timeSlot}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Special Requests */}
          <div className="space-y-4">
            <Label htmlFor="requests" className="text-lg font-medium">
              Special Requests (Optional)
            </Label>
            <Textarea
              id="requests"
              value={formData.specialRequests}
              onChange={(e) => setFormData(prev => ({ ...prev, specialRequests: e.target.value }))}
              placeholder="Any special requirements or requests..."
              className="resize-none min-h-[100px]"
              rows={4}
            />
          </div>

          {/* Total Price */}
          <div className="border-t pt-6">
            <div className="flex justify-between items-center text-xl font-semibold mb-6">
              <span>Total Price:</span>
              <span className="text-primary">${totalPrice * formData.guests}</span>
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-14 text-lg font-medium" 
              disabled={isSubmitting || !formData.date || !formData.time}
            >
              {isSubmitting ? "Creating Booking..." : "Reserve"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default BookingForm;
