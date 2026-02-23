import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, coachId, sessionId } = await req.json();

    // Basic input validation
    if (!coachId || typeof coachId !== 'string' || !sessionId || typeof sessionId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid request parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (!Array.isArray(messages) || messages.length > 50) {
      return new Response(
        JSON.stringify({ error: 'Invalid or too many messages' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch coach profile and details
    const { data: coachProfile, error: coachError } = await supabase
      .from('coach_profiles')
      .select(`
        *,
        profiles!inner(full_name, phone)
      `)
      .eq('id', coachId)
      .single();

    if (coachError || !coachProfile) {
      console.error('Coach fetch error:', coachError);
      throw new Error('Coach not found');
    }

    // Fetch coach's existing bookings
    const { data: existingBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('session_date, session_time, duration_hours, status')
      .eq('coach_id', coachId)
      .in('status', ['approved', 'pending'])
      .gte('session_date', new Date().toISOString().split('T')[0]);

    if (bookingsError) {
      console.error('Bookings fetch error:', bookingsError);
      throw new Error('Failed to fetch bookings');
    }

    // Fetch coach's blocked times and recurring blockings in parallel
    const [{ data: blockedTimes }, { data: recurringBlockings }] = await Promise.all([
      supabase
        .from('coach_blockings')
        .select('blocked_date, start_time, end_time, reason')
        .eq('coach_id', coachId)
        .gte('blocked_date', new Date().toISOString().split('T')[0])
        .order('blocked_date', { ascending: true }),
      supabase
        .from('coach_recurring_blockings')
        .select('day_of_week, start_time, end_time, reason')
        .eq('coach_id', coachId),
    ]);

    // Find next available slot
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextSlot = { date: tomorrow.toISOString().split('T')[0], time: '09:00' };

    // Check if user has an approved booking awaiting payment
    const { data: approvedBooking } = await supabase
      .from('bookings')
      .select(`
        *,
        payments (*)
      `)
      .eq('athlete_phone', messages[messages.length - 1]?.content || '')
      .eq('status', 'approved')
      .is('payments.payment_status', 'pending')
      .single();

    let systemPrompt = '';
    
    if (approvedBooking && (approvedBooking.payment_method === 'gcash' || approvedBooking.payment_method === 'maya')) {
      // Payment receipt upload flow
      systemPrompt = `You are a payment collection assistant for Coach ${coachProfile.profiles.full_name}.

BOOKING DETAILS:
- Booking Reference: ${approvedBooking.booking_reference}
- Date: ${approvedBooking.session_date} at ${approvedBooking.session_time}
- Payment Method: ${approvedBooking.payment_method?.toUpperCase()}
- Amount: ₱${approvedBooking.total_amount}

TASK:
Your booking has been APPROVED by the coach! Now you need to send payment via ${approvedBooking.payment_method?.toUpperCase()}.

Ask the user to upload a screenshot of their payment receipt. Once they mention they've sent it or describe the transaction, respond with "RECEIPT_READY" to indicate they should upload the file.

Be friendly and guide them through the payment process.`;
    } else {
      // Single sport auto-selection logic
      const isSingleSport = coachProfile.sports_offered.length === 1;
      const singleSport = isSingleSport ? coachProfile.sports_offered[0] : null;
      const sportInstruction = isSingleSport
        ? `5. SKIP this step — the coach only offers ${singleSport}, so auto-select it. Briefly mention: "Since Coach ${coachProfile.profiles.full_name} specializes in ${singleSport}, I've already selected that for you." Then move to the next question.`
        : `5. Ask which sport they want to train (show available options: ${coachProfile.sports_offered.join(', ')})`;

      // Regular booking flow
      systemPrompt = `You are a friendly and professional booking assistant for Coach ${coachProfile.profiles.full_name}.

COACH DETAILS:
- Business Name: ${coachProfile.business_name || 'Not specified'}
- Sports Offered: ${coachProfile.sports_offered.join(', ')}
- Coach's Service Area: ${coachProfile.locations.join(', ')}
- Hourly Rate: ₱${coachProfile.hourly_rate}/hour
- Years of Experience: ${coachProfile.years_of_experience || 'Not specified'}
- Next Available Slot: ${nextSlot.date} at ${nextSlot.time}

CONVERSATION FLOW:

1. The client has already seen the list of required fields in the initial greeting. Do NOT repeat the full list again. Instead, warmly acknowledge their first message and start collecting/recognizing information from whatever they provide.

2. ACCEPT ANSWERS IN BULK OR INCREMENTALLY:
   - If the client sends multiple or all answers in one message, extract and recognize each field.
   - If the client sends answers one by one, track which fields have been provided and which are still missing.
   - After each client message, check which fields are still missing and ask ONLY for the missing ones.
   - Be smart about recognizing information even if not in a structured format.
   - Infer duration_hours from the time range (e.g. "2:00 PM - 4:00 PM" = 2 hours, "3:00 PM - 4:30 PM" = 1.5 hours).

3. SINGLE CONFIRMATION STEP (MANDATORY — DO THIS EXACTLY ONCE):
   Once ALL required fields are collected, present this emoji-formatted summary and NOTHING ELSE before it:
   "Here's a summary of your booking details:
   📋 Name: ...
   📱 Phone: ...
   🏀 Sport: ...
   📍 Location: ...
   📅 Date & Time: [date], [start time] - [end time] ([X] hours)
   💰 Total: ₱...
   💳 Payment: ...
   📝 Notes: ..."
   
   Then ask: "Does everything look correct? Please confirm and I'll submit your booking!"
   
   IMPORTANT: Do NOT summarize the details in plain text before showing this emoji summary. There must be exactly ONE confirmation prompt, and it MUST use the emoji format above.

4. ONLY after the client explicitly confirms (e.g., "yes", "looks good", "confirm", etc.), respond with "READY_TO_BOOK" followed by the JSON.

IMPORTANT RULES:
- Keep responses SHORT and concise — no long paragraphs
- Be warm and conversational
- Do NOT ask for email — it is not collected
- Do NOT ask for duration separately — infer it from the time range
- Location can be any venue, but remind the client sessions should be within the coach's service area
${isSingleSport ? `- The sport is auto-selected as "${singleSport}" — do NOT ask the user to choose a sport` : ''}
- When you have ALL required information AND the client has confirmed, respond with "READY_TO_BOOK" followed by JSON: {athlete_name, athlete_phone, athlete_email: null, sport, location, session_date, session_time, duration_hours, payment_method, notes}
- Do NOT output READY_TO_BOOK until the client has explicitly confirmed the summary

AVAILABILITY RULES:
${coachProfile.coaching_hours ? `- The coach is only available from ${(coachProfile.coaching_hours as any).start} to ${(coachProfile.coaching_hours as any).end}. Do NOT accept bookings outside these hours.` : '- The coach is available 24/7 by default. There are no fixed working hours.'}
- Availability is ALSO restricted by existing bookings, blocked times, and recurring blocked times listed below.
- A booking ONLY blocks its specific time range. The rest of the day remains open.
- Example: If there is a booking from 2:00 PM to 4:00 PM, the coach is still available before 2:00 PM and after 4:00 PM.
- Only reject a requested time if it actually OVERLAPS with an existing booking, blocked time, or recurring blocked time.
- If the requested time overlaps, suggest alternative times on the SAME day that are still free.
- A day is only fully unavailable if bookings and blockings cover the entire available window.

EXISTING BOOKINGS (only these specific time ranges are occupied):
${existingBookings.length > 0 ? existingBookings.map(b => `- ${b.session_date} at ${b.session_time} for ${b.duration_hours} hours (${b.status})`).join('\n') : 'No existing bookings'}

BLOCKED TIMES (coach is unavailable ONLY during these specific windows):
${blockedTimes && blockedTimes.length > 0 ? blockedTimes.map(b => `- ${b.blocked_date} from ${b.start_time} to ${b.end_time}${b.reason ? ` (${b.reason})` : ''}`).join('\n') : 'No blocked times'}

RECURRING BLOCKED TIMES (coach is unavailable every week during these windows):
${recurringBlockings && recurringBlockings.length > 0 ? recurringBlockings.map((rb: any) => `- Every ${['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][rb.day_of_week]} from ${rb.start_time} to ${rb.end_time}${rb.reason ? ` (${rb.reason})` : ''}`).join('\n') : 'No recurring blocked times'}`;
    }

    // Use streaming for the AI call
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
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
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    // Read the full streamed response, accumulate it, and check for READY_TO_BOOK
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    let textBuffer = '';
    const chunks: string[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);
        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (!line.startsWith('data: ')) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') break;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            fullContent += content;
            chunks.push(content);
          }
        } catch { /* partial JSON, skip */ }
      }
    }

    // Flush remaining buffer
    if (textBuffer.trim()) {
      for (let raw of textBuffer.split('\n')) {
        if (!raw) continue;
        if (raw.endsWith('\r')) raw = raw.slice(0, -1);
        if (!raw.startsWith('data: ')) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === '[DONE]') continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            fullContent += content;
            chunks.push(content);
          }
        } catch { /* ignore */ }
      }
    }

    const aiReply = fullContent;
    console.log('AI Reply:', aiReply);

    // Check if the AI has collected all information and is ready to book
    if (aiReply.includes('READY_TO_BOOK')) {
      const jsonMatch = aiReply.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const bookingData = JSON.parse(jsonMatch[0]);
          
          // Validate required fields
          if (!bookingData.athlete_name || !bookingData.athlete_phone || !bookingData.sport || 
              !bookingData.location || !bookingData.session_date || !bookingData.session_time || 
              !bookingData.duration_hours || !bookingData.payment_method) {
            throw new Error('Missing required booking information');
          }

          // Sanitize and validate inputs
          const stripHtml = (str: string) => str.replace(/<[^>]*>/g, '').trim();
          
          bookingData.athlete_name = stripHtml(bookingData.athlete_name).slice(0, 100);
          if (!/^[a-zA-ZÀ-ÿ\s'\-\.]+$/.test(bookingData.athlete_name) || bookingData.athlete_name.length < 2) {
            return new Response(
              JSON.stringify({ reply: 'Please provide a valid name (letters, spaces, and hyphens only, 2-100 characters).' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // Validate sport against coach's offered sports
          if (!coachProfile.sports_offered.map((s: string) => s.toLowerCase()).includes(bookingData.sport.toLowerCase())) {
            return new Response(
              JSON.stringify({ reply: `Invalid sport. Available options: ${coachProfile.sports_offered.join(', ')}` }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // Sanitize text fields
          bookingData.location = stripHtml(bookingData.location).slice(0, 200);
          if (bookingData.notes) bookingData.notes = stripHtml(bookingData.notes).slice(0, 500);
          if (bookingData.athlete_notes) bookingData.athlete_notes = stripHtml(bookingData.athlete_notes).slice(0, 500);

          // Validate date format
          if (!/^\d{4}-\d{2}-\d{2}$/.test(bookingData.session_date)) {
            return new Response(
              JSON.stringify({ reply: 'Invalid date format. Please provide a valid date.' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // Validate duration
          const duration = Number(bookingData.duration_hours);
          if (isNaN(duration) || duration < 0.5 || duration > 8) {
            return new Response(
              JSON.stringify({ reply: 'Duration must be between 0.5 and 8 hours.' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // Validate payment method
          if (!['gcash', 'maya', 'cash'].includes(bookingData.payment_method.toLowerCase())) {
            return new Response(
              JSON.stringify({ 
                reply: `Invalid payment method. Please choose GCash, Maya, or Cash.`
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // Check for conflicts
          const requestStart = new Date(`${bookingData.session_date}T${bookingData.session_time}`);
          const requestEnd = new Date(requestStart);
          requestEnd.setHours(requestEnd.getHours() + Number(bookingData.duration_hours));

          const conflicts = existingBookings.filter(booking => {
            const bookingStart = new Date(`${booking.session_date}T${booking.session_time}`);
            const bookingEnd = new Date(bookingStart);
            bookingEnd.setHours(bookingEnd.getHours() + Number(booking.duration_hours));
            return bookingStart < requestEnd && bookingEnd > requestStart;
          });

          if (conflicts.length > 0) {
            return new Response(
              JSON.stringify({ 
                reply: `Sorry, this time slot conflicts with an existing booking on ${conflicts[0].session_date} at ${conflicts[0].session_time}. Please choose a different time.`
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // Validate and format Philippine phone number
          const phoneFormatted = bookingData.athlete_phone.replace(/[\s\-\(\)]/g, '');
          let formattedPhone = phoneFormatted;
          
          if (phoneFormatted.startsWith('0')) {
            formattedPhone = '+63' + phoneFormatted.substring(1);
          } else if (!phoneFormatted.startsWith('+63')) {
            formattedPhone = '+63' + phoneFormatted;
          }
          
          // Validate phone format
          if (!/^\+63[0-9]{10}$/.test(formattedPhone)) {
            return new Response(
              JSON.stringify({ 
                reply: `Invalid phone number format. Please provide a valid Philippine phone number (e.g., +639171234567 or 09171234567).`
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // Create booking
          const total_amount = bookingData.duration_hours * Number(coachProfile.hourly_rate);

          const { data: booking, error: bookingError } = await supabase
            .from('bookings')
            .insert({
              coach_id: coachId,
              athlete_name: bookingData.athlete_name,
              athlete_phone: formattedPhone,
              athlete_email: bookingData.athlete_email || null,
              sport: bookingData.sport,
              location: bookingData.location,
              session_date: bookingData.session_date,
              session_time: bookingData.session_time,
              duration_hours: bookingData.duration_hours,
              total_amount: total_amount,
              payment_method: bookingData.payment_method.toLowerCase(),
              notes: bookingData.notes || null,
              status: 'pending'
            })
            .select()
            .single();

          if (bookingError) {
            console.error('Booking creation error:', bookingError);
            throw new Error('Failed to create booking');
          }

          // Send email notification to coach
          try {
            await fetch(`${SUPABASE_URL}/functions/v1/send-booking-email`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
              },
              body: JSON.stringify({
                to: coachProfile.profiles.email || '',
                type: 'booking_created',
                bookingDetails: {
                  athleteName: bookingData.athlete_name,
                  coachName: coachProfile.profiles.full_name,
                  sport: bookingData.sport,
                  location: bookingData.location,
                  sessionDate: bookingData.session_date,
                  sessionTime: bookingData.session_time,
                  duration: bookingData.duration_hours,
                  totalAmount: total_amount,
                  bookingReference: booking.booking_reference
                }
              })
            });
          } catch (emailError) {
            console.error('Failed to send booking email:', emailError);
          }

          // Create payment record
          const { error: paymentError } = await supabase
            .from('payments')
            .insert({
              booking_id: booking.id,
              amount: total_amount,
              payment_method: bookingData.payment_method.toLowerCase(),
              payment_status: 'pending'
            });

          if (paymentError) {
            console.error('Payment creation error:', paymentError);
          }

          // Store chat with booking
          await supabase
            .from('booking_chats')
            .insert({
              coach_id: coachId,
              session_id: sessionId,
              messages: [...messages, { role: 'assistant', content: aiReply }],
              booking_id: booking.id
            });

          const paymentInfo = bookingData.payment_method.toLowerCase() === 'cash' 
            ? '\n\n💵 Payment Method: Cash (pay upon session)'
            : `\n\n💳 Payment Method: ${bookingData.payment_method.toUpperCase()}\n📱 You will receive payment instructions once the coach approves your booking.`;

          return new Response(
            JSON.stringify({ 
              reply: `Perfect! Your booking has been submitted successfully.\n\n📋 Booking Reference: ${booking.booking_reference}\n💰 Total Amount: ₱${total_amount}${paymentInfo}\n\nCoach ${coachProfile.profiles.full_name} will review and confirm your booking soon!`,
              bookingCreated: true,
              bookingReference: booking.booking_reference
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );

        } catch (parseError) {
          console.error('Parse error:', parseError);
          return new Response(
            JSON.stringify({ 
              reply: aiReply.replace('READY_TO_BOOK', '').trim()
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Store chat conversation
    await supabase
      .from('booking_chats')
      .upsert({
        coach_id: coachId,
        session_id: sessionId,
        messages: [...messages, { role: 'assistant', content: aiReply }]
      }, {
        onConflict: 'session_id'
      });

    // Return streamed chunks for the frontend to replay quickly
    return new Response(
      JSON.stringify({ reply: aiReply, chunks }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in booking-assistant function:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred processing your request. Please try again.' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
