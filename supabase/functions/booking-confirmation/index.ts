import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BookingConfirmationRequest {
  bookingId: string;
  action: 'confirmed' | 'rejected';
}

const handler = async (req: Request): Promise<Response> => {
  console.log('Booking confirmation function called');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    console.log('Auth header present:', !!authHeader);
    
    // Create Supabase client with service role for admin operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

    const requestBody = await req.text();
    console.log('Request body:', requestBody);
    
    const { bookingId, action }: BookingConfirmationRequest = JSON.parse(requestBody);

    console.log(`Processing booking ${action} for booking ID: ${bookingId}`);

    // Get booking details with venue info
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        venues(name, partner_id)
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      console.error('Error fetching booking:', bookingError);
      throw new Error('Booking not found');
    }

    console.log('Booking data:', booking);

    // Update booking status
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ 
        status: action,
        status_updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    if (updateError) {
      console.error('Error updating booking status:', updateError);
      throw updateError;
    }

    // Create in-app notification for the user
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: booking.user_id,
        booking_id: bookingId,
        type: action === 'confirmed' ? 'booking_confirmed' : 'booking_rejected',
        title: action === 'confirmed' ? 'Booking Confirmed!' : 'Booking Rejected',
        message: action === 'confirmed' 
          ? `Your booking for ${booking.venues.name} has been confirmed.`
          : `Your booking for ${booking.venues.name} has been rejected.`,
        read: false
      });

    if (notificationError) {
      console.error('Error creating notification:', notificationError);
    }

    // Send email notification
    const emailSubject = action === 'confirmed' 
      ? `Booking Confirmed - ${booking.venues.name}`
      : `Booking Update - ${booking.venues.name}`;

    const emailHtml = action === 'confirmed' 
      ? `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #22c55e;">Booking Confirmed!</h1>
          <p>Great news! Your booking has been confirmed.</p>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Booking Details:</h3>
            <p><strong>Venue:</strong> ${booking.venues.name}</p>
            <p><strong>Date:</strong> ${new Date(booking.booking_date).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${booking.booking_time}</p>
            <p><strong>Guests:</strong> ${booking.guest_count}</p>
            <p><strong>Total:</strong> $${Number(booking.total_price).toFixed(2)}</p>
          </div>
          
          <p>We look forward to seeing you!</p>
          <p style="color: #6b7280; font-size: 14px;">Best regards,<br>Venue Booking Team</p>
        </div>
      `
      : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #ef4444;">Booking Update</h1>
          <p>We regret to inform you that your booking has been rejected.</p>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Booking Details:</h3>
            <p><strong>Venue:</strong> ${booking.venues.name}</p>
            <p><strong>Date:</strong> ${new Date(booking.booking_date).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${booking.booking_time}</p>
          </div>
          
          <p>You can browse other available venues and try booking again.</p>
          <p style="color: #6b7280; font-size: 14px;">Best regards,<br>Venue Booking Team</p>
        </div>
      `;

    try {
      const emailResponse = await resend.emails.send({
        from: "Venue Booking <onboarding@resend.dev>",
        to: [booking.user_email],
        subject: emailSubject,
        html: emailHtml,
      });

      console.log("Email sent successfully:", emailResponse);
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      // Don't throw error - email failure shouldn't break the booking confirmation
    }

    console.log(`Booking ${action} processed successfully`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Booking ${action} successfully`,
        bookingId 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error("Error in booking-confirmation function:", error);
    
    // Return more detailed error information
    const errorMessage = error.message || 'An error occurred processing the booking confirmation';
    console.error("Detailed error:", {
      message: errorMessage,
      stack: error.stack,
      name: error.name
    });
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error.stack
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);