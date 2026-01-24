import { useState, useEffect } from "react";
import { useAuth } from "@/lib/authContext";
import { useProfile } from "@/lib/useProfile";
import { useStore, ACTION_TYPES } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash, Check, X, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function AdminPage() {
  const { user: authUser, initialized } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("actions");

  // Redirect if not authenticated
  useEffect(() => {
    if (initialized && !authUser) {
      setLocation('/auth');
    }
  }, [initialized, authUser, setLocation]);

  // Show loading while checking auth
  if (!initialized || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Admin access check - ONLY from database profile, never from local store
  const isAdmin = profile?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground">You do not have permission to view this page.</p>
        <p className="text-sm text-muted-foreground mt-2">Admin access is controlled by your account profile.</p>
      </div>
    );
  }

  const handleAction = (action: string) => {
    toast({
      title: action,
      description: "This feature is mocked for the prototype.",
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight">Admin Console</h1>
          <p className="text-muted-foreground">Manage content, users, and settings.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Export CSV</Button>
          <Button>System Settings</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            <div className="text-2xl font-bold">1,234</div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Actions Logged</CardTitle>
            <div className="text-2xl font-bold">5,678</div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Credits Issued</CardTitle>
            <div className="text-2xl font-bold">12,345</div>
          </CardHeader>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="actions">Actions</TabsTrigger>
          <TabsTrigger value="quests">Quests</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="actions" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Manage Actions</CardTitle>
                <CardDescription>Add, edit or remove eco-actions</CardDescription>
              </div>
              <Button size="sm" onClick={() => handleAction("Add Action")}>
                <Plus className="w-4 h-4 mr-2" /> Add Action
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>CO2 Impact</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ACTION_TYPES.slice(0, 5).map((action) => (
                    <TableRow key={action.id}>
                      <TableCell className="font-medium">{action.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{action.category}</Badge>
                      </TableCell>
                      <TableCell>{action.baseRewardCredits} Credits</TableCell>
                      <TableCell>{action.impactCO2} kg CO2</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleAction("Edit")}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleAction("Delete")}>
                          <Trash className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quests" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Quest Management</CardTitle>
              <CardDescription>Quests are managed in Supabase</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Quest CRUD operations are handled via Supabase dashboard for security.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>View and manage user accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">User management is handled via Supabase dashboard for security.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
