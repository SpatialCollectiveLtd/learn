'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, FileText, CheckCircle2 } from 'lucide-react';

export default function CodeOfConductPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [youthName, setYouthName] = useState('');
  const [youthId, setYouthId] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('youthToken');
    const youthData = localStorage.getItem('youthData');
    
    if (!token || !youthData) {
      router.push('/');
      return;
    }

    try {
      const parsed = JSON.parse(youthData);
      
      // Only allow digitization users
      if (parsed.programType !== 'digitization') {
        router.push('/youth/dashboard');
        return;
      }
      
      setYouthName(parsed.fullName || parsed.name);
      setYouthId(parsed.youthId);
      setIsAuthenticated(true);

      // Check if already acknowledged
      const ackKey = `code_conduct_ack_${parsed.youthId}`;
      const hasAcknowledged = localStorage.getItem(ackKey);
      if (hasAcknowledged) {
        setAcknowledged(true);
      }
    } catch {
      router.push('/');
    }
  }, [router]);

  const handleAcknowledge = async () => {
    setLoading(true);
    
    // Record acknowledgment in localStorage
    const ackKey = `code_conduct_ack_${youthId}`;
    const ackData = {
      acknowledgedAt: new Date().toISOString(),
      youthId,
      youthName
    };
    
    localStorage.setItem(ackKey, JSON.stringify(ackData));
    
    // TODO: Could also send to API to record in database
    // await fetch('/api/youth/acknowledge-conduct', { ... });
    
    setTimeout(() => {
      setAcknowledged(true);
      setLoading(false);
    }, 500);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-[#1a1a1a] border-b border-[#2a2a2a] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/youth/dashboard')}
              className="flex items-center gap-2 text-[#a3a3a3] hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </button>
            
            <div className="text-right">
              <p className="text-xs text-[#a3a3a3]">Digitization Program</p>
              <p className="text-white font-semibold text-sm">{youthName}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Title Section */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-primary/20 p-3 rounded-lg">
              <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-heading font-bold text-white">
                Youth Code of Conduct
              </h1>
              <p className="text-[#a3a3a3] text-sm sm:text-base mt-1">
                Required reading for all digitization team members
              </p>
            </div>
          </div>
        </div>

        {/* Download Button */}
        <div className="mb-6">
          <a
            href="/documents/youth-code-of-conduct.pdf"
            download="Youth_Code_of_Conduct.pdf"
            className="inline-flex items-center gap-2 bg-[#1a1a1a] hover:bg-[#252525] text-white px-4 py-2 rounded-lg border border-[#2a2a2a] transition-colors text-sm sm:text-base"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </a>
        </div>

        {/* PDF Viewer */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#2a2a2a]">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Document Viewer
            </h2>
          </div>
          
          {/* Responsive PDF embed - works on most devices */}
          <div className="relative w-full" style={{ minHeight: '70vh' }}>
            <iframe
              src="/documents/youth-code-of-conduct.pdf#view=FitH"
              className="w-full h-full absolute inset-0"
              style={{ minHeight: '70vh', border: 'none' }}
              title="Youth Code of Conduct"
            />
          </div>
        </div>

        {/* Acknowledgment Section */}
        <div className="mt-6 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 sm:p-6">
          {!acknowledged ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-5 h-5 rounded-full border-2 border-[#a3a3a3]"></div>
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold mb-2">Acknowledgment Required</p>
                  <p className="text-[#a3a3a3] text-sm">
                    I have read and understood the Youth Code of Conduct. I agree to follow these guidelines 
                    throughout my participation in the digitization program.
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleAcknowledge}
                disabled={loading}
                className="w-full sm:w-auto px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>I Acknowledge & Agree</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-success">
              <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
              <div>
                <p className="font-semibold">Code of Conduct Acknowledged</p>
                <p className="text-sm text-[#a3a3a3]">
                  Thank you for reviewing and acknowledging the code of conduct
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Notice */}
        <div className="mt-4 bg-warning/10 border border-warning/30 rounded-lg p-4 sm:hidden">
          <p className="text-warning text-sm">
            <strong>Tip:</strong> If the PDF doesn't display properly on your device, 
            use the download button above to view it in your PDF reader app.
          </p>
        </div>
      </div>
    </div>
  );
}
