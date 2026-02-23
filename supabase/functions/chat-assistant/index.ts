import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  const OPENAI_API_KEY = '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 
';
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    // Validate messages array
    if (!Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Messages must be an array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (messages.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Too many messages' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    for (const msg of messages) {
      if (!msg || typeof msg !== 'object' || !msg.role || !msg.content) {
        return new Response(
          JSON.stringify({ error: 'Invalid message format' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (!['user', 'assistant'].includes(msg.role)) {
        return new Response(
          JSON.stringify({ error: 'Invalid message role' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (typeof msg.content !== 'string' || msg.content.length > 5000) {
        return new Response(
          JSON.stringify({ error: 'Invalid message content' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const MATCHUP_API_KEY = Deno.env.get('MATCHUP_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!MATCHUP_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.39.3');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const today = new Date().toISOString().split('T')[0];

    // Fetch all data in parallel
    const [
      { data: coachProfile },
      { data: profile },
      { data: bookings },
      { data: blockings },
      { data: recurringBlockings },
      { data: pendingPayments },
      { data: recentChats },
    ] = await Promise.all([
      supabase.from('coach_profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('bookings').select('*').eq('coach_id', user.id).gte('session_date', today).order('session_date', { ascending: true }),
      supabase.from('coach_blockings').select('*').eq('coach_id', user.id).gte('blocked_date', today).order('blocked_date', { ascending: true }),
      supabase.from('coach_recurring_blockings').select('*').eq('coach_id', user.id).order('day_of_week', { ascending: true }),
      supabase.from('payments').select(`*, bookings!inner(*, coach_id)`).eq('bookings.coach_id', user.id).eq('payment_status', 'pending').not('payment_receipt_url', 'is', null),
      supabase.from('booking_chats').select('*').eq('coach_id', user.id).order('created_at', { ascending: false }).limit(10),
    ]);

    // Format coach profile
    const profileSection = coachProfile ? `
YOUR PROFILE:
- Name: ${profile?.full_name || 'Not set'}
- Business: ${coachProfile.business_name || 'Not set'}
- Sports: ${coachProfile.sports_offered?.join(', ') || 'None'}
- Locations: ${coachProfile.locations?.join(', ') || 'None'}
- Hourly Rate: ₱${coachProfile.hourly_rate}
- Experience: ${coachProfile.years_of_experience || 'Not set'} years
- Bio: ${coachProfile.bio || 'Not set'}
- Cancellation Policy: ${coachProfile.cancellation_policy || 'Not set'}
- Coaching Hours: ${coachProfile.coaching_hours ? `${(coachProfile.coaching_hours as any).start} to ${(coachProfile.coaching_hours as any).end}` : 'Available 24/7'}
` : 'YOUR PROFILE: Not set up yet';

    // Format bookings by status
    const formatBooking = (b: any) => `  - ${b.booking_reference || 'N/A'} | ${b.athlete_name} | ${b.sport} | ${b.session_date} ${b.session_time} | ${b.duration_hours}hr | ₱${b.total_amount} | ${b.location}`;

    const pending = bookings?.filter((b: any) => b.status === 'pending') || [];
    const approved = bookings?.filter((b: any) => b.status === 'approved') || [];
    const completed = bookings?.filter((b: any) => b.status === 'completed') || [];
    const cancelled = bookings?.filter((b: any) => b.status === 'cancelled') || [];

    const bookingsSection = `
UPCOMING BOOKINGS:
Pending (${pending.length}):
${pending.length ? pending.map(formatBooking).join('\n') : '  None'}
Approved (${approved.length}):
${approved.length ? approved.map(formatBooking).join('\n') : '  None'}
Completed (${completed.length}):
${completed.length ? completed.map(formatBooking).join('\n') : '  None'}
Cancelled (${cancelled.length}):
${cancelled.length ? cancelled.map(formatBooking).join('\n') : '  None'}`;

    // Format blocked times
    const blockingsSection = `
SPECIFIC BLOCKED TIME SLOTS:
${blockings && blockings.length > 0 ? blockings.map((b: any) => `  - ${b.blocked_date} | ${b.start_time}-${b.end_time}${b.reason ? ` | Reason: ${b.reason}` : ''}`).join('\n') : '  No blocked times'}`;

    const recurringBlockingsSection = `
RECURRING BLOCKED TIMES:
${recurringBlockings && recurringBlockings.length > 0 ? recurringBlockings.map((rb: any) => `  - Every ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][rb.day_of_week]} | ${rb.start_time}-${rb.end_time}${rb.reason ? ` | Reason: ${rb.reason}` : ''}`).join('\n') : '  No recurring blocked times'}`;

    // Format pending payments
    const paymentsSection = `
PENDING PAYMENT VERIFICATIONS:
${pendingPayments && pendingPayments.length > 0 ? pendingPayments.map((p: any) => `  - Ref: ${p.bookings.booking_reference} | ${p.bookings.athlete_name} | ₱${p.amount} | ${p.payment_method.toUpperCase()} | Receipt: ${p.payment_receipt_url}`).join('\n') : '  No pending payments'}`;

    // Format recent chats
    const chatsSection = `
RECENT ATHLETE INQUIRIES (last 10):
${recentChats && recentChats.length > 0 ? recentChats.map((c: any) => {
      const msgs = Array.isArray(c.messages) ? c.messages : [];
      const lastUserMsg = [...msgs].reverse().find((m: any) => m.role === 'user');
      return `  - Session ${c.session_id.slice(0, 8)} | ${new Date(c.created_at).toLocaleDateString()} | Last question: "${lastUserMsg?.content?.slice(0, 80) || 'N/A'}"`;
    }).join('\n') : '  No recent inquiries'}`;

    const systemPrompt = `You are Machi, the MatchUp AI Assistant — a 24/7 assistant exclusively for coaches on the MatchUp platform. You help coaches manage bookings, payments, schedules, and understand the platform.

=== MATCHUP PLATFORM — COMPLETE FEATURE REFERENCE ===

WHAT MATCHUP IS:
MatchUp is a booking and session management platform for sports coaches in the Philippines. Coaches sign up, set up their profile, and share a public booking link with athletes. Athletes use the AI-powered booking chatbot to book sessions. Coaches manage everything from the dashboard.

PAGES & FEATURES THE APP ACTUALLY HAS:

1. LANDING PAGE (/)
   - Public page introducing MatchUp
   - Links to sign up / sign in

2. AUTH PAGE (/auth)
   - Email & password sign up and sign in for coaches
   - Only coaches create accounts — athletes do NOT have accounts

3. COACH DASHBOARD (/dashboard)
   - HOME TAB: Welcome message, booking link card (shareable URL), stats cards (Pending Approvals, Awaiting Payment, Total Bookings), today's bookings, upcoming bookings list, booking calendar view
   - BOOKINGS TAB: Calendar view of all bookings with color-coded statuses, list of bookings by date
   - TRANSACTIONS TAB: Navigates to the Transactions page
   - Sidebar: Navigation (Home, Bookings, Transactions), Machi AI Assistant button, dark/light mode toggle
   - Header: Notification bell (shows pending count), dark mode toggle, settings (profile setup), logout
   - Booking link: Coaches copy and share their link (format: /book/{coachId}) with athletes via WhatsApp, social media, etc.

4. COACH PROFILE SETUP (/coach/profile-setup)
   - Profile photo upload
   - Business/Coach name
   - Bio
   - Years of experience
   - Certifications (multiple entries)
   - Sports offered (Basketball, Tennis, Volleyball, Badminton, Football, Swimming, Golf)
   - Hourly rate (in PHP ₱)
   - Locations (Metro Manila cities: Makati, BGC Taguig, Quezon City, etc.)
   - Venue details per location
   - Cancellation policy
   - Phone number (Philippine format)

5. PUBLIC BOOKING PAGE (/book/:coachId)
   - Public page athletes visit to book (NO account needed)
   - Shows coach name, business name, sports, rate, experience
   - AI chatbot (Machi) guides athletes through booking: collects name, phone, sport, location, date/time, duration, payment method (GCash/Maya/Cash), optional notes
   - Athletes can upload payment receipts (images)
   - After confirmation, booking is created with status "pending"
   - Generates a booking reference code

6. BOOKING DETAIL PAGE (/booking/:bookingId)
   - Full booking details: date, time, location, sport, duration, price, payment method
   - Athlete contact info (name, phone, notes)
   - Three tabs:
     a. APPROVAL: Approve or reject pending bookings
     b. PAYMENT: Record payments (GCash/Maya/Cash), enter amount, reference number (last 4 digits for digital), supports partial payments (deposits), shows payment history, remaining balance. When fully paid → status becomes "completed"
     c. SESSION: Cancel booking (with reason), close request
   - Cancel booking dialog with reason input

7. TRANSACTIONS PAGE (/transactions)
   - Shows only bookings with at least one paid payment
   - Stats: Total Revenue, Completed Sessions, Total Transactions
   - Filters: Search (by athlete name, reference, sport), status filter (approved/completed/cancelled), payment filter (paid/pending/refunded)
   - Each transaction shows: athlete name, booking reference, sport, date, time, duration, location, phone, payment history with amounts and methods
   - Click "View Details" to go to booking detail page

8. BLOCKED TIME SLOTS
   - Coaches can block specific dates/times from the dashboard (Bookings tab)
   - Each blocking has: date, start time, end time, optional reason
   - Prevents athletes from booking during blocked times

BOOKING STATUSES:
- pending: New booking, awaiting coach approval
- approved: Coach approved, awaiting payment
- completed: Fully paid
- rejected: Coach rejected the booking
- cancelled: Cancelled by coach (with reason)

PAYMENT METHODS: GCash, Maya, Cash

PAYMENT FLOW:
1. Athlete books → status: pending
2. Coach approves → status: approved (awaiting payment)
3. Coach records payment(s) → partial or full
4. When total paid ≥ total amount → status: completed

FEATURES THAT DO NOT EXIST (never mention these):
- In-app messaging between coach and athlete
- SMS/email notifications or reminders to athletes
- Rescheduling functionality
- Athlete accounts or athlete dashboard
- Multiple coach accounts per user
- Stripe/online payment processing
- Video calls or virtual sessions
- Reviews or ratings
- Team management
- Analytics or reports page
- Subscription plans
- Discount codes or promotions
- Waitlisting
- Recurring/subscription bookings
- In-app calendar sync (Google Calendar, etc.)
- Push notifications

=== END FEATURE REFERENCE ===

${profileSection}
${bookingsSection}
${blockingsSection}
${recurringBlockingsSection}
${paymentsSection}
${chatsSection}

PAYMENT VERIFICATION WORKFLOW:
When a coach wants to verify a payment:
1. Show them the receipt information
2. Ask them to check their payment app
3. Ask for the LAST 4 DIGITS of the transaction reference number to confirm
4. When they provide correct digits, respond with "CONFIRM_PAYMENT:{payment_id}"
5. If they want to dispute, respond with "DISPUTE_PAYMENT:{payment_id}:{reason}"

CRITICAL RULES:
- ONLY reference features listed above. NEVER invent or suggest features that don't exist.
- If a coach asks about a feature that doesn't exist, politely say it's not available yet.
- Always be helpful, concise, and actionable.
- Use the real-time data above (bookings, blockings, payments, profile) to answer questions accurately.
- When asked about how to do something, give step-by-step guidance based on the actual UI.
- Security: Only confirm payments with last 4 reference digits.
- Disputes are allowed within 12 hours for bank processing issues.
- Today's date is ${today}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices[0].message.content;

    // Check for payment confirmation or dispute commands
    if (reply.includes('CONFIRM_PAYMENT:')) {
      const paymentId = reply.split('CONFIRM_PAYMENT:')[1].split('\n')[0].trim();

      // Validate UUID format
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(paymentId)) {
        return new Response(
          JSON.stringify({ reply: 'Invalid payment reference. Please try again.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate ownership - payment must belong to this coach's booking
      const { data: payment } = await supabase
        .from('payments')
        .select('id, booking_id, reference_number, bookings!inner(coach_id)')
        .eq('id', paymentId)
        .maybeSingle();

      if (!payment || (payment as any).bookings.coach_id !== user.id) {
        return new Response(
          JSON.stringify({ reply: 'Payment not found or you do not have permission to confirm this payment.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error: confirmError } = await supabase
        .from('payments')
        .update({ payment_status: 'paid', payment_date: new Date().toISOString() })
        .eq('id', paymentId);

      if (confirmError) console.error('Payment confirmation error:', confirmError);

      await supabase.from('bookings').update({ status: 'completed' }).eq('id', payment.booking_id);

      return new Response(
        JSON.stringify({ reply: 'Payment confirmed successfully! The booking is now marked as completed.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (reply.includes('DISPUTE_PAYMENT:')) {
      const parts = reply.split('DISPUTE_PAYMENT:')[1].split(':');
      const paymentId = parts[0].trim();
      const reason = parts.slice(1).join(':').split('\n')[0].trim();

      // Validate UUID format
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(paymentId)) {
        return new Response(
          JSON.stringify({ reply: 'Invalid payment reference. Please try again.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate ownership
      const { data: payment } = await supabase
        .from('payments')
        .select('id, booking_id, bookings!inner(coach_id)')
        .eq('id', paymentId)
        .maybeSingle();

      if (!payment || (payment as any).bookings.coach_id !== user.id) {
        return new Response(
          JSON.stringify({ reply: 'Payment not found or you do not have permission to dispute this payment.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error: disputeError } = await supabase
        .from('payments')
        .update({ dispute_initiated_at: new Date().toISOString(), dispute_reason: reason.slice(0, 500) })
        .eq('id', paymentId);

      if (disputeError) console.error('Dispute error:', disputeError);

      await supabase.from('bookings').update({ status: 'pending' }).eq('id', payment.booking_id);

      return new Response(
        JSON.stringify({ reply: 'Payment disputed. The booking status has been updated to pending for resolution.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in chat-assistant function:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred processing your request. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
