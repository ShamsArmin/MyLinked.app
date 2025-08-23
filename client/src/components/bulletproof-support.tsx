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

export function BulletproofSupport() {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const showStatus = (message: string, error = false) => {
    setStatusMessage(message);
    setIsError(error);
    setTimeout(() => {
      setStatusMessage("");
      setIsError(false);
    }, 3000);
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/support/messages', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
        showStatus(`Loaded ${data.length} messages`);
      } else {
        showStatus('Failed to load messages', true);
      }
    } catch (error) {
      showStatus('Network error loading messages', true);
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateMessage = async (id: number, updates: any) => {
    try {
      const response = await fetch(`/api/support/messages/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
        credentials: 'include',
      });

      if (response.ok) {
        const updatedMessage = await response.json();
        setMessages(prev => prev.map(msg => 
          msg.id === id ? updatedMessage : msg
        ));
        showStatus('Message updated successfully');
        return true;
      } else {
        showStatus('Failed to update message', true);
        return false;
      }
    } catch (error) {
      showStatus('Network error updating message', true);
      console.error('Error:', error);
      return false;
    }
  };

  const deleteMessage = async (id: number) => {
    if (!window.confirm(`Delete message ${id}?`)) return;

    try {
      const response = await fetch(`/api/support/messages/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setMessages(prev => prev.filter(msg => msg.id !== id));
        showStatus('Message deleted');
      } else {
        showStatus('Failed to delete message', true);
      }
    } catch (error) {
      showStatus('Network error deleting message', true);
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const stats = {
    total: messages.length,
    open: messages.filter(m => m.status === 'open').length,
    unread: messages.filter(m => !m.isRead).length,
    resolved: messages.filter(m => m.status === 'resolved').length,
  };

  const handleStatusChange = (id: number, newStatus: string) => {
    const updates: any = { status: newStatus };
    if (newStatus === 'resolved') {
      updates.resolvedAt = new Date().toISOString();
      updates.resolvedBy = 'Admin';
    }
    updateMessage(id, updates);
  };

  const handleReadToggle = (id: number, currentIsRead: boolean) => {
    updateMessage(id, { isRead: !currentIsRead });
  };

  const handleNotesUpdate = (id: number, notes: string) => {
    updateMessage(id, { adminNotes: notes });
  };

  if (loading) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center', 
        fontSize: '16px', 
        color: '#666' 
      }}>
        Loading support messages...
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      {/* Status Message */}
      {statusMessage && (
        <div style={{
          padding: '10px 15px',
          marginBottom: '20px',
          borderRadius: '4px',
          backgroundColor: isError ? '#f8d7da' : '#d4edda',
          color: isError ? '#721c24' : '#155724',
          border: `1px solid ${isError ? '#f5c6cb' : '#c3e6cb'}`
        }}>
          {statusMessage}
        </div>
      )}

      {/* Statistics */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '15px', 
        marginBottom: '20px' 
      }}>
        <div style={{ 
          backgroundColor: 'white', 
          border: '1px solid #e0e0e0', 
          borderRadius: '8px', 
          padding: '15px' 
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>
            {stats.total}
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>Total Messages</div>
        </div>
        
        <div style={{ 
          backgroundColor: 'white', 
          border: '1px solid #e0e0e0', 
          borderRadius: '8px', 
          padding: '15px' 
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f57c00' }}>
            {stats.open}
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>Open</div>
        </div>
        
        <div style={{ 
          backgroundColor: 'white', 
          border: '1px solid #e0e0e0', 
          borderRadius: '8px', 
          padding: '15px' 
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#d32f2f' }}>
            {stats.unread}
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>Unread</div>
        </div>
        
        <div style={{ 
          backgroundColor: 'white', 
          border: '1px solid #e0e0e0', 
          borderRadius: '8px', 
          padding: '15px' 
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#388e3c' }}>
            {stats.resolved}
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>Resolved</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ 
        backgroundColor: 'white', 
        border: '1px solid #e0e0e0', 
        borderRadius: '8px' 
      }}>
        <div style={{ 
          padding: '15px', 
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: '#f8f9fa'
        }}>
          <h2 style={{ margin: '0 0 5px 0', fontSize: '18px' }}>Support Messages</h2>
          <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
            Manage customer support requests
          </p>
        </div>

        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
          {messages.map((message, index) => (
            <MessageCard
              key={message.id}
              message={message}
              onStatusChange={handleStatusChange}
              onReadToggle={handleReadToggle}
              onNotesUpdate={handleNotesUpdate}
              onDelete={deleteMessage}
              isLast={index === messages.length - 1}
            />
          ))}
          
          {messages.length === 0 && (
            <div style={{ 
              padding: '40px', 
              textAlign: 'center',
              color: '#666'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>📧</div>
              <div style={{ fontSize: '18px', fontWeight: '500', marginBottom: '5px' }}>
                No support messages
              </div>
              <div style={{ fontSize: '14px' }}>
                Messages from the contact form will appear here
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Refresh Button */}
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <button
          onClick={fetchMessages}
          style={{
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#5a6268'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#6c757d'}
        >
          🔄 Refresh Messages
        </button>
      </div>
    </div>
  );
}

interface MessageCardProps {
  message: SupportMessage;
  onStatusChange: (id: number, status: string) => void;
  onReadToggle: (id: number, isRead: boolean) => void;
  onNotesUpdate: (id: number, notes: string) => void;
  onDelete: (id: number) => void;
  isLast: boolean;
}

function MessageCard({ message, onStatusChange, onReadToggle, onNotesUpdate, onDelete, isLast }: MessageCardProps) {
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState(message.adminNotes || '');

  const handleSaveNotes = () => {
    onNotesUpdate(message.id, notes);
    setShowNotes(false);
  };

  const handleCancelNotes = () => {
    setNotes(message.adminNotes || '');
    setShowNotes(false);
  };

  return (
    <>
      <div style={{ 
        padding: '15px',
        backgroundColor: !message.isRead ? '#e3f2fd' : 'white',
        borderLeft: !message.isRead ? '4px solid #2196f3' : 'none'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '10px' }}>
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            alignItems: 'center', 
            gap: '8px',
            marginBottom: '8px'
          }}>
            <span style={{ fontWeight: '500' }}>{message.name}</span>
            <span style={{ 
              fontSize: '12px', 
              backgroundColor: '#f5f5f5',
              padding: '2px 6px',
              borderRadius: '3px'
            }}>
              {message.email}
            </span>
            <span style={{ 
              fontSize: '12px',
              backgroundColor: message.priority === 'urgent' ? '#ffebee' : 
                            message.priority === 'high' ? '#fff3e0' : '#f5f5f5',
              color: message.priority === 'urgent' ? '#c62828' : 
                     message.priority === 'high' ? '#ef6c00' : '#424242',
              padding: '2px 6px',
              borderRadius: '3px'
            }}>
              {message.priority.toUpperCase()}
            </span>
            <span style={{ 
              fontSize: '12px',
              backgroundColor: message.status === 'resolved' ? '#e8f5e8' : 
                            message.status === 'in_progress' ? '#fff3e0' : '#ffebee',
              color: message.status === 'resolved' ? '#2e7d32' : 
                     message.status === 'in_progress' ? '#ef6c00' : '#c62828',
              padding: '2px 6px',
              borderRadius: '3px'
            }}>
              {message.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          
          <div style={{ fontWeight: '500', marginBottom: '5px' }}>
            {message.subject}
          </div>
          
          <div style={{ 
            fontSize: '14px', 
            color: '#666', 
            marginBottom: '8px',
            lineHeight: '1.4'
          }}>
            {message.message.length > 150 ? 
              `${message.message.substring(0, 150)}...` : 
              message.message
            }
          </div>
          
          <div style={{ fontSize: '12px', color: '#999' }}>
            📅 {new Date(message.createdAt).toLocaleString()}
            {message.resolvedAt && (
              <span> • ✅ Resolved: {new Date(message.resolvedAt).toLocaleString()}</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          paddingTop: '10px',
          borderTop: '1px solid #eee'
        }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => onReadToggle(message.id, message.isRead)}
              style={{
                backgroundColor: 'white',
                border: '1px solid #ddd',
                padding: '6px 10px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              {message.isRead ? '👁️ Unread' : '👁️‍🗨️ Read'}
            </button>
            
            <button
              onClick={() => setShowNotes(true)}
              style={{
                backgroundColor: 'white',
                border: '1px solid #ddd',
                padding: '6px 10px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              📝 Notes
            </button>
            
            <button
              onClick={() => onDelete(message.id)}
              style={{
                backgroundColor: 'white',
                border: '1px solid #dc3545',
                color: '#dc3545',
                padding: '6px 10px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              🗑️ Delete
            </button>
          </div>

          <select
            value={message.status}
            onChange={(e) => onStatusChange(message.id, e.target.value)}
            style={{
              padding: '4px 8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '12px',
              backgroundColor: 'white'
            }}
          >
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>
      
      {!isLast && <div style={{ height: '1px', backgroundColor: '#eee' }} />}

      {/* Notes Modal */}
      {showNotes && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '20px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '15px'
            }}>
              <h3 style={{ margin: 0 }}>Admin Notes</h3>
              <button
                onClick={handleCancelNotes}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#999'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ 
              backgroundColor: '#f8f9fa',
              padding: '10px',
              borderRadius: '4px',
              marginBottom: '15px'
            }}>
              <div style={{ fontWeight: '500', marginBottom: '5px' }}>
                {message.subject}
              </div>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                From: {message.name} ({message.email})
              </div>
              <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
                {message.message}
              </div>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '5px', 
                fontWeight: '500' 
              }}>
                Admin Notes:
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add your notes here..."
                style={{
                  width: '100%',
                  minHeight: '80px',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: '8px' 
            }}>
              <button
                onClick={handleCancelNotes}
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #ddd',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNotes}
                style={{
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}