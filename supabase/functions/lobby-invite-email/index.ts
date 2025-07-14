import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LobbyInviteRequest {
  lobbyId: string;
  invitedUserIds: string[];
  inviterName: string;
  lobbyName: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lobbyId, invitedUserIds, inviterName, lobbyName }: LobbyInviteRequest = await req.json();

    console.log('Sending lobby invitation emails:', { lobbyId, invitedUserIds, inviterName, lobbyName });

    // Get invited users' email addresses
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', invitedUserIds);

    if (profileError) {
      console.error('Error fetching user profiles:', profileError);
      throw profileError;
    }

    if (!profiles || profiles.length === 0) {
      throw new Error('No user profiles found');
    }

    // Send emails to all invited users
    const emailPromises = profiles.map(async (profile) => {
      if (!profile.email) {
        console.warn(`No email found for user ${profile.id}`);
        return null;
      }

      try {
        const emailResponse = await resend.emails.send({
          from: "Dajavshne Gaming <onboarding@resend.dev>",
          to: [profile.email],
          subject: `🎮 You're invited to join "${lobbyName}" lobby!`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #6366f1; margin-bottom: 10px;">🎮 Dajavshne Gaming</h1>
                <h2 style="color: #333; margin-bottom: 20px;">You're invited to join a gaming lobby!</h2>
              </div>
              
              <div style="background: #f8fafc; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
                <h3 style="color: #333; margin-bottom: 15px;">Lobby Details</h3>
                <p style="margin: 8px 0;"><strong>Lobby Name:</strong> ${lobbyName}</p>
                <p style="margin: 8px 0;"><strong>Invited by:</strong> ${inviterName}</p>
                <p style="margin: 8px 0;"><strong>Your Name:</strong> ${profile.full_name || 'Gaming Friend'}</p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <p style="margin-bottom: 20px; color: #666;">Ready to join the gaming session?</p>
                <a href="${supabaseUrl.replace('https://', 'https://dfedc512-158f-4d8f-ad30-b46307620cec.lovableproject.com')}" 
                   style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                  View Invitation
                </a>
              </div>
              
              <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center;">
                <p style="color: #666; font-size: 14px; margin: 5px 0;">
                  Log in to Dajavshne to accept or decline this invitation.
                </p>
                <p style="color: #666; font-size: 14px; margin: 5px 0;">
                  You can find this invitation in your profile notifications.
                </p>
              </div>
              
              <div style="margin-top: 30px; text-align: center;">
                <p style="color: #9ca3af; font-size: 12px;">
                  This email was sent by Dajavshne Gaming Hub. 
                  <br>Ready to elevate your gaming experience?
                </p>
              </div>
            </div>
          `,
        });

        console.log(`Email sent successfully to ${profile.email}:`, emailResponse);
        return emailResponse;
      } catch (emailError) {
        console.error(`Error sending email to ${profile.email}:`, emailError);
        return null;
      }
    });

    const emailResults = await Promise.allSettled(emailPromises);
    const successfulEmails = emailResults.filter(result => result.status === 'fulfilled' && result.value !== null).length;

    console.log(`Successfully sent ${successfulEmails} out of ${profiles.length} invitation emails`);

    return new Response(JSON.stringify({
      success: true,
      message: `Lobby invitation emails sent`,
      emailsSent: successfulEmails,
      totalInvited: profiles.length
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in lobby-invite-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
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