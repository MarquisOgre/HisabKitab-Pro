import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Edit2, Trash2, FolderOpen } from "lucide-react";
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
import { useBusinessSelection } from "@/contexts/BusinessSelectionContext";

export default function Categories() {
  const [newCategory, setNewCategory] = useState("");
  const [editCategory, setEditCategory] = useState<{ id: string; name: string } | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const queryClient = useQueryClient();
  const { selectedBusiness } = useBusinessSelection();
  const navigate = useNavigate();

  // Fetch categories with item count
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories', selectedBusiness?.id],
    queryFn: async () => {
      if (!selectedBusiness) return [];
      
      const { data: categoriesData, error } = await supabase
        .from('categories')
        .select('*')
        .eq('business_id', selectedBusiness.id)
        .order('name');
      
      if (error) throw error;

      // Get item counts for each category
      const { data: items } = await supabase
        .from('items')
        .select('category_id')
        .eq('is_deleted', false)
        .eq('business_id', selectedBusiness.id);

      const itemCounts = (items || []).reduce((acc: Record<string, number>, item) => {
        if (item.category_id) {
          acc[item.category_id] = (acc[item.category_id] || 0) + 1;
        }
        return acc;
      }, {});

      return (categoriesData || []).map(cat => ({
        ...cat,
        itemCount: itemCounts[cat.id] || 0
      }));
    },
    enabled: !!selectedBusiness
  });

  // Add category mutation
  const addMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      if (!selectedBusiness) throw new Error('No business selected');

      // Get admin user ID for data isolation
      const { data: adminId } = await supabase.rpc('get_admin_user_id', { _user_id: user.id });

      const { error } = await supabase
        .from('categories')
        .insert({ 
          name, 
          user_id: adminId || user.id,
          business_id: selectedBusiness.id
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setNewCategory("");
      setIsAddOpen(false);
      toast.success("Category added successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add category");
    }
  });

  // Update category mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase
        .from('categories')
        .update({ name })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setEditCategory(null);
      setIsEditOpen(false);
      toast.success("Category updated successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update category");
    }
  });

  // Delete category mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success("Category deleted successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete category");
    }
  });

  const handleAddCategory = () => {
    if (!newCategory.trim()) return;
    addMutation.mutate(newCategory.trim());
  };

  const handleEditCategory = () => {
    if (!editCategory || !editCategory.name.trim()) return;
    updateMutation.mutate({ id: editCategory.id, name: editCategory.name.trim() });
  };

  const openEditDialog = (category: { id: string; name: string }) => {
    setEditCategory({ id: category.id, name: category.name });
    setIsEditOpen(true);
  };

  const handleCategoryClick = (categoryId: string, categoryName: string) => {
    navigate(`/items?category=${categoryId}&categoryName=${encodeURIComponent(categoryName)}`);
  };

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
            <h1 className="text-2xl font-bold">Categories</h1>
            <p className="text-muted-foreground">Manage your item categories</p>
          </div>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="btn-gradient gap-2">
              <Plus className="w-4 h-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Category</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="categoryName">Category Name</Label>
                <Input
                  id="categoryName"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Enter category name"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  className="btn-gradient" 
                  onClick={handleAddCategory}
                  disabled={addMutation.isPending}
                >
                  {addMutation.isPending ? "Adding..." : "Add Category"}
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
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="editCategoryName">Category Name</Label>
              <Input
                id="editCategoryName"
                value={editCategory?.name || ""}
                onChange={(e) => setEditCategory(prev => prev ? { ...prev, name: e.target.value } : null)}
                placeholder="Enter category name"
                onKeyDown={(e) => e.key === 'Enter' && handleEditCategory()}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button 
                className="btn-gradient" 
                onClick={handleEditCategory}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Categories Grid */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading categories...</div>
      ) : categories.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No categories yet. Click "Add Category" to create one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className="metric-card flex items-center justify-between group cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => handleCategoryClick(category.id, category.name)}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FolderOpen className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{category.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {category.itemCount} items
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => openEditDialog(category)}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Category</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{category.name}"? This action cannot be undone.
                        {category.itemCount > 0 && (
                          <span className="block mt-2 text-destructive">
                            Warning: This category has {category.itemCount} items associated with it.
                          </span>
                        )}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteMutation.mutate(category.id)}
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