'use client';

import React from 'react';
import { Download, FileText, Trash2, CheckCircle2, ShieldCheck, History } from 'lucide-react';

export interface AuditLogEntry {
  sender: 'Deaf User' | 'Desk Officer';
  text: string;
  time: string;
}

interface Props {
  transcripts: AuditLogEntry[];
  onClear: () => void;
  deploymentContext?: string;
}

export default function TranscriptAuditLogger({
  transcripts,
  onClear,
  deploymentContext = 'General Helpdesk',
}: Props) {
  const exportLog = () => {
    if (transcripts.length === 0) return;
    const content = [
      '====================================================',
      'SIGNBRIDGE INSTITUTIONAL ACCESSIBILITY SESSION LOG',
      `Generated: ${new Date().toLocaleString()}`,
      `Deployment Domain: ${deploymentContext.toUpperCase()}`,
      'Platform: SignBridge Client-Side Edge System (Air-Gapped)',
      'Security: 100% Local Inference (0 Network Egress)',
      '====================================================\n',
      ...transcripts.map((t) => `[${t.time}] ${t.sender.toUpperCase()}: ${t.text}`),
      '\n====================================================',
      `Total Recorded Dialogue Entries: ${transcripts.length}`,
      'End of Interaction Log',
      '====================================================',
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SignBridge-Session-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col gap-3.5 shadow-2xl backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
              Interaction Audit Log ({transcripts.length} Entries)
            </h4>
            <p className="text-[10px] text-slate-400 font-mono">
              Full-duplex transcript recording for compliance & accessibility auditing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {transcripts.length > 0 && (
            <button
              onClick={onClear}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium transition-all cursor-pointer"
              title="Clear Session Audit Log"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}

          <button
            onClick={exportLog}
            disabled={transcripts.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-600/20 cursor-pointer disabled:cursor-not-allowed"
            title="Download formatted text transcript"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Log (.txt)</span>
          </button>
        </div>
      </div>

      <div className="max-h-48 overflow-y-auto flex flex-col gap-2 p-3 rounded-xl bg-slate-950/70 border border-white/5 font-sans">
        {transcripts.length === 0 ? (
          <div className="text-[11px] text-slate-500 italic text-center py-6 flex flex-col items-center gap-1.5">
            <History className="w-4 h-4 text-slate-600" />
            <span>No dialogue recorded yet. Active sign translations and officer responses will log here automatically.</span>
          </div>
        ) : (
          transcripts.map((item, idx) => (
            <div
              key={idx}
              className="text-xs flex items-start gap-2.5 p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
            >
              <span className="text-[10px] font-mono text-slate-500 mt-0.5 shrink-0">
                [{item.time}]
              </span>
              <span
                className={`font-semibold shrink-0 px-1.5 py-0.5 rounded text-[10px] uppercase font-mono ${
                  item.sender === 'Deaf User'
                    ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
                    : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                }`}
              >
                {item.sender}
              </span>
              <span className="text-slate-200 leading-relaxed font-sans break-words">{item.text}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export { TranscriptAuditLogger };
