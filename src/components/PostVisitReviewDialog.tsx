import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useUserBookings } from '@/hooks/useBookings';
import { useUserReviewForVenue } from '@/hooks/useReviews';
import { useAuth } from '@/hooks/useAuth';
import ReviewForm from '@/components/ReviewForm';
import { isAfter, parse } from 'date-fns';

export const PostVisitReviewDialog = () => {
  const { user } = useAuth();
  const { data: bookings } = useUserBookings();
  const [currentBookingForReview, setCurrentBookingForReview] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reviewedBookings, setReviewedBookings] = useState<Set<string>>(new Set());

  // Check if user has existing review for the current booking's venue
  const { data: existingReview } = useUserReviewForVenue(
    currentBookingForReview?.venue_id || ''
  );

  useEffect(() => {
    if (!user || !bookings || bookings.length === 0) return;

    const now = new Date();
    console.log('PostVisitReviewDialog: Current time:', now.toISOString());
    console.log('PostVisitReviewDialog: Available bookings:', bookings.length);
    
    // Find completed bookings that haven't been reviewed
    const completedBookingsNeedingReview = bookings.filter(booking => {
      console.log('PostVisitReviewDialog: Checking booking:', booking.id, 'Status:', booking.status, 'Date:', booking.booking_date, 'Time:', booking.booking_time);
      
      // Skip if we already showed review dialog for this booking
      if (reviewedBookings.has(booking.id)) {
        console.log('PostVisitReviewDialog: Already reviewed:', booking.id);
        return false;
      }
      
      // Skip if booking isn't confirmed
      if (booking.status !== 'confirmed') {
        console.log('PostVisitReviewDialog: Not confirmed:', booking.id, booking.status);
        return false;
      }
      
      // Check if booking time has passed
      try {
        const bookingDateTime = parse(
          `${booking.booking_date} ${booking.booking_time}`,
          'yyyy-MM-dd HH:mm:ss',
          new Date()
        );
        
        // Add duration based on booking data (default to 1 hour)
        const durationMs = 1 * 60 * 60 * 1000; // 1 hour in milliseconds
        const bookingEndTime = new Date(bookingDateTime.getTime() + durationMs);
        
        console.log('PostVisitReviewDialog: Booking', booking.id, 'ends at:', bookingEndTime.toISOString(), 'Current time:', now.toISOString());
        
        const hasEnded = isAfter(now, bookingEndTime);
        console.log('PostVisitReviewDialog: Booking has ended:', hasEnded);
        
        return hasEnded;
      } catch (error) {
        console.error('PostVisitReviewDialog: Error parsing booking time:', error);
        return false;
      }
    });

    console.log('PostVisitReviewDialog: Completed bookings needing review:', completedBookingsNeedingReview.length);
    
    // Show dialog for the first completed booking that needs review
    if (completedBookingsNeedingReview.length > 0 && !dialogOpen) {
      const bookingToReview = completedBookingsNeedingReview[0];
      console.log('PostVisitReviewDialog: Setting booking for review:', bookingToReview.id);
      setCurrentBookingForReview(bookingToReview);
      setDialogOpen(true);
    }
  }, [bookings, user, dialogOpen, reviewedBookings]);

  const handleCloseDialog = () => {
    if (currentBookingForReview) {
      // Mark this booking as having been shown the review dialog
      setReviewedBookings(prev => new Set(prev).add(currentBookingForReview.id));
    }
    setDialogOpen(false);
    setCurrentBookingForReview(null);
  };

  const handleReviewSuccess = () => {
    handleCloseDialog();
  };

  if (!currentBookingForReview || !dialogOpen) return null;

  return (
    <Dialog open={dialogOpen} onOpenChange={handleCloseDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>How was your visit?</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="font-semibold text-lg">
              {currentBookingForReview.venues?.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {currentBookingForReview.venues?.location}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Visited on {new Date(currentBookingForReview.booking_date).toLocaleDateString()}
            </p>
          </div>
          
          <ReviewForm
            venueId={currentBookingForReview.venue_id}
            bookingId={currentBookingForReview.id}
            existingReview={existingReview}
            onSuccess={handleReviewSuccess}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};