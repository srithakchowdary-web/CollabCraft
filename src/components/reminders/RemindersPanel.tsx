import React, { useState, useEffect } from 'react';
import {
  Bell,
  AlertTriangle,
  Clock,
  Send,
  CheckCircle2,
  Calendar,
  RefreshCw,
  Mail,
  Sparkles,
} from 'lucide-react';
import type { Task, Project, TaskReminder } from '../../types/index.ts';
import { checkRemindersApi, sendSimulatedNotification } from '../../services/aiClientService.ts';

interface RemindersPanelProps {
  project: Project;
  tasks: Task[];
}

export function RemindersPanel({ project, tasks }: RemindersPanelProps) {
  const [loading, setLoading] = useState(false);
  const [reminders, setReminders] = useState<TaskReminder[]>([]);
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [dispatchedLogs, setDispatchedLogs] = useState<Array<{ text: string; time: string }>>([]);
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);

  const runDeadlineCheck = async () => {
    setLoading(true);
    try {
      const data = await checkRemindersApi(tasks, project.title, project.id);
      setReminders(data.reminders);
      setLastChecked(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Error checking reminders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDeadlineCheck();
  }, [tasks, project.id]);

  const handleSendNotification = async (reminder: TaskReminder) => {
    setDispatchingId(reminder.taskId);
    try {
      await sendSimulatedNotification(reminder);
      setDispatchedLogs((prev) => [
        {
          text: `Delivered reminder to ${reminder.assigneeEmail || 'team'} for "${reminder.taskTitle}"`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        },
        ...prev,
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setDispatchingId(null);
    }
  };

  const overdue = reminders.filter((r) => r.urgency === 'overdue');
  const dueToday = reminders.filter((r) => r.urgency === 'due_today');
  const dueSoon = reminders.filter((r) => r.urgency === 'due_soon');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-md p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-orange-400 text-white shadow-md shadow-amber-500/20">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Scheduled Deadline & Reminder Engine
              <span className="rounded-md bg-amber-50 border border-amber-200/60 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                Automated Cloud Schedule
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Evaluates task deadlines, alerts collaborators, and notifies assignees of overdue items.
              {lastChecked && ` · Last checked: ${lastChecked}`}
            </p>
          </div>
        </div>

        <button
          onClick={runDeadlineCheck}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-sm shrink-0"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          Run Check Now
        </button>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-rose-200/80 bg-gradient-to-br from-rose-50/80 to-pink-50/50 p-4 shadow-sm">
          <div className="flex items-center justify-between text-rose-700 text-xs mb-1 font-semibold">
            <span>Overdue Tasks</span>
            <AlertTriangle className="h-4 w-4" />
          </div>
          <span className="text-3xl font-black text-rose-600">{overdue.length}</span>
          <p className="text-[11px] text-rose-600/80 mt-1">Past due date, requires priority push</p>
        </div>

        <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/80 to-yellow-50/50 p-4 shadow-sm">
          <div className="flex items-center justify-between text-amber-700 text-xs mb-1 font-semibold">
            <span>Due Today</span>
            <Clock className="h-4 w-4" />
          </div>
          <span className="text-3xl font-black text-amber-600">{dueToday.length}</span>
          <p className="text-[11px] text-amber-600/80 mt-1">Deadline is today before end of day</p>
        </div>

        <div className="rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/80 to-purple-50/50 p-4 shadow-sm">
          <div className="flex items-center justify-between text-indigo-700 text-xs mb-1 font-semibold">
            <span>Due Within 48 Hours</span>
            <Calendar className="h-4 w-4" />
          </div>
          <span className="text-3xl font-black text-indigo-600">{dueSoon.length}</span>
          <p className="text-[11px] text-indigo-600/80 mt-1">Approaching scheduled deadline</p>
        </div>
      </div>

      {/* Reminders List */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/95 backdrop-blur-md p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Active Deadline Action Items</h3>

        {reminders.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs flex flex-col items-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-2" />
            <span className="text-slate-800 font-semibold text-sm">No impending or overdue deadlines!</span>
            <span className="text-[12px] text-slate-500 mt-1">
              All tasks with deadlines are either completed or scheduled well in advance.
            </span>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 space-y-3">
            {reminders.map((item) => (
              <div
                key={item.taskId}
                className="pt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`mt-0.5 rounded-xl p-2 shrink-0 ${
                      item.urgency === 'overdue'
                        ? 'bg-rose-100 text-rose-600 border border-rose-200'
                        : item.urgency === 'due_today'
                        ? 'bg-amber-100 text-amber-600 border border-amber-200'
                        : 'bg-indigo-100 text-indigo-600 border border-indigo-200'
                    }`}
                  >
                    {item.urgency === 'overdue' ? (
                      <AlertTriangle className="h-4 w-4" />
                    ) : (
                      <Clock className="h-4 w-4" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{item.taskTitle}</span>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          item.urgency === 'overdue'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : item.urgency === 'due_today'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}
                      >
                        {item.urgency === 'overdue'
                          ? `${item.daysDiff}d Overdue`
                          : item.urgency === 'due_today'
                          ? 'Due Today'
                          : `Due in ${item.daysDiff}d`}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-500">
                      <span>Deadline: <strong className="text-slate-700">{item.deadline}</strong></span>
                      <span>·</span>
                      <span>
                        Assignee: <strong className="text-slate-700">{item.assigneeName || item.assigneeEmail || 'Unassigned'}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dispatch notification button */}
                <button
                  onClick={() => handleSendNotification(item)}
                  disabled={dispatchingId === item.taskId}
                  className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100/80 px-3 py-1.5 text-xs font-semibold text-indigo-700 active:scale-95 transition-all shrink-0"
                >
                  <Mail className="h-3.5 w-3.5 text-indigo-600" />
                  {dispatchingId === item.taskId ? 'Sending...' : 'Send Reminder Alert'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dispatched Logs */}
      {dispatchedLogs.length > 0 && (
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 text-xs shadow-sm">
          <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
            <Send className="h-3.5 w-3.5 text-indigo-600" />
            Recent Dispatch Transmission Log
          </h4>
          <div className="space-y-1.5 max-h-32 overflow-y-auto font-mono text-[11px]">
            {dispatchedLogs.map((log, idx) => (
              <div key={idx} className="flex items-center gap-2 text-emerald-700 bg-emerald-50/70 p-1.5 rounded-lg border border-emerald-100">
                <span className="text-emerald-500 font-medium">[{log.time}]</span>
                <span>{log.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
