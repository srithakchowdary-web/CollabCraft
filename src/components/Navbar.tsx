import React, { useState } from 'react';
import {
  FolderKanban,
  User,
  LogOut,
  Bell,
  ChevronDown,
  Layers,
  Plus,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import type { Project } from '../types/index.ts';

interface NavbarProps {
  projects: Project[];
  activeProject: Project | null;
  onSelectProject: (p: Project | null) => void;
  onOpenProfile: () => void;
  onOpenAuth: () => void;
  onOpenCreateProject?: () => void;
  overdueCount: number;
  onOpenReminders?: () => void;
}

export function Navbar({
  projects,
  activeProject,
  onSelectProject,
  onOpenProfile,
  onOpenAuth,
  onOpenCreateProject,
  overdueCount,
  onOpenReminders,
}: NavbarProps) {
  const { currentUser, userProfile, logout, acceptedInvitesCount, clearAcceptedInvitesAlert } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/85 backdrop-blur-xl shadow-xs">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Workspace Path */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectProject(null)}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-pink-500 text-white shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-all">
              <FolderKanban className="h-4 w-4" />
            </div>
            <span className="text-base font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-violet-900 bg-clip-text text-transparent">
              CollabCraft
            </span>
          </button>

          {/* Breadcrumb separator */}
          {currentUser && (
            <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
              <div className="relative">
                <button
                  onClick={() => setProjectMenuOpen(!projectMenuOpen)}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-indigo-300 hover:bg-white hover:text-indigo-600 transition-all shadow-2xs"
                >
                  <Layers className="h-3.5 w-3.5 text-indigo-500" />
                  <span className="max-w-[150px] truncate">
                    {activeProject ? activeProject.title : 'All Workspaces'}
                  </span>
                  <ChevronDown className="h-3 w-3 text-slate-400" />
                </button>

                {projectMenuOpen && (
                  <div
                    className="absolute left-0 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100"
                    onClick={() => setProjectMenuOpen(false)}
                  >
                    <button
                      onClick={() => onSelectProject(null)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                        !activeProject
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      All Projects Overview
                    </button>
                    <div className="my-1.5 border-t border-slate-100" />
                    <div className="px-3 py-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <span>Projects</span>
                      <span>{projects.length}</span>
                    </div>
                    <div className="max-h-52 overflow-y-auto space-y-0.5">
                      {projects.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => onSelectProject(p)}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs truncate transition-colors flex items-center justify-between ${
                            activeProject?.id === p.id
                              ? 'bg-indigo-50 text-indigo-700 font-bold'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span className="truncate">{p.title}</span>
                          <span className="text-[10px] font-medium text-slate-400 ml-2 shrink-0">
                            {p.memberIds?.length || 1} members
                          </span>
                        </button>
                      ))}
                    </div>

                    {onOpenCreateProject && (
                      <div className="mt-1.5 pt-1.5 border-t border-slate-100">
                        <button
                          onClick={() => {
                            setProjectMenuOpen(false);
                            onOpenCreateProject();
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Create New Project
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 sm:gap-3">
          {currentUser ? (
            <>
              {/* Quick Create Project Button */}
              {onOpenCreateProject && !activeProject && (
                <button
                  onClick={onOpenCreateProject}
                  className="hidden sm:flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm shadow-indigo-500/25 hover:from-indigo-500 hover:to-violet-500 active:scale-95 transition-all"
                >
                  <Plus className="h-3.5 w-3.5" />
                  New Project
                </button>
              )}

              {/* Reminders Bell */}
              <button
                onClick={onOpenReminders}
                title={
                  overdueCount > 0
                    ? `${overdueCount} deadlines require attention`
                    : 'Reminders & Notifications'
                }
                className="relative rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                <Bell className="h-4 w-4" />
                {overdueCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
                )}
              </button>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 rounded-xl p-1 pr-2 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
                >
                  <img
                    src={
                      userProfile?.photoURL ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.uid}`
                    }
                    alt="Avatar"
                    className="h-8 w-8 rounded-lg border-2 border-indigo-200 bg-slate-100 object-cover"
                  />
                  <span className="text-xs font-bold text-slate-800 hidden md:block max-w-[120px] truncate">
                    {userProfile?.displayName || currentUser.displayName || 'Member'}
                  </span>
                  <ChevronDown className="h-3 w-3 text-slate-400 hidden sm:block" />
                </button>

                {dropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {userProfile?.displayName || 'User'}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                    </div>

                    <button
                      onClick={onOpenProfile}
                      className="w-full flex items-center gap-2 px-3 py-2 mt-1 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                    >
                      <User className="h-3.5 w-3.5 text-indigo-500" />
                      Edit Profile & Bio
                    </button>

                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-500/25 hover:from-indigo-500 hover:to-violet-500 active:scale-95 transition-all"
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Auto-accepted invite notice */}
      {acceptedInvitesCount > 0 && (
        <div className="bg-emerald-50 border-t border-emerald-200 px-4 py-1.5 text-center text-xs text-emerald-800 flex items-center justify-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
          <span>
            You joined <strong>{acceptedInvitesCount}</strong> project(s) via pending invitations.
          </span>
          <button
            onClick={clearAcceptedInvitesAlert}
            className="ml-2 font-bold underline hover:text-emerald-950"
          >
            Dismiss
          </button>
        </div>
      )}
    </header>
  );
}
