import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Search,
  Filter,
  Sparkles,
  Bot,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import type { Message, Project, UserProfile } from '../../types/index.ts';
import {
  sendChatMessage,
  subscribeProjectMessages,
  filterMessagesInBrowser,
} from '../../services/chatService.ts';

interface ChatRoomProps {
  project: Project;
  members: UserProfile[];
  onOpenSummarize: (messages: Message[]) => void;
  onOpenExtractTasks: (messages: Message[]) => void;
}

export function ChatRoom({
  project,
  members,
  onOpenSummarize,
  onOpenExtractTasks,
}: ChatRoomProps) {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);

  // Filters for messages
  const [filterUsername, setFilterUsername] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState<'all' | 'today' | 'last7' | 'last30'>('all');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to real-time Firestore messages
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeProjectMessages(
      project.id,
      (newMsgs) => {
        setMessages(newMsgs);
        setLoading(false);
      },
      (err) => {
        console.error('Chat subscription error:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [project.id]);

  // Auto scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !currentUser || sending) return;

    setSending(true);
    try {
      await sendChatMessage(project.id, inputText, {
        uid: currentUser.uid,
        displayName: currentUser.displayName || undefined,
        email: currentUser.email || undefined,
      });
      setInputText('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const displayedMessages = filterMessagesInBrowser(messages, filterUsername, filterDateRange);
  const hasActiveFilters = filterUsername !== 'all' || filterDateRange !== 'all';

  return (
    <div className="flex flex-col h-[650px] rounded-3xl border border-slate-200/90 bg-white/95 shadow-sm overflow-hidden">
      {/* Top AI Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-3.5">
        <div className="flex items-center gap-2 text-xs">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="font-extrabold text-slate-900 tracking-tight">Team Live Chat</h3>
          <span className="text-slate-400 font-medium">· {messages.length} messages</span>
        </div>

        {/* AI Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenSummarize(messages)}
            disabled={messages.length === 0}
            className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 active:scale-95 disabled:opacity-40 transition-all shadow-2xs"
          >
            <Bot className="h-3.5 w-3.5 text-indigo-600" />
            Summarize Chat
          </button>

          <button
            onClick={() => onOpenExtractTasks(messages)}
            disabled={messages.length === 0}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-indigo-500/20 hover:opacity-95 active:scale-95 disabled:opacity-40 transition-all"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Extract Tasks
          </button>
        </div>
      </div>

      {/* In-Browser Search & Filtering Toolbar */}
      <div className="flex flex-wrap items-center gap-2.5 border-b border-slate-100 bg-slate-50/30 px-5 py-2 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 font-medium shrink-0">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <span>Filter:</span>
        </div>

        {/* Filter by username */}
        <div className="relative">
          <select
            value={filterUsername}
            onChange={(e) => setFilterUsername(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">All Senders</option>
            {members.map((m) => (
              <option key={m.uid} value={m.displayName || m.email}>
                {m.displayName || m.email}
              </option>
            ))}
          </select>
        </div>

        {/* Filter by date range */}
        <div className="relative">
          <select
            value={filterDateRange}
            onChange={(e) => setFilterDateRange(e.target.value as any)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="last7">Last 7 Days</option>
            <option value="last30">Last 30 Days</option>
          </select>
        </div>

        {hasActiveFilters && (
          <button
            onClick={() => {
              setFilterUsername('all');
              setFilterDateRange('all');
            }}
            className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 ml-auto"
          >
            <RotateCcw className="h-3 w-3" />
            Reset filters ({displayedMessages.length} matched)
          </button>
        )}
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full text-xs text-slate-400">
            Connecting to real-time chat...
          </div>
        ) : displayedMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 mb-3 shadow-sm">
              <Search className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-slate-800">
              {hasActiveFilters
                ? 'No messages match your selected filters.'
                : 'No messages yet in this project.'}
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              {hasActiveFilters
                ? 'Try broadening your filter criteria above.'
                : 'Share updates, brainstorm ideas, or delegate tasks with your team!'}
            </p>
          </div>
        ) : (
          displayedMessages.map((msg) => {
            const isMe = msg.senderId === currentUser?.uid;
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[82%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {/* Avatar with colorful gradient */}
                <div className="shrink-0">
                  <div
                    className={`h-8 w-8 rounded-xl flex items-center justify-center text-xs font-black text-white shadow-sm ${
                      isMe
                        ? 'bg-gradient-to-tr from-indigo-600 to-violet-600'
                        : 'bg-gradient-to-tr from-slate-600 to-slate-800'
                    }`}
                  >
                    {msg.senderName.charAt(0).toUpperCase()}
                  </div>
                </div>

                {/* Bubble */}
                <div
                  className={`rounded-2xl px-4 py-2.5 text-xs shadow-xs ${
                    isMe
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-tr-none'
                      : 'bg-slate-100 text-slate-900 border border-slate-200/80 rounded-tl-none'
                  }`}
                >
                  <div
                    className={`flex items-center gap-1.5 mb-1 text-[11px] ${
                      isMe ? 'text-indigo-100 justify-end' : 'text-slate-500 font-medium'
                    }`}
                  >
                    <span className="font-bold">{isMe ? 'You' : msg.senderName}</span>
                    <span aria-hidden="true" className="opacity-60">·</span>
                    <span>
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap leading-relaxed break-words">{msg.text}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSend} className="border-t border-slate-100 bg-slate-50/50 p-3.5">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a team message or action item... (Press Enter to send)"
            className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 shadow-2xs"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || sending}
            className="flex items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-500/20 hover:opacity-95 active:scale-95 disabled:opacity-40 transition-all"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
