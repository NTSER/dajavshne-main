import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Venue } from './useVenues';

export interface CreateVenueData {
  name: string;
  description: string;
  location: string;
  category: string;
  price: number;
  images: string[];
  amenities: string[];
  openingTime: string;
  closingTime: string;
}

export const usePartnerVenues = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['partner-venues', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .eq('partner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Venue[];
    },
    enabled: !!user?.id,
  });
};

export const useCreateVenue = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (venueData: CreateVenueData) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('venues')
        .insert([{
          name: venueData.name,
          description: venueData.description,
          location: venueData.location,
          category: venueData.category,
          price: venueData.price,
          images: venueData.images,
          amenities: venueData.amenities,
          opening_time: venueData.openingTime,
          closing_time: venueData.closingTime,
          partner_id: user.id,
          rating: 0,
          review_count: 0,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-venues'] });
    },
  });
};

export const useUpdateVenue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...venueData }: Partial<Venue> & { id: string }) => {
      const { data, error } = await supabase
        .from('venues')
        .update(venueData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-venues'] });
      queryClient.invalidateQueries({ queryKey: ['venues'] });
    },
  });
};

export const useDeleteVenue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (venueId: string) => {
      const { error } = await supabase
        .from('venues')
        .delete()
        .eq('id', venueId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-venues'] });
      queryClient.invalidateQueries({ queryKey: ['venues'] });
    },
  });
};