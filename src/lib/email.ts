import { createClient } from "../../supabase/client";

export type EmailData = {
  to: string;
  subject: string;
  body: string;
  from?: string;
  type?: "reminder" | "document_completion" | "general";
  testMode?: boolean;
};

export async function sendEmail(emailData: EmailData) {
  const supabase = createClient();

  try {
    const { data, error } = await supabase.functions.invoke("send-email", {
      body: emailData,
    });

    if (error) {
      console.error("Error sending email:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Exception sending email:", error);
    return { success: false, error };
  }
}

export function generateReminderEmailBody({
  clientName,
  reminderTitle,
  reminderMessage,
  accountantName,
  dueDate,
}: {
  clientName: string;
  reminderTitle: string;
  reminderMessage: string;
  accountantName: string;
  dueDate?: string;
}) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #333;">Reminder: ${reminderTitle}</h2>
      <p>Hello ${clientName},</p>
      <p>${reminderMessage}</p>
      ${dueDate ? `<p><strong>Due Date:</strong> ${dueDate}</p>` : ""}
      <p>Please log in to your client portal to take action.</p>
      <p>Best regards,<br>${accountantName}</p>
    </div>
  `;
}

export function generateDocumentCompletionEmailBody({
  clientName,
  documentType,
  month,
  year,
  accountantName,
}: {
  clientName: string;
  documentType: string;
  month: string;
  year: string;
  accountantName: string;
}) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #333;">Document Upload Completed</h2>
      <p>Hello ${accountantName},</p>
      <p>Your client <strong>${clientName}</strong> has marked the following document type as completed:</p>
      <ul>
        <li><strong>Document Type:</strong> ${documentType}</li>
        <li><strong>Period:</strong> ${month}/${year}</li>
      </ul>
      <p>You can review the uploaded documents in your accountant dashboard.</p>
      <p>Best regards,<br>AccountFlow</p>
    </div>
  `;
}
