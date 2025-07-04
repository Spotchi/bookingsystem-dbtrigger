// Setup type definitions for built-in Supabase Runtime APIs
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer/mod.ts";
import { getTemplateFromLanguageCode } from "./language-utils.ts";
import { sendEmail } from "./sendEmail.ts";
import { handleCalenderEntry } from "./handleCalendar.ts";
serve(async (req) => {
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

    const result = await sendEmail(record, type, isAuthenticated);
    if (result.error) {
      return result.error;
    }

    const resultCalendar = await handleCalenderEntry(
      record,
      type,
      isAuthenticated
    );
    if (resultCalendar.error) {
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
});
