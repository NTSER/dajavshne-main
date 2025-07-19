import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface VenueCategory {
  id: string;
  name: string;
}

export interface Amenity {
  id: string;
  name: string;
  icon?: string;
}

export const useVenueCategories = () => {
  return useQuery({
    queryKey: ['venue-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('venue_categories')
        .select('id, name')
        .order('name', { ascending: true });

      if (error) throw error;
      return data as VenueCategory[];
    },
  });
};

export const useAmenities = () => {
  return useQuery({
    queryKey: ['amenities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('amenities')
        .select('id, name, icon')
        .order('name', { ascending: true });

      if (error) throw error;
      return data as Amenity[];
    },
  });
};