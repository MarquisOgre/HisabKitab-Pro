import { useState, useEffect } from "react";
import { format, addDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  Loader2, 
  Check, 
  X, 
  MessageSquare, 
  Clock,
  Eye,
  EyeOff,
  CreditCard,
  Mail
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { PlanPaymentsManagement } from "./PlanPaymentsManagement";
import { EmailSettings } from "./EmailSettings";
// @ts-nocheck
interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface TrialRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  business_name: string | null;
  status: string;
  approved_at: string | null;
  trial_start_date: string | null;
  trial_end_date: string | null;
  notes: string | null;
  created_at: string;
}

export function SuperAdminSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<ContactSubmission[]>([]);
  const [trialRequests, setTrialRequests] = useState<TrialRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<TrialRequest | null>(null);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [contactsRes, trialsRes] = await Promise.all([
        supabase
          .from("contact_submissions")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("trial_requests")
          .select("*")
          .order("created_at", { ascending: false }),
      ]);

      if (contactsRes.error) throw contactsRes.error;
      if (trialsRes.error) throw trialsRes.error;

      setContacts((contactsRes.data || []) as any);
      setTrialRequests(trialsRes.data || []);
    } catch (error: any) {
      toast.error("Failed to fetch data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const markContactAsRead = async (id: string, isRead: boolean) => {
    try {
      const { error } = await supabase
        .from("contact_submissions")
        .update({ is_read: String(isRead) })
        .eq("id", id);

      if (error) throw error;
      
      setContacts(contacts.map(c => 
        c.id === id ? { ...c, is_read: isRead } : c
      ));
      toast.success(isRead ? "Marked as read" : "Marked as unread");
    } catch (error: any) {
      toast.error("Failed to update: " + error.message);
    }
  };

  const sendNotificationEmail = async (
    type: "trial_approved" | "trial_rejected",
    to: string,
    name: string,
    trialEndDate?: string,
    notes?: string
  ) => {
    try {
      const { error } = await supabase.functions.invoke("send-notification", {
        body: { type, to, name, trialEndDate, notes },
      });
      if (error) throw error;
    } catch (error: any) {
      console.error("Failed to send email:", error);
      // Don't throw - email is secondary
    }
  };

  const handleTrialAction = async (status: "approved" | "rejected") => {
    if (!selectedRequest || !user) return;
    
    setProcessing(true);
    try {
      const now = new Date();
      const trialEndDate = addDays(now, 14);
      const updateData: Partial<TrialRequest> & { approved_by?: string } = {
        status,
        approved_at: now.toISOString(),
        approved_by: user.id,
        notes: approvalNotes || null,
      };

      if (status === "approved") {
        updateData.trial_start_date = now.toISOString();
        updateData.trial_end_date = trialEndDate.toISOString();
      }

      const { error } = await supabase
        .from("trial_requests")
        .update(updateData)
        .eq("id", selectedRequest.id);

      if (error) throw error;

      // Send notification email
      await sendNotificationEmail(
        status === "approved" ? "trial_approved" : "trial_rejected",
        selectedRequest.email,
        selectedRequest.name,
        status === "approved" ? format(trialEndDate, "dd MMM yyyy") : undefined,
        approvalNotes || undefined
      );

      setTrialRequests(trialRequests.map(t => 
        t.id === selectedRequest.id 
          ? { ...t, ...updateData } 
          : t
      ));
      
      toast.success(`Trial request ${status}. Email notification sent!`);
      setSelectedRequest(null);
      setApprovalNotes("");
    } catch (error: any) {
      toast.error("Failed to process: " + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-success/10 text-success">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-destructive/10 text-destructive">Rejected</Badge>;
      default:
        return <Badge className="bg-warning/10 text-warning">Pending</Badge>;
    }
  };

  const unreadCount = contacts.filter(c => !c.is_read).length;
  const pendingTrials = trialRequests.filter(t => t.status === "pending").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="metric-card">
        <h3 className="font-semibold mb-4 text-lg">Super Admin Dashboard</h3>
        
        <Tabs defaultValue="payments">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="payments" className="gap-1 text-xs sm:text-sm">
              <CreditCard className="w-4 h-4" />
              <span className="hidden sm:inline">Payments</span>
            </TabsTrigger>
            <TabsTrigger value="contacts" className="gap-1 text-xs sm:text-sm">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Contacts</span>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-1 text-xs">{unreadCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="trials" className="gap-1 text-xs sm:text-sm">
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Trials</span>
              {pendingTrials > 0 && (
                <Badge variant="destructive" className="ml-1 text-xs">{pendingTrials}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="email" className="gap-1 text-xs sm:text-sm">
              <Mail className="w-4 h-4" />
              <span className="hidden sm:inline">Email</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="payments" className="mt-4">
            <PlanPaymentsManagement />
          </TabsContent>

          <TabsContent value="contacts" className="mt-4">
            {contacts.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No contact submissions yet</p>
            ) : (
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contacts.map((contact) => (
                      <TableRow key={contact.id} className={contact.is_read ? "opacity-60" : ""}>
                        <TableCell className="font-medium">{contact.name}</TableCell>
                        <TableCell>
                          <a href={`mailto:${contact.email}`} className="text-primary hover:underline">
                            {contact.email}
                          </a>
                        </TableCell>
                        <TableCell>{contact.phone || "-"}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{contact.message}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(contact.created_at), "dd MMM yyyy")}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markContactAsRead(contact.id, !contact.is_read)}
                          >
                            {contact.is_read ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="trials" className="mt-4">
            {trialRequests.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No trial requests yet</p>
            ) : (
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Business</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trialRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">{request.name}</TableCell>
                        <TableCell>
                          <a href={`mailto:${request.email}`} className="text-primary hover:underline">
                            {request.email}
                          </a>
                        </TableCell>
                        <TableCell>{request.phone}</TableCell>
                        <TableCell>{request.business_name || "-"}</TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(request.created_at), "dd MMM yyyy")}
                        </TableCell>
                        <TableCell>
                          {request.status === "pending" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedRequest(request)}
                            >
                              Review
                            </Button>
                          )}
                          {request.status === "approved" && request.trial_end_date && (
                            <span className="text-xs text-muted-foreground">
                              Expires: {format(new Date(request.trial_end_date), "dd MMM")}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="email" className="mt-4">
            <EmailSettings />
          </TabsContent>

        </Tabs>
      </div>

      {/* Trial Approval Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Trial Request</DialogTitle>
            <DialogDescription>
              {selectedRequest?.name} ({selectedRequest?.email}) is requesting a 14-day free trial.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Phone</p>
                <p className="font-medium">{selectedRequest?.phone}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Business</p>
                <p className="font-medium">{selectedRequest?.business_name || "Not provided"}</p>
              </div>
            </div>
            
            <div>
              <label className="text-sm text-muted-foreground">Notes (optional)</label>
              <Textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Add any notes about this request..."
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => handleTrialAction("rejected")}
              disabled={processing}
              className="text-destructive"
            >
              <X className="w-4 h-4 mr-2" />
              Reject
            </Button>
            <Button
              onClick={() => handleTrialAction("approved")}
              disabled={processing}
              className="bg-success hover:bg-success/90"
            >
              {processing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Approve (14 Days)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}