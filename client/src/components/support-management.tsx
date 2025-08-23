import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Mail,
  Clock,
  User,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Trash2,
  Eye,
  EyeOff
} from "lucide-react";

interface SupportMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  priority: string;
  status: string;
  isRead: boolean;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  adminNotes?: string;
}

export function SupportManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedMessage, setSelectedMessage] = useState<SupportMessage | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  // Fetch support messages
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['/api/support/messages'],
    queryFn: () =>
      fetch('/api/support/messages', { credentials: 'include' }).then(res =>
        res.json(),
      ) as Promise<SupportMessage[]>
  });

  // Update message status
  const updateMessageMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: any }) =>
      apiRequest(`/api/support/messages/${id}`, { method: 'PATCH', body: updates }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/support/messages'] });
      toast({
        title: "Message updated",
        description: "Support message has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Failed to update support message. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Delete message
  const deleteMessageMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/support/messages/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/support/messages'] });
      toast({
        title: "Message deleted",
        description: "Support message has been deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Delete failed",
        description: "Failed to delete support message. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleStatusChange = (id: number, status: string) => {
    const updates: any = { status };
    if (status === 'resolved') {
      updates.resolvedAt = new Date().toISOString();
      updates.resolvedBy = 'Admin';
    }
    updateMessageMutation.mutate({ id, updates });
  };

  const handleToggleRead = (id: number, isRead: boolean) => {
    updateMessageMutation.mutate({ id, updates: { isRead: !isRead } });
  };

  const handleSaveNotes = () => {
    if (selectedMessage) {
      updateMessageMutation.mutate({
        id: selectedMessage.id,
        updates: { adminNotes }
      });
      setSelectedMessage(null);
      setAdminNotes("");
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'orange';
      case 'medium': return 'yellow';
      case 'low': return 'green';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'green';
      case 'in_progress': return 'blue';
      case 'open': return 'orange';
      default: return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Support Messages</CardTitle>
          <CardDescription>Loading support messages...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const unreadCount = messages.filter(m => !m.isRead).length;
  const openCount = messages.filter(m => m.status === 'open').length;

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Mail className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{messages.length}</p>
                <p className="text-sm text-muted-foreground">Total Messages</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{openCount}</p>
                <p className="text-sm text-muted-foreground">Open</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{unreadCount}</p>
                <p className="text-sm text-muted-foreground">Unread</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">
                  {messages.filter(m => m.status === 'resolved').length}
                </p>
                <p className="text-sm text-muted-foreground">Resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Messages List */}
      <Card>
        <CardHeader>
          <CardTitle>Support Messages</CardTitle>
          <CardDescription>
            Manage customer support requests and inquiries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {messages.map((message) => (
                <Card key={message.id} className={`${!message.isRead ? 'border-blue-200 bg-blue-50/50' : ''}`}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{message.name}</span>
                          <Badge variant="outline">{message.email}</Badge>
                          <Badge variant={getPriorityColor(message.priority) as any}>
                            {message.priority.toUpperCase()}
                          </Badge>
                          <Badge variant={getStatusColor(message.status) as any}>
                            {message.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                        
                        <div>
                          <h4 className="font-medium">{message.subject}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {message.message}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(message.createdAt).toLocaleString()}</span>
                          {message.resolvedAt && (
                            <>
                              <span>•</span>
                              <span>Resolved: {new Date(message.resolvedAt).toLocaleString()}</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleRead(message.id, message.isRead)}
                        >
                          {message.isRead ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        
                        <Select
                          value={message.status}
                          onValueChange={(status) => handleStatusChange(message.id, status)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedMessage(message);
                                setAdminNotes(message.adminNotes || "");
                              }}
                            >
                              Notes
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Admin Notes - {message.subject}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm font-medium">From: {message.name} ({message.email})</p>
                                <p className="text-sm text-muted-foreground mt-2">{message.message}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Admin Notes:</label>
                                <Textarea
                                  value={adminNotes}
                                  onChange={(e) => setAdminNotes(e.target.value)}
                                  placeholder="Add admin notes..."
                                  rows={4}
                                  className="mt-1"
                                />
                              </div>
                              <div className="flex justify-end space-x-2">
                                <Button variant="outline" onClick={() => setSelectedMessage(null)}>
                                  Cancel
                                </Button>
                                <Button onClick={handleSaveNotes}>
                                  Save Notes
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteMessageMutation.mutate(message.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {messages.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No support messages found</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}