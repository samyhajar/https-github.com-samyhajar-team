"use server";

import { createClient } from "../../../../../supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function updateReminderSettingsAction(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const userId = formData.get("user_id") as string;
  const isEnabled = formData.get("is_enabled") === "on";
  const monthlyDaysBefore =
    parseInt(formData.get("monthly_days_before") as string) || 3;
  const quarterlyDaysBefore =
    parseInt(formData.get("quarterly_days_before") as string) || 14;
  const yearlyDaysBefore =
    parseInt(formData.get("yearly_days_before") as string) || 30;

  // Check if settings already exist
  const { data: existingSettings } = await supabase
    .from("accountant_reminder_settings")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (existingSettings) {
    // Update existing settings
    const { error } = await supabase
      .from("accountant_reminder_settings")
      .update({
        is_enabled: isEnabled,
        monthly_days_before: monthlyDaysBefore,
        quarterly_days_before: quarterlyDaysBefore,
        yearly_days_before: yearlyDaysBefore,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (error) {
      console.error("Error updating reminder settings:", error);
      return { error: error.message };
    }
  } else {
    // Create new settings
    const { error } = await supabase
      .from("accountant_reminder_settings")
      .insert({
        user_id: userId,
        is_enabled: isEnabled,
        monthly_days_before: monthlyDaysBefore,
        quarterly_days_before: quarterlyDaysBefore,
        yearly_days_before: yearlyDaysBefore,
      });

    if (error) {
      console.error("Error creating reminder settings:", error);
      return { error: error.message };
    }
  }

  revalidatePath("/dashboard/settings/reminder-settings");
  return { success: true };
}
