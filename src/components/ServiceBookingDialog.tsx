import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Minus, Plus, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { VenueService } from "@/hooks/useVenues";

interface ServiceBookingDialogProps {
  service: VenueService | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    service: VenueService;
    guests: number;
    date: Date;
  }) => void;
}

const ServiceBookingDialog = ({ 
  service, 
  isOpen, 
  onClose, 
  onConfirm 
}: ServiceBookingDialogProps) => {
  const [guests, setGuests] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date>();

  const handleConfirm = () => {
    if (service && selectedDate) {
      onConfirm({
        service,
        guests,
        date: selectedDate
      });
      onClose();
    }
  };

  if (!service) return null;

  const totalPrice = service.price * guests;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Book {service.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Service Info */}
          <Card className="border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {service.images && service.images.length > 0 && (
                  <img
                    src={service.images[0]}
                    alt={service.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold">{service.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {service.description}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">${service.price}/guest</Badge>
                    <Badge variant="outline">{service.duration}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

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

          {/* Date Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Select Date</label>
            <Popover>
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
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Total Price */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Total</span>
              <span>${totalPrice}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              ${service.price} × {guests} guest{guests !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm} 
              disabled={!selectedDate}
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