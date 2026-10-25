import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  PlusCircle,
  UserPlus,
  Bot,
  Sparkles,
  Clock,
  Activity,
} from 'lucide-react';
import type { Project, ProjectActivity, ActivityType } from '../../types/index.ts';
import { subscribeProjectActivities, formatRelativeTime } from '../../services/activityService.ts';

interface RecentActivityPanelProps {
  project: Project;
}

export function RecentActivityPanel({ project }: RecentActivityPanelProps) {
  const [activities, setActivities] = useState<ProjectActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'tasks' | 'team' | 'ai'>('all');

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeProjectActivities(
      project.id,
      (list) => {
        setActivities(list);
        setLoading(false);
      },
      (err) => {
        console.error('Activity stream error:', err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [project.id]);

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'task_completed':
        return (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 border border-emerald-200 shrink-0 shadow-xs">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        );
      case 'task_created':
      case 'task_status_changed':
        return (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 border border-indigo-200 shrink-0 shadow-xs">
            <PlusCircle className="h-4 w-4" />
          </div>
        );
      case 'member_invited':
      case 'member_joined':
        return (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-600 border border-violet-200 shrink-0 shadow-xs">
            <UserPlus className="h-4 w-4" />
          </div>
        );
      case 'chat_summarized':
        return (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-sky-600 border border-sky-200 shrink-0 shadow-xs">
            <Bot className="h-4 w-4" />
          </div>
        );
      case 'tasks_extracted':
        return (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600 border border-amber-200 shrink-0 shadow-xs">
            <Sparkles className="h-4 w-4" />
          </div>
        );
      default:
        return (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 shrink-0">
            <Activity className="h-4 w-4" />
          </div>
        );
    }
  };

  const filteredActivities = activities.filter((act) => {
    if (filterType === 'all') return true;
    if (filterType === 'tasks') {
      return act.type === 'task_completed' || act.type === 'task_created' || act.type === 'task_status_changed';
    }
    if (filterType === 'team') {
      return act.type === 'member_invited' || act.type === 'member_joined';
    }
    if (filterType === 'ai') {
      return act.type === 'chat_summarized' || act.type === 'tasks_extracted';
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-500 to-indigo-600 text-white shadow-md shadow-violet-500/20">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Recent Project Activity</h2>
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" title="Live Firestore Stream" />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time audit log of task updates, collaborator invitations, and Gemini AI operations.
            </p>
          </div>
        </div>

        {/* Filter Segmented Control */}
        <div className="flex items-center gap-1 rounded-2xl bg-slate-100 p-1 text-xs font-bold">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              filterType === 'all'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({activities.length})
          </button>
          <button
            onClick={() => setFilterType('tasks')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              filterType === 'tasks'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tasks
          </button>
          <button
            onClick={() => setFilterType('team')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              filterType === 'team'
                ? 'bg-white text-violet-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Team
          </button>
          <button
            onClick={() => setFilterType('ai')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              filterType === 'ai'
                ? 'bg-white text-amber-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            AI Actions
          </button>
        </div>
      </div>

      {/* Main Activity Timeline */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-7 shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent mb-2" />
            <span>Streaming project activity from Firestore...</span>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            <Clock className="mx-auto h-8 w-8 text-slate-300 mb-2" />
            <p className="font-bold text-slate-700">No activity logged yet</p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              Actions such as marking tasks completed, inviting teammates, or running AI summaries will appear here in chronological order.
            </p>
          </div>
        ) : (
          <div className="relative pl-4 sm:pl-6 space-y-6 before:absolute before:left-[21px] sm:before:left-[29px] before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200">
            {filteredActivities.map((act) => (
              <div key={act.id} className="relative flex items-start gap-4 group">
                {/* Node Icon */}
                <div className="relative z-10">{getActivityIcon(act.type)}</div>

                {/* Content Box */}
                <div className="flex-1 min-w-0 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 hover:border-indigo-200 hover:bg-white transition-all shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                    <p className="font-bold text-slate-900 leading-snug">{act.title}</p>
                    <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap">
                      {formatRelativeTime(act.createdAt)}
                    </span>
                  </div>

                  {act.description && (
                    <p className="mt-1 text-xs text-slate-600 leading-relaxed break-words">
                      {act.description}
                    </p>
                  )}

                  <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-200/60 font-medium">
                    <span className="font-bold text-slate-800">{act.actorName}</span>
                    {act.actorEmail && (
                      <>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span className="truncate max-w-[180px] text-slate-500">{act.actorEmail}</span>
                      </>
                    )}
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="capitalize text-indigo-600 font-semibold">{act.type.replace(/_/g, ' ')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
