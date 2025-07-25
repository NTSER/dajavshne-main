import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, TrendingUp, Calendar, DollarSign, Users, MapPin, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { usePartnerAuth } from '@/hooks/usePartnerAuth';
import PartnerLayout from '@/components/PartnerLayout';

interface BookingStats {
  total_bookings: number;
  confirmed_bookings: number;
  pending_bookings: number;
  rejected_bookings: number;
  total_revenue: number;
  upcoming_bookings: number;
}

interface RecentBooking {
  id: string;
  booking_date: string;
  booking_time: string;
  guest_count: number;
  total_price: number;
  status: string;
  user_email: string;
  venue_name: string;
}

const Analytics = () => {
  const navigate = useNavigate();
  const { profile } = usePartnerAuth();
  const [stats, setStats] = useState<BookingStats>({
    total_bookings: 0,
    confirmed_bookings: 0,
    pending_bookings: 0,
    rejected_bookings: 0,
    total_revenue: 0,
    upcoming_bookings: 0
  });
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [profile]);

  const fetchAnalytics = async () => {
    if (!profile?.id) return;

    try {
      // Fetch booking statistics
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          venues!inner(partner_id, name)
        `)
        .eq('venues.partner_id', profile.id);

      if (bookingsError) throw bookingsError;

      const bookingStats = bookings.reduce((acc, booking) => {
        acc.total_bookings++;
        
        switch (booking.status) {
          case 'confirmed':
            acc.confirmed_bookings++;
            acc.total_revenue += Number(booking.total_price);
            break;
          case 'pending':
            acc.pending_bookings++;
            break;
          case 'rejected':
            acc.rejected_bookings++;
            break;
        }

        // Check if booking is upcoming
        const bookingDate = new Date(booking.booking_date);
        const today = new Date();
        if (bookingDate >= today && booking.status === 'confirmed') {
          acc.upcoming_bookings++;
        }

        return acc;
      }, {
        total_bookings: 0,
        confirmed_bookings: 0,
        pending_bookings: 0,
        rejected_bookings: 0,
        total_revenue: 0,
        upcoming_bookings: 0
      });

      setStats(bookingStats);

      // Format recent bookings
      const recentBookingsData = bookings
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10)
        .map(booking => ({
          id: booking.id,
          booking_date: booking.booking_date,
          booking_time: booking.booking_time,
          guest_count: booking.guest_count,
          total_price: Number(booking.total_price),
          status: booking.status,
          user_email: booking.user_email,
          venue_name: booking.venues.name
        }));

      setRecentBookings(recentBookingsData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return 'Not set';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <PartnerLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading analytics...</p>
          </div>
        </div>
      </PartnerLayout>
    );
  }

  return (
    <PartnerLayout>
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/partner/dashboard')}
              className="hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics & Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400">Track your venue performance and bookings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="grid gap-6">
          {/* Stats Overview */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_bookings}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats.total_revenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">From confirmed bookings</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pending_bookings}</div>
                <p className="text-xs text-muted-foreground">Awaiting your response</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Bookings</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.upcoming_bookings}</div>
                <p className="text-xs text-muted-foreground">Confirmed future bookings</p>
              </CardContent>
            </Card>
          </div>

          {/* Booking Status Breakdown */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-green-600">Confirmed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{stats.confirmed_bookings}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-yellow-600">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">{stats.pending_bookings}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-red-600">Rejected</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{stats.rejected_bookings}</div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Bookings */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              {recentBookings.length > 0 ? (
                <div className="space-y-4">
                  {recentBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{booking.venue_name}</h4>
                            <Badge className={getStatusColor(booking.status)}>
                              {booking.status}
                            </Badge>
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDate(booking.booking_date)}
                            <Clock className="h-4 w-4 ml-3 mr-1" />
                            {formatTime(booking.booking_time)}
                            <Users className="h-4 w-4 ml-3 mr-1" />
                            {booking.guest_count} guest{booking.guest_count !== 1 ? 's' : ''}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Customer: {booking.user_email}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">${booking.total_price.toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No bookings yet</h3>
                  <p className="text-muted-foreground">
                    Bookings will appear here once customers start booking your venues.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PartnerLayout>
  );
};

export default Analytics;