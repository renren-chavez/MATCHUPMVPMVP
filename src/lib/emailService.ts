import { supabase } from "@/integrations/supabase/client";

interface BookingDetails {
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
}

type EmailType = "booking_created" | "booking_approved" | "booking_rejected" | "booking_cancelled" | "payment_received";

export const sendBookingEmail = async (
  to: string,
  type: EmailType,
  bookingDetails: BookingDetails
) => {
  try {
    const { data, error } = await supabase.functions.invoke("send-booking-email", {
      body: {
        to,
        type,
        bookingDetails,
      },
    });

    if (error) {
      console.error("Error sending email:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Failed to send email:", error);
    throw error;
  }
};
