
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
  openingTime?: string;
  closingTime?: string;
  services?: Array<{
    id: string;
    name: string;
    price: number;
    duration: string;
  }>;
  selectedServiceId?: string;
}

const BookingForm = ({ venueId, venueName, venuePrice, openingTime, closingTime, services = [], selectedServiceId }: BookingFormProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    date: undefined as Date | undefined,
    arrivalTime: '',
    departureTime: '',
    serviceBookings: [] as Array<{
      serviceId: string;
      arrivalTime: string;
      departureTime: string;
    }>,
    guests: 1,
    serviceIds: selectedServiceId ? [selectedServiceId] : [] as string[],
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
  
  // Calculate duration in hours for pricing
  const calculateDuration = () => {
    if (!formData.arrivalTime || !formData.departureTime) return 0;
    const start = new Date(`2000-01-01T${formData.arrivalTime}:00`);
    const end = new Date(`2000-01-01T${formData.departureTime}:00`);
    const diffMs = end.getTime() - start.getTime();
    return diffMs / (1000 * 60 * 60); // Convert to hours
  };
  
  const durationHours = calculateDuration();
  const totalPrice = basePrice * formData.guests * durationHours;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Instead of requiring auth upfront, proceed to payment step
    // where authentication will be handled
    const bookingData = {
      venueId,
      venueName,
      date: formData.date ? format(formData.date, 'yyyy-MM-dd') : "",
      arrivalTime: formData.arrivalTime,
      departureTime: formData.departureTime,
      serviceBookings: formData.serviceBookings,
      guests: formData.guests,
      serviceIds: formData.serviceIds,
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

  // Generate 30-minute time slots based on venue hours
  const generateTimeSlots = () => {
    const slots = [];
    const start = openingTime || '00:00';
    const end = closingTime || '23:59';
    
    const [startHour, startMinute] = start.split(':').map(Number);
    const [endHour, endMinute] = end.split(':').map(Number);
    
    let currentHour = startHour;
    let currentMinute = startMinute;
    
    // Round start time to nearest 30-minute slot
    if (currentMinute < 30) {
      currentMinute = 0;
    } else {
      currentMinute = 30;
    }
    
    while (currentHour < endHour || (currentHour === endHour && currentMinute <= endMinute)) {
      const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      slots.push(timeString);
      
      // Move to next 30-minute slot
      currentMinute += 30;
      if (currentMinute >= 60) {
        currentMinute = 0;
        currentHour++;
      }
    }
    
    return slots;
  };

  // Validate time to ensure it's on half-hour intervals
  const validateHalfHourInterval = (time: string) => {
    if (!time) return true;
    const [hours, minutes] = time.split(':');
    const minuteNum = parseInt(minutes);
    return minuteNum === 0 || minuteNum === 30;
  };

  // Handle main arrival/departure time updates
  const updateMainTime = (field: 'arrivalTime' | 'departureTime', value: string) => {
    // Validate against venue working hours
    if (openingTime && closingTime && value) {
      if (value < openingTime || value > closingTime) {
        toast({
          title: "Invalid time",
          description: `Please select a time between ${formatTime(openingTime)} and ${formatTime(closingTime)}`,
          variant: "destructive",
        });
        return;
      }
    }

    // Validate that departure time is after arrival time
    if (field === 'departureTime' && formData.arrivalTime && value <= formData.arrivalTime) {
      toast({
        title: "Invalid time",
        description: "Departure time must be after arrival time",
        variant: "destructive",
      });
      return;
    }
    
    if (field === 'arrivalTime' && formData.departureTime && value >= formData.departureTime) {
      toast({
        title: "Invalid time",
        description: "Arrival time must be before departure time",
        variant: "destructive",
      });
      return;
    }

    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle service time updates with validation
  const updateServiceTime = (serviceId: string, field: 'arrivalTime' | 'departureTime', value: string) => {
    // Validate against venue working hours
    if (openingTime && closingTime && value) {
      if (value < openingTime || value > closingTime) {
        toast({
          title: "Invalid time",
          description: `Please select a time between ${formatTime(openingTime)} and ${formatTime(closingTime)}`,
          variant: "destructive",
        });
        return;
      }
    }

    setFormData(prev => {
      const existingBooking = prev.serviceBookings.find(sb => sb.serviceId === serviceId);
      if (existingBooking) {
        const updatedBooking = { ...existingBooking, [field]: value };
        
        // Validate that departure time is after arrival time
        if (field === 'departureTime' && updatedBooking.arrivalTime && value <= updatedBooking.arrivalTime) {
          toast({
            title: "Invalid time",
            description: "Departure time must be after arrival time",
            variant: "destructive",
          });
          return prev;
        }
        
        if (field === 'arrivalTime' && updatedBooking.departureTime && value >= updatedBooking.departureTime) {
          toast({
            title: "Invalid time",
            description: "Arrival time must be before departure time",
            variant: "destructive",
          });
          return prev;
        }

        return {
          ...prev,
          serviceBookings: prev.serviceBookings.map(sb =>
            sb.serviceId === serviceId ? updatedBooking : sb
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

  // Helper function to format time for display
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
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
                    {formData.date ? format(formData.date, "EEEE, MMMM do, yyyy") : "Select date"}
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

            {/* Main Arrival and Departure Times */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Booking Times</h3>
                {openingTime && closingTime && (
                  <p className="text-sm text-muted-foreground">
                    Open: {formatTime(openingTime)} - {formatTime(closingTime)}
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="main-arrival">Arrival Time *</Label>
                  <Select 
                    value={formData.arrivalTime} 
                    onValueChange={(value) => updateMainTime('arrivalTime', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select arrival time" />
                    </SelectTrigger>
                    <SelectContent>
                      {generateTimeSlots().map((time) => (
                        <SelectItem key={time} value={time}>
                          {formatTime(time)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="main-departure">Departure Time *</Label>
                  <Select 
                    value={formData.departureTime} 
                    onValueChange={(value) => updateMainTime('departureTime', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select departure time" />
                    </SelectTrigger>
                    <SelectContent>
                      {generateTimeSlots().map((time) => (
                        <SelectItem key={time} value={time}>
                          {formatTime(time)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
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
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Service Times</h3>
                  {openingTime && closingTime && (
                    <p className="text-sm text-muted-foreground">
                      Open: {formatTime(openingTime)} - {formatTime(closingTime)}
                    </p>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">Set arrival and departure times for each selected service.</p>
                
                {selectedServices.map((service) => {
                  const serviceBooking = formData.serviceBookings.find(sb => sb.serviceId === service.id);
                  return (
                    <div key={service.id} className="p-4 border border-border rounded-lg space-y-4">
                      <h4 className="font-medium">{service.name}</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`arrival-${service.id}`}>Arrival Time</Label>
                          <Select 
                            value={serviceBooking?.arrivalTime || ''} 
                            onValueChange={(value) => updateServiceTime(service.id, 'arrivalTime', value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select arrival time" />
                            </SelectTrigger>
                            <SelectContent>
                              {generateTimeSlots().map((time) => (
                                <SelectItem key={time} value={time}>
                                  {formatTime(time)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`departure-${service.id}`}>Departure Time</Label>
                          <Select 
                            value={serviceBooking?.departureTime || ''} 
                            onValueChange={(value) => updateServiceTime(service.id, 'departureTime', value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select departure time" />
                            </SelectTrigger>
                            <SelectContent>
                              {generateTimeSlots().map((time) => (
                                <SelectItem key={time} value={time}>
                                  {formatTime(time)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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

      {/* Sticky Reserve Section */}
      <div className="fixed bottom-0 right-0 lg:absolute lg:bottom-0 lg:right-0 w-full lg:w-auto bg-background/95 backdrop-blur-sm border-t lg:border-0 p-4 lg:p-0">
        <div className="max-w-sm lg:max-w-none mx-auto lg:mx-0">
          {/* Reserve Button with Price */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="text-right mb-2">
                <span className="text-2xl font-bold text-primary">Total Price: ${totalPrice.toFixed(2)}</span>
              </div>
              
              {durationHours > 0 && (
                <div className="text-sm text-muted-foreground text-right mb-2">
                  <p>Duration: {durationHours}h × ${basePrice}/hour × {formData.guests} guest{formData.guests !== 1 ? 's' : ''}</p>
                  {selectedServices.length > 0 && (
                    <p>Services: {selectedServices.map(s => s.name).join(', ')}</p>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <Button 
            onClick={handleSubmit}
            className="w-full h-14 text-lg font-medium" 
            disabled={
              isSubmitting || 
              !formData.date || 
              !formData.arrivalTime ||
              !formData.departureTime ||
              durationHours <= 0 ||
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
