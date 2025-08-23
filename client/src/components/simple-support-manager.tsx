import React, { useState, useEffect } from "react";

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
  resolvedAt?: string | null;
  resolvedBy?: string | null;
  adminNotes?: string | null;
}

export function SimpleSupportManager() {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<SupportMessage | null>(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notes, setNotes] = useState("");
  const [updateStatus, setUpdateStatus] = useState("");

  // Fetch messages
  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/support/messages');
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      } else {
        console.error('Failed to fetch messages');
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update message
  const updateMessage = async (id: number, updates: any) => {
    try {
      setUpdateStatus('Updating...');
      const response = await fetch(`/api/support/messages/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        setUpdateStatus('Updated successfully!');
        fetchMessages(); // Refresh the list
        setTimeout(() => setUpdateStatus(''), 3000);
      } else {
        setUpdateStatus('Update failed');
        setTimeout(() => setUpdateStatus(''), 3000);
      }
    } catch (error) {
      console.error('Error updating message:', error);
      setUpdateStatus('Update error');
      setTimeout(() => setUpdateStatus(''), 3000);
    }
  };

  // Delete message
  const deleteMessage = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;

    try {
      const response = await fetch(`/api/support/messages/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setUpdateStatus('Message deleted');
        fetchMessages();
        setTimeout(() => setUpdateStatus(''), 3000);
      } else {
        setUpdateStatus('Delete failed');
        setTimeout(() => setUpdateStatus(''), 3000);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  // Handle status change
  const handleStatusChange = (id: number, newStatus: string) => {
    const updates: any = { status: newStatus };
    if (newStatus === 'resolved') {
      updates.resolvedAt = new Date().toISOString();
      updates.resolvedBy = 'Admin';
    }
    updateMessage(id, updates);
  };

  // Handle read toggle
  const handleReadToggle = (id: number, currentIsRead: boolean) => {
    updateMessage(id, { isRead: !currentIsRead });
  };

  // Open notes modal
  const openNotesModal = (message: SupportMessage) => {
    setSelectedMessage(message);
    setNotes(message.adminNotes || '');
    setShowNotesModal(true);
  };

  // Save notes
  const saveNotes = () => {
    if (selectedMessage) {
      updateMessage(selectedMessage.id, { adminNotes: notes });
      setShowNotesModal(false);
      setSelectedMessage(null);
      setNotes('');
    }
  };

  // Cancel notes
  const cancelNotes = () => {
    setShowNotesModal(false);
    setSelectedMessage(null);
    setNotes('');
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  if (loading) {
    return <div className="p-6">Loading support messages...</div>;
  }

  const stats = {
    total: messages.length,
    open: messages.filter(m => m.status === 'open').length,
    unread: messages.filter(m => !m.isRead).length,
    resolved: messages.filter(m => m.status === 'resolved').length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Status Message */}
      {updateStatus && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
          {updateStatus}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-blue-500 mr-3">📧</div>
            <div>
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Messages</div>
            </div>
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-orange-500 mr-3">⚠️</div>
            <div>
              <div className="text-2xl font-bold">{stats.open}</div>
              <div className="text-sm text-gray-600">Open</div>
            </div>
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-500 mr-3">💬</div>
            <div>
              <div className="text-2xl font-bold">{stats.unread}</div>
              <div className="text-sm text-gray-600">Unread</div>
            </div>
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-green-500 mr-3">✅</div>
            <div>
              <div className="text-2xl font-bold">{stats.resolved}</div>
              <div className="text-sm text-gray-600">Resolved</div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages List */}
      <div className="bg-white border rounded-lg">
        <div className="border-b p-4">
          <h2 className="text-lg font-semibold">Support Messages</h2>
          <p className="text-sm text-gray-600">Manage customer support requests and inquiries</p>
        </div>
        
        <div className="divide-y max-h-96 overflow-y-auto">
          {messages.map((message) => (
            <div key={message.id} className={`p-4 ${!message.isRead ? 'bg-blue-50 border-l-4 border-l-blue-400' : ''}`}>
              <div className="space-y-3">
                {/* Header with user info and badges */}
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-2 flex-wrap gap-1">
                      <span className="text-gray-500">👤</span>
                      <span className="font-medium">{message.name}</span>
                      <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                        {message.email}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        message.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        message.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {message.priority.toUpperCase()}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        message.status === 'resolved' ? 'bg-green-100 text-green-800' :
                        message.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {message.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    
                    {/* Subject and Message */}
                    <div>
                      <h4 className="font-medium text-sm">{message.subject}</h4>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {message.message}
                      </p>
                    </div>
                    
                    {/* Timestamp */}
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>🕒</span>
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
                    <button
                      onClick={() => handleReadToggle(message.id, message.isRead)}
                      className="px-3 py-1 text-sm border rounded hover:bg-gray-50 flex items-center"
                      title={message.isRead ? "Mark as unread" : "Mark as read"}
                    >
                      {message.isRead ? '👁️' : '👁️‍🗨️'}
                    </button>
                    
                    {/* Notes Button */}
                    <button
                      onClick={() => openNotesModal(message)}
                      className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                    >
                      📝 Notes
                    </button>
                    
                    {/* Delete Button */}
                    <button
                      onClick={() => deleteMessage(message.id)}
                      className="px-3 py-1 text-sm border rounded text-red-600 hover:bg-red-50"
                    >
                      🗑️
                    </button>
                  </div>

                  {/* Status Dropdown */}
                  <div className="flex items-center space-x-2">
                    <select
                      value={message.status}
                      onChange={(e) => handleStatusChange(message.id, e.target.value)}
                      className="text-sm border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {messages.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">📧</div>
              <p className="text-lg font-medium">No support messages</p>
              <p className="text-sm">Messages from the contact form will appear here</p>
            </div>
          )}
        </div>
      </div>

      {/* Notes Modal */}
      {showNotesModal && selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-96 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Admin Notes</h3>
                <button
                  onClick={cancelNotes}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm font-medium">{selectedMessage.subject}</p>
                  <p className="text-sm text-gray-600">From: {selectedMessage.name} ({selectedMessage.email})</p>
                  <p className="text-sm text-gray-700 mt-2">{selectedMessage.message}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Admin Notes:</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add your notes here..."
                    rows={4}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <button
                    onClick={cancelNotes}
                    className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveNotes}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Save Notes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <div className="text-center">
        <button
          onClick={fetchMessages}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          🔄 Refresh Messages
        </button>
      </div>
    </div>
  );
}