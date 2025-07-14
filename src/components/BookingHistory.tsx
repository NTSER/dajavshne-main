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
    <div className="space-y-4 max-h-96 overflow-y-auto">
      <h3 className="text-lg font-semibold">Your Bookings</h3>
      {bookings.map((booking) => (
        <Card key={booking.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-semibold text-foreground">
                  {booking.venues?.name || 'Venue'}
                </h4>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  {booking.venues?.location}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(booking.status)}>
                  {booking.status}
                </Badge>
                <div className="text-right">
                  <div className="font-semibold text-primary">${booking.total_price}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-1">
                <CalendarDays className="w-4 h-4 text-muted-foreground" />
                <span>{formatDate(booking.booking_date)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>{booking.booking_time}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span>{booking.guest_count} guest{booking.guest_count > 1 ? 's' : ''}</span>
              </div>
            </div>

            {booking.venue_services && (
              <div className="mt-2 text-sm text-muted-foreground">
                Service: {booking.venue_services.name} ({booking.venue_services.duration})
              </div>
            )}

            {booking.special_requests && (
              <div className="mt-2 text-sm text-muted-foreground">
                Special requests: {booking.special_requests}
              </div>
            )}

            <div className="mt-3 flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate(`/venue/${booking.venue_id}`)}
              >
                View Venue
              </Button>
              {booking.status === 'confirmed' && (
                <Button variant="outline" size="sm">
                  Modify Booking
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default BookingHistory;