
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";

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
  bookingDate: string;
  bookingTime: string;
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

    const { bookingId, userId, userEmail, venueName, bookingDate, bookingTime }: BookingNotificationRequest = 
      await req.json();

    console.log("Processing booking notification for:", { bookingId, userId, userEmail });

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

    // Calculate reminder times
    const bookingDateTime = new Date(`${bookingDate}T${bookingTime}`);
    const twoHoursBefore = new Date(bookingDateTime.getTime() - 2 * 60 * 60 * 1000);
    const oneHourBefore = new Date(bookingDateTime.getTime() - 60 * 60 * 1000);
    const tenMinutesBefore = new Date(bookingDateTime.getTime() - 10 * 60 * 1000);

    // Create scheduled reminder notifications
    const reminders = [
      {
        user_id: userId,
        booking_id: bookingId,
        type: '2_hours_before',
        title: 'Booking Reminder - 2 Hours',
        message: `Your booking at ${venueName} starts in 2 hours!`,
        scheduled_for: twoHoursBefore.toISOString(),
      },
      {
        user_id: userId,
        booking_id: bookingId,
        type: '1_hour_before',
        title: 'Booking Reminder - 1 Hour',
        message: `Your booking at ${venueName} starts in 1 hour!`,
        scheduled_for: oneHourBefore.toISOString(),
      },
      {
        user_id: userId,
        booking_id: bookingId,
        type: '10_minutes_before',
        title: 'Booking Reminder - 10 Minutes',
        message: `Your booking at ${venueName} starts in 10 minutes! Time to head over!`,
        scheduled_for: tenMinutesBefore.toISOString(),
      },
    ];

    const { error: remindersError } = await supabase
      .from('notifications')
      .insert(reminders);

    if (remindersError) {
      console.error("Error creating reminder notifications:", remindersError);
      throw remindersError;
    }

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
