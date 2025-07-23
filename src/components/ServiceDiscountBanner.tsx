import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Percent, Tag, Clock } from "lucide-react";
import { VenueService } from "@/hooks/useVenues";

interface ServiceDiscountBannerProps {
  services: VenueService[];
  selectedService?: VenueService;
  className?: string;
}

const ServiceDiscountBanner = ({ 
  services, 
  selectedService,
  className = "" 
}: ServiceDiscountBannerProps) => {
  // Get services with discounts (assuming they have a discount_percentage property)
  const servicesWithDiscounts = services?.filter(service => {
    // For now, we'll check if the service has a special offer or price reduction
    // This will be enhanced when we add service-level discount support
    return service.price > 0;
  }) || [];

  // If no services or no services with potential discounts, don't show banner
  if (!services || services.length === 0 || servicesWithDiscounts.length === 0) {
    return null;
  }

  const hasActiveDiscounts = servicesWithDiscounts.some(service => service.price > 0);
  
  if (!hasActiveDiscounts) {
    return null;
  }

  return (
    <Card className={`border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">Service Offers Available</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {servicesWithDiscounts.slice(0, 3).map((service) => (
              <Badge 
                key={service.id} 
                variant="secondary" 
                className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                <Percent className="h-3 w-3 mr-1" />
                {service.name} from ${service.price}
              </Badge>
            ))}
            
            {servicesWithDiscounts.length > 3 && (
              <Badge variant="outline" className="border-primary/30 text-primary">
                +{servicesWithDiscounts.length - 3} more
              </Badge>
            )}
          </div>
          
          {selectedService && (
            <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Selected: {selectedService.name}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceDiscountBanner;