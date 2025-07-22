# Booking Notifications with Multi-Language Support

This system provides multi-language email notifications for booking events using Supabase Edge Functions.

## Structure

```
bookingsystem-dbtrigger/
├── bookingnotifications.ts      # Main Edge Function
├── language-utils.ts           # Language detection and template utilities
├── templates/
│   ├── english.ts             # English email templates
│   ├── french.ts              # French email templates
│   └── dutch.ts               # Dutch email templates
├── email_triggers.sql         # Database triggers
└── README.md                  # This file
```

## How Language Detection Works

1. **Language Source**: The system reads the `language` attribute from the booking record passed by the database trigger.

2. **Language Detection**: The `detectLanguage()` function in `language-utils.ts` processes the language code:
   - Handles various formats (e.g., 'en', 'en-US', 'fr-FR', 'nl-NL')
   - Defaults to English if no language is specified
   - Maps language codes to supported languages:
     - `en*` → English
     - `fr*` → French  
     - `nl*` or `du*` → Dutch

3. **Template Selection**: Based on the detected language, the appropriate template is loaded and used for email generation.

## Supported Languages

- **English** (`en`) - Default
- **French** (`fr`)
- **Dutch** (`nl`)

## Email Types

Each language template supports two types of notifications:

### New Booking Notifications
Sent when a new booking is created (triggered by database INSERT).

### Confirmed Booking Notifications  
Sent when a booking is approved (triggered by database UPDATE when `approved_at` changes from NULL).

## Template Structure

Each language template exports an `EmailTemplate` interface with:

```typescript
interface EmailTemplate {
  newBooking: {
    subject: (title: string) => string;
    body: (record: any, formattedStartDate: string, formattedStartTime: string, formattedEndTime: string) => string;
  };
  confirmedBooking: {
    subject: (title: string) => string;
    body: (record: any, formattedStartDate: string, formattedStartTime: string, formattedEndTime: string) => string;
  };
}
```

## Usage

The system automatically:
1. Receives booking data from the database trigger
2. Extracts the `language` field from the booking record  
3. Detects the appropriate language template
4. Generates localized email content
5. Sends the email to the office manager and CCs the booking creator

## Adding New Languages

To add support for a new language:

1. Create a new template file in `/templates/` (e.g., `spanish.ts`)
2. Implement the `EmailTemplate` interface with translated content
3. Update `language-utils.ts` to include the new language mapping
4. Add the language to the `SupportedLanguage` type

## Environment Variables

The system requires these environment variables:
- `EMAIL_HOST` - SMTP server hostname
- `EMAIL_PORT` - SMTP server port (default: 587)
- `EMAIL_USER` - SMTP username
- `EMAIL_PASS` - SMTP password  
- `OFFICE_MANAGER_EMAIL` - Recipient email for notifications
- `TRIGGER_AUTH` - Authentication token for webhook security

## Testing Setup

To run Supabase function tests, follow these steps:

1. Navigate to the `supabase/functions/` directory:
   ```sh
   cd supabase/functions
   ```
2. Copy the environment variable template to a new `.env` file:
   ```sh
   cp .env.template .env
   ```
3. Fill in the required values in `.env` with your credentials and configuration.

4. Run the tests (from the `supabase/functions/` directory):
   ```sh
   deno test --allow-env --allow-net --allow-read
   ```
   Adjust permissions as needed depending on your test requirements.

## TODO

- Fulfill email credentials

