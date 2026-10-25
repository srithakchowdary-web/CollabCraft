import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  X,
  CheckSquare,
  Square,
  User,
  Calendar,
  AlertCircle,
  Plus,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import type { Message, SuggestedTask, UserProfile, Project } from '../../types/index.ts';
import { requestExtractTasks } from '../../services/aiClientService.ts';
import { batchCreateSuggestedTasks } from '../../services/taskService.ts';

interface ExtractTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  project: Project;
  members: UserProfile[];
  onTasksAdded?: () => void;
}

export function ExtractTasksModal({
  isOpen,
  onClose,
  messages,
  project,
  members,
  onTasksAdded,
}: ExtractTasksModalProps) {
  const { currentUser } = useAuth();
  const isLeader = project.leaderId === currentUser?.uid;

  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<Array<SuggestedTask & { selected: boolean }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && messages.length > 0) {
      handleExtract();
    }
  }, [isOpen]);

  const handleExtract = async () => {
    setLoading(true);
    setError(null);
    setSuccessCount(null);

    try {
      const result = await requestExtractTasks(
        messages,
        members.map((m) => ({
          uid: m.uid,
          displayName: m.displayName || m.email,
          email: m.email,
        })),
        project.title
      );

      const mapped = result.suggestedTasks.map((t) => ({
        ...t,
        selected: true,
      }));
      setTasks(mapped);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to extract tasks from chat');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelect = (index: number) => {
    setTasks((prev) =>
      prev.map((t, i) => (i === index ? { ...t, selected: !t.selected } : t))
    );
  };

  const handleUpdateTaskField = (
    index: number,
    field: keyof SuggestedTask,
    value: any
  ) => {
    setTasks((prev) =>
      prev.map((t, i) => (i === index ? { ...t, [field]: value } : t))
    );
  };

  const handleRemoveTask = (index: number) => {
    setTasks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirmAndAdd = async () => {
    if (!currentUser || !isLeader) return;

    const selectedTasks = tasks.filter((t) => t.selected && t.title.trim());
    if (selectedTasks.length === 0) return;

    setSubmitting(true);
    setError(null);

    try {
      const added = await batchCreateSuggestedTasks(
        project.id,
        selectedTasks,
        { uid: currentUser.uid }
      );
      setSuccessCount(added);
      if (onTasksAdded) onTasksAdded();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to add confirmed tasks');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const selectedCount = tasks.filter((t) => t.selected).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl max-h-[88vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5 shrink-0">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">AI Task Extractor</h2>
              <span className="rounded-md bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                Gemini Model
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Parsed from recent team conversation. Project leader can review, edit, and confirm.
            </p>
          </div>
        </div>

        {/* Permissions Notice */}
        {!isLeader && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 flex items-center gap-2 shrink-0">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
            <span>
              You are viewing suggested tasks as a member. Only the Project Leader ({project.leaderEmail}) can confirm and batch add them.
            </span>
          </div>
        )}

        {/* Success Alert */}
        {successCount !== null && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center gap-2 shrink-0">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>Successfully added {successCount} task(s) to the project board!</span>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 shrink-0">
            {error}
          </div>
        )}

        {/* Tasks List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-10 w-10 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent mb-3" />
              <p className="text-xs font-semibold text-indigo-700">
                Analyzing chat conversation for deliverables...
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Matching assignee mentions and deadline promises
              </p>
            </div>
          )}

          {!loading && tasks.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-xs">
              No tasks could be inferred from the current chat messages. Try discussing deliverables or action items in chat first!
            </div>
          )}

          {!loading &&
            tasks.map((task, idx) => (
              <div
                key={idx}
                className={`rounded-xl border p-4 transition-all ${
                  task.selected
                    ? 'border-indigo-200 bg-indigo-50/40 shadow-sm'
                    : 'border-slate-200 bg-slate-50/60 opacity-60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => handleToggleSelect(idx)}
                    className="mt-1 text-indigo-600 hover:text-indigo-700 shrink-0"
                  >
                    {task.selected ? (
                      <CheckSquare className="h-4 w-4" />
                    ) : (
                      <Square className="h-4 w-4 text-slate-400" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0 space-y-2">
                    <input
                      type="text"
                      value={task.title}
                      onChange={(e) => handleUpdateTaskField(idx, 'title', e.target.value)}
                      placeholder="Task Title"
                      disabled={!isLeader}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 focus:border-indigo-500 focus:outline-none"
                    />

                    <textarea
                      rows={2}
                      value={task.description || ''}
                      onChange={(e) => handleUpdateTaskField(idx, 'description', e.target.value)}
                      placeholder="Description & details..."
                      disabled={!isLeader}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none resize-none"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {/* Assignee selection */}
                      <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1">
                        <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <select
                          value={task.suggestedAssigneeEmail || ''}
                          disabled={!isLeader}
                          onChange={(e) => {
                            const email = e.target.value;
                            const matched = members.find((m) => m.email === email);
                            handleUpdateTaskField(idx, 'suggestedAssigneeEmail', email || null);
                            handleUpdateTaskField(
                              idx,
                              'suggestedAssigneeName',
                              matched ? matched.displayName : null
                            );
                          }}
                          className="w-full bg-transparent text-xs text-slate-800 focus:outline-none"
                        >
                          <option value="">Unassigned</option>
                          {members.map((m) => (
                            <option key={m.uid} value={m.email}>
                              {m.displayName} ({m.email})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Deadline input */}
                      <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <input
                          type="date"
                          value={task.deadline || ''}
                          disabled={!isLeader}
                          onChange={(e) => handleUpdateTaskField(idx, 'deadline', e.target.value || null)}
                          className="w-full bg-transparent text-xs text-slate-800 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {isLeader && (
                    <button
                      onClick={() => handleRemoveTask(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            onClick={handleExtract}
            disabled={loading}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 disabled:opacity-40"
          >
            Re-analyze Chat
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            {isLeader && (
              <button
                onClick={handleConfirmAndAdd}
                disabled={submitting || selectedCount === 0}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-500/25 active:scale-95 disabled:opacity-40 transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
                {submitting ? 'Adding...' : `Add ${selectedCount} Task(s) to Project`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
