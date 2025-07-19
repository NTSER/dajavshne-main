
import { useState, useEffect } from "react";
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
  selectedServiceId?: string;
}

const BookingForm = ({ venueId, venueName, venuePrice, services = [], selectedServiceId }: BookingFormProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    date: undefined as Date | undefined,
    serviceBookings: [] as Array<{
      serviceId: string;
      arrivalTime: string;
      departureTime: string;
    }>,
    guests: 1,
    serviceIds: selectedServiceId ? [selectedServiceId] : [] as string[], // Changed to array for multiple services
    specialRequests: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update serviceIds when selectedServiceId prop changes
  useEffect(() => {
    if (selectedServiceId && !formData.serviceIds.includes(selectedServiceId)) {
      setFormData(prev => ({ ...prev, serviceIds: [selectedServiceId] }));
    }
  }, [selectedServiceId, formData.serviceIds]);

  const selectedServices = services.filter(s => formData.serviceIds.includes(s.id));
  const totalServicePrice = selectedServices.reduce((sum, service) => sum + service.price, 0);
  const basePrice = totalServicePrice > 0 ? totalServicePrice : venuePrice;
  const totalPrice = basePrice * formData.guests;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Instead of requiring auth upfront, proceed to payment step
    // where authentication will be handled
    const bookingData = {
      venueId,
      venueName,
      date: formData.date ? format(formData.date, 'yyyy-MM-dd') : "",
      serviceBookings: formData.serviceBookings,
      guests: formData.guests,
      serviceIds: formData.serviceIds, // Send array of service IDs
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

  // Handle service time updates
  const updateServiceTime = (serviceId: string, field: 'arrivalTime' | 'departureTime', value: string) => {
    setFormData(prev => {
      const existingBooking = prev.serviceBookings.find(sb => sb.serviceId === serviceId);
      if (existingBooking) {
        return {
          ...prev,
          serviceBookings: prev.serviceBookings.map(sb =>
            sb.serviceId === serviceId ? { ...sb, [field]: value } : sb
          )
        };
      } else {
        return {
          ...prev,
          serviceBookings: [
            ...prev.serviceBookings,
            {
              serviceId,
              arrivalTime: field === 'arrivalTime' ? value : '',
              departureTime: field === 'departureTime' ? value : '',
            }
          ]
        };
      }
    });
  };


  return (
    <div className="relative">
      <Card className="border-0 shadow-none">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-2xl font-medium">Book Your Session</CardTitle>
        </CardHeader>
        <CardContent className="px-0 space-y-8 pb-24">
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
                <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) => setFormData(prev => ({ ...prev, date }))}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Services Selection */}
            {services.length > 0 && (
              <div className="space-y-4">
            {services.map((service) => {
              const isSelected = formData.serviceIds.includes(service.id);
              return (
                <div 
                  key={service.id}
                  className={cn(
                    "flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                    isSelected 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50"
                  )}
                   onClick={() => {
                     setFormData(prev => ({
                       ...prev,
                       serviceIds: isSelected
                         ? prev.serviceIds.filter(id => id !== service.id) // Remove if selected
                         : [...prev.serviceIds, service.id], // Add if not selected
                       // Remove service booking if service is deselected
                       serviceBookings: isSelected
                         ? prev.serviceBookings.filter(sb => sb.serviceId !== service.id)
                         : prev.serviceBookings
                     }));
                   }}
                >
                  <div className="w-16 h-16 bg-muted rounded-xl flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-lg mb-1">{service.name}</h4>
                    <p className="text-muted-foreground">
                      ${service.price} / guest · {service.duration}
                    </p>
                  </div>
                </div>
              );
            })}
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

            {/* Service Time Selection */}
            {formData.serviceIds.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Service Times</h3>
                <p className="text-sm text-muted-foreground">Set arrival and departure times for each selected service.</p>
                
                {selectedServices.map((service) => {
                  const serviceBooking = formData.serviceBookings.find(sb => sb.serviceId === service.id);
                  return (
                    <div key={service.id} className="p-4 border border-border rounded-lg space-y-4">
                      <h4 className="font-medium">{service.name}</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`arrival-${service.id}`}>Arrival Time</Label>
                          <Input
                            id={`arrival-${service.id}`}
                            type="time"
                            value={serviceBooking?.arrivalTime || ''}
                            onChange={(e) => updateServiceTime(service.id, 'arrivalTime', e.target.value)}
                            className="w-full"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`departure-${service.id}`}>Departure Time</Label>
                          <Input
                            id={`departure-${service.id}`}
                            type="time"
                            value={serviceBooking?.departureTime || ''}
                            onChange={(e) => updateServiceTime(service.id, 'departureTime', e.target.value)}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

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
          </form>
        </CardContent>
      </Card>

      {/* Sticky Reserve Button */}
      <div className="fixed bottom-0 right-0 lg:absolute lg:bottom-0 lg:right-0 w-full lg:w-auto bg-background/95 backdrop-blur-sm border-t lg:border-0 p-4 lg:p-0">
        <div className="max-w-sm lg:max-w-none mx-auto lg:mx-0">
          {/* Total Price */}
          <div className="bg-card border border-border rounded-xl p-4 mb-4 shadow-lg">
            <div className="flex justify-between items-center text-xl font-semibold mb-2">
              <span>Total Price:</span>
              <span className="text-primary">${totalPrice}</span>
            </div>
            
            {selectedServices.length > 0 && (
              <div className="text-sm text-muted-foreground">
                <p>Selected services: {selectedServices.map(s => s.name).join(', ')}</p>
                <p>Price: ${basePrice} × {formData.guests} guest{formData.guests !== 1 ? 's' : ''}</p>
              </div>
            )}
          </div>
          
          <Button 
            onClick={handleSubmit}
            className="w-full h-14 text-lg font-medium" 
            disabled={
              isSubmitting || 
              !formData.date || 
              (services.length > 0 && formData.serviceIds.length === 0) ||
              (formData.serviceIds.length > 0 && formData.serviceBookings.some(sb => !sb.arrivalTime || !sb.departureTime))
            }
          >
            {isSubmitting ? "Creating Booking..." : "Reserve"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BookingForm;
