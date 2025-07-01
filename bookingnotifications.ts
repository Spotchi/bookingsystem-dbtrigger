// Setup type definitions for built-in Supabase Runtime APIs
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer/mod.ts";
import { getTemplateFromLanguageCode } from "./language-utils.ts";
serve(async (req) => {
  try {
    const isAuthenticated =
      req.headers.get("x-supabase-webhook-source") ===
      Deno.env.get("TRIGGER_AUTH");
    // Parse the request body
    const payload = await req.json();
    console.log(payload);
    const { record, type } = payload;
    // Récupérer les variables d'environnement
    const emailHost = Deno.env.get("EMAIL_HOST");
    const emailPort = parseInt(Deno.env.get("EMAIL_PORT") || "587");
    const emailUser = Deno.env.get("EMAIL_USER");
    const emailPass = Deno.env.get("EMAIL_PASS");
    const officeManagerEmail = Deno.env.get("OFFICE_MANAGER_EMAIL");
    // Vérifier si les variables d'environnement sont définies
    if (
      !emailHost ||
      !emailUser ||
      !emailPass ||
      !officeManagerEmail ||
      !isAuthenticated
    ) {
      console.error("Missing email configuration in environment variables");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Email configuration incomplete",
          missing: {
            host: !emailHost,
            user: !emailUser,
            pass: !emailPass,
            recipient: !officeManagerEmail,
            authentication: !isAuthenticated,
          },
        }),
        {
          headers: {
            "Content-Type": "application/json",
          },
          status: 500,
        }
      );
    }
    // Configure email client avec les variables d'environnement
    const client = new SMTPClient({
      connection: {
        hostname: emailHost,
        port: emailPort,
        tls: true,
        auth: {
          username: emailUser,
          password: emailPass,
        },
      },
    });
    console.log("Connecting to SMTP server:", emailHost, emailPort);
    
    // Format the date and time for better readability
    const startDateTime = new Date(record.start_time);
    const endDateTime = new Date(record.end_time);
    const formattedStartDate = startDateTime.toLocaleDateString();
    const formattedStartTime = startDateTime.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const formattedEndTime = endDateTime.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Get the appropriate email template based on the booking's language
    console.log("Booking language:", record.language);
    const emailTemplate = getTemplateFromLanguageCode(record.language);
    
    let subject = "";
    let body = "";
    
    // Determine email content based on the event type
    if (type === "new_booking") {
      subject = emailTemplate.newBooking.subject(record.title);
      body = emailTemplate.newBooking.body(record, formattedStartDate, formattedStartTime, formattedEndTime);
    } else if (type === "confirmed_booking") {
      subject = emailTemplate.confirmedBooking.subject(record.title);
      body = emailTemplate.confirmedBooking.body(record, formattedStartDate, formattedStartTime, formattedEndTime);
    }
    console.log(`Sending email to ${officeManagerEmail} - Subject: ${subject}`);
    // Send the email
    await client.send({
      from: emailUser,
      to: officeManagerEmail,
      cc: record.created_by_email,
      subject: subject,
      content: body,
    });
    await client.close();
    // Log a success message
    console.log(`Email sent successfully for ${type}`);
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
