import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  CheckSquare,
  MessageSquare,
  BarChart3,
  Bell,
  Users,
  Crown,
  Trash2,
  Activity,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import type { Project, Task, UserProfile, Message } from '../../types/index.ts';
import { subscribeProjectTasks } from '../../services/taskService.ts';
import { fetchProjectMemberProfiles, deleteProject } from '../../services/projectService.ts';
import { TaskList } from '../tasks/TaskList.tsx';
import { ChatRoom } from '../chat/ChatRoom.tsx';
import { ProjectDashboard } from '../dashboard/ProjectDashboard.tsx';
import { RemindersPanel } from '../reminders/RemindersPanel.tsx';
import { TeamPanel } from '../members/TeamPanel.tsx';
import { RecentActivityPanel } from '../activity/RecentActivityPanel.tsx';
import { ChatSummaryModal } from '../ai/ChatSummaryModal.tsx';
import { ExtractTasksModal } from '../ai/ExtractTasksModal.tsx';

interface ProjectWorkspaceProps {
  project: Project;
  onBack: () => void;
  onProjectDeleted: () => void;
}

type TabType = 'tasks' | 'chat' | 'dashboard' | 'activity' | 'reminders' | 'team';

export function ProjectWorkspace({ project, onBack, onProjectDeleted }: ProjectWorkspaceProps) {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('tasks');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  // AI Modal States
  const [summarizeOpen, setSummarizeOpen] = useState(false);
  const [extractOpen, setExtractOpen] = useState(false);
  const [chatMessagesForAi, setChatMessagesForAi] = useState<Message[]>([]);

  const isLeader = project.leaderId === currentUser?.uid;

  // Real-time tasks subscription
  useEffect(() => {
    setLoadingTasks(true);
    const unsub = subscribeProjectTasks(
      project.id,
      (newTasks) => {
        setTasks(newTasks);
        setLoadingTasks(false);
      },
      (err) => {
        console.error('Tasks subscription error:', err);
        setLoadingTasks(false);
      }
    );

    return () => unsub();
  }, [project.id]);

  // Load project member profiles
  const loadMemberProfiles = async () => {
    if (project.memberIds && project.memberIds.length > 0) {
      const profs = await fetchProjectMemberProfiles(project.memberIds);
      setMembers(profs);
    }
  };

  useEffect(() => {
    loadMemberProfiles();
  }, [project.id, project.memberIds]);

  const handleDeleteProject = async () => {
    if (!isLeader) return;
    if (confirm(`Are you sure you want to permanently delete "${project.title}"?`)) {
      try {
        await deleteProject(project.id);
        onProjectDeleted();
      } catch (err) {
        console.error('Failed to delete project:', err);
      }
    }
  };

  // Overdue count for alert badge
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const overdueCount = tasks.filter((t) => {
    if (t.status === 'completed' || !t.deadline) return false;
    const d = new Date(t.deadline);
    d.setHours(0, 0, 0, 0);
    return d.getTime() < now.getTime();
  }).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Top Workspace Navigation & Header */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to All Projects
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              {project.title}
            </h1>
            {isLeader ? (
              <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full font-bold">
                <Crown className="h-3.5 w-3.5 text-amber-500" />
                Project Lead
              </span>
            ) : (
              <span className="text-xs text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full font-semibold">
                Member View
              </span>
            )}
          </div>
          {project.description && (
            <p className="mt-1 text-xs text-slate-600 max-w-2xl leading-relaxed">{project.description}</p>
          )}

          <div className="mt-2.5 flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span className="text-indigo-600 font-semibold">{members.length} team members</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>{tasks.length} total deliverables</span>
            {tasks.filter((t) => t.status === 'completed').length > 0 && (
              <>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span className="text-emerald-600 font-bold">
                  {tasks.filter((t) => t.status === 'completed').length} completed
                </span>
              </>
            )}
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          {isLeader && (
            <button
              onClick={handleDeleteProject}
              title="Delete project workspace"
              className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 shadow-2xs transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Project
            </button>
          )}
        </div>
      </div>

      {/* Colorful Segmented Tabs Navigation Bar */}
      <div className="mb-6 overflow-x-auto no-scrollbar">
        <div className="inline-flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-200/80 shadow-inner">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'tasks'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckSquare className="h-4 w-4 text-indigo-500" />
            <span>Tasks & Board</span>
            <span className="text-[11px] opacity-75">({tasks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'chat'
                ? 'bg-white text-pink-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="h-4 w-4 text-pink-500" />
            <span>Live Chat</span>
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'dashboard'
                ? 'bg-white text-amber-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="h-4 w-4 text-amber-500" />
            <span>Dashboard</span>
          </button>

          {/* Recent Activity Tab */}
          <button
            onClick={() => setActiveTab('activity')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'activity'
                ? 'bg-white text-violet-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="h-4 w-4 text-violet-500" />
            <span>Recent Activity</span>
          </button>

          <button
            onClick={() => setActiveTab('reminders')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'reminders'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bell className="h-4 w-4 text-emerald-500" />
            <span>Reminders</span>
            {overdueCount > 0 && (
              <span className="text-[10px] font-bold text-white bg-rose-500 px-1.5 py-0.2 rounded-full">
                {overdueCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('team')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'team'
                ? 'bg-white text-sky-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="h-4 w-4 text-sky-500" />
            <span>Team & Invites</span>
            <span className="text-[11px] opacity-75">({project.memberIds.length})</span>
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'tasks' && (
          <TaskList project={project} tasks={tasks} members={members} />
        )}

        {activeTab === 'chat' && (
          <ChatRoom
            project={project}
            members={members}
            onOpenSummarize={(msgs) => {
              setChatMessagesForAi(msgs);
              setSummarizeOpen(true);
            }}
            onOpenExtractTasks={(msgs) => {
              setChatMessagesForAi(msgs);
              setExtractOpen(true);
            }}
          />
        )}

        {activeTab === 'dashboard' && (
          <ProjectDashboard project={project} tasks={tasks} members={members} />
        )}

        {activeTab === 'activity' && (
          <RecentActivityPanel project={project} />
        )}

        {activeTab === 'reminders' && (
          <RemindersPanel project={project} tasks={tasks} />
        )}

        {activeTab === 'team' && (
          <TeamPanel
            project={project}
            members={members}
            onMemberAdded={loadMemberProfiles}
          />
        )}
      </div>

      {/* AI Summarize Modal */}
      <ChatSummaryModal
        isOpen={summarizeOpen}
        onClose={() => setSummarizeOpen(false)}
        projectId={project.id}
        messages={chatMessagesForAi}
        projectTitle={project.title}
      />

      {/* AI Task Extraction Modal */}
      <ExtractTasksModal
        isOpen={extractOpen}
        onClose={() => setExtractOpen(false)}
        messages={chatMessagesForAi}
        project={project}
        members={members}
      />
    </div>
  );
}
