import { finalizeEvent, SimplePool, verifyEvent } from "nostr-tools";
import { CalendarTimeBasedTemplateEvent } from "./lib/nip-52";
import { getCommunityATag } from "./lib/nip-72";
import { GoogleCalendarService, CalendarEvent } from "./lib/google-calendar.ts";

export const handleCalenderEntry = async (record, type, isAuthenticated) => {
  const pool = new SimplePool();
  const relays = ["wss://relay.chorus.community"];
  const secretKey = Deno.env.get("NOSTR_SECRET_KEY");
  const community_id = Deno.env.get("NOSTR_COMMUNITY_ID");
  const community_identifier = Deno.env.get("NOSTR_COMMUNITY_IDENTIFIER");
  const googleCalendarId = Deno.env.get("GOOGLE_CALENDAR_ID") || "primary";

  // Initialize Google Calendar service
  const googleCalendar = new GoogleCalendarService();

  //
  if (!isAuthenticated) {
    return {
      error: new Response(
        JSON.stringify({
          success: false,
          error: "Calendar handling failed",
          missing: {
            authentication: !isAuthenticated,
          },
        }),
        {
          headers: {
            "Content-Type": "application/json",
          },
          status: 500,
        }
      ),
    };
  } // TODO handle calendar entry
  if (type === "new_booking") {
    // Create a Google Calendar entry
    try {
      const calendarEvent: CalendarEvent = {
        title: record.title,
        description:
          record.description ||
          `New booking at Commons Hub Brussels - ${record.room_name}`,
        startTime: new Date(record.start_time).toISOString(),
        endTime: new Date(record.end_time).toISOString(),
        location: `Commons Hub Brussels - ${record.room_name}`,
        attendees: [record.created_by_email, "mushroom@gmail.com"],
      };

      const createdEvent = await googleCalendar.createEvent(
        googleCalendarId,
        calendarEvent
      );
      console.log("Google Calendar event created:", createdEvent.htmlLink);

      // Optionally store the Google Calendar event ID in your database
      // for future updates/deletions
      record.google_calendar_event_id = createdEvent.id;
    } catch (error) {
      console.error("Failed to create Google Calendar event:", error);
      // Don't fail the entire process if calendar creation fails
    }
  } else if (type === "confirmed_booking") {
    // Create Nostr calendar entry
    const calendarEvent: CalendarTimeBasedTemplateEvent = {
      kind: 31923,
      tags: [
        ["a", getCommunityATag(community_id, community_identifier)],
        ["d", Math.random().toString(36).substring(7)], // Random identifier
        ["title", record.title],
        ["start", dateToTimestamp(record.start_time)],
        ["end", dateToTimestamp(record.end_time)],
        ["location", "Commons Hub Brussels"],
        ["location", record.room_name],
      ],
      content: record.description || "",
      created_at: Math.floor(Date.now() / 1000),
    };
    let event = finalizeEvent(calendarEvent, secretKey);

    let isGood = verifyEvent(event);
    console.log("event", event);
    if (isGood) {
      pool.publish(relays, event);
    }
  }

  return { success: true };
};

function dateToTimestamp(dateString: string): string {
  const date = new Date(dateString);
  return Math.floor(date.getTime() / 1000).toString();
}
