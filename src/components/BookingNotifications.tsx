import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Bell, Check, X, Calendar, Clock, Users, MapPin, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePartnerAuth } from '@/hooks/usePartnerAuth';

interface PendingBooking {
  id: string;
  booking_date: string;
  booking_time: string;
  guest_count: number;
  total_price: number;
  user_email: string;
  special_requests?: string;
  venue_name: string;
  venue_id: string;
  created_at: string;
  service_name?: string;
}

interface BookingNotificationsProps {
  className?: string;
}

const BookingNotifications: React.FC<BookingNotificationsProps> = ({ className }) => {
  const { profile } = usePartnerAuth();
  const { toast } = useToast();
  const [pendingBookings, setPendingBookings] = useState<PendingBooking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<PendingBooking | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.id) {
      fetchPendingBookings();
      subscribeToBookings();
    }
  }, [profile]);

  const fetchPendingBookings = async () => {
    if (!profile?.id) {
      console.log('No profile ID available for fetching bookings');
      return;
    }

    console.log('Fetching pending bookings for partner:', profile.id);

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          venues(name, partner_id),
          venue_services(name)
        `)
        .eq('status', 'pending')
        .not('venues', 'is', null)
        .order('created_at', { ascending: false });

      console.log('Raw booking data:', data, 'Error:', error);

      if (error) throw error;

      // Filter bookings that belong to this partner
      const partnerBookings = data?.filter(booking => 
        booking.venues?.partner_id === profile.id
      ) || [];

      const formattedBookings = partnerBookings.map(booking => ({
        id: booking.id,
        booking_date: booking.booking_date,
        booking_time: booking.booking_time,
        guest_count: booking.guest_count,
        total_price: Number(booking.total_price),
        user_email: booking.user_email,
        special_requests: booking.special_requests,
        venue_name: booking.venues.name,
        venue_id: booking.venue_id,
        created_at: booking.created_at,
        service_name: booking.venue_services?.name
      }));

      console.log('Partner bookings filtered:', partnerBookings);
      console.log('Formatted bookings:', formattedBookings);
      setPendingBookings(formattedBookings);
    } catch (error) {
      console.error('Error fetching pending bookings:', error);
    }
  };

  const subscribeToBookings = () => {
    if (!profile?.id) return;

    console.log('Setting up booking subscription for partner:', profile.id);
    
    const channel = supabase
      .channel('booking-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bookings',
          filter: `status=eq.pending`
        },
        async (payload) => {
          console.log('New booking received:', payload);
          
          // Fetch the complete booking data with venue info
          const { data, error } = await supabase
            .from('bookings')
            .select(`
              *,
              venues!inner(name, partner_id),
              venue_services(name)
            `)
            .eq('id', payload.new.id)
            .single();

          console.log('Booking data fetched:', data, error);

          if (data && data.venues.partner_id === profile.id) {
            console.log('Booking is for this partner, adding to notifications');
            
            const newBooking = {
              id: data.id,
              booking_date: data.booking_date,
              booking_time: data.booking_time,
              guest_count: data.guest_count,
              total_price: Number(data.total_price),
              user_email: data.user_email,
              special_requests: data.special_requests,
              venue_name: data.venues.name,
              venue_id: data.venue_id,
              created_at: data.created_at,
              service_name: data.venue_services?.name
            };

            setPendingBookings(prev => [newBooking, ...prev]);
            
            // Show notification toast
            toast({
              title: "New Booking Request!",
              description: `${data.user_email} wants to book ${data.venues.name}`,
            });
          } else {
            console.log('Booking not for this partner or data missing');
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Unsubscribing from booking notifications');
      supabase.removeChannel(channel);
    };
  };

  const handleBookingAction = async (bookingId: string, action: 'confirmed' | 'rejected') => {
    setProcessing(bookingId);
    
    try {
      // Call the edge function to handle booking confirmation/rejection
      const { data, error } = await supabase.functions.invoke('booking-confirmation', {
        body: {
          bookingId,
          action
        }
      });

      if (error) throw error;

      // Remove from pending list
      setPendingBookings(prev => prev.filter(b => b.id !== bookingId));
      setSelectedBooking(null);

      toast({
        title: action === 'confirmed' ? "Booking Confirmed" : "Booking Rejected",
        description: `The booking has been ${action}. Customer will be notified via email.`,
      });

    } catch (error: any) {
      console.error('Error processing booking action:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update booking",
        variant: "destructive"
      });
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return 'Not set';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <>
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Pending Booking Requests
            {pendingBookings.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingBookings.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingBookings.length > 0 ? (
            <div className="space-y-4">
              {pendingBookings.slice(0, 3).map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => setSelectedBooking(booking)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{booking.venue_name}</h4>
                      <Badge variant="outline">Pending</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>{booking.user_email}</p>
                      <p>{formatDate(booking.booking_date)} at {formatTime(booking.booking_time)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">${booking.total_price.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">
                      {booking.guest_count} guest{booking.guest_count !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              ))}
              {pendingBookings.length > 3 && (
                <p className="text-sm text-muted-foreground text-center pt-2">
                  +{pendingBookings.length - 3} more pending requests
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No pending requests</h3>
              <p className="text-muted-foreground">
                New booking requests will appear here for your approval.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Booking Details Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Booking Request Details</DialogTitle>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Customer Information</h3>
                  <p className="text-sm text-muted-foreground">Email: {selectedBooking.user_email}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Booking Date</h3>
                  <p className="text-sm">{formatDate(selectedBooking.booking_date)}</p>
                </div>
              </div>

              {/* Booking Details */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{selectedBooking.venue_name}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{formatTime(selectedBooking.booking_time)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedBooking.guest_count} guest{selectedBooking.guest_count !== 1 ? 's' : ''}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">${selectedBooking.total_price.toFixed(2)}</span>
                  </div>
                </div>
                
                <div>
                  {selectedBooking.service_name && (
                    <div className="mb-3">
                      <h4 className="font-medium">Selected Service</h4>
                      <p className="text-sm text-muted-foreground">{selectedBooking.service_name}</p>
                    </div>
                  )}
                  
                  {selectedBooking.special_requests && (
                    <div>
                      <h4 className="font-medium">Special Requests</h4>
                      <p className="text-sm text-muted-foreground">{selectedBooking.special_requests}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => handleBookingAction(selectedBooking.id, 'rejected')}
                  disabled={processing === selectedBooking.id}
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => handleBookingAction(selectedBooking.id, 'confirmed')}
                  disabled={processing === selectedBooking.id}
                >
                  <Check className="h-4 w-4 mr-2" />
                  {processing === selectedBooking.id ? 'Processing...' : 'Accept'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BookingNotifications;