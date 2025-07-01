import { EmailTemplate } from "./english.ts";

export const dutchTemplate: EmailTemplate = {
  newBooking: {
    subject: (title: string) => `Nieuwe reserveringsaanvraag: ${title}`,
    body: (record: any, formattedStartDate: string, formattedStartTime: string, formattedEndTime: string) => `Een nieuwe reserveringsaanvraag is ontvangen.

Reserveringsinformatie:
----------------------------
Titel: ${record.title}
Beschrijving: ${record.description || "Geen"}
Ruimte: ${record.room_name} (capaciteit: ${record.room_capacity})
Datum: ${formattedStartDate}
Tijd: ${formattedStartTime} - ${formattedEndTime}
Aangemaakt door: ${record.created_by_name || "Niet gespecificeerd"} (${record.created_by_email})

Om deze reservering goed te keuren, log in op het reserveringssysteem.`
  },
  confirmedBooking: {
    subject: (title: string) => `Reservering bevestigd: ${title}`,
    body: (record: any, formattedStartDate: string, formattedStartTime: string, formattedEndTime: string) => `Een reservering is bevestigd.

Reserveringsinformatie:
----------------------------
Titel: ${record.title}
Beschrijving: ${record.description || "Geen"}
Ruimte: ${record.room_name} (capaciteit: ${record.room_capacity})
Datum: ${formattedStartDate}
Tijd: ${formattedStartTime} - ${formattedEndTime}
Aangemaakt door: ${record.created_by_name || "Niet gespecificeerd"} (${record.created_by_email})
Goedgekeurd door: ${record.approved_by_email}
Goedkeuringsdatum: ${new Date(record.approved_at || "").toLocaleString()}`
  }
};
