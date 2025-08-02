import { useState, useEffect } from 'react';
import { Percent, Clock, Gift, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useVenueDiscounts, isDiscountActive, calculateDiscountedPrice, VenueDiscount } from '@/hooks/useDiscounts';

interface VenueDiscountsProps {
  venueId: string;
  defaultDiscount: number;
  servicePrice?: number;
  showCalculation?: boolean;
}

export const VenueDiscounts = ({ 
  venueId, 
  defaultDiscount, 
  servicePrice, 
  showCalculation = false 
}: VenueDiscountsProps) => {
  const { data: discounts = [], isLoading } = useVenueDiscounts(venueId);
  const [activeDiscounts, setActiveDiscounts] = useState<VenueDiscount[]>([]);

  useEffect(() => {
    const active = discounts.filter(isDiscountActive);
    setActiveDiscounts(active);
  }, [discounts]);

  const getDiscountIcon = (type: string) => {
    switch (type) {
      case 'percentage': return <Percent className="h-4 w-4" />;
      case 'time_based': return <Clock className="h-4 w-4" />;
      case 'bulk_deal': return <Gift className="h-4 w-4" />;
      default: return <Tag className="h-4 w-4" />;
    }
  };

  const getDiscountDescription = (discount: VenueDiscount) => {
    switch (discount.discount_type) {
      case 'percentage':
        return `${discount.discount_value}% off all services`;
      case 'time_based':
        const days = discount.valid_days?.join(', ') || 'selected days';
        const timeRange = discount.valid_start_time && discount.valid_end_time 
          ? ` from ${discount.valid_start_time} to ${discount.valid_end_time}`
          : '';
        return `${discount.discount_value}% off on ${days}${timeRange}`;
      case 'bulk_deal':
        return `Buy ${discount.buy_quantity} hours, get ${discount.get_quantity} hour${discount.get_quantity === 1 ? '' : 's'} free`;
      default:
        return discount.description || discount.title;
    }
  };

  const formatTime = (time: string) => {
    const [hour, minute] = time.split(':');
    const hourNum = parseInt(hour);
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
    return `${displayHour}:${minute} ${ampm}`;
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-muted rounded w-32 mb-2"></div>
        <div className="h-8 bg-muted rounded"></div>
      </div>
    );
  }

  const hasAnyDiscount = defaultDiscount > 0 || activeDiscounts.length > 0;

  if (!hasAnyDiscount) {
    return null;
  }

  return (
    <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
          <Tag className="h-5 w-5" />
          Active Discounts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Default Discount */}
        {defaultDiscount > 0 && (
          <div className="flex items-center justify-between p-3 bg-white dark:bg-green-900 rounded-lg border border-green-200 dark:border-green-700">
            <div className="flex items-center gap-3">
              <Percent className="h-4 w-4 text-green-600 dark:text-green-400" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">Default Discount</p>
                <p className="text-sm text-green-600 dark:text-green-400">{defaultDiscount}% off all services</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-300">
              {defaultDiscount}% OFF
            </Badge>
          </div>
        )}

        {/* Special Discounts */}
        {activeDiscounts.map((discount) => (
          <div key={discount.id} className="flex items-center justify-between p-3 bg-white dark:bg-green-900 rounded-lg border border-green-200 dark:border-green-700">
            <div className="flex items-center gap-3">
              {getDiscountIcon(discount.discount_type)}
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">{discount.title}</p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  {getDiscountDescription(discount)}
                </p>
                {discount.discount_type === 'time_based' && discount.valid_start_time && discount.valid_end_time && (
                  <p className="text-xs text-green-500 dark:text-green-400 mt-1">
                    Valid today: {formatTime(discount.valid_start_time)} - {formatTime(discount.valid_end_time)}
                  </p>
                )}
              </div>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-300">
              {discount.discount_type === 'percentage' 
                ? `${discount.discount_value}% OFF`
                : discount.discount_type === 'bulk_deal' 
                ? 'BULK DEAL'
                : 'SPECIAL'
              }
            </Badge>
          </div>
        ))}

        {/* Price Calculation */}
        {showCalculation && servicePrice && (
          <div className="mt-4 p-3 bg-green-100 dark:bg-green-900 rounded-lg border border-green-300 dark:border-green-600">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-green-700 dark:text-green-300">Original Price:</span>
                <span className="text-green-700 dark:text-green-300">{servicePrice.toFixed(2)}₾</span>
              </div>
              {(() => {
                const calculation = calculateDiscountedPrice(servicePrice, defaultDiscount, activeDiscounts);
                return (
                  <>
                    {calculation.savings > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-green-600 dark:text-green-400">Total Savings:</span>
                        <span className="text-green-600 dark:text-green-400">-{calculation.savings.toFixed(2)}₾</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold text-green-800 dark:text-green-200 border-t border-green-300 dark:border-green-600 pt-2">
                      <span>Final Price:</span>
                      <span>{calculation.finalPrice.toFixed(2)}₾</span>
                    </div>
                    {calculation.appliedDiscounts.length > 0 && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        Applied: {calculation.appliedDiscounts.join(', ')}
                      </p>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};