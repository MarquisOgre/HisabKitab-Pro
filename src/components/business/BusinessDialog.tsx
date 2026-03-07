import { useState } from "react";
import { Building2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useBusinessSelection, Business } from "@/contexts/BusinessSelectionContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

interface BusinessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit' | 'manage';
  business?: Business;
}

interface FormData {
  name: string;
  gstin: string;
  pan: string;
  email: string;
  phone: string;
  address: string;
}

export function BusinessDialog({ open, onOpenChange, mode, business }: BusinessDialogProps) {
  const { businesses, createBusiness, updateBusiness, deleteBusiness, canCreateBusiness } = useBusinessSelection();
  const [loading, setLoading] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [deleteConfirmBusiness, setDeleteConfirmBusiness] = useState<Business | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    name: business?.name || '',
    gstin: business?.gstin || '',
    pan: business?.pan || '',
    email: business?.email || '',
    phone: business?.phone || '',
    address: business?.address || '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      gstin: '',
      pan: '',
      email: '',
      phone: '',
      address: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setLoading(true);
    try {
      if (mode === 'edit' && business) {
        await updateBusiness(business.id, formData);
      } else if (editingBusiness) {
        await updateBusiness(editingBusiness.id, formData);
        setEditingBusiness(null);
      } else {
        await createBusiness(formData);
      }
      resetForm();
      if (mode !== 'manage') {
        onOpenChange(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (business: Business) => {
    setEditingBusiness(business);
    setFormData({
      name: business.name,
      gstin: business.gstin || '',
      pan: business.pan || '',
      email: business.email || '',
      phone: business.phone || '',
      address: business.address || '',
    });
  };

  const handleDelete = async () => {
    if (!deleteConfirmBusiness) return;
    setLoading(true);
    try {
      await deleteBusiness(deleteConfirmBusiness.id);
      setDeleteConfirmBusiness(null);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    setEditingBusiness(null);
    onOpenChange(false);
  };

  if (mode === 'manage') {
    return (
      <>
        <Dialog open={open} onOpenChange={handleClose}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Manage Businesses</DialogTitle>
              <DialogDescription>
                View, edit, or delete your businesses
              </DialogDescription>
            </DialogHeader>

            {editingBusiness ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Business Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter business name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gstin">GSTIN</Label>
                    <Input
                      id="gstin"
                      value={formData.gstin}
                      onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                      placeholder="22AAAAA0000A1Z5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pan">PAN</Label>
                    <Input
                      id="pan"
                      value={formData.pan}
                      onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                      placeholder="AAAAA0000A"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="business@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Enter business address"
                      rows={2}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => {
                    setEditingBusiness(null);
                    resetForm();
                  }}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </DialogFooter>
              </form>
            ) : (
              <>
                <ScrollArea className="max-h-[400px]">
                  <div className="space-y-2">
                    {businesses.map((business) => (
                      <div
                        key={business.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {business.name}
                              {business.is_default && (
                                <Badge variant="secondary" className="text-xs">Default</Badge>
                              )}
                            </div>
                            {business.gstin && (
                              <div className="text-sm text-muted-foreground">
                                GSTIN: {business.gstin}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(business)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteConfirmBusiness(business)}
                            disabled={businesses.length === 1}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <DialogFooter>
                  <Button variant="outline" onClick={handleClose}>
                    Close
                  </Button>
                  {canCreateBusiness && (
                    <Button onClick={() => {
                      resetForm();
                      setEditingBusiness({ id: 'new' } as Business);
                    }}>
                      Add Business
                    </Button>
                  )}
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteConfirmBusiness} onOpenChange={() => setDeleteConfirmBusiness(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Business?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete "{deleteConfirmBusiness?.name}" and all its associated data including items, parties, invoices, and transactions. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Edit Business' : 'Create New Business'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit' 
              ? 'Update your business details' 
              : 'Add a new business to manage separately'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Business Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter business name"
              required
            />
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="gstin">GSTIN</Label>
              <Input
                id="gstin"
                value={formData.gstin}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                placeholder="22AAAAA0000A1Z5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pan">PAN</Label>
              <Input
                id="pan"
                value={formData.pan}
                onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                placeholder="AAAAA0000A"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="business@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Enter business address"
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.name.trim()}>
              {loading ? 'Saving...' : (mode === 'edit' ? 'Save Changes' : 'Create Business')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
