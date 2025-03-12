import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "../../../../../supabase/server";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Textarea } from "@/components/ui/textarea";
import { inviteClientAction } from "@/app/dashboard/actions";

export default async function InviteClientPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/clients">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Clients
          </Link>
        </Button>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Invite Client</CardTitle>
          <CardDescription>
            Send an invitation email to your client to set up their account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={inviteClientAction} className="space-y-6">
            <input type="hidden" name="accountant_id" value={user.id} />

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Client Name</Label>
                <Input id="name" name="name" required placeholder="John Doe" />
              </div>

              <div>
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  id="company_name"
                  name="company_name"
                  placeholder="ABC Corporation"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="client@example.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <Label htmlFor="message">Invitation Message (Optional)</Label>
                <Textarea
                  id="message"
                  name="message"
                  placeholder="Please join our client portal to securely upload your documents."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" asChild>
                <Link href="/dashboard/clients">Cancel</Link>
              </Button>
              <Button type="submit">Send Invitation</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
