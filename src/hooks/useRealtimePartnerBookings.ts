import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { audioAlert } from '@/utils/audioAlert';

export const useRealtimePartnerBookings = () => {
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!profile || profile.role !== 'partner') return;

    console.log('Setting up real-time booking subscription for partner:', profile.id);

    const channel = supabase
      .channel('partner-booking-requests')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bookings',
        },
        async (payload) => {
          console.log('New booking request received:', payload);
          
          // Check if this booking is for one of the partner's venues
          const { data: venue } = await supabase
            .from('venues')
            .select('name, partner_id')
            .eq('id', payload.new.venue_id)
            .eq('partner_id', profile.id)
            .single();

          if (venue) {
            // Play booking alert sound (longer, more urgent)
            audioAlert.playBookingSound();
            
            toast({
              title: "🔔 New Booking Request!",
              description: `New booking request for ${venue.name}`,
              duration: 8000,
            });

            // Invalidate pending bookings query to refresh the list
            queryClient.invalidateQueries({ queryKey: ['pending-bookings'] });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
        },
        async (payload) => {
          console.log('Booking status updated:', payload);
          
          const oldStatus = payload.old.status;
          const newStatus = payload.new.status;
          
          // Only handle changes from pending to other statuses for cleanup
          if (oldStatus === 'pending' && newStatus !== 'pending') {
            // Check if this booking belongs to the partner's venues
            const { data: venue } = await supabase
              .from('venues')
              .select('partner_id')
              .eq('id', payload.new.venue_id)
              .eq('partner_id', profile.id)
              .single();

            if (venue) {
              // Refresh pending bookings list
              queryClient.invalidateQueries({ queryKey: ['pending-bookings'] });
            }
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Unsubscribing from partner booking notifications');
      supabase.removeChannel(channel);
    };
  }, [profile, queryClient, toast]);
};