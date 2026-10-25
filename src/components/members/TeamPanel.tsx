import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Mail,
  Crown,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import type { Project, UserProfile, Invite } from '../../types/index.ts';
import {
  inviteMemberByEmail,
  subscribeProjectInvites,
} from '../../services/projectService.ts';

interface TeamPanelProps {
  project: Project;
  members: UserProfile[];
  onMemberAdded?: () => void;
}

export function TeamPanel({ project, members, onMemberAdded }: TeamPanelProps) {
  const { currentUser } = useAuth();
  const isLeader = project.leaderId === currentUser?.uid;

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [pendingInvites, setPendingInvites] = useState<Invite[]>([]);

  // Listen to pending invites for this project
  useEffect(() => {
    const unsub = subscribeProjectInvites(project.id, (invs) => {
      setPendingInvites(invs);
    });
    return () => unsub();
  }, [project.id]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !currentUser || !isLeader) return;

    setInviting(true);
    setFeedback(null);

    try {
      const res = await inviteMemberByEmail(
        project.id,
        project.title,
        inviteEmail.trim(),
        {
          uid: currentUser.uid,
          displayName: currentUser.displayName || undefined,
        }
      );

      setFeedback({
        type: 'success',
        message: res.message,
      });
      setInviteEmail('');
      if (onMemberAdded) onMemberAdded();
    } catch (err: any) {
      console.error(err);
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to process invite',
      });
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Invite Member Card (Visible to Leader) */}
      {isLeader ? (
        <div className="rounded-2xl border border-indigo-200/80 bg-gradient-to-r from-indigo-50/70 via-purple-50/50 to-pink-50/40 p-5 shadow-sm">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
              <UserPlus className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Add Team Member by Email</h3>
              <p className="text-[11px] text-slate-500">
                Instantly connect existing teammates or send pending registrations
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-600 mb-4">
            If the user has an existing CollabCraft account, they will be added immediately. If not, a pending invite is securely stored and applied automatically the moment they sign up.
          </p>

          <form onSubmit={handleSendInvite} className="flex flex-col sm:flex-row gap-2.5 max-w-xl">
            <div className="relative flex-1">
              <Mail className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <button
              type="submit"
              disabled={inviting || !inviteEmail.trim()}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 active:scale-95 disabled:opacity-40 transition-all shrink-0"
            >
              <UserPlus className="h-3.5 w-3.5" />
              {inviting ? 'Sending...' : 'Invite Member'}
            </button>
          </form>

          {feedback && (
            <div
              className={`mt-3 flex items-center gap-2 rounded-xl p-3 text-xs ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-800 flex items-center gap-2.5 shadow-sm">
          <Crown className="h-4 w-4 text-amber-600 shrink-0" />
          <span>Only the Project Leader (<strong className="text-amber-900">{project.leaderEmail}</strong>) can invite new members to this group.</span>
        </div>
      )}

      {/* Active Members Grid */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/95 backdrop-blur-md p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Users className="h-4 w-4 text-indigo-600" />
            Project Members ({members.length})
          </h3>
          <span className="text-xs text-slate-500">Active Collaborators</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {members.map((member) => {
            const isUserLeader = member.uid === project.leaderId;
            return (
              <div
                key={member.uid}
                className="flex items-center gap-3.5 rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5 hover:bg-indigo-50/30 hover:border-indigo-200 hover:shadow-sm transition-all"
              >
                <img
                  src={
                    member.photoURL ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.uid}`
                  }
                  alt={member.displayName}
                  className="h-12 w-12 rounded-full border-2 border-indigo-200 bg-white object-cover shadow-sm shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {member.displayName}
                    </span>
                    {isUserLeader && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 border border-amber-300/80 px-2 py-0.5 text-[10px] font-bold text-amber-800 shrink-0">
                        <Crown className="h-3 w-3 text-amber-600" />
                        Leader
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 truncate">{member.email}</p>
                  {member.about && (
                    <p className="text-[11px] text-slate-600 truncate mt-0.5 italic">
                      "{member.about}"
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pending Invites List */}
      {pendingInvites.length > 0 && (
        <div className="rounded-2xl border border-slate-200/80 bg-white/95 backdrop-blur-md p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-amber-600" />
            Pending Email Invitations ({pendingInvites.filter((i) => i.status === 'pending').length})
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            These invitations will automatically activate as full project memberships as soon as the invited person creates an account.
          </p>

          <div className="space-y-2">
            {pendingInvites.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs hover:border-amber-200 transition-colors"
              >
                <div className="flex items-center gap-2.5 text-slate-800">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  <span className="font-semibold">{inv.invitedEmail}</span>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                  <span>Sent {new Date(inv.createdAt).toLocaleDateString()}</span>
                  <span
                    className={`rounded-md px-2 py-0.5 font-bold capitalize ${
                      inv.status === 'pending'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}
                  >
                    {inv.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
