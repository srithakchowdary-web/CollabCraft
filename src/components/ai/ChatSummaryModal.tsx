import React, { useEffect, useState } from 'react';
import { Bot, X, Check, Copy, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import type { Message, ChatSummaryResult } from '../../types/index.ts';
import { requestChatSummary } from '../../services/aiClientService.ts';
import { logProjectActivity } from '../../services/activityService.ts';

interface ChatSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  messages: Message[];
  projectTitle: string;
}

export function ChatSummaryModal({
  isOpen,
  onClose,
  projectId,
  messages,
  projectTitle,
}: ChatSummaryModalProps) {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [summaryData, setSummaryData] = useState<ChatSummaryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && messages.length > 0) {
      handleGenerate();
    }
  }, [isOpen]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await requestChatSummary(messages, projectTitle);
      setSummaryData(result);

      if (currentUser) {
        await logProjectActivity(projectId, {
          type: 'chat_summarized',
          title: `${currentUser.displayName || 'Team Member'} generated AI chat summary`,
          description: result.summary ? `${result.summary.slice(0, 150)}...` : 'Summarized chat discussion',
          actor: {
            uid: currentUser.uid,
            displayName: currentUser.displayName || undefined,
            email: currentUser.email || undefined,
          },
        });
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to generate chat summary');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!summaryData) return;
    const text = `Executive Summary for ${projectTitle}:\n${summaryData.summary}\n\nKey Points:\n${summaryData.keyPoints.map((k) => `• ${k}`).join('\n')}\n\nDecisions:\n${summaryData.decisions.map((d) => `• ${d}`).join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl max-h-[85vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5 shrink-0">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Gemini AI Chat Summary</h2>
              <span className="text-[11px] text-indigo-600 font-semibold bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                Gemini 2.5 Flash
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Summarizing {messages.length} messages from project "{projectTitle}"
            </p>
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent mb-3" />
              <p className="text-xs font-semibold text-slate-700">
                Synthesizing team discussions via Gemini...
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Extracting key topics, consensus, and next steps
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 flex items-start gap-3">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
              <div>
                <p className="font-semibold">Unable to generate summary</p>
                <p className="mt-0.5 text-rose-600">{error}</p>
                <button
                  onClick={handleGenerate}
                  className="mt-2 text-indigo-600 underline font-semibold hover:text-indigo-800"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {summaryData && !loading && (
            <div className="space-y-4 text-xs">
              {/* Executive Overview */}
              <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-purple-50/40 p-4">
                <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                  Executive Overview
                </h4>
                <p className="text-slate-800 leading-relaxed whitespace-pre-line text-[13px]">
                  {summaryData.summary}
                </p>
              </div>

              {/* Key Points */}
              {summaryData.keyPoints.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                    Key Discussion Points
                  </h4>
                  <ul className="space-y-1.5 list-disc list-inside text-slate-700">
                    {summaryData.keyPoints.map((point, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Decisions */}
              {summaryData.decisions.length > 0 && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
                  <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-2">
                    Decisions & Consensus
                  </h4>
                  <ul className="space-y-1.5 list-disc list-inside text-emerald-800">
                    {summaryData.decisions.map((dec, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {dec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Blockers */}
              {summaryData.blockers && summaryData.blockers.length > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-2">
                    Blockers & Open Inquiries
                  </h4>
                  <ul className="space-y-1.5 list-disc list-inside text-amber-800">
                    {summaryData.blockers.map((b, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 disabled:opacity-40"
          >
            Regenerate Summary
          </button>

          <div className="flex gap-2">
            {summaryData && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied to Clipboard' : 'Copy Summary'}
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 px-5 py-2 text-xs font-bold text-white shadow-md shadow-indigo-500/25 transition-all"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
