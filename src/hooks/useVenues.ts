
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Venue {
  id: string;
  name: string;
  category: string;
  location: string;
  rating: number;
  review_count: number;
  price: number;
  images: string[];
  amenities: string[];
  description: string;
  opening_time?: string;
  closing_time?: string;
}

export interface VenueService {
  id: string;
  venue_id: string;
  name: string;
  price: number;
  duration: string;
  description: string;
  images: string[];
}

export const useVenues = () => {
  return useQuery({
    queryKey: ['venues'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data as Venue[];
    },
  });
};

export const useVenue = (id: string) => {
  return useQuery({
    queryKey: ['venue', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      return data as Venue;
    },
    enabled: !!id,
  });
};

export const useVenueServices = (venueId: string) => {
  return useQuery({
    queryKey: ['venue-services', venueId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('venue_services')
        .select('*')
        .eq('venue_id', venueId)
        .order('price', { ascending: true });

      if (error) {
        throw error;
      }

      return data as VenueService[];
    },
    enabled: !!venueId,
  });
};
