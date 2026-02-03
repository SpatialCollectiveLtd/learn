'use client';

import { useEffect, useState } from 'react';
import { 
  MessageCircle,
  Send,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  X,
  Upload,
  AlertCircle,
  RefreshCw,
  MessageSquare
} from 'lucide-react';

interface QueryMessage {
  message_id: string;
  sender: 'youth' | 'admin';
  message: string;
  timestamp: string;
}

interface Query {
  query_id: string;
  category: string;
  subject: string;
  message: string;
  priority: string;
  status: 'pending' | 'in_progress' | 'resolved';
  submitted_at: string;
  resolved_at?: string;
  resolution_notes?: string;
  attachments: Array<{
    filename: string;
    url: string;
    uploaded_at: string;
  }>;
  messages: QueryMessage[];
}

interface QueriesData {
  youth_id: string;
  settlement: string;
  total_queries: number;
  pending_queries: number;
  queries: Query[];
}

const QUERY_CATEGORIES = [
  { value: 'payment', label: 'Payment Issue' },
  { value: 'technical', label: 'Technical Problem' },
  { value: 'odk', label: 'ODK App Issue' },
  { value: 'general', label: 'General Question' },
];

const PRIORITY_LEVELS = [
  { value: 'low', label: 'Low', color: 'text-info' },
  { value: 'medium', label: 'Medium', color: 'text-warning' },
  { value: 'high', label: 'High', color: 'text-error' },
];

export default function ResolveCenterTab() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [queriesData, setQueriesData] = useState<QueriesData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showNewQueryForm, setShowNewQueryForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    category: 'payment',
    subject: '',
    message: '',
    priority: 'medium',
  });

  useEffect(() => {
    fetchQueries();
  }, []);

  const fetchQueries = async () => {
    try {
      setError(null);
      const token = localStorage.getItem('youthToken');
      if (!token) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch('/api/youth/queries', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const result = await response.json();

      if (result.success) {
        setQueriesData(result.data);
      } else {
        setError(result.error?.message || 'Failed to load queries');
      }
    } catch (err: any) {
      console.error('Queries fetch error:', err);
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchQueries();
  };

  const handleSubmitQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subject.trim() || !formData.message.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('youthToken');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/youth/queries/submit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        // Reset form
        setFormData({
          category: 'payment',
          subject: '',
          message: '',
          priority: 'medium',
        });
        setShowNewQueryForm(false);
        
        // Refresh queries list
        fetchQueries();
      } else {
        alert(result.error?.message || 'Failed to submit query');
      }
    } catch (err: any) {
      console.error('Query submit error:', err);
      alert(err.message || 'Failed to submit query');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-warning" />;
      case 'in_progress': return <AlertTriangle className="w-4 h-4 text-info" />;
      case 'resolved': return <CheckCircle className="w-4 h-4 text-success" />;
      default: return <MessageCircle className="w-4 h-4 text-foreground-subtle" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning/10 text-warning border-warning/30';
      case 'in_progress': return 'bg-info/10 text-info border-info/30';
      case 'resolved': return 'bg-success/10 text-success border-success/30';
      default: return 'bg-foreground-subtle/10 text-foreground-subtle border-border';
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-foreground-subtle text-sm">Loading queries...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-error/10 border border-error/30 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-error mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-white mb-1">Error Loading Queries</p>
            <p className="text-xs text-foreground-muted">{error}</p>
            <button
              onClick={handleRefresh}
              className="mt-3 text-xs text-primary hover:text-primary-hover"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header with New Query Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-heading font-bold text-white">Resolve Center</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 hover:bg-background-elevated rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-primary ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowNewQueryForm(!showNewQueryForm)}
            className="px-3 py-2 bg-primary hover:bg-primary-hover rounded-lg flex items-center gap-2 text-white text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Query</span>
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      {queriesData && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-background-elevated border border-border rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-white">{queriesData.total_queries}</p>
            <p className="text-xs text-foreground-subtle">Total Queries</p>
          </div>
          <div className="bg-background-elevated border border-border rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-warning">{queriesData.pending_queries}</p>
            <p className="text-xs text-foreground-subtle">Pending</p>
          </div>
        </div>
      )}

      {/* New Query Form */}
      {showNewQueryForm && (
        <div className="bg-background-elevated border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Submit New Query</h3>
            <button
              onClick={() => setShowNewQueryForm(false)}
              className="p-1 hover:bg-background rounded transition-colors"
            >
              <X className="w-4 h-4 text-foreground-subtle" />
            </button>
          </div>
          
          <form onSubmit={handleSubmitQuery} className="space-y-3">
            <div>
              <label className="block text-xs text-foreground-subtle mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-white focus:outline-none focus:border-primary"
              >
                {QUERY_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-foreground-subtle mb-1">Subject</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Brief summary of your issue"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-white placeholder:text-foreground-subtle focus:outline-none focus:border-primary"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-foreground-subtle mb-1">Message</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Describe your issue in detail..."
                rows={4}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-white placeholder:text-foreground-subtle focus:outline-none focus:border-primary resize-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-foreground-subtle mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-white focus:outline-none focus:border-primary"
              >
                {PRIORITY_LEVELS.map(level => (
                  <option key={level.value} value={level.value}>{level.label}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full px-4 py-2 bg-primary hover:bg-primary-hover disabled:bg-foreground-subtle disabled:cursor-not-allowed rounded-lg flex items-center justify-center gap-2 text-white text-sm font-semibold transition-colors"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Query</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Queries List */}
      {queriesData && queriesData.queries.length > 0 ? (
        <div className="space-y-3">
          {queriesData.queries.map((query) => (
            <div
              key={query.query_id}
              className="bg-background-elevated border border-border rounded-lg p-4 hover:border-primary/30 transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {getStatusIcon(query.status)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-semibold text-white truncate">{query.subject}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border whitespace-nowrap ${getStatusColor(query.status)}`}>
                      {query.status.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <p className="text-xs text-foreground-subtle mb-2 line-clamp-2">{query.message}</p>
                  
                  <div className="flex items-center gap-3 text-xs text-foreground-subtle">
                    <span>{query.category}</span>
                    <span>•</span>
                    <span>{new Date(query.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                    {query.messages.length > 0 && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {query.messages.length}
                        </span>
                      </>
                    )}
                  </div>
                  
                  {query.status === 'resolved' && query.resolution_notes && (
                    <div className="mt-2 pt-2 border-t border-border">
                      <p className="text-xs text-success font-semibold mb-1">Resolved:</p>
                      <p className="text-xs text-foreground-muted">{query.resolution_notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <MessageCircle className="w-12 h-12 text-foreground-subtle mx-auto mb-3" />
          <p className="text-foreground-subtle text-sm mb-4">No queries yet</p>
          <button
            onClick={() => setShowNewQueryForm(true)}
            className="px-4 py-2 bg-primary hover:bg-primary-hover rounded-lg text-white text-sm font-semibold transition-colors"
          >
            Submit Your First Query
          </button>
        </div>
      )}
    </div>
  );
}
