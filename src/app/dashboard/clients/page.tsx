import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "../../../../supabase/server";
import { redirect } from "next/navigation";
import { Plus, Users, Filter, Search } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";

export default async function ClientsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Get all clients for the user
  const { data: clients, error } = await supabase
    .from("clients")
    .select("*")
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching clients:", error);
  }

  // Group clients by invoicing frequency
  const monthlyClients =
    clients?.filter((client) => client.invoicing_frequency === "monthly") || [];
  const quarterlyClients =
    clients?.filter((client) => client.invoicing_frequency === "quarterly") ||
    [];
  const yearlyClients =
    clients?.filter((client) => client.invoicing_frequency === "yearly") || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Clients</h1>
        <Button asChild>
          <Link href="/dashboard/clients/new">
            <Plus className="mr-2 h-4 w-4" /> Add New Client
          </Link>
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={18}
          />
          <Input placeholder="Search clients..." className="pl-10" />
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Filter size={18} />
          <span>Filter</span>
        </Button>
      </div>

      {/* Client Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Users size={18} className="text-blue-500" />
              <span>Monthly Clients</span>
            </CardTitle>
            <CardDescription>30-day invoicing cycle</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              {monthlyClients.length}
            </div>
            <Link
              href="/dashboard/clients?frequency=monthly"
              className="text-sm text-blue-500"
            >
              View all monthly clients
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Users size={18} className="text-indigo-500" />
              <span>Quarterly Clients</span>
            </CardTitle>
            <CardDescription>90-day invoicing cycle</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              {quarterlyClients.length}
            </div>
            <Link
              href="/dashboard/clients?frequency=quarterly"
              className="text-sm text-blue-500"
            >
              View all quarterly clients
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Users size={18} className="text-purple-500" />
              <span>Yearly Clients</span>
            </CardTitle>
            <CardDescription>Annual invoicing cycle</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              {yearlyClients.length}
            </div>
            <Link
              href="/dashboard/clients?frequency=yearly"
              className="text-sm text-blue-500"
            >
              View all yearly clients
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Client List */}
      <Card>
        <CardHeader>
          <CardTitle>All Clients</CardTitle>
          <CardDescription>
            Manage all your clients in one place
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clients && clients.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Name</th>
                    <th className="text-left py-3 px-4 font-medium">Company</th>
                    <th className="text-left py-3 px-4 font-medium">Email</th>
                    <th className="text-left py-3 px-4 font-medium">
                      Frequency
                    </th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr key={client.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <Link
                          href={`/dashboard/clients/${client.id}`}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {client.name}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        {client.company_name || "-"}
                      </td>
                      <td className="py-3 px-4">{client.email || "-"}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            client.invoicing_frequency === "monthly"
                              ? "bg-blue-100 text-blue-800"
                              : client.invoicing_frequency === "quarterly"
                                ? "bg-indigo-100 text-indigo-800"
                                : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {client.invoicing_frequency.charAt(0).toUpperCase() +
                            client.invoicing_frequency.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            client.status === "active"
                              ? "bg-green-100 text-green-800"
                              : client.status === "inactive"
                                ? "bg-gray-100 text-gray-800"
                                : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {client.status.charAt(0).toUpperCase() +
                            client.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/dashboard/clients/${client.id}`}>
                              View
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">
                No clients yet
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new client.
              </p>
              <div className="mt-6">
                <Button asChild>
                  <Link href="/dashboard/clients/new">
                    <Plus className="mr-2 h-4 w-4" /> Add New Client
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
