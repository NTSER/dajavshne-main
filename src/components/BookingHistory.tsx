import { useUserBookings } from "@/hooks/useBookings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock, Users, MapPin, Star } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

const BookingHistory = () => {
  const { data: bookings, isLoading, error } = useUserBookings();
  const navigate = useNavigate();

  console.log('BookingHistory render:', { bookings, isLoading, error });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-muted h-32 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Failed to load booking history</p>
      </div>
    );
  }

  if (!bookings || bookings.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">No bookings found</p>
        <Button onClick={() => navigate('/')}>
          Browse Venues
        </Button>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM dd, yyyy");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Your Bookings</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {bookings.map((booking) => (
          <Card key={booking.id} className="hover:shadow-lg transition-all duration-300 hover-scale overflow-hidden">
            <div className="relative">
              {/* Venue Image */}
              <div className="aspect-[16/9] overflow-hidden">
                <img
                  src={booking.venues?.images?.[0] || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800'}
                  alt={booking.venues?.name || 'Venue'}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              
              {/* Status Badge */}
              <Badge className={`absolute top-3 right-3 ${getStatusColor(booking.status)} shadow-md`}>
                {booking.status}
              </Badge>
            </div>

            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground text-lg mb-1">
                    {booking.venues?.name || 'Venue'}
                  </h4>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                    <MapPin className="w-3 h-3" />
                    {booking.venues?.location}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-primary text-xl">${booking.total_price}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                <div className="flex items-center gap-1">
                  <CalendarDays className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{formatDate(booking.booking_date)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{booking.booking_time}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{booking.guest_count} guest{booking.guest_count > 1 ? 's' : ''}</span>
                </div>
              </div>

              {booking.venue_services && (
                <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                  <div className="text-sm font-medium text-foreground">
                    Service: {booking.venue_services.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Duration: {booking.venue_services.duration}
                  </div>
                </div>
              )}

              {booking.special_requests && (
                <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                    Special Requests:
                  </div>
                  <div className="text-sm text-yellow-700 dark:text-yellow-300">
                    {booking.special_requests}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => navigate(`/venue/${booking.venue_id}`)}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  Book Again
                </Button>
                {booking.status === 'confirmed' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(`/venue/${booking.venue_id}`)}
                  >
                    View Details
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BookingHistory;