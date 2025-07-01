import { EmailTemplate } from "./english.ts";

export const frenchTemplate: EmailTemplate = {
  newBooking: {
    subject: (title: string) => `Nouvelle demande de réservation: ${title}`,
    body: (record: any, formattedStartDate: string, formattedStartTime: string, formattedEndTime: string) => `Une nouvelle demande de réservation a été reçue.

Informations de réservation:
----------------------------
Titre: ${record.title}
Description: ${record.description || "Aucune"}
Salle: ${record.room_name} (capacité: ${record.room_capacity})
Date: ${formattedStartDate}
Horaire: ${formattedStartTime} - ${formattedEndTime}
Créée par: ${record.created_by_name || "Non spécifié"} (${record.created_by_email})

Pour approuver cette réservation, veuillez vous connecter au système de réservation.`
  },
  confirmedBooking: {
    subject: (title: string) => `Réservation confirmée: ${title}`,
    body: (record: any, formattedStartDate: string, formattedStartTime: string, formattedEndTime: string) => `Une réservation a été confirmée.

Informations de réservation:
----------------------------
Titre: ${record.title}
Description: ${record.description || "Aucune"}
Salle: ${record.room_name} (capacité: ${record.room_capacity})
Date: ${formattedStartDate}
Horaire: ${formattedStartTime} - ${formattedEndTime}
Créée par: ${record.created_by_name || "Non spécifié"} (${record.created_by_email})
Approuvée par: ${record.approved_by_email}
Date d'approbation: ${new Date(record.approved_at || "").toLocaleString()}`
  }
};
