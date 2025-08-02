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
    
    // Find completed bookings that haven't been reviewed
    const completedBookingsNeedingReview = bookings.filter(booking => {
      // Skip if we already showed review dialog for this booking
      if (reviewedBookings.has(booking.id)) return false;
      
      // Skip if booking isn't confirmed
      if (booking.status !== 'confirmed') return false;
      
      // Check if booking time has passed
      const bookingDateTime = parse(
        `${booking.booking_date} ${booking.booking_time}`,
        'yyyy-MM-dd HH:mm',
        new Date()
      );
      
      // Add 1 hour to booking time (assuming 1 hour duration)
      const bookingEndTime = new Date(bookingDateTime.getTime() + 60 * 60 * 1000);
      
      return isAfter(now, bookingEndTime);
    });

    // Show dialog for the first completed booking that needs review
    if (completedBookingsNeedingReview.length > 0 && !dialogOpen) {
      const bookingToReview = completedBookingsNeedingReview[0];
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