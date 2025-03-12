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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { createClientAction } from "@/app/dashboard/actions";

export default async function NewClientPage() {
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
          <CardTitle>Add New Client</CardTitle>
          <CardDescription>
            Create a new client profile with invoicing preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createClientAction} className="space-y-6">
            <input type="hidden" name="user_id" value={user.id} />

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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="client@example.com"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    An invitation link will be created for the client to
                    register
                  </p>
                </div>

                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <div>
                <Label>Invoicing Frequency</Label>
                <RadioGroup
                  defaultValue="monthly"
                  name="invoicing_frequency"
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="monthly" id="monthly" />
                    <Label htmlFor="monthly" className="cursor-pointer">
                      Monthly
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="quarterly" id="quarterly" />
                    <Label htmlFor="quarterly" className="cursor-pointer">
                      Quarterly
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yearly" id="yearly" />
                    <Label htmlFor="yearly" className="cursor-pointer">
                      Yearly
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="next_invoice_date">Next Invoice Date</Label>
                <Input
                  id="next_invoice_date"
                  name="next_invoice_date"
                  type="date"
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Additional information about this client"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" asChild>
                <Link href="/dashboard/clients">Cancel</Link>
              </Button>
              <Button type="submit">Create Client & Send Invitation</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
