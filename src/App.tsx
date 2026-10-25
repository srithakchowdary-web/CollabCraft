import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { AuthModal } from './components/auth/AuthModal.tsx';
import { ProfileModal } from './components/profile/ProfileModal.tsx';
import { CreateProjectModal } from './components/projects/CreateProjectModal.tsx';
import { ProjectList } from './components/projects/ProjectList.tsx';
import { ProjectWorkspace } from './components/projects/ProjectWorkspace.tsx';
import type { Project } from './types/index.ts';
import { subscribeUserProjects } from './services/projectService.ts';
import { FolderKanban, ShieldCheck, Zap, ArrowRight, Sparkles } from 'lucide-react';

function AppContent() {
  const { currentUser, loading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false);

  // Subscribe to current user's projects
  useEffect(() => {
    if (!currentUser) {
      setProjects([]);
      setActiveProject(null);
      return;
    }

    setLoadingProjects(true);
    const unsubscribe = subscribeUserProjects(
      currentUser.uid,
      (userProjects) => {
        setProjects(userProjects);
        setLoadingProjects(false);

        // Keep active project in sync if it exists in updated list
        if (activeProject) {
          const fresh = userProjects.find((p) => p.id === activeProject.id);
          if (fresh) {
            setActiveProject(fresh);
          }
        }
      },
      (err) => {
        console.error('Error fetching user projects:', err);
        setLoadingProjects(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 text-slate-800">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent" />
          <p className="text-xs font-semibold text-slate-500">Loading CollabCraft...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen ambient-gradient text-slate-900 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Top Studio Navigation */}
      <Navbar
        projects={projects}
        activeProject={activeProject}
        onSelectProject={(p) => setActiveProject(p)}
        onOpenProfile={() => setProfileModalOpen(true)}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenCreateProject={() => setCreateProjectModalOpen(true)}
        overdueCount={0}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {!currentUser ? (
          // Radiant Aesthetic Landing Hero
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-6">
              <span className="text-xs font-bold tracking-wider uppercase text-indigo-600 block">
                ✦ Next-Gen Collaborative Workspace
              </span>

              <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 leading-[1.1]">
                Work together with joy, ship with velocity, and{' '}
                <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-500 bg-clip-text text-transparent">
                  supercharge with Gemini AI
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                CollabCraft empowers teams with real-time chat rooms, interactive Kanban boards, nested subtasks, visual progress charts, live audit logs, and server-side Gemini AI for chat summarization & task extraction.
              </p>

              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-500 px-7 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 hover:opacity-95 active:scale-95 transition-all"
                >
                  Enter Workspace
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Vibrant Feature Highlights Grid */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-3xl border border-indigo-100 bg-white/90 p-7 shadow-sm colorful-card-glow hover:border-indigo-200 hover:-translate-y-0.5 transition-all">
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center mb-4 shadow-md shadow-indigo-500/20">
                  <FolderKanban className="h-5 w-5" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900 mb-2">Projects & Email Invites</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Organize team spaces with leaders and members. Invite teammates by email with instant addition or stored pending invites that activate upon signup.
                </p>
              </div>

              <div className="rounded-3xl border border-violet-100 bg-white/90 p-7 shadow-sm colorful-card-glow hover:border-violet-200 hover:-translate-y-0.5 transition-all">
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 text-white flex items-center justify-center mb-4 shadow-md shadow-pink-500/20">
                  <Zap className="h-5 w-5" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900 mb-2">Live Chat & Gemini AI</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Real-time project discussions with username and date filtering. Leverage server-side Gemini to summarize chats and extract action items directly into tasks.
                </p>
              </div>

              <div className="rounded-3xl border border-emerald-100 bg-white/90 p-7 shadow-sm colorful-card-glow hover:border-emerald-200 hover:-translate-y-0.5 transition-all">
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center mb-4 shadow-md shadow-emerald-500/20">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900 mb-2">Kanban, Subtasks & Activity</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Dual Kanban and Tree views with server-enforced security rules. Live chronological audit trail and velocity dashboards track every deliverable.
                </p>
              </div>
            </div>
          </div>
        ) : activeProject ? (
          // Active Project Workspace
          <ProjectWorkspace
            project={activeProject}
            onBack={() => setActiveProject(null)}
            onProjectDeleted={() => {
              setActiveProject(null);
            }}
          />
        ) : (
          // Home View: My Projects
          <ProjectList
            projects={projects}
            loading={loadingProjects}
            onSelectProject={(p) => setActiveProject(p)}
            onOpenCreateModal={() => setCreateProjectModalOpen(true)}
          />
        )}
      </main>

      {/* Global Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />

      <CreateProjectModal
        isOpen={createProjectModalOpen}
        onClose={() => setCreateProjectModalOpen(false)}
        onProjectCreated={(projectId) => {
          setTimeout(() => {
            const found = projects.find((p) => p.id === projectId);
            if (found) setActiveProject(found);
          }, 400);
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
