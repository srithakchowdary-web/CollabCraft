import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  CornerDownRight,
  User,
  Calendar,
  Layers,
  LayoutGrid,
  List as ListIcon,
  Search,
  ArrowRight,
  Clock,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext.tsx';
import type { Task, Project, UserProfile } from '../../types/index.ts';
import { updateTaskStatus, deleteTask } from '../../services/taskService.ts';
import { CreateTaskModal } from './CreateTaskModal.tsx';

interface TaskListProps {
  project: Project;
  tasks: Task[];
  members: UserProfile[];
}

export function TaskList({ project, tasks, members }: TaskListProps) {
  const { currentUser } = useAuth();
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'todo' | 'in_progress' | 'completed'>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [subtaskParent, setSubtaskParent] = useState<Task | null>(null);

  const isLeader = project.leaderId === currentUser?.uid;

  // Group into parent tasks and subtasks
  const parentTasks = tasks.filter((t) => !t.parentTaskId);
  const getSubtasks = (parentId: string) => tasks.filter((t) => t.parentTaskId === parentId);

  const handleToggleStatus = async (task: Task, targetStatus?: 'todo' | 'in_progress' | 'completed') => {
    if (!currentUser) return;
    const canUpdate = isLeader || task.assigneeId === currentUser.uid;
    if (!canUpdate) {
      alert('Only the task assignee or project leader can update this task.');
      return;
    }

    const nextStatus: 'todo' | 'in_progress' | 'completed' =
      targetStatus ||
      (task.status === 'completed' ? 'todo' : task.status === 'todo' ? 'in_progress' : 'completed');

    try {
      await updateTaskStatus(project.id, task.id, nextStatus, task.title, {
        uid: currentUser.uid,
        displayName: currentUser.displayName || undefined,
        email: currentUser.email || undefined,
      });

      if (nextStatus === 'completed') {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
        });
      }
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!isLeader) return;
    if (confirm('Are you sure you want to delete this task? Any subtasks will also be removed.')) {
      try {
        await deleteTask(project.id, taskId, tasks);
      } catch (err) {
        console.error('Error deleting task:', err);
      }
    }
  };

  const matchesFilter = (task: Task) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const inTitle = task.title.toLowerCase().includes(q);
      const inDesc = task.description?.toLowerCase().includes(q);
      const inAssignee = task.assigneeName?.toLowerCase().includes(q);
      if (!inTitle && !inDesc && !inAssignee) return false;
    }

    if (viewMode === 'list') {
      if (filterStatus !== 'all' && task.status !== filterStatus) return false;
    }

    if (filterAssignee !== 'all') {
      if (filterAssignee === 'unassigned' && task.assigneeId) return false;
      if (filterAssignee !== 'unassigned' && task.assigneeId !== filterAssignee) return false;
    }
    return true;
  };

  const getDeadlineBadge = (deadline?: string | null, status?: string) => {
    if (!deadline) return null;
    if (status === 'completed') {
      return <span className="text-emerald-700 font-medium">Completed</span>;
    }
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const d = new Date(deadline);
    d.setHours(0, 0, 0, 0);
    const diff = d.getTime() - now.getTime();
    const diffDays = Math.round(diff / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return <span className="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">Overdue ({deadline})</span>;
    }
    if (diffDays === 0) {
      return <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">Due Today</span>;
    }
    if (diffDays <= 2) {
      return <span className="text-amber-600 font-semibold bg-amber-50/60 px-2 py-0.5 rounded-md border border-amber-100">Due in {diffDays}d</span>;
    }
    return <span className="text-slate-500 font-medium">Due {deadline}</span>;
  };

  // Colorful Kanban Columns
  const kanbanColumns: Array<{
    id: 'todo' | 'in_progress' | 'completed';
    title: string;
    bgClass: string;
    borderClass: string;
    dotColor: string;
    badgeBg: string;
    badgeText: string;
  }> = [
    {
      id: 'todo',
      title: 'To Do',
      bgClass: 'bg-sky-50/40',
      borderClass: 'border-sky-200/70',
      dotColor: 'bg-sky-500',
      badgeBg: 'bg-sky-100',
      badgeText: 'text-sky-800',
    },
    {
      id: 'in_progress',
      title: 'In Progress',
      bgClass: 'bg-indigo-50/40',
      borderClass: 'border-indigo-200/70',
      dotColor: 'bg-indigo-600',
      badgeBg: 'bg-indigo-100',
      badgeText: 'text-indigo-800',
    },
    {
      id: 'completed',
      title: 'Completed',
      bgClass: 'bg-emerald-50/40',
      borderClass: 'border-emerald-200/70',
      dotColor: 'bg-emerald-500',
      badgeBg: 'bg-emerald-100',
      badgeText: 'text-emerald-800',
    },
  ];

  return (
    <div className="space-y-5">
      {/* Action and Filter Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Left: View Switcher & Search */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* View Switcher: Kanban vs List */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-200/80 p-1 text-xs font-bold">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'kanban'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Kanban Board</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListIcon className="h-3.5 w-3.5" />
              <span>List View</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search deliverables..."
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 shadow-2xs"
            />
          </div>

          {/* Status filter (List View only) */}
          {viewMode === 'list' && (
            <div className="flex items-center gap-1 rounded-xl bg-slate-200/80 p-1 text-xs font-semibold hidden sm:flex">
              {(['all', 'todo', 'in_progress', 'completed'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-2.5 py-1 rounded-lg capitalize transition-colors ${
                    filterStatus === st
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st === 'all' ? 'All' : st === 'in_progress' ? 'In Progress' : st}
                </button>
              ))}
            </div>
          )}

          {/* Assignee filter */}
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none shadow-2xs"
          >
            <option value="all">All Assignees</option>
            <option value="unassigned">Unassigned</option>
            {members.map((m) => (
              <option key={m.uid} value={m.uid}>
                {m.displayName}
              </option>
            ))}
          </select>
        </div>

        {/* Leader Add Task Button */}
        {isLeader && (
          <button
            onClick={() => {
              setSubtaskParent(null);
              setCreateModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-500/25 hover:from-indigo-500 hover:to-violet-500 active:scale-95 transition-all shrink-0"
          >
            <Plus className="h-4 w-4" />
            Add Deliverable
          </button>
        )}
      </div>

      {/* Render based on viewMode */}
      {viewMode === 'kanban' ? (
        /* Colorful Kanban Board View */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 min-h-[500px]">
          {kanbanColumns.map((col) => {
            const colTasks = tasks.filter(
              (t) => t.status === col.id && matchesFilter(t)
            );
            return (
              <div
                key={col.id}
                className={`flex flex-col rounded-3xl border ${col.borderClass} ${col.bgClass} p-4 shadow-sm backdrop-blur-sm`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/80">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900">
                    <span className={`h-2.5 w-2.5 rounded-full ${col.dotColor}`} />
                    <span>{col.title}</span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${col.badgeBg} ${col.badgeText}`}>
                    {colTasks.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div className="flex-1 space-y-3 overflow-y-auto max-h-[620px] pr-1">
                  {colTasks.length === 0 ? (
                    <div className="py-14 text-center text-xs text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-white/50">
                      No deliverables in {col.title}
                    </div>
                  ) : (
                    colTasks.map((task) => {
                      const canManage = isLeader || task.assigneeId === currentUser?.uid;
                      return (
                        <div
                          key={task.id}
                          className="group rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                              {task.title}
                            </h4>
                            {isLeader && (
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 p-0.5 transition-opacity"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>

                          {task.description && (
                            <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                              {task.description}
                            </p>
                          )}

                          {/* Metadata row */}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                            <span className="font-semibold text-slate-700">
                              {task.assigneeName || 'Unassigned'}
                            </span>
                            {task.deadline && (
                              <span>{getDeadlineBadge(task.deadline, task.status)}</span>
                            )}
                          </div>

                          {/* Quick Advance Button */}
                          {canManage && (
                            <div className="pt-1 flex items-center justify-end gap-1 text-[11px]">
                              {col.id === 'todo' && (
                                <button
                                  onClick={() => handleToggleStatus(task, 'in_progress')}
                                  className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-bold bg-indigo-50 px-2 py-1 rounded-lg"
                                >
                                  Start Progress <ArrowRight className="h-3 w-3" />
                                </button>
                              )}
                              {col.id === 'in_progress' && (
                                <button
                                  onClick={() => handleToggleStatus(task, 'completed')}
                                  className="flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg"
                                >
                                  Mark Done <CheckCircle2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                              {col.id === 'completed' && (
                                <button
                                  onClick={() => handleToggleStatus(task, 'todo')}
                                  className="text-slate-400 hover:text-slate-600 text-[10px] font-medium"
                                >
                                  Reopen
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View (with Subtasks) */
        <div className="space-y-3">
          {parentTasks.length === 0 ? (
            <div className="text-center py-16 px-4 rounded-3xl border-2 border-dashed border-slate-200 bg-white/70">
              <Layers className="mx-auto h-12 w-12 text-slate-400 mb-3" />
              <h3 className="text-base font-bold text-slate-800">No tasks created yet</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                {isLeader
                  ? 'Add your first task deliverable or use AI task extraction in the chat room.'
                  : 'The project leader has not added any tasks to this workspace yet.'}
              </p>
            </div>
          ) : (
            parentTasks.map((task) => {
              const subtasks = getSubtasks(task.id);
              const showParent = matchesFilter(task) || subtasks.some(matchesFilter);

              if (!showParent) return null;

              const isCompleted = task.status === 'completed';
              const canManage = isLeader || task.assigneeId === currentUser?.uid;

              return (
                <div
                  key={task.id}
                  className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all"
                >
                  {/* Main Task Row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Status Toggle Checkbox */}
                      <button
                        onClick={() => handleToggleStatus(task)}
                        disabled={!canManage}
                        title={canManage ? 'Toggle status' : 'Only assignee or leader can change status'}
                        className={`mt-0.5 shrink-0 rounded-lg p-0.5 transition-transform ${
                          !canManage ? 'cursor-not-allowed opacity-40' : 'hover:scale-105 active:scale-95'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-600 fill-emerald-100" />
                        ) : task.status === 'in_progress' ? (
                          <div className="h-5 w-5 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                        ) : (
                          <Circle className="h-5 w-5 text-slate-400 hover:text-indigo-600" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-sm font-extrabold truncate ${
                              isCompleted ? 'line-through text-slate-400' : 'text-slate-900'
                            }`}
                          >
                            {task.title}
                          </span>

                          <span className="text-xs">
                            {task.status === 'in_progress' ? (
                              <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold text-[10px] border border-indigo-200">
                                In Progress
                              </span>
                            ) : task.status === 'completed' ? (
                              <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold text-[10px] border border-emerald-200">
                                Completed
                              </span>
                            ) : (
                              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold text-[10px]">
                                To Do
                              </span>
                            )}
                          </span>
                        </div>

                        {task.description && (
                          <p
                            className={`mt-1.5 text-xs leading-relaxed ${
                              isCompleted ? 'text-slate-400' : 'text-slate-600'
                            }`}
                          >
                            {task.description}
                          </p>
                        )}

                        {/* Metadata row with colorful accents */}
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
                          <span>
                            {task.assigneeName ? (
                              <span className="text-indigo-700 font-bold bg-indigo-50/60 px-2 py-0.5 rounded-md">
                                {task.assigneeName}
                              </span>
                            ) : (
                              <span className="text-slate-400">Unassigned</span>
                            )}
                          </span>

                          {task.deadline && (
                            <>
                              <span aria-hidden="true" className="text-slate-300">·</span>
                              <span>{getDeadlineBadge(task.deadline, task.status)}</span>
                            </>
                          )}

                          {subtasks.length > 0 && (
                            <>
                              <span aria-hidden="true" className="text-slate-300">·</span>
                              <span className="text-slate-600">
                                {subtasks.filter((s) => s.status === 'completed').length}/{subtasks.length}{' '}
                                subtasks
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Leader Controls */}
                    {isLeader && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => {
                            setSubtaskParent(task);
                            setCreateModalOpen(true);
                          }}
                          title="Add subtask"
                          className="rounded-xl p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          title="Delete task"
                          className="rounded-xl p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Nested Subtasks Container */}
                  {subtasks.length > 0 && (
                    <div className="mt-3.5 ml-8 pl-3 border-l-2 border-indigo-100 space-y-2">
                      {subtasks.map((subtask) => {
                        if (!matchesFilter(subtask)) return null;
                        const isSubCompleted = subtask.status === 'completed';
                        const canManageSub = isLeader || subtask.assigneeId === currentUser?.uid;

                        return (
                          <div
                            key={subtask.id}
                            className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 border border-slate-200/80 p-2.5 hover:border-indigo-200 transition-all text-xs"
                          >
                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                              <CornerDownRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <button
                                onClick={() => handleToggleStatus(subtask)}
                                disabled={!canManageSub}
                                className={`shrink-0 ${
                                  !canManageSub ? 'opacity-40 cursor-not-allowed' : 'hover:scale-105'
                                }`}
                              >
                                {isSubCompleted ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-600 fill-emerald-100" />
                                ) : (
                                  <Circle className="h-4 w-4 text-slate-400 hover:text-indigo-600" />
                                )}
                              </button>

                              <span
                                className={`truncate font-semibold ${
                                  isSubCompleted ? 'line-through text-slate-400' : 'text-slate-800'
                                }`}
                              >
                                {subtask.title}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                              {subtask.assigneeName && (
                                <span className="truncate max-w-[120px] text-slate-700">
                                  {subtask.assigneeName}
                                </span>
                              )}
                              {subtask.deadline && (
                                <>
                                  <span aria-hidden="true" className="text-slate-300">·</span>
                                  <span>{getDeadlineBadge(subtask.deadline, subtask.status)}</span>
                                </>
                              )}
                              {isLeader && (
                                <button
                                  onClick={() => handleDeleteTask(subtask.id)}
                                  className="text-slate-400 hover:text-rose-600 p-1 ml-1"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Create / Subtask Modal */}
      <CreateTaskModal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setSubtaskParent(null);
        }}
        projectId={project.id}
        members={members}
        parentTask={subtaskParent}
      />
    </div>
  );
}
