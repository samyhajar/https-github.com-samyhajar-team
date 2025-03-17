"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../../supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type EmailLog = {
  id: string;
  to_email: string;
  from_email: string;
  subject: string;
  body: string;
  type: string;
  test_mode: boolean;
  status: string;
  created_at: string;
  sent_at: string | null;
  error_message: string | null;
};

export function EmailLogsViewer() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("email_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(20);

        if (error) throw error;
        setLogs(data || []);
      } catch (err) {
        console.error("Error fetching email logs:", err);
        setError("Failed to load email logs");
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();

    // Set up realtime subscription
    const channel = supabase
      .channel("email_logs_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "email_logs" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setLogs((prev) => [payload.new as EmailLog, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setLogs((prev) =>
              prev.map((log) =>
                log.id === payload.new.id ? (payload.new as EmailLog) : log,
              ),
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Email Logs</CardTitle>
          <CardDescription>Loading email logs...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Email Logs</CardTitle>
          <CardDescription className="text-red-500">{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Logs</CardTitle>
        <CardDescription>Recent emails sent through the system</CardDescription>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-center py-4 text-gray-500">
            No email logs found. Send a test email to see logs here.
          </p>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {logs.map((log) => (
              <div
                key={log.id}
                className="border rounded-md p-4 hover:bg-gray-50"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium">{log.subject}</h4>
                    <p className="text-sm text-gray-500">
                      To: {log.to_email} | From: {log.from_email}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge
                      variant={
                        log.status === "sent" ? "default" : "destructive"
                      }
                    >
                      {log.status}
                    </Badge>
                    {log.test_mode && (
                      <Badge variant="outline">Test Mode</Badge>
                    )}
                  </div>
                </div>
                <div className="text-sm text-gray-700 mb-2">
                  <p className="line-clamp-2">
                    {log.body.replace(/<[^>]*>?/gm, "")}
                  </p>
                </div>
                <div className="text-xs text-gray-500 flex justify-between">
                  <span>
                    Created: {new Date(log.created_at).toLocaleString()}
                  </span>
                  {log.sent_at && (
                    <span>Sent: {new Date(log.sent_at).toLocaleString()}</span>
                  )}
                </div>
                {log.error_message && (
                  <p className="text-xs text-red-500 mt-1">
                    Error: {log.error_message}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
