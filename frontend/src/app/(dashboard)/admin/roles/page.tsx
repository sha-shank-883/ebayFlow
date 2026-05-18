"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Edit2, Trash2, Save, X, Shield } from "lucide-react";
import { PageSkeleton } from "@/components/ui/skeleton";
import toast from "react-hot-toast";

export default function RolesPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any>(null);

  useEffect(() => { loadRoles(); }, []);

  const loadRoles = async () => {
    try { const data = await adminApi.roles.list(); setRoles(data); }
    catch (error: any) { toast.error(error.message); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    try {
      if (editing.id) await adminApi.roles.update(editing.id, editing);
      else await adminApi.roles.create(editing);
      toast.success("Saved"); setEditing(null); loadRoles();
    } catch (error: any) { toast.error(error.message); }
  };

  const deleteRole = async (id: string) => {
    if (!confirm("Delete?")) return;
    try { await adminApi.roles.delete(id); loadRoles(); toast.success("Deleted"); }
    catch (error: any) { toast.error(error.message); }
  };

  if (loading) return <PageSkeleton content="cards" />;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Roles & Permissions</h1>
          <p className="text-muted-foreground mt-1">Manage admin roles and their permissions.</p>
        </div>
        <Button onClick={() => setEditing({ name: "", description: "", permissions: [] })}><Plus className="mr-2 h-4 w-4" /> New Role</Button>
      </div>

      {editing && (
        <Card className="border-primary/50">
          <CardHeader><CardTitle>{editing.id ? "Edit" : "New"} Role</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Name</Label><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Description</Label><Input value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
            <div className="space-y-2"><Label>Permissions (one per line)</Label>
              <Textarea value={Array.isArray(editing.permissions) ? editing.permissions.join('\n') : editing.permissions} onChange={(e) => setEditing({ ...editing, permissions: e.target.value.split('\n').filter((p: string) => p.trim()) })} rows={8} className="font-mono text-sm" placeholder="content:read&#10;content:write&#10;blog:read&#10;blog:write" />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave}><Save className="mr-2 h-4 w-4" /> Save</Button>
              <Button variant="outline" onClick={() => setEditing(null)}><X className="mr-2 h-4 w-4" /> Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map(role => (
          <Card key={role.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-lg">{role.name}</CardTitle>
                  {role.isSystem && <Badge variant="secondary">System</Badge>}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setEditing(role)}><Edit2 className="h-3.5 w-3.5" /></Button>
                  {!role.isSystem && <Button variant="ghost" size="sm" onClick={() => deleteRole(role.id)}><Trash2 className="h-3.5 w-3.5" /></Button>}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">{role.description}</p>
              <div className="flex flex-wrap gap-1">
                {(Array.isArray(role.permissions) ? role.permissions : []).map((p: string, i: number) => (
                  <Badge key={i} variant="outline" className="text-xs">{p}</Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">{role._count?.users || 0} users</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
