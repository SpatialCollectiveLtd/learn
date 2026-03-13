'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Mail,
  Inbox,
  Send,
  FileText,
  Trash2,
  RefreshCw,
  ArrowLeft,
  Eye,
  Download,
  Clock,
  User,
  Settings,
  Copy,
  Check,
  Lightbulb,
} from 'lucide-react';


function processEmailBody(body: string): string {
  if (!body) return '';
  
  
  const hasHtml = /<[a-z][\s\S]*>/i.test(body);
  
  let processed = body;
  
  
  if (!hasHtml) {
    
    processed = processed
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    
    
    const urlRegex = /(https?:\/\/[^\s<>"]+|www\.[^\s<>"]+)/gi;
    processed = processed.replace(urlRegex, (url) => {
      const href = url.startsWith('www.') ? `https://${url}` : url;
      return `<a href="${href}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    });
    
    
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
    processed = processed.replace(emailRegex, '<a href="mailto:$1">$1</a>');
    
    
    processed = processed.replace(/\r?\n/g, '<br>');
    
    
    processed = `<p>${processed}</p>`;
  } else {
    
    
    
    
    
    processed = processed.replace(
      /<a\s+([^>]*href="[^"]*"[^>]*)>/gi, 
      (match, attrs) => {
        if (!attrs.includes('target=')) {
          return `<a ${attrs} target="_blank" rel="noopener noreferrer">`;
        }
        return match;
      }
    );
  }
  
  return processed;
}

interface Email {
  id: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  is_read: boolean;
  preview: string;
}

interface EmailDetail {
  id: string;
  from: string;
  to: string;
  cc: string;
  subject: string;
  date: string;
  body: string;
  attachments: Array<{
    filename: string;
    content_type: string;
    size: number;
  }>;
}

export default function MessagesPage() {
  const router = useRouter();
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentFolder, setCurrentFolder] = useState('INBOX');
  const [folders, setFolders] = useState<string[]>(['INBOX', 'Sent', 'Drafts', 'Trash']);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasEmail, setHasEmail] = useState(true);
  const [workEmail, setWorkEmail] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [youthId, setYouthId] = useState<string>('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const youthData = localStorage.getItem('youthData');

    if (!token || !youthData) {
      router.push('/');
      return;
    }

    const parsed = JSON.parse(youthData);
    setYouthId(parsed.youthId || '');

    fetchFolders();
    fetchEmails();
    fetchUnreadCount();
  }, [router, currentFolder]);

  const fetchFolders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/messages/folders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success && data.data.folders) {
        setFolders(data.data.folders);
      }
    } catch (error) {
      
    }
  };

  const fetchEmails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/messages/inbox?folder=${currentFolder}&limit=50`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();

      if (!data.success) {
        if (data.hasEmail === false) {
          setHasEmail(false);
        }
        setEmails([]);
        return;
      }

      setEmails(data.data.emails || []);
      setWorkEmail(data.data.workEmail || '');
      setHasEmail(true);
    } catch (error) {
      
      setEmails([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/messages/unread-count', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success && data.data.hasEmail) {
        setUnreadCount(data.data.unreadCount || 0);
      }
    } catch (error) {
      
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchEmails();
    fetchUnreadCount();
  };

  const handleEmailClick = async (email: Email) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/messages/${email.id}?folder=${currentFolder}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();

      if (data.success) {
        setSelectedEmail(data.data);
        
        setTimeout(() => fetchEmails(), 500);
        setTimeout(() => fetchUnreadCount(), 500);
      }
    } catch (error) {
      
    }
  };

  const copyPassword = () => {
    navigator.clipboard.writeText('DPW2026Map!');
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2000);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const getFolderIcon = (folder: string) => {
    switch (folder.toLowerCase()) {
      case 'inbox':
        return <Inbox className="w-4 h-4" />;
      case 'sent':
        return <Send className="w-4 h-4" />;
      case 'drafts':
        return <FileText className="w-4 h-4" />;
      case 'trash':
        return <Trash2 className="w-4 h-4" />;
      default:
        return <Mail className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#dc2626]"></div>
          <p className="mt-4 text-[#e5e5e5]">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (!hasEmail) {
    return (
      <div className="min-h-screen bg-black py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-[#a3a3a3] hover:text-[#dc2626] mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>

          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-12 text-center">
            <Mail className="w-16 h-16 text-[#dc2626] mx-auto mb-4" />
            <h2 className="text-2xl font-heading font-bold text-white mb-2">
              No Work Email Assigned
            </h2>
            <p className="text-[#a3a3a3] mb-6">
              Your @spatialcollective.co.ke email account has not been set up yet.
              <br />
              Please contact your trainer to activate your work email.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 text-[#a3a3a3] hover:text-[#dc2626] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>

            <div>
              <h1 className="text-3xl font-heading font-bold text-white flex items-center gap-3">
                <Mail className="w-8 h-8 text-[#dc2626]" />
                Messages
                {unreadCount > 0 && (
                  <span className="bg-[#dc2626] text-white text-sm px-2 py-1 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </h1>
              <p className="text-[#a3a3a3] text-sm mt-1">{workEmail}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg hover:border-[#dc2626] transition-colors"
              title="Email Settings"
            >
              <Settings className="w-5 h-5 text-[#e5e5e5]" />
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-[#dc2626] text-white rounded-lg hover:bg-[#b91c1c] transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {}
        {showSettings && (
          <div className="mb-6 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
            <h3 className="text-lg font-heading font-bold text-white mb-4">
              Email Credentials
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-[#a3a3a3] block mb-2">Email Address</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={workEmail}
                    readOnly
                    className="flex-1 px-4 py-2 bg-[#262626] border border-[#3a3a3a] rounded-lg text-white"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(workEmail);
                    }}
                    className="p-2 bg-[#262626] border border-[#3a3a3a] rounded-lg hover:border-[#dc2626] transition-colors"
                  >
                    <Copy className="w-4 h-4 text-[#e5e5e5]" />
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm text-[#a3a3a3] block mb-2">Password</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value="DPW2026Map!"
                    readOnly
                    className="flex-1 px-4 py-2 bg-[#262626] border border-[#3a3a3a] rounded-lg text-white font-mono"
                  />
                  <button
                    onClick={copyPassword}
                    className="p-2 bg-[#262626] border border-[#3a3a3a] rounded-lg hover:border-[#dc2626] transition-colors"
                  >
                    {copiedPassword ? (
                      <Check className="w-4 h-4 text-[#22c55e]" />
                    ) : (
                      <Copy className="w-4 h-4 text-[#e5e5e5]" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-[#737373] mt-2 flex items-center gap-1">
                  <Lightbulb className="w-3 h-3" />
                  Use these credentials with any email client (Outlook, Thunderbird, etc.)
                </p>
              </div>
            </div>
          </div>
        )}

        {}
        <div className="grid grid-cols-12 gap-6">
          {}
          <div className="col-span-3">
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
              <h3 className="text-sm font-bold text-[#a3a3a3] uppercase mb-3">Folders</h3>
              <div className="space-y-1">
                {folders.map((folder) => (
                  <button
                    key={folder}
                    onClick={() => {
                      setCurrentFolder(folder);
                      setSelectedEmail(null);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      currentFolder === folder
                        ? 'bg-[#dc2626] text-white'
                        : 'text-[#a3a3a3] hover:bg-[#262626]'
                    }`}
                  >
                    {getFolderIcon(folder)}
                    <span>{folder}</span>
                    {folder === 'INBOX' && unreadCount > 0 && (
                      <span className="ml-auto bg-white text-[#dc2626] text-xs px-2 py-0.5 rounded-full font-bold">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {}
          <div className="col-span-4">
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
              <div className="p-4 border-b border-[#2a2a2a]">
                <h3 className="font-bold text-white">{currentFolder}</h3>
                <p className="text-sm text-[#a3a3a3]">{emails.length} messages</p>
              </div>

              <div className="divide-y divide-[#2a2a2a] max-h-[calc(100vh-300px)] overflow-y-auto">
                {emails.length === 0 ? (
                  <div className="p-8 text-center text-[#a3a3a3]">
                    <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No messages in {currentFolder}</p>
                  </div>
                ) : (
                  emails.map((email) => (
                    <button
                      key={email.id}
                      onClick={() => handleEmailClick(email)}
                      className={`w-full text-left p-4 hover:bg-[#262626] transition-colors ${
                        !email.is_read ? 'bg-[#1f1f1f]' : ''
                      } ${selectedEmail?.id === email.id ? 'border-l-4 border-[#dc2626]' : ''}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-[#a3a3a3]" />
                          <span
                            className={`text-sm ${
                              !email.is_read ? 'font-bold text-white' : 'text-[#a3a3a3]'
                            }`}
                          >
                            {email.from.split('<')[0].trim() || email.from}
                          </span>
                        </div>
                        <span className="text-xs text-[#737373]">{formatDate(email.date)}</span>
                      </div>
                      <h4
                        className={`text-sm mb-1 line-clamp-1 ${
                          !email.is_read ? 'font-bold text-white' : 'text-[#e5e5e5]'
                        }`}
                      >
                        {email.subject || '(No Subject)'}
                      </h4>
                      <p className="text-xs text-[#737373] line-clamp-2">{email.preview}</p>
                      {!email.is_read && (
                        <div className="mt-2">
                          <span className="inline-block bg-[#dc2626] text-white text-xs px-2 py-0.5 rounded">
                            New
                          </span>
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {}
          <div className="col-span-5">
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
              {selectedEmail ? (
                <>
                  <div className="p-6 border-b border-[#2a2a2a]">
                    <div className="flex items-start justify-between mb-4">
                      <h2 className="text-xl font-heading font-bold text-white pr-4">
                        {selectedEmail.subject || '(No Subject)'}
                      </h2>
                      <button
                        onClick={() => setSelectedEmail(null)}
                        className="text-[#a3a3a3] hover:text-white"
                      >
                        Ã—
                      </button>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <span className="text-[#a3a3a3] min-w-[60px]">From:</span>
                        <span className="text-[#e5e5e5]">{selectedEmail.from}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-[#a3a3a3] min-w-[60px]">To:</span>
                        <span className="text-[#e5e5e5]">{selectedEmail.to}</span>
                      </div>
                      {selectedEmail.cc && (
                        <div className="flex items-start gap-2">
                          <span className="text-[#a3a3a3] min-w-[60px]">CC:</span>
                          <span className="text-[#e5e5e5]">{selectedEmail.cc}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#a3a3a3]" />
                        <span className="text-[#a3a3a3]">
                          {new Date(selectedEmail.date).toLocaleString('en-US', {
                            dateStyle: 'full',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>
                    </div>

                    {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
                        <p className="text-sm text-[#a3a3a3] mb-2">
                          {selectedEmail.attachments.length} Attachment(s):
                        </p>
                        <div className="space-y-2">
                          {selectedEmail.attachments.map((att, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 p-2 bg-[#262626] rounded-lg"
                            >
                              <Download className="w-4 h-4 text-[#a3a3a3]" />
                              <div className="flex-1">
                                <p className="text-sm text-[#e5e5e5]">{att.filename}</p>
                                <p className="text-xs text-[#737373]">
                                  {(att.size / 1024).toFixed(2)} KB
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-6 max-h-[calc(100vh-400px)] overflow-y-auto bg-white rounded-lg">
                    <div
                      className="email-body text-[#1a1a1a] text-base leading-relaxed"
                      style={{
                        fontSize: '16px',
                        lineHeight: '1.7',
                        wordBreak: 'break-word',
                      }}
                      dangerouslySetInnerHTML={{ __html: processEmailBody(selectedEmail.body) }}
                    />
                    <style jsx global>{`
                      .email-body a {
                        color: #dc2626 !important;
                        text-decoration: underline !important;
                        word-break: break-all;
                      }
                      .email-body a:hover {
                        color: #b91c1c !important;
                      }
                      .email-body p {
                        margin-bottom: 1em;
                      }
                      .email-body img {
                        max-width: 100%;
                        height: auto;
                      }
                      .email-body table {
                        max-width: 100%;
                        border-collapse: collapse;
                      }
                      .email-body td, .email-body th {
                        padding: 8px;
                        border: 1px solid #e5e5e5;
                      }
                      .email-body blockquote {
                        border-left: 4px solid #dc2626;
                        padding-left: 1em;
                        margin-left: 0;
                        color: #525252;
                      }
                      .email-body ul, .email-body ol {
                        padding-left: 1.5em;
                        margin-bottom: 1em;
                      }
                      .email-body li {
                        margin-bottom: 0.5em;
                      }
                      .email-body pre {
                        background: #f5f5f5;
                        padding: 1em;
                        overflow-x: auto;
                        border-radius: 4px;
                      }
                      .email-body h1, .email-body h2, .email-body h3, .email-body h4 {
                        margin-top: 1em;
                        margin-bottom: 0.5em;
                        font-weight: bold;
                      }
                      .email-body h1 { font-size: 1.5em; }
                      .email-body h2 { font-size: 1.3em; }
                      .email-body h3 { font-size: 1.1em; }
                    `}</style>
                  </div>
                </>
              ) : (
                <div className="p-12 text-center text-[#a3a3a3]">
                  <Eye className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Select a message to read</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
