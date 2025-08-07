-- First, ensure we have the http extension enabled
CREATE EXTENSION IF NOT EXISTS "http";

-- ======= HELPER FUNCTIONS FOR WEBHOOK SIGNING =======

-- Function to get the decrypted secret from vault
CREATE OR REPLACE FUNCTION public.get_trigger_auth_secret()
RETURNS TEXT AS $$
DECLARE
  secret_value TEXT;
BEGIN
  SELECT decrypted_secret INTO secret_value
  FROM vault.decrypted_secrets 
  WHERE name = 'TRIGGER_AUTH' 
  LIMIT 1;
  
  RETURN secret_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create HMAC signature
CREATE OR REPLACE FUNCTION public.create_webhook_signature(payload TEXT, secret TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Use PostgreSQL's built-in HMAC function with SHA256
  RETURN encode(hmac(payload::bytea, secret::bytea, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ======= TRIGGER FOR NEW BOOKINGS =======

-- 1. Create a function that will be called when a new booking is inserted
CREATE OR REPLACE FUNCTION public.handle_new_booking()
RETURNS TRIGGER AS $$
DECLARE
  payload TEXT;
  secret TEXT;
  signature TEXT;
  headers JSONB;
BEGIN
  -- Build the payload
  payload := jsonb_build_object(
    'record', jsonb_build_object(
      'id', NEW.id,
      'title', NEW.title,
      'description', NEW.description,
      'room_id', NEW.room_id,
      'room_name', NEW.room_name,
      'room_capacity', NEW.room_capacity,
      'start_time', NEW.start_time,
      'end_time', NEW.end_time,
      'status', NEW.status,
      'created_by_email', NEW.created_by_email,
      'created_by_name', NEW.created_by_name,
      'created_at', NEW.created_at,
      'approved_by_email', NEW.approved_by_email,
      'approved_at', NEW.approved_at,
      'additional_comments', NEW.additional_comments,
      'is_public_event', NEW.is_public_event,
      'cancelled_at', NEW.cancelled_at,
      'cancelled_by_email', NEW.cancelled_by_email,
      'organizer', NEW.organizer,
      'estimated_attendees', NEW.estimated_attendees,
      'luma_event_url', NEW.luma_event_url,
      'calendar_url', NEW.calendar_url,
      'public_uri', NEW.public_uri,
      'language', NEW.language,
      'price', NEW.price,
      'currency', NEW.currency,
      'catering_options', NEW.catering_options,
      'catering_comments', NEW.catering_comments,
      'event_support_options', NEW.event_support_options,
      'membership_status', NEW.membership_status
    ),
    'type', 'new_booking'
  )::text;
  
  -- Get the secret and create signature
  secret := public.get_trigger_auth_secret();
  signature := public.create_webhook_signature(payload, secret);
  
  -- Build headers with signature
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'x-supabase-webhook-signature', signature
  );
  
  -- Make an HTTP POST request to your Edge Function
  PERFORM
    http_post(
      'https://sokfvqtgpbeybjifaywh.supabase.co/functions/v1/bookingnotifications',  
      payload,
      headers::text
    );
  RETURN NEW;  -- Return the new row, which continues the insert operation
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;  -- SECURITY DEFINER means it runs with the privileges of the function creator

-- 2. Create a trigger that calls this function after each new booking insert
CREATE OR REPLACE TRIGGER on_new_booking_inserted
  AFTER INSERT ON bookings  
  FOR EACH ROW              
  EXECUTE FUNCTION public.handle_new_booking();


-- ======= TRIGGER FOR BOOKING CONFIRMATIONS =======

-- 1. Create a function for when bookings are approved
CREATE OR REPLACE FUNCTION public.handle_booking_approval()
RETURNS TRIGGER AS $$
DECLARE
  payload TEXT;
  secret TEXT;
  signature TEXT;
  headers JSONB;
BEGIN
  -- Only trigger when the booking gets approved (approved_at changes from NULL to a timestamp)
  IF (OLD.approved_at IS NULL AND NEW.approved_at IS NOT NULL) THEN
    -- Build the payload
    payload := jsonb_build_object(
      'record', jsonb_build_object(
        'id', NEW.id,
        'title', NEW.title,
        'description', NEW.description,
        'room_id', NEW.room_id,
        'room_name', NEW.room_name,
        'room_capacity', NEW.room_capacity,
        'start_time', NEW.start_time,
        'end_time', NEW.end_time,
        'status', NEW.status,
        'created_by_email', NEW.created_by_email,
        'created_by_name', NEW.created_by_name,
        'created_at', NEW.created_at,
        'approved_by_email', NEW.approved_by_email,
        'approved_at', NEW.approved_at
      ),
      'type', 'confirmed_booking'
    )::text;
    
    -- Get the secret and create signature
    secret := public.get_trigger_auth_secret();
    signature := public.create_webhook_signature(payload, secret);
    
    -- Build headers with signature
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-supabase-webhook-signature', signature
    );
    
    PERFORM
      http_post(
        'https://sokfvqtgpbeybjifaywh.supabase.co/functions/v1/bookingnotifications',
        payload,
        headers::text
      );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create a trigger that calls this function after booking updates
CREATE OR REPLACE TRIGGER on_booking_approved
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_booking_approval();


-- ======= TRIGGER FOR NEW REQUESTS =======

-- 1. Create a function that will be called when a new request is inserted
CREATE OR REPLACE FUNCTION public.handle_new_request()
RETURNS TRIGGER AS $$
DECLARE
  payload TEXT;
  secret TEXT;
  signature TEXT;
  headers JSONB;
BEGIN
  -- Build the payload
  payload := jsonb_build_object(
    'record', jsonb_build_object(
      'id', NEW.id,
      'title', NEW.title,
      'description', NEW.description,
      'request_type', NEW.request_type,
      'priority', NEW.priority,
      'status', NEW.status,
      'created_by_email', NEW.created_by_email,
      'created_by_name', NEW.created_by_name,
      'created_at', NEW.created_at,
      'email', NEW.email,
      'name', NEW.name,
      'phone', NEW.phone,
      'organization', NEW.organization,
      'expected_completion_date', NEW.expected_completion_date,
      'additional_details', NEW.additional_details,
      'attachments', NEW.attachments,
      'language', NEW.language,
      'completed_at', NEW.completed_at,
      'completed_by_email', NEW.completed_by_email,
      'cancelled_at', NEW.cancelled_at,
      'cancelled_by_email', NEW.cancelled_by_email
    ),
    'type', 'new_request'
  )::text;
  
  -- Get the secret and create signature
  secret := public.get_trigger_auth_secret();
  signature := public.create_webhook_signature(payload, secret);
  
  -- Build headers with signature
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'x-supabase-webhook-signature', signature
  );
  
  -- Make an HTTP POST request to your Edge Function
  PERFORM
    http_post(
      'https://sokfvqtgpbeybjifaywh.supabase.co/functions/v1/bookingnotifications',  
      payload,
      headers::text
    );
  RETURN NEW;  -- Return the new row, which continues the insert operation
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create a trigger that calls this function after each new request insert
CREATE OR REPLACE TRIGGER on_new_request_inserted
  AFTER INSERT ON requests  
  FOR EACH ROW              
  EXECUTE FUNCTION public.handle_new_request();


