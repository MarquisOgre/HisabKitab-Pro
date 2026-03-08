// @ts-nocheck
import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Edit2, Trash2, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

export default function Units() {
  const { user } = useAuth();
  const [newUnit, setNewUnit] = useState({ name: "", symbol: "" });
  const [editUnit, setEditUnit] = useState<{ id: string; name: string; symbol: string } | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: units = [], isLoading } = useQuery({
    queryKey: ['units'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('units')
        .select('*')
        .order('name');
      if (error) throw error;
      return data || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async ({ name, symbol }: { name: string; symbol: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('units')
        .insert({ name, symbol: symbol || null, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      setNewUnit({ name: "", symbol: "" });
      setIsAddOpen(false);
      toast.success("Unit added successfully!");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to add unit"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name, symbol }: { id: string; name: string; symbol: string }) => {
      // Units table doesn't have UPDATE RLS, so we delete and re-insert
      const unit = units.find(u => u.id === id);
      const { error: delError } = await supabase.from('units').delete().eq('id', id);
      if (delError) throw delError;
      const { error: insError } = await supabase.from('units').insert({
        name,
        symbol: symbol || null,
        user_id: unit?.user_id || user?.id,
      });
      if (insError) throw insError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      setEditUnit(null);
      setIsEditOpen(false);
      toast.success("Unit updated successfully!");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to update unit"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('units').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      toast.success("Unit deleted successfully!");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to delete unit"),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/items">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Units of Measure</h1>
            <p className="text-muted-foreground">Manage measurement units for your items</p>
          </div>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="btn-gradient gap-2">
              <Plus className="w-4 h-4" />
              Add Unit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Unit</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Unit Name *</Label>
                <Input
                  value={newUnit.name}
                  onChange={(e) => setNewUnit(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Kilograms"
                  onKeyDown={(e) => e.key === 'Enter' && newUnit.name.trim() && addMutation.mutate({ name: newUnit.name.trim(), symbol: newUnit.symbol.trim() })}
                />
              </div>
              <div className="space-y-2">
                <Label>Symbol (optional)</Label>
                <Input
                  value={newUnit.symbol}
                  onChange={(e) => setNewUnit(prev => ({ ...prev, symbol: e.target.value }))}
                  placeholder="e.g. kg"
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button
                  className="btn-gradient"
                  onClick={() => {
                    if (!newUnit.name.trim()) return;
                    addMutation.mutate({ name: newUnit.name.trim(), symbol: newUnit.symbol.trim() });
                  }}
                  disabled={addMutation.isPending}
                >
                  {addMutation.isPending ? "Adding..." : "Add Unit"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Unit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Unit Name *</Label>
              <Input
                value={editUnit?.name || ""}
                onChange={(e) => setEditUnit(prev => prev ? { ...prev, name: e.target.value } : null)}
                placeholder="e.g. Kilograms"
              />
            </div>
            <div className="space-y-2">
              <Label>Symbol (optional)</Label>
              <Input
                value={editUnit?.symbol || ""}
                onChange={(e) => setEditUnit(prev => prev ? { ...prev, symbol: e.target.value } : null)}
                placeholder="e.g. kg"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button
                className="btn-gradient"
                onClick={() => {
                  if (!editUnit || !editUnit.name.trim()) return;
                  updateMutation.mutate({ id: editUnit.id, name: editUnit.name.trim(), symbol: editUnit.symbol.trim() });
                }}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Units Grid */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading units...</div>
      ) : units.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No units yet. Click "Add Unit" to create one (e.g. Pieces, Kg, Liters).
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {units.map((unit) => (
            <div
              key={unit.id}
              className="metric-card flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Ruler className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{unit.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {unit.symbol || "No symbol"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    setEditUnit({ id: unit.id, name: unit.name || "", symbol: unit.symbol || "" });
                    setIsEditOpen(true);
                  }}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Unit</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{unit.name}"? Items using this unit won't be affected.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteMutation.mutate(unit.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
