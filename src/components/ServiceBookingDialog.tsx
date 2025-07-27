import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon, Minus, Plus, Users, Clock, Gamepad2, Check, ChevronsUpDown, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { VenueService } from "@/hooks/useVenues";
import { useToast } from "@/hooks/use-toast";

interface ServiceBookingDialogProps {
  service: VenueService | null;
  venueId?: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    service: VenueService;
    guests: number;
    date: Date;
    arrivalTime: string;
    departureTime: string;
    selectedGames: string[];
  }) => void;
  openingTime?: string;
  closingTime?: string;
  initialData?: {
    guests: number;
    date: Date;
    arrivalTime: string;
    departureTime: string;
  };
}

const ServiceBookingDialog = ({ 
  service, 
  venueId,
  isOpen, 
  onClose, 
  onConfirm,
  openingTime,
  closingTime,
  initialData
}: ServiceBookingDialogProps) => {
  const { toast } = useToast();
  const [guests, setGuests] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [arrivalTime, setArrivalTime] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [selectedGames, setSelectedGames] = useState<string[]>([]);
  const [isGameComboboxOpen, setIsGameComboboxOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Use service-specific games instead of all venue games
  const availableGames = service?.service_games || [];

  // Set initial values when dialog opens with existing data
  useEffect(() => {
    if (isOpen && initialData) {
      setGuests(initialData.guests);
      setSelectedDate(initialData.date);
      setArrivalTime(initialData.arrivalTime);
      setDepartureTime(initialData.departureTime);
    } else if (isOpen && !initialData) {
      // Reset to defaults when opening without initial data
      setGuests(1);
      setSelectedDate(undefined);
      setArrivalTime("");
      setDepartureTime("");
      setSelectedGames([]);
    }
  }, [isOpen, initialData]);

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
      const selectedDateString = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
      
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

  const handleArrivalTimeChange = (value: string) => {
    // Validate against current time for today's bookings
    const todayString = new Date().toISOString().split('T')[0];
    const selectedDateString = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
    
    if (selectedDateString === todayString) {
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

    // Clear departure time if it's before the new arrival time
    if (departureTime && value >= departureTime) {
      setDepartureTime("");
    }
    
    setArrivalTime(value);
  };

  const handleDepartureTimeChange = (value: string) => {
    // Validate that departure time is after arrival time
    if (arrivalTime && value <= arrivalTime) {
      toast({
        title: "Invalid time",
        description: "Departure time must be after arrival time",
        variant: "destructive",
      });
      return;
    }
    
    setDepartureTime(value);
  };

  const handleConfirm = () => {
    if (service && selectedDate && arrivalTime && departureTime) {
      onConfirm({
        service,
        guests,
        date: selectedDate,
        arrivalTime,
        departureTime,
        selectedGames
      });
      // Reset form
      setGuests(1);
      setSelectedDate(undefined);
      setArrivalTime("");
      setDepartureTime("");
      setSelectedGames([]);
      onClose();
    }
  };

  if (!service) return null;

  // Calculate total price based on duration and guests
  const calculateTotalPrice = () => {
    if (!arrivalTime || !departureTime) return service.price * guests;
    
    const start = new Date(`2000-01-01T${arrivalTime}:00`);
    const end = new Date(`2000-01-01T${departureTime}:00`);
    const diffMs = end.getTime() - start.getTime();
    const hours = diffMs / (1000 * 60 * 60);
    
    return service.price * guests * hours;
  };

  const totalPrice = calculateTotalPrice();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Book {service.name} - ${service.price}/guest</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">

          {/* Guest Count */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Number of People</label>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Guests</span>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setGuests(Math.max(1, guests - 1))}
                  disabled={guests <= 1}
                  className="h-8 w-8 p-0"
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-8 text-center text-sm font-medium">{guests}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setGuests(Math.min(20, guests + 1))}
                  disabled={guests >= 20}
                  className="h-8 w-8 p-0"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          {/* Game Selection - Only show if service has games */}
          {availableGames.length > 0 && (
            <div className="space-y-3">
              <label className="text-sm font-medium">Select Games</label>
              <Popover open={isGameComboboxOpen} onOpenChange={setIsGameComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isGameComboboxOpen}
                    className="w-full justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Gamepad2 className="h-4 w-4" />
                      {selectedGames.length > 0 ? `${selectedGames.length} game${selectedGames.length > 1 ? 's' : ''} selected` : "Choose games"}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search games..." />
                    <CommandList className="max-h-[160px]">
                      <CommandEmpty>No game found.</CommandEmpty>
                      <CommandGroup>
                        {availableGames.map((game) => (
                          <CommandItem
                            key={game}
                            value={game}
                            onSelect={(currentValue) => {
                              setSelectedGames(prev => {
                                const isSelected = prev.includes(currentValue);
                                if (isSelected) {
                                  return prev.filter(g => g !== currentValue);
                                } else {
                                  return [...prev, currentValue];
                                }
                              });
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedGames.includes(game) ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <Gamepad2 className="mr-2 h-4 w-4" />
                            {game}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {selectedGames.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedGames.map((game) => (
                    <Badge key={game} variant="secondary" className="flex items-center gap-1">
                      {game}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-destructive"
                        onClick={() => {
                          setSelectedGames(prev => prev.filter(g => g !== game));
                        }}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Date Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Select Date</label>
            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    setIsDatePickerOpen(false);
                  }}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Selection */}
          {selectedDate && (
            <div className="space-y-4">
              <label className="text-sm font-medium">Select Time</label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Arrival</Label>
                  <Select value={arrivalTime} onValueChange={handleArrivalTimeChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {generateTimeSlots().map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Departure</Label>
                  <Select 
                    value={departureTime} 
                    onValueChange={handleDepartureTimeChange}
                    disabled={!arrivalTime}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {generateTimeSlots().map((time) => {
                        const isDisabled = arrivalTime && time <= arrivalTime;
                        return (
                          <SelectItem 
                            key={time} 
                            value={time}
                            disabled={isDisabled}
                          >
                            {time}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {openingTime && closingTime && (
                <p className="text-xs text-muted-foreground">
                  Available: {openingTime} - {closingTime}
                </p>
              )}
            </div>
          )}

          {/* Total Price */}
          {arrivalTime && departureTime && (
            <div className="border-t pt-4">
              <div className="flex items-center justify-between text-lg font-semibold">
                <span>Total</span>
                <span>${totalPrice}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                ${service.price} × {guests} guest{guests !== 1 ? 's' : ''} × {(() => {
                  const start = new Date(`2000-01-01T${arrivalTime}:00`);
                  const end = new Date(`2000-01-01T${departureTime}:00`);
                  const diffMs = end.getTime() - start.getTime();
                  const hours = diffMs / (1000 * 60 * 60);
                  return hours.toFixed(1);
                })()} hours
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm} 
              disabled={!selectedDate || !arrivalTime || !departureTime}
              className="flex-1"
            >
              Continue
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceBookingDialog;