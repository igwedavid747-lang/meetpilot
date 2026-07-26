import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const payload = z.object({
  slug: z.string().min(3).max(80),
  eventTypeId: z.string().uuid(),
  startsAt: z.coerce.date(),
  timeZone: z.string().min(1).max(64),
  inviteeName: z.string().trim().min(2).max(120),
  inviteeEmail: z.string().email().max(320),
  note: z.string().trim().max(2_000).optional().or(z.literal("")),
});

export async function POST(request: Request) {
  let supabase: ReturnType<typeof createSupabaseAdminClient>;
  try {
    supabase = createSupabaseAdminClient();
  } catch {
    return NextResponse.json(
      { message: "Bookings are not configured yet. Add the Supabase environment variables and apply the migrations." },
      { status: 503 },
    );
  }

  const parsed = payload.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "Please check the booking details and try again." }, { status: 400 });
  }

  const input = parsed.data;

  try {
    const { data: page, error: pageError } = await supabase
      .from("booking_pages")
      .select("host_id")
      .eq("slug", input.slug)
      .eq("is_active", true)
      .maybeSingle();

    if (pageError) throw pageError;
    if (!page) {
      return NextResponse.json({ message: "This booking page is no longer available." }, { status: 404 });
    }

    const [hostResult, eventTypeResult] = await Promise.all([
      supabase.from("users").select("email").eq("id", page.host_id).maybeSingle(),
      supabase
        .from("event_types")
        .select("id, duration_minutes, minimum_notice_minutes")
        .eq("id", input.eventTypeId)
        .eq("host_id", page.host_id)
        .eq("is_active", true)
        .maybeSingle(),
    ]);

    if (hostResult.error) throw hostResult.error;
    if (eventTypeResult.error) throw eventTypeResult.error;
    if (!hostResult.data) {
      return NextResponse.json({ message: "This booking page is unavailable." }, { status: 404 });
    }

    const eventType = eventTypeResult.data;
    if (!eventType) {
      return NextResponse.json({ message: "This meeting type is no longer available." }, { status: 404 });
    }

    const endsAt = new Date(input.startsAt.getTime() + eventType.duration_minutes * 60_000);
    const earliest = Date.now() + eventType.minimum_notice_minutes * 60_000;
    if (input.startsAt.getTime() < earliest || endsAt <= input.startsAt) {
      return NextResponse.json({ message: "That time is no longer available. Please select another time." }, { status: 409 });
    }

    // The database function creates the appointment and notifications atomically.
    // The exclusion constraint remains the final concurrent-safe overlap check.
    const { data: appointmentId, error: bookingError } = await supabase.rpc("create_booking", {
      p_host_id: page.host_id,
      p_event_type_id: eventType.id,
      p_invitee_name: input.inviteeName,
      p_invitee_email: input.inviteeEmail,
      p_invitee_time_zone: input.timeZone,
      p_note: input.note || null,
      p_starts_at: input.startsAt.toISOString(),
      p_ends_at: endsAt.toISOString(),
      p_host_email: hostResult.data.email,
    });

    if (bookingError) throw bookingError;
    // Queue an Inngest event here; workers send email and create the provider calendar event.
    return NextResponse.json({ id: appointmentId }, { status: 201 });
  } catch (error: unknown) {
    // PostgreSQL exclusion violations use SQLSTATE 23P01.
    if (typeof error === "object" && error && "code" in error && error.code === "23P01") {
      return NextResponse.json({ message: "That time was just booked. Please choose another slot." }, { status: 409 });
    }

    console.error("Booking creation failed", error);
    return NextResponse.json({ message: "We couldn't confirm that booking. Please try again." }, { status: 500 });
  }
}
