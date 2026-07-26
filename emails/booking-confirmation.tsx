type BookingConfirmationProps = { recipientName: string; hostName: string; eventTitle: string; startsAtLabel: string; durationMinutes: number; location: string; manageUrl: string };

/** React Email-compatible transactional template; render it from the Inngest notification worker. */
export function BookingConfirmationEmail({ recipientName, hostName, eventTitle, startsAtLabel, durationMinutes, location, manageUrl }: BookingConfirmationProps) {
  return <div style={{ fontFamily: "Arial, sans-serif", color: "#172033", lineHeight: 1.5, maxWidth: 560, margin: "0 auto", padding: 24 }}><h1 style={{ margin: 0 }}>Your meeting is confirmed</h1><p>Hi {recipientName},</p><p>Your meeting with {hostName} is on the calendar.</p><div style={{ background: "#f7f8fc", borderRadius: 12, padding: 18 }}><strong>{eventTitle}</strong><br />{startsAtLabel}<br />{durationMinutes} minutes<br />{location}</div><p><a href={manageUrl} style={{ color: "#4752d9", fontWeight: 700 }}>Manage this appointment</a></p><p style={{ color: "#64748b", fontSize: 12 }}>Sent by MeetPilot</p></div>;
}
