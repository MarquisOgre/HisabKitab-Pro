import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Gift, Loader2, Check } from "lucide-react";
import { toast } from "sonner";

interface TrialRequestFormProps {
  trigger?: React.ReactNode;
}

export function TrialRequestForm({ trigger }: TrialRequestFormProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    business_name: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("trial_requests").insert({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        business_name: formData.business_name.trim() || null,
      });

      if (error) throw error;

      // Notify SuperAdmin about new trial request
      try {
        await supabase.functions.invoke("notify-admin", {
          body: {
            type: "trial_request",
            data: {
              name: formData.name.trim(),
              email: formData.email.trim(),
              phone: formData.phone.trim(),
              businessName: formData.business_name.trim() || null
            }
          }
        });
      } catch (notifyError) {
        console.error("Failed to notify admin:", notifyError);
      }

      setSubmitted(true);
      toast.success("Trial request submitted! We'll contact you soon.");
      
      // Reset after delay
      setTimeout(() => {
        setOpen(false);
        setSubmitted(false);
        setFormData({ name: "", email: "", phone: "", business_name: "" });
      }, 2000);
    } catch (error: any) {
      toast.error("Failed to submit request: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="lg" className="bg-gradient-to-r from-primary to-orange-400 hover:from-primary/90 hover:to-orange-400/90 gap-2">
            <Gift className="w-5 h-5" />
            Request Free Trial
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            Request 14-Day Free Trial
          </DialogTitle>
          <DialogDescription>
            Fill in your details and we'll activate your free trial within 24 hours.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-success" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Request Submitted!</h3>
            <p className="text-muted-foreground">
              We'll review your request and contact you within 24 hours.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="trial-name">Full Name *</Label>
              <Input
                id="trial-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="trial-email">Email Address *</Label>
              <Input
                id="trial-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="trial-phone">Phone Number *</Label>
              <Input
                id="trial-phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="trial-business">Business Name (Optional)</Label>
              <Input
                id="trial-business"
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                placeholder="Your business name"
              />
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Request Free Trial"
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
