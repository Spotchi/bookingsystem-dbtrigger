export interface EmailTemplate {
  newBooking: {
    subject: (title: string) => string;
    body: (record: any, formattedStartDate: string, formattedStartTime: string, formattedEndTime: string) => string;
  };
  confirmedBooking: {
    subject: (title: string) => string;
    body: (record: any, formattedStartDate: string, formattedStartTime: string, formattedEndTime: string) => string;
  };
}

export const englishTemplate: EmailTemplate = {
  newBooking: {
    subject: (title: string) => `New booking request: ${title}`,
    body: (record: any, formattedStartDate: string, formattedStartTime: string, formattedEndTime: string) => `A new booking request has been received.

Booking Information:
----------------------------
Title: ${record.title}
Description: ${record.description || "None"}
Room: ${record.room_name} (capacity: ${record.room_capacity})
Date: ${formattedStartDate}
Time: ${formattedStartTime} - ${formattedEndTime}
Created by: ${record.created_by_name || "Not specified"} (${record.created_by_email})

To approve this booking, please log in to the booking system.`
  },
  confirmedBooking: {
    subject: (title: string) => `Booking confirmed: ${title}`,
    body: (record: any, formattedStartDate: string, formattedStartTime: string, formattedEndTime: string) => `A booking has been confirmed.

Booking Information:
----------------------------
Title: ${record.title}
Description: ${record.description || "None"}
Room: ${record.room_name} (capacity: ${record.room_capacity})
Date: ${formattedStartDate}
Time: ${formattedStartTime} - ${formattedEndTime}
Created by: ${record.created_by_name || "Not specified"} (${record.created_by_email})
Approved by: ${record.approved_by_email}
Approval date: ${new Date(record.approved_at || "").toLocaleString()}`
  }
};
