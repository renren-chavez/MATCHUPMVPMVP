import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookingEmailRequest {
  to: string;
  type: "booking_created" | "booking_approved" | "booking_rejected" | "booking_cancelled" | "payment_received";
  bookingDetails: {
    athleteName: string;
    coachName: string;
    sport: string;
    location: string;
    sessionDate: string;
    sessionTime: string;
    duration: number;
    totalAmount: number;
    bookingReference: string;
    cancellationReason?: string;
    paymentAmount?: number;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, type, bookingDetails }: BookingEmailRequest = await req.json();

    console.log("Sending email:", { to, type, bookingReference: bookingDetails.bookingReference });

    let subject = "";
    let html = "";

    const commonDetails = `
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #333;">Booking Details</h3>
        <p><strong>Reference:</strong> ${bookingDetails.bookingReference}</p>
        <p><strong>Athlete:</strong> ${bookingDetails.athleteName}</p>
        <p><strong>Coach:</strong> ${bookingDetails.coachName}</p>
        <p><strong>Sport:</strong> ${bookingDetails.sport}</p>
        <p><strong>Location:</strong> ${bookingDetails.location}</p>
        <p><strong>Date:</strong> ${bookingDetails.sessionDate}</p>
        <p><strong>Time:</strong> ${bookingDetails.sessionTime}</p>
        <p><strong>Duration:</strong> ${bookingDetails.duration} hour(s)</p>
        <p><strong>Total Amount:</strong> ₱${bookingDetails.totalAmount}</p>
      </div>
    `;

    switch (type) {
      case "booking_created":
        subject = `New Booking Request - ${bookingDetails.bookingReference}`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">New Booking Request</h1>
            <p>Hi ${bookingDetails.coachName},</p>
            <p>You have received a new booking request from <strong>${bookingDetails.athleteName}</strong>.</p>
            ${commonDetails}
            <p>Please review and approve or reject this booking in your MatchUp dashboard.</p>
            <p>Best regards,<br>The MatchUp Team</p>
          </div>
        `;
        break;

      case "booking_approved":
        subject = `Booking Approved - ${bookingDetails.bookingReference}`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #16a34a;">Booking Approved!</h1>
            <p>Hi ${bookingDetails.athleteName},</p>
            <p>Great news! Your booking with <strong>${bookingDetails.coachName}</strong> has been approved.</p>
            ${commonDetails}
            <p>Please proceed with the payment to confirm your session.</p>
            <p>Best regards,<br>The MatchUp Team</p>
          </div>
        `;
        break;

      case "booking_rejected":
        subject = `Booking Not Approved - ${bookingDetails.bookingReference}`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #dc2626;">Booking Not Approved</h1>
            <p>Hi ${bookingDetails.athleteName},</p>
            <p>Unfortunately, your booking request with <strong>${bookingDetails.coachName}</strong> could not be approved at this time.</p>
            ${commonDetails}
            <p>Please feel free to book another session or contact the coach directly for more information.</p>
            <p>Best regards,<br>The MatchUp Team</p>
          </div>
        `;
        break;

      case "booking_cancelled":
        subject = `Booking Cancelled - ${bookingDetails.bookingReference}`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #dc2626;">Booking Cancelled</h1>
            <p>Hi ${bookingDetails.athleteName},</p>
            <p>Your booking with <strong>${bookingDetails.coachName}</strong> has been cancelled.</p>
            ${commonDetails}
            ${bookingDetails.cancellationReason ? `<p><strong>Reason:</strong> ${bookingDetails.cancellationReason}</p>` : ''}
            <p>If a refund is applicable, it will be processed according to the coach's cancellation policy.</p>
            <p>Best regards,<br>The MatchUp Team</p>
          </div>
        `;
        break;

      case "payment_received":
        subject = `Payment Received - ${bookingDetails.bookingReference}`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #16a34a;">Payment Received!</h1>
            <p>Hi ${bookingDetails.athleteName},</p>
            <p>Your payment of <strong>₱${bookingDetails.paymentAmount}</strong> has been confirmed for your session with ${bookingDetails.coachName}.</p>
            ${commonDetails}
            <p>We look forward to your session!</p>
            <p>Best regards,<br>The MatchUp Team</p>
          </div>
        `;
        break;
    }

    // Send email using Resend API
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "MatchUp <onboarding@resend.dev>",
        to: [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Resend API error:", error);
      throw new Error(`Email send failed: ${error}`);
    }

    const data = await response.json();
    console.log("Email sent successfully:", data);

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-booking-email function:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred sending the email. Please try again." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
