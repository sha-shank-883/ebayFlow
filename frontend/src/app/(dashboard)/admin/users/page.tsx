"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Edit2, Trash2, Save, X, Users, Shield } from "lucide-react";
import { PageSkeleton } from "@/components/ui/skeleton";
import toast from "react-hot-toast";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editingRole, setEditingRole] = useState<any>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [u, r] = await Promise.all([adminApi.users.list(), adminApi.roles.list()]);
      setUsers(u); setRoles(r);
    } catch (error: any) { toast.error(error.message); }
    finally { setLoading(false); }
  };

  const saveUser = async () => {
    try {
      if (editingUser.id) await adminApi.users.update(editingUser.id, editingUser);
      else await adminApi.users.create(editingUser);
      toast.success("Saved"); setEditingUser(null); loadData();
    } catch (error: any) { toast.error(error.message); }
  };

  const saveRole = async () => {
    try {
      if (editingRole.id) await adminApi.roles.update(editingRole.id, editingRole);
      else await adminApi.roles.create(editingRole);
      toast.success("Saved"); setEditingRole(null); loadData();
    } catch (error: any) { toast.error(error.message); }
  };

  const deleteUser = async (id: string) => {
    if (!confirm("Delete?")) return;
    try { await adminApi.users.delete(id); loadData(); toast.success("Deleted"); }
    catch (error: any) { toast.error(error.message); }
  };

  const deleteRole = async (id: string) => {
    if (!confirm("Delete?")) return;
    try { await adminApi.roles.delete(id); loadData(); toast.success("Deleted"); }
    catch (error: any) { toast.error(error.message); }
  };

  if (loading) return <PageSkeleton content="list" />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Users & Roles</h1>
        <p className="text-muted-foreground mt-1">Manage admin users and their permissions.</p>
      </div>

      {editingUser && (
        <Card className="border-primary/50">
          <CardHeader><CardTitle>{editingUser.id ? "Edit" : "New"} User</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Email</Label><Input value={editingUser.email || ""} onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })} /></div>
              <div className="space-y-2"><Label>Name</Label><Input value={editingUser.name || ""} onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })} /></div>
            </div>
            {!editingUser.id && <div className="space-y-2"><Label>Password</Label><Input type="password" value={editingUser.password || ""} onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })} /></div>}
            <div className="space-y-2"><Label>Role</Label>
              <select className="w-full h-10 rounded-md border border-input bg-background px-3" value={editingUser.role} onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}>
                <option value="SUPER_ADMIN">Super Admin</option><option value="ADMIN">Admin</option><option value="EDITOR">Editor</option><option value="USER">User</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button onClick={saveUser}><Save className="mr-2 h-4 w-4" /> Save</Button>
              <Button variant="outline" onClick={() => setEditingUser(null)}><X className="mr-2 h-4 w-4" /> Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {editingRole && (
        <Card className="border-primary/50">
          <CardHeader><CardTitle>{editingRole.id ? "Edit" : "New"} Role</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Name</Label><Input value={editingRole.name} onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Description</Label><Input value={editingRole.description || ""} onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })} /></div>
            <div className="space-y-2"><Label>Permissions (one per line)</Label><Textarea value={Array.isArray(editingRole.permissions) ? editingRole.permissions.join('\n') : editingRole.permissions} onChange={(e) => setEditingRole({ ...editingRole, permissions: e.target.value.split('\n').filter((p: string) => p.trim()) })} rows={5} /></div>
            <div className="flex gap-2">
              <Button onClick={saveRole}><Save className="mr-2 h-4 w-4" /> Save</Button>
              <Button variant="outline" onClick={() => setEditingRole(null)}><X className="mr-2 h-4 w-4" /> Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Users ({users.length})</CardTitle>
            <Button size="sm" onClick={() => setEditingUser({ email: "", name: "", password: "", role: "EDITOR" })}><Plus className="mr-2 h-3.5 w-3.5" /> Add</Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {users.map(user => (
              <div key={user.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium text-sm">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{user.role}</Badge>
                  <Button variant="ghost" size="sm" onClick={() => setEditingUser(user)}><Edit2 className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteUser(user.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Roles ({roles.length})</CardTitle>
            <Button size="sm" onClick={() => setEditingRole({ name: "", description: "", permissions: [] })}><Plus className="mr-2 h-3.5 w-3.5" /> Add</Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {roles.map(role => (
              <div key={role.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium text-sm">{role.name}</p>
                  <p className="text-xs text-muted-foreground">{role.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{role._count?.users || 0} users</Badge>
                  <Button variant="ghost" size="sm" onClick={() => setEditingRole(role)}><Edit2 className="h-3.5 w-3.5" /></Button>
                  {!role.isSystem && <Button variant="ghost" size="sm" onClick={() => deleteRole(role.id)}><Trash2 className="h-3.5 w-3.5" /></Button>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
