import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AdminVenue {
  id: string;
  name: string;
  description: string | null;
  location: string;
  price: number;
  rating: number | null;
  review_count: number | null;
  category: string;
  images: string[] | null;
  amenities: string[] | null;
  approval_status: 'pending' | 'approved' | 'rejected';
  is_visible: boolean;
  priority: number;
  rejected_reason: string | null;
  partner_id: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string | null;
    email: string | null;
  };
}

export const useAdminVenues = () => {
  return useQuery({
    queryKey: ['admin-venues'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('venues')
        .select(`
          *,
          profiles:partner_id (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AdminVenue[];
    },
  });
};

export const usePendingVenues = () => {
  return useQuery({
    queryKey: ['pending-venues'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('venues')
        .select(`
          *,
          profiles:partner_id (
            full_name,
            email
          )
        `)
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AdminVenue[];
    },
  });
};

export const useApproveVenue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (venueId: string) => {
      const { error } = await supabase
        .from('venues')
        .update({ 
          approval_status: 'approved',
          is_visible: true 
        })
        .eq('id', venueId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-venues'] });
      queryClient.invalidateQueries({ queryKey: ['pending-venues'] });
      queryClient.invalidateQueries({ queryKey: ['venues'] });
      toast.success('Venue approved successfully');
    },
    onError: (error) => {
      toast.error('Failed to approve venue: ' + error.message);
    },
  });
};

export const useRejectVenue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ venueId, reason }: { venueId: string; reason?: string }) => {
      const { error } = await supabase
        .from('venues')
        .update({ 
          approval_status: 'rejected',
          is_visible: false,
          rejected_reason: reason || null
        })
        .eq('id', venueId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-venues'] });
      queryClient.invalidateQueries({ queryKey: ['pending-venues'] });
      queryClient.invalidateQueries({ queryKey: ['venues'] });
      toast.success('Venue rejected');
    },
    onError: (error) => {
      toast.error('Failed to reject venue: ' + error.message);
    },
  });
};

export const useToggleVenueVisibility = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ venueId, isVisible }: { venueId: string; isVisible: boolean }) => {
      const { error } = await supabase
        .from('venues')
        .update({ is_visible: isVisible })
        .eq('id', venueId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-venues'] });
      queryClient.invalidateQueries({ queryKey: ['venues'] });
      toast.success('Venue visibility updated');
    },
    onError: (error) => {
      toast.error('Failed to update venue visibility: ' + error.message);
    },
  });
};