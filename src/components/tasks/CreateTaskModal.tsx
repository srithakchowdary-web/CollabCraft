import React, { useState } from 'react';
import { CheckSquare, X, Calendar, User, AlignLeft, Layers } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import type { Task, UserProfile } from '../../types/index.ts';
import { createTask } from '../../services/taskService.ts';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  members: UserProfile[];
  parentTask?: Task | null;
  onTaskCreated?: () => void;
}

export function CreateTaskModal({
  isOpen,
  onClose,
  projectId,
  members,
  parentTask,
  onTaskCreated,
}: CreateTaskModalProps) {
  const { currentUser } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !currentUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }

    setLoading(true);
    setError(null);

    const selectedMember = members.find((m) => m.uid === assigneeId);

    try {
      await createTask(
        projectId,
        {
          title: title.trim(),
          description: description.trim(),
          parentTaskId: parentTask ? parentTask.id : null,
          assigneeId: selectedMember ? selectedMember.uid : null,
          assigneeEmail: selectedMember ? selectedMember.email : null,
          assigneeName: selectedMember ? selectedMember.displayName : null,
          deadline: deadline || null,
          status: 'todo',
        },
        { uid: currentUser.uid }
      );

      setTitle('');
      setDescription('');
      setAssigneeId('');
      setDeadline('');
      if (onTaskCreated) onTaskCreated();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25">
            {parentTask ? <Layers className="h-6 w-6" /> : <CheckSquare className="h-6 w-6" />}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {parentTask ? 'Add Subtask' : 'Create New Task'}
            </h2>
            <p className="text-xs text-slate-500">
              {parentTask ? `Subtask of: "${parentTask.title}"` : 'Assign task deliverables and set target deadlines'}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={150}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={parentTask ? 'e.g. Write unit tests' : 'e.g. Implement authentication flow'}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description (Optional)</label>
            <textarea
              rows={2}
              maxLength={1000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide context or acceptance criteria..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Assignee</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-9 pr-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.uid} value={m.uid}>
                      {m.displayName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Deadline</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-9 pr-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-500/25 active:scale-95 disabled:opacity-50 transition-all"
            >
              {loading ? 'Creating...' : parentTask ? 'Add Subtask' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
