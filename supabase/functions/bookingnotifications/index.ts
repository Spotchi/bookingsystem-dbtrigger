import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Setup type definitions for built-in Supabase Runtime APIs
import { handleCalendarEntry } from "./../../../src/handleCalendar.ts";
import { sendEmail } from "./../../../src/sendEmail.ts";

export async function handler(req: Request) {
  try {
    const isAuthenticated =
      req.headers.get("x-supabase-webhook-source") ===
      Deno.env.get("TRIGGER_AUTH");

    if (!isAuthenticated) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Authentication failed",
        }),
        {
          headers: {
            "Content-Type": "application/json",
          },
          status: 500,
        }
      );
    }

    // Parse the request body
    const payload = await req.json();
    console.log(payload);
    const { record, type } = payload;

    const result = await sendEmail(record, type);
    if (result.error) {
      return result.error;
    }

    const resultCalendar = await handleCalendarEntry(
      record,
      type
    );
    if (resultCalendar && 'error' in resultCalendar && resultCalendar.error) {
      return resultCalendar.error;
    }

    // Log a success message
    console.log(
      `Email sent successfully and calendar entry handled for ${type}`
    );
    return new Response(
      JSON.stringify({
        success: true,
        message: "Notification email sent",
      }),
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    // Log the error
    if (error instanceof Error) {
      console.error("Error sending notification:", error.message);
      console.error("Stack trace:", error.stack);
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
          stack: error.stack,
        }),
        {
          headers: {
            "Content-Type": "application/json",
          },
          status: 400,
        }
      );
    } else {
      console.error("Error sending notification:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: String(error),
        }),
        {
          headers: {
            "Content-Type": "application/json",
          },
          status: 400,
        }
      );
    }
  }
}

Deno.serve(handler);

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/bookingnotifications' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
