import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../supabase/server";
import { sendEmail, generateReminderEmailBody } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get request body
    const { clientId, emailType = "reminder" } = await request.json();

    if (!clientId) {
      return NextResponse.json(
        { error: "Client ID is required" },
        { status: 400 },
      );
    }

    // Get client information
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Generate and send test email
    if (emailType === "reminder") {
      const emailBody = generateReminderEmailBody({
        clientName: client.name,
        reminderTitle: "Test Reminder",
        reminderMessage: "This is a test reminder from your accountant.",
        accountantName: user.user_metadata?.full_name || "Your Accountant",
        dueDate: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ).toLocaleDateString(),
      });

      const result = await sendEmail({
        to: client.email,
        subject: "Test Reminder Email",
        body: emailBody,
        type: "reminder",
        testMode: true,
      });

      return NextResponse.json({
        success: result.success,
        message: result.success
          ? "Test email sent successfully"
          : "Failed to send test email",
        error: result.error,
      });
    }

    return NextResponse.json(
      {
        error: "Invalid email type",
      },
      { status: 400 },
    );
  } catch (error) {
    console.error("Error sending test email:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
