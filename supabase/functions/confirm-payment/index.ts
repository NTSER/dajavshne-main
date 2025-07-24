import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Confirm payment function started');

    // Get Stripe secret key
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }

    // Initialize Supabase client with service role for database writes
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get user from auth header (using anon key for auth)
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAuth.auth.getUser(token);
    if (userError || !userData.user) {
      throw new Error(`Authentication error: ${userError?.message || 'User not found'}`);
    }

    const user = userData.user;
    console.log('User authenticated:', user.id);

    // Parse request body
    const { paymentIntentId, bookingData } = await req.json();
    
    if (!paymentIntentId) {
      throw new Error("Payment intent ID is required");
    }

    if (!bookingData) {
      throw new Error("Booking data is required");
    }

    console.log('Confirming payment for:', paymentIntentId);

    // Initialize Stripe and verify payment
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      throw new Error(`Payment not completed. Status: ${paymentIntent.status}`);
    }

    console.log('Payment verified successfully');

    // Create booking in database
    const bookingInsert = {
      user_id: user.id,
      venue_id: bookingData.venueId,
      service_id: bookingData.serviceIds && bookingData.serviceIds.length > 0 ? bookingData.serviceIds[0] : null,
      booking_date: bookingData.date,
      booking_time: bookingData.time,
      guest_count: bookingData.guests,
      total_price: bookingData.total,
      status: 'pending',
      special_requests: bookingData.specialRequests || null,
      user_email: user.email,
    };

    console.log('Creating booking:', bookingInsert);

    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .insert(bookingInsert)
      .select()
      .single();

    if (bookingError) {
      console.error('Booking creation error:', bookingError);
      throw new Error(`Failed to create booking: ${bookingError.message}`);
    }

    console.log('Booking created successfully:', booking.id);

    // Create notification for the user
    const notificationData = {
      user_id: user.id,
      booking_id: booking.id,
      type: 'booking_pending',
      title: 'Booking Request Submitted',
      message: `Your booking request for ${bookingData.venueName} on ${bookingData.date} has been submitted and is awaiting partner approval.`,
      read: false,
    };

    const { error: notificationError } = await supabaseClient
      .from('notifications')
      .insert(notificationData);

    if (notificationError) {
      console.error('Failed to create notification:', notificationError);
      // Don't throw error, booking was successful
    }

    return new Response(
      JSON.stringify({
        success: true,
        bookingId: booking.id,
        message: 'Payment confirmed and booking created successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in confirm-payment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});