
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Venue {
  id: string;
  name: string;
  location: string;
  rating: number;
  review_count: number;
  images: string[];
  opening_time?: string;
  closing_time?: string;
  default_discount_percentage?: number;
}

export interface VenueService {
  id: string;
  venue_id: string;
  name: string;
  price: number;
  service_type: 'PC Gaming' | 'PlayStation 5' | 'Billiards' | 'Table Tennis';
  images: string[];
}

export const useVenues = (showHidden = true) => {
  return useQuery({
    queryKey: ['venues', showHidden],
    queryFn: async () => {
      let query = supabase
        .from('venues')
        .select('*')
        .order('created_at', { ascending: false });

      // If showHidden is false, filter to only show visible venues
      if (!showHidden) {
        query = query.eq('is_visible', true);
      }

      const { data, error } = await query;

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
