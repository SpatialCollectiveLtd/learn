'use client';

import { useState } from 'react';
import { Download, Users, Flag } from 'lucide-react';

const SETTLEMENTS = ['Kayole Soweto', 'Kariobangi Machakos', 'Mji wa Huruma'];
const MODULES = [
  { value: 'digitization', label: 'Digitization' },
  { value: 'mobile_mapping', label: 'Mobile Mapping' },
  { value: 'household_survey', label: 'Household Survey' },
  { value: 'microtasking', label: 'Microtasking' },
];

export default function AdminReportsPage() {
  const [youthSettlement, setYouthSettlement] = useState('');
  const [youthModule, setYouthModule] = useState('');
  const [youthDownloading, setYouthDownloading] = useState(false);

  const [dispSettlement, setDispSettlement] = useState('');
  const [dispStatus, setDispStatus] = useState('');
  const [dispDownloading, setDispDownloading] = useState(false);

  const download = async (
    params: URLSearchParams,
    setDownloading: (v: boolean) => void
  ) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setDownloading(true);
    try {
      const res = await fetch(`/api/admin/export?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        alert(err?.error?.message ?? 'Export failed. Please try again.');
        return;
      }

      const disposition = res.headers.get('Content-Disposition') ?? '';
      const filenameMatch = disposition.match(/filename="([^"]+)"/);
      const filename = filenameMatch?.[1] ?? 'export.csv';

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Download failed. Check your connection and try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleYouthExport = () => {
    const params = new URLSearchParams({ type: 'youth' });
    if (youthSettlement) params.set('settlement', youthSettlement);
    if (youthModule) params.set('module', youthModule);
    download(params, setYouthDownloading);
  };

  const handleDisputesExport = () => {
    const params = new URLSearchParams({ type: 'disputes' });
    if (dispSettlement) params.set('settlement', dispSettlement);
    if (dispStatus) params.set('status', dispStatus);
    download(params, setDispDownloading);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-white mb-1">Reports</h1>
        <p className="text-[#a3a3a3]">Download CSV exports for platform data</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Youth List Export */}
        <div className="bg-[#1F2121] border border-[#262626] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="bg-[#dc2626]/20 p-2.5 rounded-xl border border-[#dc2626]/30">
              <Users className="w-5 h-5 text-[#dc2626]" />
            </div>
            <div>
              <h2 className="text-white font-semibold">Youth List</h2>
              <p className="text-xs text-[#737373]">All youth participants with their details</p>
            </div>
          </div>

          <div className="space-y-3 mb-5">
            <div>
              <label className="block text-xs text-[#737373] uppercase font-medium mb-1">Settlement</label>
              <select
                value={youthSettlement}
                onChange={(e) => setYouthSettlement(e.target.value)}
                className="w-full px-3 py-2 bg-black border border-[#2a2a2a] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#dc2626]"
              >
                <option value="">All Settlements</option>
                {SETTLEMENTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-[#737373] uppercase font-medium mb-1">Module</label>
              <select
                value={youthModule}
                onChange={(e) => setYouthModule(e.target.value)}
                className="w-full px-3 py-2 bg-black border border-[#2a2a2a] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#dc2626]"
              >
                <option value="">All Modules</option>
                {MODULES.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          <p className="text-xs text-[#525252] mb-4">
            Includes: Youth ID, Name, Settlement, Module, Assignment, OSM Username, Active status, Enrolment date
          </p>

          <button
            onClick={handleYouthExport}
            disabled={youthDownloading}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-[#dc2626] hover:bg-[#b91c1c] disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <Download className="w-4 h-4" />
            {youthDownloading ? 'Preparing…' : 'Download CSV'}
          </button>
        </div>

        {/* Disputes Export */}
        <div className="bg-[#1F2121] border border-[#262626] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="bg-yellow-500/10 p-2.5 rounded-xl border border-yellow-500/20">
              <Flag className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold">Payment Disputes</h2>
              <p className="text-xs text-[#737373]">All disputes with resolution details</p>
            </div>
          </div>

          <div className="space-y-3 mb-5">
            <div>
              <label className="block text-xs text-[#737373] uppercase font-medium mb-1">Settlement</label>
              <select
                value={dispSettlement}
                onChange={(e) => setDispSettlement(e.target.value)}
                className="w-full px-3 py-2 bg-black border border-[#2a2a2a] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#dc2626]"
              >
                <option value="">All Settlements</option>
                {SETTLEMENTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-[#737373] uppercase font-medium mb-1">Status</label>
              <select
                value={dispStatus}
                onChange={(e) => setDispStatus(e.target.value)}
                className="w-full px-3 py-2 bg-black border border-[#2a2a2a] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#dc2626]"
              >
                <option value="">All Statuses</option>
                <option value="open">Open</option>
                <option value="resolved">Resolved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <p className="text-xs text-[#525252] mb-4">
            Includes: Youth ID, Name, Settlement, Date, Module, Issue, Amounts, Status, Resolution note
          </p>

          <button
            onClick={handleDisputesExport}
            disabled={dispDownloading}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-[#dc2626] hover:bg-[#b91c1c] disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <Download className="w-4 h-4" />
            {dispDownloading ? 'Preparing…' : 'Download CSV'}
          </button>
        </div>
      </div>
    </div>
  );
}
