import { useState, useEffect } from "react";
import { 
  UserPlus, 
  Trash2, 
  Loader2, 
  Shield,
  Users,
  Eye,
  KeyRound
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { checkMaxUsers } from "@/hooks/useSessionTracking";
import { Badge } from "@/components/ui/badge";
import { isSuperAdminEmail } from "@/lib/superadmin";

type AppRole = 'admin' | 'supervisor' | 'viewer';

interface UserWithRole {
  user_id: string;
  email: string;
  full_name: string | null;
  role: AppRole;
  parent_user_id: string | null;
}

export function UserManagement() {
  const { user, isAdmin } = useAuth();
  const isSuperAdmin = isSuperAdminEmail(user?.email);
  
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserRole, setNewUserRole] = useState<AppRole>("viewer");
  const [addingUser, setAddingUser] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  
  // Password change state
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<UserWithRole | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role, parent_user_id');

      if (rolesError) throw rolesError;

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, email, full_name, parent_user_id');

      if (profilesError) throw profilesError;

      const usersWithRoles: UserWithRole[] = rolesData
        .map(roleItem => {
          const profile = profilesData.find(p => p.user_id === roleItem.user_id);
          return {
            user_id: roleItem.user_id,
            email: profile?.email || 'Unknown',
            full_name: profile?.full_name || null,
            role: roleItem.role as AppRole,
            parent_user_id: profile?.parent_user_id || roleItem.parent_user_id || null
          };
        })
        // Hide superadmin from user list (unless current user is superadmin)
        .filter(u => isSuperAdmin || !isSuperAdminEmail(u.email))
        // For non-superadmin admins, only show users they created or themselves
        .filter(u => {
          if (isSuperAdmin) return true;
          // Show self
          if (u.user_id === user?.id) return true;
          // Show users created by this admin
          if (u.parent_user_id === user?.id) return true;
          return false;
        });

      setUsers(usersWithRoles);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUserEmail.trim() || !newUserPassword.trim()) {
      toast.error('Please enter email and password');
      return;
    }

    if (newUserPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setAddingUser(true);
    try {
      // Check max users limit before adding (SuperAdmin bypasses this)
      if (!isSuperAdmin) {
        const { allowed, error: limitError } = await checkMaxUsers();
        if (!allowed) {
          toast.error(limitError || 'User limit reached');
          setAddingUser(false);
          return;
        }
      }

      // Store current session before creating user
      const { data: currentSession } = await supabase.auth.getSession();
      const currentAccessToken = currentSession?.session?.access_token;
      const currentRefreshToken = currentSession?.session?.refresh_token;
      
      const { data, error } = await supabase.auth.signUp({
        email: newUserEmail.trim(),
        password: newUserPassword,
        options: {
          data: {
            full_name: newUserName.trim() || null,
          },
        }
      });
      
      // Immediately restore original admin session after creating user to prevent auto-login as new user
      if (currentAccessToken && currentRefreshToken) {
        await supabase.auth.setSession({
          access_token: currentAccessToken,
          refresh_token: currentRefreshToken
        });
      }

      if (error) throw error;

      if (data.user) {
        // Update the role if not viewer (viewer is default)
        if (newUserRole !== 'viewer') {
          const { error: roleError } = await supabase
            .from('user_roles')
            .update({ role: newUserRole, parent_user_id: user?.id })
            .eq('user_id', data.user.id);

          if (roleError) {
            console.error('Error updating role:', roleError);
          }
        } else {
          // Set parent_user_id even for viewer role
          const { error: roleError } = await supabase
            .from('user_roles')
            .update({ parent_user_id: user?.id })
            .eq('user_id', data.user.id);

          if (roleError) {
            console.error('Error updating parent:', roleError);
          }
        }

        // Update profile with parent_user_id
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ parent_user_id: user?.id })
          .eq('user_id', data.user.id);

        if (profileError) {
          console.error('Error updating profile parent:', profileError);
        }
      }

      toast.success(`User ${newUserEmail} added successfully`);
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserName("");
      setNewUserRole("viewer");
      setAddUserDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      console.error('Error adding user:', error);
      if (error.message?.includes('already registered')) {
        toast.error('This email is already registered');
      } else {
        toast.error('Failed to add user: ' + error.message);
      }
    } finally {
      setAddingUser(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === user?.id) {
      toast.error("You cannot delete your own account");
      return;
    }

    setDeletingUserId(userId);
    try {
      if (isSuperAdmin) {
        // SuperAdmin: full account deletion via edge function
        const { data: sessionData } = await supabase.auth.getSession();
        const response = await supabase.functions.invoke('delete-user-account', {
          body: { userId },
          headers: {
            Authorization: `Bearer ${sessionData.session?.access_token}`
          }
        });

        if (response.error) throw new Error(response.error.message);
        toast.success('User account and all records deleted successfully');
      } else {
        // Regular admin: just remove role and profile
        const { error: roleError } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId);

        if (roleError) throw roleError;

        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('user_id', userId);

        if (profileError) throw profileError;
        toast.success('User removed successfully');
      }

      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user: ' + error.message);
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleChangeRole = async (userId: string, newRole: AppRole) => {
    // Prevent non-superadmin from assigning admin role
    if (!isSuperAdmin && newRole === 'admin') {
      toast.error('Only SuperAdmin can assign Admin role');
      return;
    }

    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      toast.success('Role updated successfully');
      // 🔥 FULL PAGE REFRESH to re-evaluate auth, RLS & context
      window.location.reload();
    } catch (error: any) {
      console.error('Error changing role:', error);
      toast.error('Failed to update role');
    }
  };

  const handleChangePassword = async () => {
    if (!selectedUserForPassword || !newPassword) {
      toast.error('Please enter a new password');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setChangingPassword(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('admin-update-password', {
        body: {
          userId: selectedUserForPassword.user_id,
          newPassword: newPassword
        },
        headers: {
          Authorization: `Bearer ${sessionData.session?.access_token}`
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to update password');
      }

      toast.success(`Password updated for ${selectedUserForPassword.email}`);
      setPasswordDialogOpen(false);
      setSelectedUserForPassword(null);
      setNewPassword("");
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error('Failed to change password: ' + error.message);
    } finally {
      setChangingPassword(false);
    }
  };

  const getRoleBadgeVariant = (role: AppRole) => {
    switch (role) {
      case 'admin':
        return 'default';
      case 'supervisor':
        return 'secondary';
      case 'viewer':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getRoleIcon = (role: AppRole) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-3 h-3" />;
      case 'supervisor':
        return <Users className="w-3 h-3" />;
      case 'viewer':
        return <Eye className="w-3 h-3" />;
      default:
        return null;
    }
  };

  // Get available roles for selection (admins can only create supervisor/viewer unless superadmin)
  const getAvailableRoles = () => {
    if (isSuperAdmin) {
      return [
        { value: 'admin', label: 'Admin - Full access', icon: Shield },
        { value: 'supervisor', label: 'Supervisor - Create & edit', icon: Users },
        { value: 'viewer', label: 'Viewer - Read only', icon: Eye },
      ];
    }
    // Regular admins can only create supervisor and viewer
    return [
      { value: 'supervisor', label: 'Supervisor - Create & edit', icon: Users },
      { value: 'viewer', label: 'Viewer - Read only', icon: Eye },
    ];
  };

  if (!isAdmin) {
    return (
      <div className="metric-card">
        <div className="text-center py-8">
          <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">Admin Access Required</h3>
          <p className="text-muted-foreground">
            Only administrators can manage users and change roles.
          </p>
        </div>
      </div>
    );
  }

  // Group users by admin (parent)
  const groupedUsers = () => {
    const groups: { admin: UserWithRole | null; members: UserWithRole[] }[] = [];
    
    // For SuperAdmin, don't show child account groupings for them - just show all users in a flat list
    if (isSuperAdmin) {
      // Show all non-superadmin users as a flat list
      const nonSuperAdminUsers = users.filter(u => !isSuperAdminEmail(u.email));
      
      // Group regular admins with their children
      const admins = nonSuperAdminUsers.filter(u => u.role === 'admin');
      const processedIds = new Set<string>();
      
      admins.forEach(admin => {
        const members = nonSuperAdminUsers.filter(u => 
          u.parent_user_id === admin.user_id && u.user_id !== admin.user_id
        );
        groups.push({ admin, members });
        processedIds.add(admin.user_id);
        members.forEach(m => processedIds.add(m.user_id));
      });
      
      // Add remaining users without a parent (orphaned users)
      const remaining = nonSuperAdminUsers.filter(u => !processedIds.has(u.user_id));
      if (remaining.length > 0) {
        groups.push({ admin: null, members: remaining });
      }
      
      return groups;
    }
    
    // For regular admins, show their own family grouping
    const admins = users.filter(u => u.role === 'admin' || (!u.parent_user_id && u.user_id === user?.id));
    const processedIds = new Set<string>();
    
    admins.forEach(admin => {
      const members = users.filter(u => 
        u.parent_user_id === admin.user_id && u.user_id !== admin.user_id
      );
      groups.push({ admin, members });
      processedIds.add(admin.user_id);
      members.forEach(m => processedIds.add(m.user_id));
    });
    
    // Add remaining users without a parent (orphaned users)
    const remaining = users.filter(u => !processedIds.has(u.user_id));
    if (remaining.length > 0) {
      groups.push({ admin: null, members: remaining });
    }
    
    return groups;
  };

  return (
    <div className="space-y-6">
      {/* User List */}
      <div className="metric-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">User Management</h3>
            <p className="text-sm text-muted-foreground">
              Add users and manage their access levels
              {!isSuperAdmin && " (Max 2 users)"}
            </p>
          </div>
          <Dialog open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="w-4 h-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>
                  Create a new user account with specific access level.
                  {!isSuperAdmin && " You can only create Supervisor or Viewer roles."}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="newUserName">Full Name</Label>
                  <Input
                    id="newUserName"
                    placeholder="John Doe"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newUserEmail">Email Address</Label>
                  <Input
                    id="newUserEmail"
                    type="email"
                    placeholder="user@example.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newUserPassword">Password</Label>
                  <Input
                    id="newUserPassword"
                    type="password"
                    placeholder="Minimum 6 characters"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Access Level</Label>
                  <Select 
                    value={newUserRole} 
                    onValueChange={(v) => setNewUserRole(v as AppRole)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableRoles().map(role => (
                        <SelectItem key={role.value} value={role.value}>
                          <div className="flex items-center gap-2">
                            <role.icon className="w-4 h-4" />
                            {role.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddUserDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddUser} disabled={addingUser}>
                  {addingUser ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Add User
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {loadingUsers ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No users found</p>
            <p className="text-sm text-muted-foreground">
              Add your first user by clicking the button above.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedUsers().map((group, groupIndex) => (
              <div key={groupIndex} className="space-y-2">
                {/* Admin Header */}
                {group.admin && (
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <Shield className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">
                          {group.admin.full_name || group.admin.email}
                        </span>
                        {group.admin.user_id === user?.id && (
                          <Badge variant="outline" className="text-xs">You</Badge>
                        )}
                        {isSuperAdminEmail(group.admin.email) && (
                          <Badge variant="default" className="text-xs bg-gradient-to-r from-primary to-orange-400">SuperAdmin</Badge>
                        )}
                        <Badge variant="default" className="text-xs">Admin</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{group.admin.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {group.members.length} team member{group.members.length !== 1 ? 's' : ''}
                      </span>
                      {/* SuperAdmin can change password for other admins */}
                      {isSuperAdmin && group.admin.user_id !== user?.id && !isSuperAdminEmail(group.admin.email) && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                            onClick={() => {
                              setSelectedUserForPassword(group.admin);
                              setPasswordDialogOpen(true);
                            }}
                          >
                            <KeyRound className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Admin Account</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete <strong>{group.admin.email}</strong> and ALL their data (invoices, items, parties, businesses, etc.) from the database. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteUser(group.admin!.user_id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {deletingUserId === group.admin!.user_id ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                  ) : null}
                                  Delete Account
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </div>
                  </div>
                )}
                
                {!group.admin && group.members.length > 0 && (
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <span className="font-semibold text-sm text-muted-foreground">Other Users</span>
                  </div>
                )}
                
                {/* Family Members */}
                <div className="space-y-2 pl-4">
                  {group.members.map((u) => (
                    <div
                      key={u.user_id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <span className="text-xs font-semibold">
                            {u.email?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{u.full_name || u.email}</p>
                            {u.user_id === user?.id && (
                              <Badge variant="outline" className="text-xs">You</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {u.user_id !== user?.id ? (
                          <>
                            <Select
                              value={u.role}
                              onValueChange={(v) => handleChangeRole(u.user_id, v as AppRole)}
                            >
                              <SelectTrigger className="w-32 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {isSuperAdmin && (
                                  <SelectItem value="admin">
                                    <div className="flex items-center gap-2">
                                      <Shield className="w-3 h-3" />
                                      Admin
                                    </div>
                                  </SelectItem>
                                )}
                                <SelectItem value="supervisor">
                                  <div className="flex items-center gap-2">
                                    <Users className="w-3 h-3" />
                                    Supervisor
                                  </div>
                                </SelectItem>
                                <SelectItem value="viewer">
                                  <div className="flex items-center gap-2">
                                    <Eye className="w-3 h-3" />
                                    Viewer
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            
                            {isSuperAdmin && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                                onClick={() => {
                                  setSelectedUserForPassword(u);
                                  setPasswordDialogOpen(true);
                                }}
                              >
                                <KeyRound className="w-3 h-3" />
                              </Button>
                            )}
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete User</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete {u.email}? 
                                    {isSuperAdmin 
                                      ? " This will permanently remove their account and ALL associated data (invoices, items, parties, businesses, etc.) from the database." 
                                      : " This will remove their role and profile."}
                                    {" "}This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteUser(u.user_id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    {deletingUserId === u.user_id ? (
                                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    ) : null}
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        ) : (
                          <Badge variant={getRoleBadgeVariant(u.role)} className="gap-1">
                            {getRoleIcon(u.role)}
                            {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Password Change Dialog - SuperAdmin only */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Set a new password for {selectedUserForPassword?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Minimum 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleChangePassword} disabled={changingPassword}>
              {changingPassword ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Update Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Access Levels Reference */}
      <div className="metric-card">
        <h3 className="font-semibold mb-4">Access Levels Reference</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Permission</TableHead>
              <TableHead className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Shield className="w-3 h-3" />
                  Admin
                </div>
              </TableHead>
              <TableHead className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Users className="w-3 h-3" />
                  Supervisor
                </div>
              </TableHead>
              <TableHead className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Eye className="w-3 h-3" />
                  Viewer
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>View Dashboard & Reports</TableCell>
              <TableCell className="text-center text-green-600">✓</TableCell>
              <TableCell className="text-center text-green-600">✓</TableCell>
              <TableCell className="text-center text-green-600">✓</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Create Invoices & Transactions</TableCell>
              <TableCell className="text-center text-green-600">✓</TableCell>
              <TableCell className="text-center text-green-600">✓</TableCell>
              <TableCell className="text-center text-green-600">✓</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Edit Invoices & Transactions</TableCell>
              <TableCell className="text-center text-green-600">✓</TableCell>
              <TableCell className="text-center text-green-600">✓</TableCell>
              <TableCell className="text-center text-red-500">✗</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Delete Invoices & Transactions</TableCell>
              <TableCell className="text-center text-green-600">✓</TableCell>
              <TableCell className="text-center text-red-500">✗</TableCell>
              <TableCell className="text-center text-red-500">✗</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Manage Items & Parties</TableCell>
              <TableCell className="text-center text-green-600">✓</TableCell>
              <TableCell className="text-center text-green-600">✓</TableCell>
              <TableCell className="text-center text-red-500">✗</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Manage Users</TableCell>
              <TableCell className="text-center text-green-600">✓</TableCell>
              <TableCell className="text-center text-red-500">✗</TableCell>
              <TableCell className="text-center text-red-500">✗</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Business Settings</TableCell>
              <TableCell className="text-center text-green-600">✓</TableCell>
              <TableCell className="text-center text-red-500">✗</TableCell>
              <TableCell className="text-center text-red-500">✗</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
