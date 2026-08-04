import { useMemo, useState } from "react";
import { Loader2, Mail, Send } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader, StatCard } from "@/components/admin/ui/AdminPageHeader";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminModal } from "@/components/admin/ui/AdminModal";
import { AdminSkeleton, AdminErrorState } from "@/components/admin/ui/AdminSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCurrency } from "@/lib/currency";
import type { useAdminApi } from "@/hooks/useAdminApi";

const ABANDONED_KEY = "blessings_abandoned_cart";

type AbandonedCart = {
  email?: string;
  items?: Array<{ name: string; quantity: number }>;
  subtotal?: number;
  savedAt?: string;
};

type Props = { api: ReturnType<typeof useAdminApi> };

function loadAbandonedCarts(): AbandonedCart[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ABANDONED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AbandonedCart | AbandonedCart[];
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [];
  }
}

export function MarketingTab({ api }: Props) {
  const { format } = useCurrency();
  const { data, loading, error, reload, sendNotification } = api;

  const [pushTitle, setPushTitle] = useState("");
  const [pushMessage, setPushMessage] = useState("");
  const [sendingPush, setSendingPush] = useState(false);

  const [emailOpen, setEmailOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  const abandoned = useMemo(() => loadAbandonedCarts(), [data.notifications.length]);

  if (loading) return <AdminSkeleton />;
  if (error) return <AdminErrorState message={error} onRetry={reload} />;

  const sendPush = async () => {
    if (!pushTitle.trim() || !pushMessage.trim()) {
      toast.error("Title and message are required");
      return;
    }
    setSendingPush(true);
    try {
      await sendNotification({ title: pushTitle.trim(), message: pushMessage.trim(), channel: "push" });
      setPushTitle("");
      setPushMessage("");
      toast.success("Push notification sent");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Send failed");
    } finally {
      setSendingPush(false);
    }
  };

  const mockEmailCampaign = () => {
    toast.success("Email campaign queued (mock)", {
      description: `"${emailSubject}" would be sent to subscribers.`,
    });
    setEmailOpen(false);
    setEmailSubject("");
    setEmailBody("");
  };

  return (
    <div>
      <AdminPageHeader
        title="Marketing"
        description="Push notifications, email campaigns, and abandoned cart recovery."
        actions={
          <Button size="sm" variant="outline" onClick={() => setEmailOpen(true)}>
            <Mail className="size-3.5 mr-1.5" />
            Email campaign
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Notifications sent" value={String(data.notifications.length)} icon={<Send className="size-4" />} />
        <StatCard label="Abandoned carts" value={String(abandoned.length)} />
        <StatCard
          label="Last notification"
          value={
            data.notifications[0]
              ? new Date(data.notifications[0].sentAt).toLocaleDateString()
              : "—"
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <AdminCard>
          <h3 className="font-serif italic text-lg mb-4">Push notification</h3>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="push-title">Title</Label>
              <Input
                id="push-title"
                value={pushTitle}
                onChange={(e) => setPushTitle(e.target.value)}
                placeholder="New collection live"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="push-msg">Message</Label>
              <Textarea
                id="push-msg"
                value={pushMessage}
                onChange={(e) => setPushMessage(e.target.value)}
                rows={4}
                placeholder="Shop our latest festive edits…"
              />
            </div>
            <Button onClick={sendPush} disabled={sendingPush}>
              {sendingPush && <Loader2 className="size-4 mr-2 animate-spin" />}
              Send push
            </Button>
          </div>
        </AdminCard>

        <AdminCard>
          <h3 className="font-serif italic text-lg mb-4">Abandoned carts</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Recovered from browser storage ({ABANDONED_KEY})
          </p>
          {abandoned.length === 0 ? (
            <p className="text-sm text-muted-foreground">No abandoned carts recorded.</p>
          ) : (
            <ul className="space-y-3">
              {abandoned.map((cart, i) => (
                <li key={i} className="rounded-lg border border-border p-3 text-sm">
                  <p className="font-medium">{cart.email ?? "Guest"}</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    {cart.items?.length ?? 0} items
                    {cart.subtotal != null ? ` · ${format(cart.subtotal)}` : ""}
                    {cart.savedAt ? ` · ${new Date(cart.savedAt).toLocaleString()}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </div>

      <AdminCard padding="none">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="font-serif italic text-lg">Notification history</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Channel</th>
                <th>Title</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {data.notifications.map((n) => (
                <tr key={n.id}>
                  <td className="text-muted-foreground whitespace-nowrap">
                    {new Date(n.sentAt).toLocaleString()}
                  </td>
                  <td className="capitalize">{n.channel}</td>
                  <td className="font-medium">{n.title}</td>
                  <td className="text-muted-foreground max-w-xs truncate">{n.message}</td>
                </tr>
              ))}
              {data.notifications.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center text-muted-foreground py-8">
                    No notifications yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </AdminCard>

      <AdminModal
        open={emailOpen}
        onOpenChange={setEmailOpen}
        title="Email campaign"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setEmailOpen(false)}>
              Cancel
            </Button>
            <Button onClick={mockEmailCampaign}>Send campaign (mock)</Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Preview and compose a broadcast email. Sending is mocked in this panel.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="email-subject">Subject</Label>
            <Input
              id="email-subject"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email-body">Body</Label>
            <Textarea
              id="email-body"
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              rows={10}
            />
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
