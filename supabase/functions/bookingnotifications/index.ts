import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Setup type definitions for built-in Supabase Runtime APIs
import { handleCalendarEntry } from "./../../../src/handleCalendar.ts";
import { sendEmail } from "./../../../src/sendEmail.ts";

// Function to create HMAC signature
async function createSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(payload);
  
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function handler(req: Request) {
  try {
    // Get the signature from headers
    const signature = req.headers.get("x-supabase-webhook-signature");
    if (!signature) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing webhook signature",
        }),
        {
          headers: {
            "Content-Type": "application/json",
          },
          status: 401,
        }
      );
    }

    // Get the raw body as text for signing
    const rawBody = await req.text();
    
    // Get the secret from environment
    const secret = (globalThis as any).Deno?.env?.get("TRIGGER_AUTH");
    if (!secret) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing TRIGGER_AUTH secret",
        }),
        {
          headers: {
            "Content-Type": "application/json",
          },
          status: 500,
        }
      );
    }

    // Create expected signature
    const expectedSignature = await createSignature(rawBody, secret);
    
    // Verify signature (constant-time comparison to prevent timing attacks)
    const isValid = signature === expectedSignature;
    
    if (!isValid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid webhook signature",
        }),
        {
          headers: {
            "Content-Type": "application/json",
          },
          status: 401,
        }
      );
    }

    // Parse the request body
    const payload = JSON.parse(rawBody);
    console.log(payload);
    const { record, type } = payload;

    const emailDisabled = (globalThis as any).Deno?.env?.get("EMAIL_DISABLED") === "true";
    if (!emailDisabled) {
      const result = await sendEmail(record, type);
      if (result.error) {
        return result.error;
      }
    } else {
      console.log("Email disabled, skipping email");
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

// @ts-ignore
(globalThis as any).Deno?.serve?.length === 1 ? (globalThis as any).Deno.serve(handler) : (globalThis as any).Deno.serve({ port: 8000 }, handler);
