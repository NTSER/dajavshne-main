import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Bell, Check, X, Calendar, Clock, Users, MapPin, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePartnerAuth } from '@/hooks/usePartnerAuth';
import { audioAlert } from '@/utils/audioAlert';
import { cn } from '@/lib/utils';

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
      console.log('🚀 Partner profile loaded, setting up BookingNotifications for:', profile.id);
      fetchPendingBookings();
      const cleanup = subscribeToBookings();
      return cleanup;
    } else {
      console.log('⏳ Waiting for partner profile...');
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
      .channel('partner-booking-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bookings',
        },
        async (payload) => {
          console.log('🔔 NEW BOOKING RECEIVED:', payload);
          
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

          console.log('📊 Booking data fetched:', data, error);

          if (data && data.venues.partner_id === profile.id && data.status === 'pending') {
            console.log('✅ Booking is for this partner, adding to notifications');
            
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

            console.log('🎯 Adding booking to state:', newBooking);
            setPendingBookings(prev => {
              const updated = [newBooking, ...prev];
              console.log('📈 Updated pending bookings state:', updated);
              return updated;
            });
            
            // Play LOUD booking sound alert - harder to miss!
            audioAlert.playBookingSound(4000);
            
            // Show notification toast
            toast({
              title: "🔔 New Booking Request!",
              description: `${data.user_email} wants to book ${data.venues.name}`,
              duration: 8000,
            });
          } else {
            console.log('❌ Booking not for this partner or not pending:', {
              isForPartner: data?.venues?.partner_id === profile.id,
              status: data?.status,
              partnerId: profile.id,
              venuePartnerId: data?.venues?.partner_id
            });
          }
        }
      )
      // Also listen for booking status updates to remove from pending list
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
        },
        async (payload) => {
          console.log('📝 Booking updated:', payload);
          
          // If booking status changed from pending, remove it from the list
          if (payload.old.status === 'pending' && payload.new.status !== 'pending') {
            console.log('🗑️ Removing booking from pending list:', payload.new.id);
            setPendingBookings(prev => prev.filter(b => b.id !== payload.new.id));
          }
        }
      )
      .subscribe(async (status, error) => {
        console.log('📡 Realtime subscription status:', status);
        if (error) {
          console.error('❌ Realtime subscription error:', error);
        }
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to booking changes');
        }
      });

    return () => {
      console.log('🔌 Unsubscribing from booking notifications');
      supabase.removeChannel(channel);
    };
  };

  const handleBookingAction = async (bookingId: string, action: 'confirmed' | 'rejected') => {
    setProcessing(bookingId);
    
    console.log(`Starting booking action: ${action} for booking ID: ${bookingId}`);
    
    try {
      // Try edge function first, but fallback to direct DB update if it fails
      console.log('Calling booking-confirmation edge function...');
      
      const { data, error } = await supabase.functions.invoke('booking-confirmation', {
        body: {
          bookingId,
          action
        }
      });

      console.log('Edge function response:', { data, error });

      if (error) {
        console.warn('Edge function failed, falling back to direct update:', error);
        
        // Fallback to direct database update
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ 
            status: action,
            status_updated_at: new Date().toISOString()
          })
          .eq('id', bookingId);

        if (updateError) {
          throw updateError;
        }

        // Create notification manually
        const bookingData = await supabase.from('bookings').select('user_id').eq('id', bookingId).single();
        if (bookingData.data?.user_id) {
          const { error: notificationError } = await supabase
            .from('notifications')
            .insert({
              user_id: bookingData.data.user_id,
              booking_id: bookingId,
              type: action === 'confirmed' ? 'booking_confirmed' : 'booking_rejected',
              title: action === 'confirmed' ? 'Booking Confirmed!' : 'Booking Rejected',
              message: action === 'confirmed' 
                ? `Your booking has been confirmed.`
                : `Your booking has been rejected.`,
              read: false
            });

          if (notificationError) {
            console.error('Error creating notification:', notificationError);
          }
        }

        console.log('Fallback update completed successfully');
      }

      // Always remove from pending list immediately - don't wait for real-time subscription
      setPendingBookings(prev => prev.filter(b => b.id !== bookingId));
      setSelectedBooking(null);

      toast({
        title: action === 'confirmed' ? "Booking Confirmed" : "Booking Rejected",
        description: `The booking has been ${action}. Customer will be notified.`,
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-2xl font-semibold">Booking Request Details</DialogTitle>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-6 pt-6">
              {/* Customer Information */}
              <div className="space-y-3">
                <h3 className="text-lg font-medium">Customer Information</h3>
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-medium text-sm">
                        {selectedBooking.user_email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Guest</p>
                      <p className="text-sm text-muted-foreground">{selectedBooking.user_email}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Service Information - EXACT same layout as client side */}
              {selectedBooking.service_name && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Service Details</h3>
                  <div className={cn(
                    "p-4 rounded-xl border-2 border-primary bg-primary/5"
                  )}>
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-muted rounded-xl flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-lg mb-1">{selectedBooking.service_name}</h4>
                        <p className="text-muted-foreground">
                          ${(selectedBooking.total_price / selectedBooking.guest_count).toFixed(0)} / guest · {selectedBooking.service_name}
                        </p>
                      </div>
                    </div>
                    
                    {/* Selected booking information - EXACT same as client */}
                    <div className="mt-4 pt-4 border-t border-border space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Guests:</span>
                        <span className="font-medium">{selectedBooking.guest_count}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Date:</span>
                        <span className="font-medium">{new Date(selectedBooking.booking_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Time:</span>
                        <span className="font-medium">
                          {selectedBooking.booking_time?.substring(0, 5)} - {(() => {
                            if (!selectedBooking.booking_time) return 'Not specified';
                            const [hours, minutes] = selectedBooking.booking_time.split(':');
                            const departureHour = (parseInt(hours) + 2) % 24;
                            return `${departureHour.toString().padStart(2, '0')}:${minutes}`;
                          })()}
                        </span>
                      </div>
                      {/* Selected Games section - extract from special requests or show service name */}
                      <div className="space-y-2">
                        <span className="text-muted-foreground text-sm">Selected Games:</span>
                        <div className="flex flex-wrap gap-1">
                          {(() => {
                            // Try to extract games from special requests or fall back to service name
                            const gamesText = selectedBooking.special_requests || '';
                            const gameMatches = gamesText.match(/Games?:\s*([^.]+)/i);
                            const games = gameMatches ? gameMatches[1].split(',').map(g => g.trim()) : [selectedBooking.service_name];
                            
                            return games.map((game, index) => (
                              <Badge key={index} variant="secondary" className="text-xs flex items-center gap-1">
                                <span>🎮</span>
                                {game}
                              </Badge>
                            ));
                          })()}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm pt-2 border-t">
                        <span className="text-muted-foreground font-medium">Total:</span>
                        <span className="font-bold text-primary">
                          ${selectedBooking.total_price.toFixed(0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Special Requests */}
              <div className="space-y-3">
                <h3 className="text-lg font-medium">Special Requests</h3>
                <div className="bg-muted/30 rounded-lg p-4 border min-h-[80px]">
                  {selectedBooking.special_requests ? (
                    <p className="text-foreground leading-relaxed">
                      {selectedBooking.special_requests.replace(/Service\s+[a-f0-9-]+:\s*\d{2}:\d{2}\s*-\s*\d{2}:\d{2}/g, '').trim() || 'No special requests'}
                    </p>
                  ) : (
                    <p className="text-muted-foreground italic">No special requests</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-6 border-t">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => handleBookingAction(selectedBooking.id, 'rejected')}
                  disabled={processing === selectedBooking.id}
                  className="min-w-[120px] border-destructive/20 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  size="lg"
                  onClick={() => handleBookingAction(selectedBooking.id, 'confirmed')}
                  disabled={processing === selectedBooking.id}
                  className="min-w-[120px] bg-primary hover:bg-primary/90"
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