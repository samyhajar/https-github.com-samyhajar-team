import ClientNavbar from "@/components/client/client-navbar";
import { createClient } from "../../../../supabase/server";
import { redirect } from "next/navigation";

export default async function ClientDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Check if user is a client
  if (!user.user_metadata.is_client) {
    return redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <ClientNavbar />
      <div className="flex-1">{children}</div>
    </div>
  );
}
