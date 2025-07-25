import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useVenueDiscounts, calculateDiscountedPrice } from "@/hooks/useDiscounts";
import ServiceBookingDialog from "@/components/ServiceBookingDialog";
import { VenueService } from "@/hooks/useVenues";

interface BookingFormProps {
  venueId: string;
  venueName: string;
  venuePrice: number;
  openingTime?: string;
  closingTime?: string;
  defaultDiscount?: number;
  services?: VenueService[];
  selectedServiceId?: string;
}

const BookingForm = ({ venueId, venueName, venuePrice, openingTime, closingTime, defaultDiscount = 0, services = [], selectedServiceId }: BookingFormProps) => {
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
  const [dialogService, setDialogService] = useState<VenueService | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Fetch venue discounts
  const { data: discounts = [] } = useVenueDiscounts(venueId);

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
    // For services, use service booking times if available
    if (services.length > 0 && formData.serviceBookings.length > 0) {
      const serviceBooking = formData.serviceBookings[0];
      if (!serviceBooking.arrivalTime || !serviceBooking.departureTime) return 0;
      const start = new Date(`2000-01-01T${serviceBooking.arrivalTime}:00`);
      const end = new Date(`2000-01-01T${serviceBooking.departureTime}:00`);
      const diffMs = end.getTime() - start.getTime();
      return diffMs / (1000 * 60 * 60);
    }
    
    // For basic venue booking, use main booking times
    if (!formData.arrivalTime || !formData.departureTime) return 0;
    const start = new Date(`2000-01-01T${formData.arrivalTime}:00`);
    const end = new Date(`2000-01-01T${formData.departureTime}:00`);
    const diffMs = end.getTime() - start.getTime();
    return diffMs / (1000 * 60 * 60);
  };
  
  const durationHours = calculateDuration();
  const baseTotalPrice = basePrice * durationHours;
  
  // Apply discounts to the total price
  const discountCalculation = calculateDiscountedPrice(
    baseTotalPrice,
    defaultDiscount,
    discounts,
    durationHours
  );
  
  const totalPrice = discountCalculation.finalPrice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.date) {
      toast({
        title: "Missing date",
        description: "Please select a booking date",
        variant: "destructive",
      });
      return;
    }

    // Validate times based on booking type
    if (services.length === 0) {
      // For basic venue booking
      if (!formData.arrivalTime || !formData.departureTime) {
        toast({
          title: "Missing times",
          description: "Please select arrival and departure times",
          variant: "destructive",
        });
        return;
      }
    } else {
      // For service bookings
      if (formData.serviceIds.length === 0) {
        toast({
          title: "No services selected",
          description: "Please select at least one service",
          variant: "destructive",
        });
        return;
      }

      // Check that all selected services have complete time bookings
      const incompleteServices = formData.serviceIds.filter(serviceId => {
        const booking = formData.serviceBookings.find(sb => sb.serviceId === serviceId);
        return !booking || !booking.arrivalTime || !booking.departureTime;
      });

      if (incompleteServices.length > 0) {
        toast({
          title: "Incomplete service times",
          description: "Please set arrival and departure times for all selected services",
          variant: "destructive",
        });
        return;
      }
    }
    
    // For service bookings, use the first service booking times as main times
    let mainArrivalTime = formData.arrivalTime;
    let mainDepartureTime = formData.departureTime;
    
    if (services.length > 0 && formData.serviceBookings.length > 0) {
      const firstServiceBooking = formData.serviceBookings[0];
      mainArrivalTime = firstServiceBooking.arrivalTime;
      mainDepartureTime = firstServiceBooking.departureTime;
    }
    
    const bookingData = {
      venueId,
      venueName,
      date: formData.date ? format(formData.date, 'yyyy-MM-dd') : "",
      arrivalTime: mainArrivalTime,
      departureTime: mainDepartureTime,
      serviceBookings: formData.serviceBookings,
      guests: formData.guests,
      serviceIds: formData.serviceIds,
      totalPrice,
      specialRequests: formData.specialRequests,
    };

    navigate('/confirm-and-pay', { 
      state: { 
        bookingData,
        requiresAuth: !user
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
    
    // Get current time for filtering
    const now = new Date();
    const currentTimeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    while (currentHour < endHour || (currentHour === endHour && currentMinute <= endMinute)) {
      const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      
      // Only add times that are not in the past (for today's bookings)
      const todayString = new Date().toISOString().split('T')[0];
      const selectedDateString = formData.date ? format(formData.date, 'yyyy-MM-dd') : '';
      
      if (selectedDateString === todayString) {
        if (timeString >= currentTimeString) {
          slots.push(timeString);
        }
      } else {
        slots.push(timeString);
      }
      
      // Move to next 30-minute slot
      currentMinute += 30;
      if (currentMinute >= 60) {
        currentMinute = 0;
        currentHour++;
      }
    }
    
    return slots;
  };

  // Handle main arrival/departure time updates
  const updateMainTime = (field: 'arrivalTime' | 'departureTime', value: string) => {
    // Validate against current time for today's bookings
    const todayString = new Date().toISOString().split('T')[0];
    const selectedDateString = formData.date ? format(formData.date, 'yyyy-MM-dd') : '';
    
    if (selectedDateString === todayString && field === 'arrivalTime') {
      const now = new Date();
      const currentTimeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      if (value < currentTimeString) {
        toast({
          title: "Invalid time",
          description: "Cannot select arrival time in the past",
          variant: "destructive",
        });
        return;
      }
    }

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
    // Validate against current time for today's bookings
    const todayString = new Date().toISOString().split('T')[0];
    const selectedDateString = formData.date ? format(formData.date, 'yyyy-MM-dd') : '';
    
    if (selectedDateString === todayString && field === 'arrivalTime') {
      const now = new Date();
      const currentTimeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      if (value < currentTimeString) {
        toast({
          title: "Invalid time",
          description: "Cannot select arrival time in the past",
          variant: "destructive",
        });
        return;
      }
    }

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

  // Helper function to format time for display (24-hour format)
  const formatTime = (time: string) => {
    return time; // Return time as-is in 24-hour format (HH:MM)
  };

  const handleServiceSelect = (service: VenueService) => {
    setDialogService(service);
    setIsDialogOpen(true);
  };

  const handleServiceConfirm = (data: {
    service: VenueService;
    guests: number;
    date: Date;
    arrivalTime: string;
    departureTime: string;
  }) => {
    setFormData(prev => ({
      ...prev,
      serviceIds: [...prev.serviceIds, data.service.id],
      guests: data.guests,
      date: data.date,
      serviceBookings: [
        ...prev.serviceBookings,
        {
          serviceId: data.service.id,
          arrivalTime: data.arrivalTime,
          departureTime: data.departureTime
        }
      ]
    }));
  };

  return (
    <div className="relative">
      <Card className="border-0 shadow-none bg-transparent">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-2xl font-bold text-foreground">Book Your Session</CardTitle>
        </CardHeader>
        <CardContent className="px-0 space-y-8 pb-24">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Guest Counter - Only show if services are selected */}
            {formData.serviceIds.length > 0 && (
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
            )}

            {/* Date Selection - Only show if services are selected */}
            {formData.serviceIds.length > 0 && (
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
            )}

            {/* Main Booking Times - Only show if no services */}
            {services.length === 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Session Times</h3>
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
                        {generateTimeSlots().map((time) => {
                          const isDisabled = formData.arrivalTime && time <= formData.arrivalTime;
                          return (
                            <SelectItem 
                              key={time} 
                              value={time}
                              disabled={isDisabled}
                              className={isDisabled ? "text-muted-foreground/50 cursor-not-allowed" : ""}
                            >
                              {formatTime(time)}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Services Selection */}
            {services.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Available Services</h3>
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
                      onClick={() => handleServiceSelect(service)}
                    >
                      {service.images && service.images.length > 0 ? (
                        <img
                          src={service.images[0]}
                          alt={service.name}
                          className="w-16 h-16 object-cover rounded-xl flex-shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-muted rounded-xl flex-shrink-0"></div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-lg mb-1">{service.name}</h4>
                        <p className="text-muted-foreground">
                          ${service.price} / guest · {service.duration}
                        </p>
                        {service.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {service.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Service Booking Dialog */}
            <ServiceBookingDialog
              service={dialogService}
              isOpen={isDialogOpen}
              onClose={() => {
                setIsDialogOpen(false);
                setDialogService(null);
              }}
              onConfirm={handleServiceConfirm}
              openingTime={openingTime}
              closingTime={closingTime}
            />

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
                              {generateTimeSlots().map((time) => {
                                const isDisabled = serviceBooking?.arrivalTime && time <= serviceBooking.arrivalTime;
                                return (
                                  <SelectItem 
                                    key={time} 
                                    value={time}
                                    disabled={isDisabled}
                                    className={isDisabled ? "text-muted-foreground/50 cursor-not-allowed" : ""}
                                  >
                                    {formatTime(time)}
                                  </SelectItem>
                                );
                              })}
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
      <div className="fixed bottom-0 right-0 lg:absolute lg:bottom-0 lg:right-0 w-full lg:w-auto bg-gradient-to-r from-primary/10 to-blue-600/10 backdrop-blur-sm border-t-2 border-primary/20 lg:border-0 p-6 lg:p-0 rounded-t-2xl lg:rounded-none">
        <div className="max-w-sm lg:max-w-none mx-auto lg:mx-0">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              {discountCalculation.savings > 0 && (
                <div className="text-sm text-muted-foreground line-through">
                  ${baseTotalPrice.toFixed(2)}
                </div>
              )}
              <span className="text-4xl font-bold text-primary bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">${totalPrice.toFixed(2)}</span>
              {discountCalculation.savings > 0 && (
                <div className="text-sm text-green-600 font-medium">
                  Save ${discountCalculation.savings.toFixed(2)}
                </div>
              )}
            </div>
            <Button 
              onClick={handleSubmit}
              className="h-16 px-10 text-xl font-bold bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105" 
              disabled={
                isSubmitting || 
                !formData.date || 
                durationHours <= 0 ||
                (services.length > 0 && formData.serviceIds.length === 0) ||
                (services.length === 0 && (!formData.arrivalTime || !formData.departureTime)) ||
                (formData.serviceIds.length > 0 && formData.serviceBookings.some(sb => !sb.arrivalTime || !sb.departureTime))
              }
            >
              {isSubmitting ? "Creating Booking..." : "Reserve"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingForm;