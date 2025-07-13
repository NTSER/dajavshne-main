
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, DollarSign } from "lucide-react";
import { VenueService } from "@/hooks/useVenues";

interface VenueServicesProps {
  services: VenueService[];
  onServiceSelect: (service: VenueService) => void;
  selectedService?: VenueService;
}

const VenueServices = ({ 
  services, 
  onServiceSelect, 
  selectedService 
}: VenueServicesProps) => {
  if (!services || services.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Available Services</h3>
      <div className="grid gap-4">
        {services.map((service) => (
          <Card 
            key={service.id}
            className={`cursor-pointer transition-all border-white/10 bg-card/50 hover:bg-card/70 ${
              selectedService?.id === service.id 
                ? 'ring-2 ring-primary border-primary/50' 
                : ''
            }`}
            onClick={() => onServiceSelect(service)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{service.name}</CardTitle>
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  ${service.price}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {service.duration}
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  ${service.price}/hour
                </div>
              </div>
              {service.description && (
                <p className="text-sm text-muted-foreground mb-3">
                  {service.description}
                </p>
              )}
              <Button 
                variant={selectedService?.id === service.id ? "default" : "outline"}
                size="sm"
                className="w-full"
              >
                {selectedService?.id === service.id ? "Selected" : "Select Service"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default VenueServices;
