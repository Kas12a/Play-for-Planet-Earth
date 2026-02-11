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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Edit, Trash, Check, X, ShieldAlert, MessageSquare, Eye, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function AdminPage() {
  const { user: authUser, initialized } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("actions");
  const [feedbackItems, setFeedbackItems] = useState<any[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<any | null>(null);

  const { session } = useAuth();

  useEffect(() => {
    if (activeTab === "feedback" && session?.access_token) {
      setFeedbackLoading(true);
      fetch("/api/admin/feedback", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
        .then((r) => r.json())
        .then((data) => setFeedbackItems(data.items || []))
        .catch(() => {})
        .finally(() => setFeedbackLoading(false));
    }
  }, [activeTab, session]);

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
        <TabsList className="grid w-full grid-cols-4 max-w-lg">
          <TabsTrigger value="actions">Actions</TabsTrigger>
          <TabsTrigger value="quests">Quests</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="feedback" className="gap-1">
            <MessageSquare className="w-3 h-3" />
            Feedback
          </TabsTrigger>
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

        <TabsContent value="feedback" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>User Feedback</CardTitle>
              <CardDescription>Latest 100 feedback submissions</CardDescription>
            </CardHeader>
            <CardContent>
              {feedbackLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : feedbackItems.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No feedback yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Sender</TableHead>
                      <TableHead>Screen</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Email Sent</TableHead>
                      <TableHead className="text-right">View</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feedbackItems.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Badge variant={item.type === 'bug' ? 'destructive' : item.type === 'praise' ? 'default' : 'outline'}>
                            {item.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {item.is_authenticated ? (
                            <div>
                              <div className="font-medium">{item.user_display_name || item.user_full_name || 'User'}</div>
                              <div className="text-xs text-muted-foreground">{item.user_email || '-'}</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic">Guest</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{item.screen_path || '-'}</TableCell>
                        <TableCell>
                          {item.severity ? (
                            <Badge variant={item.severity === 'high' ? 'destructive' : 'outline'}>
                              {item.severity}
                            </Badge>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(item.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {item.email_sent === false ? (
                            <Badge variant="destructive">Failed</Badge>
                          ) : (
                            <Badge variant="outline">Yes</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedFeedback(item)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Feedback Detail Dialog */}
      <Dialog open={!!selectedFeedback} onOpenChange={(open) => !open && setSelectedFeedback(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Badge variant={selectedFeedback?.type === 'bug' ? 'destructive' : 'outline'}>
                {selectedFeedback?.type}
              </Badge>
              Feedback Details
            </DialogTitle>
          </DialogHeader>
          {selectedFeedback && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4 pr-4">
                <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <p className="text-sm font-medium text-green-800 dark:text-green-300 mb-1">Sender</p>
                  {selectedFeedback.is_authenticated ? (
                    <div className="space-y-0.5 text-sm">
                      <div><span className="font-medium">Name:</span> {selectedFeedback.user_display_name || selectedFeedback.user_full_name || 'Unknown'}</div>
                      <div><span className="font-medium">Email:</span> {selectedFeedback.user_email || '-'}</div>
                      <div><span className="font-medium">User ID:</span> {selectedFeedback.user_id || '-'}</div>
                    </div>
                  ) : (
                    <p className="text-sm italic text-muted-foreground">Guest (not logged in)</p>
                  )}
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Message</p>
                  <p className="mt-1 whitespace-pre-wrap">{selectedFeedback.message}</p>
                </div>

                {selectedFeedback.type === 'bug' && (
                  <>
                    {selectedFeedback.severity && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Severity</p>
                        <Badge variant={selectedFeedback.severity === 'high' ? 'destructive' : 'outline'}>
                          {selectedFeedback.severity}
                        </Badge>
                      </div>
                    )}
                    {selectedFeedback.steps_to_reproduce && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Steps to Reproduce</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm">{selectedFeedback.steps_to_reproduce}</p>
                      </div>
                    )}
                    {selectedFeedback.expected_result && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Expected Result</p>
                        <p className="mt-1 text-sm">{selectedFeedback.expected_result}</p>
                      </div>
                    )}
                    {selectedFeedback.actual_result && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Actual Result</p>
                        <p className="mt-1 text-sm">{selectedFeedback.actual_result}</p>
                      </div>
                    )}
                  </>
                )}

                {selectedFeedback.type === 'confusing' && (
                  <>
                    {selectedFeedback.user_intent && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">What they were trying to do</p>
                        <p className="mt-1 text-sm">{selectedFeedback.user_intent}</p>
                      </div>
                    )}
                    {selectedFeedback.expectation && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">What they expected</p>
                        <p className="mt-1 text-sm">{selectedFeedback.expectation}</p>
                      </div>
                    )}
                  </>
                )}

                {selectedFeedback.type === 'idea' && (
                  <>
                    {selectedFeedback.problem_solved && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Problem it solves</p>
                        <p className="mt-1 text-sm">{selectedFeedback.problem_solved}</p>
                      </div>
                    )}
                    {selectedFeedback.target_user && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Who is it for</p>
                        <p className="mt-1 text-sm">{selectedFeedback.target_user}</p>
                      </div>
                    )}
                    {selectedFeedback.value_rating && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Value Rating</p>
                        <Badge variant="outline">{selectedFeedback.value_rating}</Badge>
                      </div>
                    )}
                  </>
                )}

                {selectedFeedback.screenshot_url && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Screenshot</p>
                    <a href={selectedFeedback.screenshot_url} target="_blank" rel="noopener noreferrer" className="text-primary underline text-sm">
                      View Screenshot
                    </a>
                  </div>
                )}

                {selectedFeedback.can_contact && selectedFeedback.email && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Contact</p>
                    <p className="mt-1 text-sm">{selectedFeedback.email}</p>
                  </div>
                )}

                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Metadata</p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div><span className="font-medium">ID:</span> {selectedFeedback.id}</div>
                    <div><span className="font-medium">Date:</span> {new Date(selectedFeedback.created_at).toLocaleString()}</div>
                    <div><span className="font-medium">Screen:</span> {selectedFeedback.screen_path || '-'}</div>
                    <div><span className="font-medium">URL:</span> {selectedFeedback.url || '-'}</div>
                    <div><span className="font-medium">User ID:</span> {selectedFeedback.user_id || 'anonymous'}</div>
                    <div><span className="font-medium">Version:</span> {selectedFeedback.app_version || '-'}</div>
                    <div><span className="font-medium">Viewport:</span> {selectedFeedback.viewport || '-'}</div>
                    <div><span className="font-medium">IP Hash:</span> {selectedFeedback.ip_hash || '-'}</div>
                    <div className="col-span-2"><span className="font-medium">User Agent:</span> {selectedFeedback.user_agent || '-'}</div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
