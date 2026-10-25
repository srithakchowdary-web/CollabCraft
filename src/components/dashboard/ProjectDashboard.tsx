import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Award,
  Users,
} from 'lucide-react';
import type { Task, UserProfile, Project } from '../../types/index.ts';

interface ProjectDashboardProps {
  project: Project;
  tasks: Task[];
  members: UserProfile[];
}

export function ProjectDashboard({ project, tasks, members }: ProjectDashboardProps) {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
  const todoTasks = tasks.filter((t) => t.status === 'todo').length;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Overdue check
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const overdueTasks = tasks.filter((t) => {
    if (t.status === 'completed' || !t.deadline) return false;
    const d = new Date(t.deadline);
    d.setHours(0, 0, 0, 0);
    return d.getTime() < now.getTime();
  });

  // Pie chart data for overall status distribution
  const statusData = [
    { name: 'Completed', value: completedTasks, color: '#10b981' },
    { name: 'In Progress', value: inProgressTasks, color: '#6366f1' },
    { name: 'To Do', value: todoTasks, color: '#94a3b8' },
  ].filter((d) => d.value > 0);

  // Per-member contribution calculation
  const memberProgressMap: Record<
    string,
    { name: string; completed: number; inProgress: number; todo: number; total: number }
  > = {};

  members.forEach((m) => {
    memberProgressMap[m.uid] = {
      name: m.displayName || m.email?.split('@')[0] || 'Member',
      completed: 0,
      inProgress: 0,
      todo: 0,
      total: 0,
    };
  });

  memberProgressMap['unassigned'] = {
    name: 'Unassigned',
    completed: 0,
    inProgress: 0,
    todo: 0,
    total: 0,
  };

  tasks.forEach((t) => {
    const key = t.assigneeId && memberProgressMap[t.assigneeId] ? t.assigneeId : 'unassigned';
    if (!memberProgressMap[key]) {
      memberProgressMap[key] = {
        name: t.assigneeName || 'Unknown',
        completed: 0,
        inProgress: 0,
        todo: 0,
        total: 0,
      };
    }
    memberProgressMap[key].total += 1;
    if (t.status === 'completed') memberProgressMap[key].completed += 1;
    else if (t.status === 'in_progress') memberProgressMap[key].inProgress += 1;
    else memberProgressMap[key].todo += 1;
  });

  const memberChartData = Object.values(memberProgressMap).filter((m) => m.total > 0);

  const recentCompletedTasks = tasks
    .filter((t) => t.status === 'completed')
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Radiant KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Completion */}
        <div className="rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/80 to-teal-50/40 p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-800 mb-2">
            <span>Overall Completion</span>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-900">{completionRate}%</span>
            <span className="text-xs text-emerald-700 font-semibold">
              ({completedTasks}/{totalTasks} tasks)
            </span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-emerald-200/60">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        {/* In Progress */}
        <div className="rounded-3xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/80 to-violet-50/40 p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-indigo-800 mb-2">
            <span>Active In Progress</span>
            <Clock className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-indigo-900">{inProgressTasks}</span>
            <span className="text-xs text-indigo-700 font-semibold">ongoing</span>
          </div>
          <p className="mt-2 text-xs text-indigo-600/80 font-medium truncate">
            {todoTasks} remaining in queue
          </p>
        </div>

        {/* Overdue Alert */}
        <div className={`rounded-3xl border p-5 shadow-xs ${
          overdueTasks.length > 0
            ? 'border-rose-200 bg-gradient-to-br from-rose-50 to-pink-50/50'
            : 'border-slate-200 bg-white'
        }`}>
          <div className="flex items-center justify-between text-xs font-bold text-rose-800 mb-2">
            <span>Overdue Tasks</span>
            <AlertTriangle className={`h-4 w-4 ${overdueTasks.length > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-black ${overdueTasks.length > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
              {overdueTasks.length}
            </span>
            <span className="text-xs text-rose-700 font-semibold">past deadline</span>
          </div>
          <p className="mt-2 text-xs text-rose-600/80 font-medium">
            {overdueTasks.length > 0 ? 'Requires priority attention' : 'All deadlines on track'}
          </p>
        </div>

        {/* Team Members */}
        <div className="rounded-3xl border border-purple-200/80 bg-gradient-to-br from-purple-50/80 to-fuchsia-50/40 p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-purple-800 mb-2">
            <span>Team Contributors</span>
            <Users className="h-4 w-4 text-purple-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-purple-900">{members.length}</span>
            <span className="text-xs text-purple-700 font-semibold">collaborators</span>
          </div>
          <p className="mt-2 text-xs text-purple-600/80 font-medium truncate">
            Lead: {project.leaderEmail}
          </p>
        </div>
      </div>

      {/* Visual Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overall Completion Donut Chart */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Award className="h-4 w-4 text-emerald-600" />
              Task Status Distribution
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Ratio of completed, in-progress, and pending deliverables</p>
          </div>

          <div className="h-64 flex items-center justify-center">
            {totalTasks === 0 ? (
              <div className="text-xs text-slate-400">No tasks to chart yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '16px',
                      fontSize: '12px',
                      color: '#0f172a',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Legend
                    formatter={(value) => (
                      <span className="text-xs text-slate-700 font-semibold">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex justify-around text-center text-xs">
            <div>
              <p className="text-slate-500 font-medium">Completed</p>
              <p className="text-base font-extrabold text-emerald-600">{completedTasks}</p>
            </div>
            <div>
              <p className="text-slate-500 font-medium">In Progress</p>
              <p className="text-base font-extrabold text-indigo-600">{inProgressTasks}</p>
            </div>
            <div>
              <p className="text-slate-500 font-medium">To Do</p>
              <p className="text-base font-extrabold text-slate-600">{todoTasks}</p>
            </div>
          </div>
        </div>

        {/* Member Contributions Bar Chart */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-600" />
              Member Progress & Contributions
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Completed vs remaining tasks assigned per member</p>
          </div>

          <div className="h-64 flex items-center justify-center">
            {memberChartData.length === 0 ? (
              <div className="text-xs text-slate-400">No member tasks assigned yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={memberChartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '16px',
                      fontSize: '12px',
                      color: '#0f172a',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Legend
                    formatter={(value) => (
                      <span className="text-xs text-slate-700 font-semibold">{value}</span>
                    )}
                  />
                  <Bar dataKey="completed" name="Completed" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="inProgress" name="In Progress" stackId="a" fill="#6366f1" />
                  <Bar dataKey="todo" name="To Do" stackId="a" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500 text-center font-medium">
            Stacked bars indicate completion velocity per collaborator
          </div>
        </div>
      </div>

      {/* Recently Completed Tasks Highlight */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 mb-4">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          Recently Completed Deliverables
        </h3>

        {recentCompletedTasks.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">
            No completed deliverables yet. Mark tasks done on the board to see them highlighted here.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentCompletedTasks.map((task) => (
              <div key={task.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="line-through text-slate-400 truncate font-semibold">
                    {task.title}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 shrink-0 font-medium">
                  {task.assigneeName && <span>by {task.assigneeName}</span>}
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px]">
                    Completed
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
