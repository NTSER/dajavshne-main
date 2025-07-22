import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface VenueDiscount {
  id: string;
  venue_id: string;
  discount_type: 'percentage' | 'bulk_deal' | 'time_based';
  discount_value: number;
  buy_quantity?: number | null;
  get_quantity?: number | null;
  valid_days?: string[] | null;
  valid_start_time?: string | null;
  valid_end_time?: string | null;
  title: string;
  description?: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export const useVenueDiscounts = (venueId: string) => {
  return useQuery({
    queryKey: ['venue-discounts', venueId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('venue_discounts')
        .select('*')
        .eq('venue_id', venueId)
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as VenueDiscount[];
    },
    enabled: !!venueId,
  });
};

export const isDiscountActive = (discount: VenueDiscount): boolean => {
  if (!discount.active) return false;
  
  if (discount.discount_type === 'time_based') {
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    
    // Check if current day is in valid days
    if (discount.valid_days && !discount.valid_days.includes(currentDay)) {
      return false;
    }
    
    // Check if current time is within valid hours
    if (discount.valid_start_time && discount.valid_end_time) {
      if (currentTime < discount.valid_start_time || currentTime > discount.valid_end_time) {
        return false;
      }
    }
  }
  
  return true;
};

export const calculateDiscountedPrice = (
  originalPrice: number,
  defaultDiscount: number,
  discounts: VenueDiscount[],
  quantity: number = 1
): { finalPrice: number; appliedDiscounts: string[]; savings: number } => {
  let finalPrice = originalPrice;
  const appliedDiscounts: string[] = [];
  let totalSavings = 0;

  // Apply default discount first
  if (defaultDiscount > 0) {
    const defaultSavings = (originalPrice * defaultDiscount) / 100;
    finalPrice -= defaultSavings;
    totalSavings += defaultSavings;
    appliedDiscounts.push(`${defaultDiscount}% default discount`);
  }

  // Apply active special discounts
  const activeDiscounts = discounts.filter(isDiscountActive);
  
  for (const discount of activeDiscounts) {
    if (discount.discount_type === 'percentage') {
      const discountSavings = (finalPrice * discount.discount_value) / 100;
      finalPrice -= discountSavings;
      totalSavings += discountSavings;
      appliedDiscounts.push(discount.title);
    } else if (discount.discount_type === 'bulk_deal' && discount.buy_quantity && discount.get_quantity) {
      if (quantity >= discount.buy_quantity) {
        const freeUnits = Math.floor(quantity / discount.buy_quantity) * discount.get_quantity;
        const unitPrice = finalPrice;
        const bulkSavings = Math.min(freeUnits, quantity) * unitPrice;
        finalPrice = Math.max(0, finalPrice * quantity - bulkSavings) / quantity;
        totalSavings += bulkSavings;
        appliedDiscounts.push(discount.title);
      }
    }
  }

  return {
    finalPrice: Math.max(0, finalPrice),
    appliedDiscounts,
    savings: totalSavings
  };
};