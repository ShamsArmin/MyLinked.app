import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  EyeOff,
  Settings
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
  const [selectedMessage, setSelectedMessage] = useState<SupportMessage | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [showNotesDialog, setShowNotesDialog] = useState(false);

  // Fetch support messages
  const { data: messages = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/support/messages'],
    queryFn: async () => {
      const response = await fetch('/api/support/messages');
      if (!response.ok) throw new Error('Failed to fetch messages');
      return response.json() as Promise<SupportMessage[]>;
    }
  });

  // Update message mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      const response = await fetch(`/api/support/messages/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Failed to update message');
      return response.json();
    },
    onSuccess: () => {
      refetch();
      toast({
        title: "Success",
        description: "Message updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update message.",
        variant: "destructive",
      });
    }
  });

  // Delete message mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/support/messages/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete message');
      return response.json();
    },
    onSuccess: () => {
      refetch();
      toast({
        title: "Success",
        description: "Message deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete message.",
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
    updateMutation.mutate({ id, updates });
  };

  const handleToggleRead = (id: number, currentIsRead: boolean) => {
    updateMutation.mutate({ 
      id, 
      updates: { isRead: !currentIsRead } 
    });
  };

  const handleDeleteMessage = (id: number) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      deleteMutation.mutate(id);
    }
  };

  const openNotesDialog = (message: SupportMessage) => {
    setSelectedMessage(message);
    setAdminNotes(message.adminNotes || "");
    setShowNotesDialog(true);
  };

  const saveNotes = () => {
    if (selectedMessage) {
      updateMutation.mutate({
        id: selectedMessage.id,
        updates: { adminNotes }
      });
      setShowNotesDialog(false);
      setSelectedMessage(null);
      setAdminNotes("");
    }
  };

  const cancelNotes = () => {
    setShowNotesDialog(false);
    setSelectedMessage(null);
    setAdminNotes("");
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

  const stats = {
    total: messages.length,
    open: messages.filter(m => m.status === 'open').length,
    unread: messages.filter(m => !m.isRead).length,
    resolved: messages.filter(m => m.status === 'resolved').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Mail className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
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
                <p className="text-2xl font-bold">{stats.open}</p>
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
                <p className="text-2xl font-bold">{stats.unread}</p>
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
                <p className="text-2xl font-bold">{stats.resolved}</p>
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
          <div className="space-y-4 max-h-[500px] overflow-y-auto">
            {messages.map((message) => (
              <Card 
                key={message.id} 
                className={`${!message.isRead ? 'border-blue-200 bg-blue-50/50' : ''} relative`}
              >
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    {/* Header with user info and badges */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center space-x-2 flex-wrap gap-1">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{message.name}</span>
                          <Badge variant="outline" className="text-xs">{message.email}</Badge>
                          <Badge 
                            variant={
                              message.priority === 'urgent' ? 'destructive' :
                              message.priority === 'high' ? 'secondary' : 'outline'
                            }
                            className="text-xs"
                          >
                            {message.priority.toUpperCase()}
                          </Badge>
                          <Badge 
                            variant={
                              message.status === 'resolved' ? 'secondary' :
                              message.status === 'in_progress' ? 'outline' : 'destructive'
                            }
                            className="text-xs"
                          >
                            {message.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                        
                        {/* Subject and Message */}
                        <div>
                          <h4 className="font-medium text-sm">{message.subject}</h4>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {message.message}
                          </p>
                        </div>
                        
                        {/* Timestamp */}
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
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div className="flex items-center space-x-2">
                        {/* Read/Unread Toggle */}
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2"
                          onClick={() => handleToggleRead(message.id, message.isRead)}
                          disabled={updateMutation.isPending}
                        >
                          {message.isRead ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                        
                        {/* Notes Button */}
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-3 text-xs"
                          onClick={() => openNotesDialog(message)}
                        >
                          Notes
                        </Button>
                        
                        {/* Delete Button */}
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2 text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteMessage(message.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Status Dropdown */}
                      <div className="flex items-center space-x-2">
                        <select
                          value={message.status}
                          onChange={(e) => handleStatusChange(message.id, e.target.value)}
                          disabled={updateMutation.isPending}
                          className="text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {messages.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Mail className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">No support messages</p>
                <p className="text-sm">Messages from the contact form will appear here</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notes Dialog */}
      {showNotesDialog && selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Admin Notes</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={cancelNotes}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm font-medium">{selectedMessage.subject}</p>
                  <p className="text-sm text-gray-600">From: {selectedMessage.name} ({selectedMessage.email})</p>
                  <p className="text-sm text-gray-700 mt-2">{selectedMessage.message}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Admin Notes:</label>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add your notes here..."
                    rows={4}
                    className="w-full"
                  />
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={cancelNotes}
                    disabled={updateMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={saveNotes}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? 'Saving...' : 'Save Notes'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}