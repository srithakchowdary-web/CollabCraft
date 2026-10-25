import React, { useState } from 'react';
import {
  FolderKanban,
  Plus,
  Search,
  Users,
  Calendar,
  Crown,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import type { Project } from '../../types/index.ts';

interface ProjectListProps {
  projects: Project[];
  loading: boolean;
  onSelectProject: (p: Project) => void;
  onOpenCreateModal: () => void;
}

export function ProjectList({
  projects,
  loading,
  onSelectProject,
  onOpenCreateModal,
}: ProjectListProps) {
  const { currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'leading' | 'member'>('all');

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterTab === 'leading') {
      return p.leaderId === currentUser?.uid;
    }
    if (filterTab === 'member') {
      return p.leaderId !== currentUser?.uid && p.memberIds.includes(currentUser?.uid || '');
    }
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Radiant Colorful Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-500 p-8 sm:p-10 mb-8 shadow-xl shadow-indigo-500/20 text-white">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white mb-3 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5" />
            <span>CollabCraft Team Hub</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
            My Projects & Teams
          </h1>
          <p className="mt-2 text-sm text-indigo-50/90 leading-relaxed max-w-xl">
            Collaborative team project spaces with live chat, subtask delegation, real-time activity tracking, and server-side Gemini AI.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenCreateModal}
              className="flex items-center gap-2 rounded-2xl bg-white px-5 py-2.5 text-xs font-bold text-indigo-700 shadow-md hover:bg-indigo-50 active:scale-95 transition-all"
            >
              <Plus className="h-4 w-4" />
              Create New Project
            </button>
          </div>
        </div>

        {/* Decorative background circles */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute right-40 bottom-0 -mb-10 h-48 w-48 rounded-full bg-pink-400/20 blur-xl pointer-events-none" />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        {/* Segmented Control Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-200/70 w-full sm:w-auto">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterTab === 'all'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Projects ({projects.length})
          </button>
          <button
            onClick={() => setFilterTab('leading')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterTab === 'leading'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Leading ({projects.filter((p) => p.leaderId === currentUser?.uid).length})
          </button>
          <button
            onClick={() => setFilterTab('member')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterTab === 'member'
                ? 'bg-white text-violet-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Joined Member ({projects.filter((p) => p.leaderId !== currentUser?.uid).length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="w-full rounded-2xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 shadow-2xs"
          />
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 rounded-3xl border border-slate-200 bg-white/70 animate-pulse p-6"
            />
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl border-2 border-dashed border-slate-200 bg-white/60">
          <FolderKanban className="mx-auto h-12 w-12 text-slate-400 mb-3" />
          <h3 className="text-base font-bold text-slate-800">No projects found</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            {search
              ? 'No projects matching your search term. Try another query.'
              : filterTab !== 'all'
              ? 'No projects matching this filter category.'
              : 'You have not joined or created any projects yet. Start by creating your first group workspace!'}
          </p>
          {!search && (
            <button
              onClick={onOpenCreateModal}
              className="mt-5 inline-flex items-center gap-1.5 rounded-2xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-500/25 hover:bg-indigo-500 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((project) => {
            const isLeader = project.leaderId === currentUser?.uid;
            return (
              <div
                key={project.id}
                onClick={() => onSelectProject(project)}
                className="group relative cursor-pointer rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm hover:shadow-xl hover:border-indigo-300 hover:-translate-y-1 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-base font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {project.title}
                    </h3>
                    {isLeader ? (
                      <span className="flex items-center gap-1 text-xs text-amber-600 font-bold shrink-0 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        <Crown className="h-3.5 w-3.5 text-amber-500" />
                        Lead
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500 shrink-0 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                        Member
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 min-h-[32px] mb-4 leading-relaxed">
                    {project.description || 'No description provided.'}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-2 font-medium">
                    <span className="flex items-center gap-1 text-slate-600">
                      <Users className="h-3.5 w-3.5 text-indigo-500" />
                      {project.memberIds.length} member{project.memberIds.length > 1 ? 's' : ''}
                    </span>
                    {project.createdAt && (
                      <>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span className="text-slate-400">
                          {new Date(project.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </>
                    )}
                  </div>

                  <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
                    Enter
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
