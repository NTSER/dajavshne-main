
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BookingNotificationRequest {
  bookingId: string;
  userId: string;
  userEmail: string;
  venueName: string;
  venueLocation: string;
  bookingDate: string;
  bookingTime: string;
  totalPrice: number;
  guestCount: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { 
      bookingId, 
      userId, 
      userEmail, 
      venueName, 
      venueLocation, 
      bookingDate, 
      bookingTime, 
      totalPrice, 
      guestCount 
    }: BookingNotificationRequest = await req.json();

    console.log("Processing booking notification for:", { bookingId, userId, userEmail });

    // Initialize Resend
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    // Send booking confirmation email
    try {
      const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      };

      const formatTime = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(':');
        const date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes));
        return date.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        });
      };

      const emailResponse = await resend.emails.send({
        from: "VenueBooker <bookings@resend.dev>",
        to: [userEmail],
        subject: `Booking Confirmed - ${venueName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 28px;">🎉 Booking Confirmed!</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your venue reservation is all set</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
              <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h2 style="color: #333; margin-top: 0; font-size: 22px;">Booking Details</h2>
                
                <div style="margin: 20px 0;">
                  <div style="display: flex; margin: 15px 0; align-items: center;">
                    <span style="font-weight: bold; color: #555; width: 120px; display: inline-block;">📍 Venue:</span>
                    <span style="color: #333; font-size: 16px;">${venueName}</span>
                  </div>
                  
                  <div style="display: flex; margin: 15px 0; align-items: center;">
                    <span style="font-weight: bold; color: #555; width: 120px; display: inline-block;">📅 Date:</span>
                    <span style="color: #333; font-size: 16px;">${formatDate(bookingDate)}</span>
                  </div>
                  
                  <div style="display: flex; margin: 15px 0; align-items: center;">
                    <span style="font-weight: bold; color: #555; width: 120px; display: inline-block;">⏰ Time:</span>
                    <span style="color: #333; font-size: 16px;">${formatTime(bookingTime)}</span>
                  </div>
                  
                  <div style="display: flex; margin: 15px 0; align-items: center;">
                    <span style="font-weight: bold; color: #555; width: 120px; display: inline-block;">👥 Guests:</span>
                    <span style="color: #333; font-size: 16px;">${guestCount} ${guestCount === 1 ? 'person' : 'people'}</span>
                  </div>
                  
                  <div style="display: flex; margin: 15px 0; align-items: center;">
                    <span style="font-weight: bold; color: #555; width: 120px; display: inline-block;">🏢 Location:</span>
                    <span style="color: #333; font-size: 16px;">${venueLocation}</span>
                  </div>
                  
                  <div style="display: flex; margin: 15px 0; align-items: center;">
                    <span style="font-weight: bold; color: #555; width: 120px; display: inline-block;">💰 Total:</span>
                    <span style="color: #333; font-size: 18px; font-weight: bold;">$${totalPrice}</span>
                  </div>
                </div>
                
                <div style="margin: 25px 0; padding: 20px; background: #e3f2fd; border-radius: 8px; border-left: 4px solid #2196f3;">
                  <h3 style="margin: 0 0 10px 0; color: #1976d2; font-size: 18px;">📧 Booking Reference</h3>
                  <p style="margin: 0; color: #333; font-family: monospace; font-size: 14px; background: white; padding: 10px; border-radius: 4px;">${bookingId}</p>
                </div>
                
                <div style="margin: 25px 0; padding: 15px; background: #fff3e0; border-radius: 8px; border-left: 4px solid #ff9800;">
                  <p style="margin: 0; color: #e65100; font-size: 14px;">
                    <strong>💡 Reminder:</strong> You'll receive reminder notifications before your booking time. Make sure to arrive on time!
                  </p>
                </div>
              </div>
              
              <div style="text-align: center; margin-top: 25px; color: #666; font-size: 14px;">
                <p style="margin: 5px 0;">Thank you for choosing VenueBooker!</p>
                <p style="margin: 5px 0;">Questions? Reply to this email or contact our support team.</p>
              </div>
            </div>
          </div>
        `,
      });

      console.log("Booking confirmation email sent successfully:", emailResponse);
    } catch (emailError) {
      console.error("Error sending booking confirmation email:", emailError);
      // Don't throw here - we still want to create notifications even if email fails
    }

    // Create booking confirmation notification
    const { error: confirmationError } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        booking_id: bookingId,
        type: 'booking_confirmation',
        title: 'Booking Confirmed!',
        message: `Your booking at ${venueName} on ${bookingDate} at ${bookingTime} has been confirmed.`,
      });

    if (confirmationError) {
      console.error("Error creating confirmation notification:", confirmationError);
      throw confirmationError;
    }

    // Note: Only booking confirmation notification is created here.
    // 1-hour reminder notifications are handled by the automated cron job system
    // which checks user's local time and sends reminders exactly 1 hour before booking.

    console.log("Successfully created booking confirmation and reminder notifications");

    return new Response(
      JSON.stringify({ success: true, message: "Notifications created successfully" }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in booking-notifications function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
