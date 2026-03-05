import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { messageThreads, UserRole } from "@/lib/data";
import { authOptions } from "@/lib/auth";

export default async function MessagesPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }
  const role = (session.user.role as UserRole) ?? "PATIENT";

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Conversation center</CardTitle>
          <p className="text-sm text-slate-500">Secure chats between patients and care teams.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {messageThreads.map((thread) => (
            <div key={thread.id} className="rounded-2xl border border-slate-100 p-4 text-sm">
              <p className="text-base font-semibold text-slate-900">{thread.subject}</p>
              <p className="text-slate-500">With {thread.sender}</p>
              <p className="mt-2 text-slate-600">{thread.snippet}</p>
              <p className="text-xs text-slate-400">{thread.timestamp}</p>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{role === "PATIENT" ? "Compose message" : "Reply to patient"}</CardTitle>
          <p className="text-sm text-slate-500">Messages trigger notifications for both parties.</p>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Input placeholder={role === "PATIENT" ? "Doctor name" : "Patient name"} />
          <Input placeholder="Subject" />
          <textarea className="h-32 w-full rounded-2xl border border-slate-200 p-3" placeholder="Write your message" />
          <Button className="w-full">Send secure message</Button>
        </CardContent>
      </Card>
    </div>
  );
}
