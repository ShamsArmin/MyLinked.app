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
  adminNotes?: string | null;
}

export function UltraSimpleSupport() {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");

  const loadData = async () => {
    try {
      const response = await fetch('/api/support/messages', {
        credentials: 'include',
      });
      const data = await response.json();
      setMessages(data);
      setFeedback(`✅ Loaded ${data.length} messages successfully`);
      setTimeout(() => setFeedback(""), 2000);
    } catch (error) {
      setFeedback("❌ Error loading messages");
      setTimeout(() => setFeedback(""), 2000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateStatus = async (id: number, status: string) => {
    try {
      const response = await fetch(`/api/support/messages/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
        credentials: 'include',
      });
      
      if (response.ok) {
        await loadData();
        setFeedback(`✅ Status updated to ${status}`);
        setTimeout(() => setFeedback(""), 2000);
      } else {
        setFeedback("❌ Failed to update status");
        setTimeout(() => setFeedback(""), 2000);
      }
    } catch (error) {
      setFeedback("❌ Network error");
      setTimeout(() => setFeedback(""), 2000);
    }
  };

  const toggleRead = async (id: number, currentRead: boolean) => {
    try {
      const response = await fetch(`/api/support/messages/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: !currentRead }),
        credentials: 'include',
      });
      
      if (response.ok) {
        await loadData();
        setFeedback(`✅ Marked as ${!currentRead ? 'read' : 'unread'}`);
        setTimeout(() => setFeedback(""), 2000);
      } else {
        setFeedback("❌ Failed to toggle read status");
        setTimeout(() => setFeedback(""), 2000);
      }
    } catch (error) {
      setFeedback("❌ Network error");
      setTimeout(() => setFeedback(""), 2000);
    }
  };

  const deleteMsg = async (id: number) => {
    if (!confirm(`Delete message ${id}?`)) return;
    
    try {
      const response = await fetch(`/api/support/messages/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (response.ok) {
        await loadData();
        setFeedback(`✅ Message ${id} deleted`);
        setTimeout(() => setFeedback(""), 2000);
      } else {
        setFeedback("❌ Failed to delete");
        setTimeout(() => setFeedback(""), 2000);
      }
    } catch (error) {
      setFeedback("❌ Network error");
      setTimeout(() => setFeedback(""), 2000);
    }
  };

  const addNotes = async (id: number) => {
    const notes = prompt("Enter admin notes:");
    if (!notes) return;
    
    try {
      const response = await fetch(`/api/support/messages/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNotes: notes }),
        credentials: 'include',
      });
      
      if (response.ok) {
        await loadData();
        setFeedback(`✅ Notes added to message ${id}`);
        setTimeout(() => setFeedback(""), 2000);
      } else {
        setFeedback("❌ Failed to add notes");
        setTimeout(() => setFeedback(""), 2000);
      }
    } catch (error) {
      setFeedback("❌ Network error");
      setTimeout(() => setFeedback(""), 2000);
    }
  };

  if (loading) {
    return <div style={{padding: '20px', textAlign: 'center'}}>Loading...</div>;
  }

  const stats = {
    total: messages.length,
    open: messages.filter(m => m.status === 'open').length,
    unread: messages.filter(m => !m.isRead).length,
    resolved: messages.filter(m => m.status === 'resolved').length,
  };

  return (
    <div style={{padding: '20px', fontFamily: 'Arial, sans-serif'}}>
      {/* Feedback */}
      {feedback && (
        <div style={{
          padding: '10px',
          marginBottom: '20px',
          background: feedback.includes('✅') ? '#d4edda' : '#f8d7da',
          color: feedback.includes('✅') ? '#155724' : '#721c24',
          border: '1px solid ' + (feedback.includes('✅') ? '#c3e6cb' : '#f5c6cb'),
          borderRadius: '4px'
        }}>
          {feedback}
        </div>
      )}

      {/* Stats */}
      <div style={{display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap'}}>
        <div style={{background: 'white', border: '1px solid #ddd', borderRadius: '8px', padding: '15px', minWidth: '120px'}}>
          <div style={{fontSize: '24px', fontWeight: 'bold'}}>{stats.total}</div>
          <div style={{fontSize: '14px', color: '#666'}}>Total</div>
        </div>
        <div style={{background: 'white', border: '1px solid #ddd', borderRadius: '8px', padding: '15px', minWidth: '120px'}}>
          <div style={{fontSize: '24px', fontWeight: 'bold', color: '#f57c00'}}>{stats.open}</div>
          <div style={{fontSize: '14px', color: '#666'}}>Open</div>
        </div>
        <div style={{background: 'white', border: '1px solid #ddd', borderRadius: '8px', padding: '15px', minWidth: '120px'}}>
          <div style={{fontSize: '24px', fontWeight: 'bold', color: '#d32f2f'}}>{stats.unread}</div>
          <div style={{fontSize: '14px', color: '#666'}}>Unread</div>
        </div>
        <div style={{background: 'white', border: '1px solid #ddd', borderRadius: '8px', padding: '15px', minWidth: '120px'}}>
          <div style={{fontSize: '24px', fontWeight: 'bold', color: '#388e3c'}}>{stats.resolved}</div>
          <div style={{fontSize: '14px', color: '#666'}}>Resolved</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{background: 'white', border: '1px solid #ddd', borderRadius: '8px'}}>
        <div style={{padding: '15px', borderBottom: '1px solid #ddd', background: '#f8f9fa'}}>
          <h2 style={{margin: 0}}>Support Messages</h2>
        </div>
        
        <div style={{maxHeight: '500px', overflowY: 'auto'}}>
          {messages.map((msg, index) => (
            <div key={msg.id} style={{
              padding: '15px',
              borderBottom: index < messages.length - 1 ? '1px solid #eee' : 'none',
              background: !msg.isRead ? '#e3f2fd' : 'white'
            }}>
              {/* Message Info */}
              <div style={{marginBottom: '10px'}}>
                <div style={{fontWeight: 'bold', marginBottom: '5px'}}>{msg.subject}</div>
                <div style={{fontSize: '14px', color: '#666', marginBottom: '5px'}}>
                  From: {msg.name} ({msg.email})
                </div>
                <div style={{fontSize: '14px', marginBottom: '8px'}}>
                  {msg.message.substring(0, 100)}...
                </div>
                <div style={{fontSize: '12px', color: '#999'}}>
                  {new Date(msg.createdAt).toLocaleString()}
                </div>
                {msg.adminNotes && (
                  <div style={{fontSize: '12px', color: '#007bff', marginTop: '5px'}}>
                    Notes: {msg.adminNotes}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center'}}>
                <button 
                  onClick={() => updateStatus(msg.id, 'open')}
                  style={{
                    background: msg.status === 'open' ? '#007bff' : '#6c757d',
                    color: 'white',
                    border: 'none',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Open
                </button>
                
                <button 
                  onClick={() => updateStatus(msg.id, 'in_progress')}
                  style={{
                    background: msg.status === 'in_progress' ? '#f57c00' : '#6c757d',
                    color: 'white',
                    border: 'none',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  In Progress
                </button>
                
                <button 
                  onClick={() => updateStatus(msg.id, 'resolved')}
                  style={{
                    background: msg.status === 'resolved' ? '#28a745' : '#6c757d',
                    color: 'white',
                    border: 'none',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Resolved
                </button>
                
                <button 
                  onClick={() => toggleRead(msg.id, msg.isRead)}
                  style={{
                    background: 'white',
                    color: '#007bff',
                    border: '1px solid #007bff',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  {msg.isRead ? 'Mark Unread' : 'Mark Read'}
                </button>
                
                <button 
                  onClick={() => addNotes(msg.id)}
                  style={{
                    background: 'white',
                    color: '#6c757d',
                    border: '1px solid #6c757d',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Add Notes
                </button>
                
                <button 
                  onClick={() => deleteMsg(msg.id)}
                  style={{
                    background: 'white',
                    color: '#dc3545',
                    border: '1px solid #dc3545',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          
          {messages.length === 0 && (
            <div style={{padding: '40px', textAlign: 'center', color: '#666'}}>
              No support messages found
            </div>
          )}
        </div>
      </div>

      {/* Refresh */}
      <div style={{marginTop: '20px', textAlign: 'center'}}>
        <button
          onClick={loadData}
          style={{
            background: '#6c757d',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Refresh Messages
        </button>
      </div>
    </div>
  );
}