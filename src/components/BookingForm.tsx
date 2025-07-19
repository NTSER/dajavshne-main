
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
    <Card>
      <CardHeader>
        <CardTitle>Book Your Session</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? format(formData.date, "PPP") : "Pick a date"}
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
            <div>
              <TimeInput
                label="Time"
                icon={<Clock className="h-4 w-4" />}
                value={formData.time}
                onChange={(time) => setFormData(prev => ({ ...prev, time }))}
                placeholder="Select time"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="guests" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Number of Guests
            </Label>
            <Input
              id="guests"
              type="number"
              min="1"
              max="20"
              value={formData.guests}
              onChange={(e) => setFormData(prev => ({ ...prev, guests: parseInt(e.target.value) }))}
              required
            />
          </div>

          {services.length > 0 && (
            <div>
              <Label>Service Package</Label>
              <Select
                value={formData.serviceId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, serviceId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a service package" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic Session - ${venuePrice}</SelectItem>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} - ${service.price} ({service.duration})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="requests" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Special Requests (Optional)
            </Label>
            <Textarea
              id="requests"
              value={formData.specialRequests}
              onChange={(e) => setFormData(prev => ({ ...prev, specialRequests: e.target.value }))}
              placeholder="Any special requirements or requests..."
              className="resize-none"
              rows={3}
            />
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total Price:</span>
              <span className="text-primary">${totalPrice}</span>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating Booking..." : "Confirm Booking"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default BookingForm;