-- ======= TRIGGER FOR NEW REQUEST COMMENTS =======

-- 1. Create a function that will be called when a new request comment is inserted
CREATE OR REPLACE FUNCTION public.handle_new_request_comment()
RETURNS TRIGGER AS $$
DECLARE
  payload TEXT;
  secret TEXT;
  signature TEXT;
  headers JSONB;
BEGIN
  -- Build the payload
  payload := jsonb_build_object(
    'record', jsonb_build_object(
      'comment_id', NEW.id,
      'request_id', NEW.request_id,
      'content', NEW.content,
      'created_at', NEW.created_at,
      'created_by_email', NEW.created_by_email,
      'created_by_name', NEW.created_by_name,
      'status', NEW.status
    ),
    'type', 'new_request_comment'
  )::text;
  
  -- Get the secret and create signature
  secret := public.get_trigger_auth_secret();
  signature := public.create_webhook_signature(payload, secret);
  
  -- Build headers with signature
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'x-supabase-webhook-signature', signature
  );
  
  -- Get the request details for the comment
  PERFORM
    http_post(
      'https://sokfvqtgpbeybjifaywh.supabase.co/functions/v1/bookingnotifications',  
      payload,
      headers::text
    );
  RETURN NEW;  -- Return the new row, which continues the insert operation
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create a trigger that calls this function after each new request comment insert
CREATE OR REPLACE TRIGGER on_new_request_comment_inserted
  AFTER INSERT ON request_comments  
  FOR EACH ROW              
  EXECUTE FUNCTION public.handle_new_request_comment();

