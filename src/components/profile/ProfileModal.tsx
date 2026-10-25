import React, { useState } from 'react';
import { User, Image, AlignLeft, X, Save, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { currentUser, userProfile, updateUserProfile } = useAuth();

  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [photoURL, setPhotoURL] = useState(
    userProfile?.photoURL || (currentUser ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.uid}` : '')
  );
  const [about, setAbout] = useState(userProfile?.about || '');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !currentUser) return null;

  const handleRandomAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(7);
    setPhotoURL(`https://api.dicebear.com/7.x/avataaars/svg?seed=${randomSeed}`);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSavedSuccess(false);

    try {
      await updateUserProfile({
        displayName: displayName.trim() || 'Team Member',
        photoURL: photoURL.trim(),
        about: about.trim(),
      });
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
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

        <div className="flex items-center gap-3.5 mb-6">
          <div className="relative group">
            <img
              src={photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.uid}`}
              alt="Avatar preview"
              className="h-16 w-16 rounded-2xl border-2 border-indigo-500 bg-white object-cover shadow-md"
            />
            <button
              type="button"
              onClick={handleRandomAvatar}
              title="Generate new avatar seed"
              className="absolute -bottom-1 -right-1 rounded-full bg-white p-1 text-slate-600 border border-slate-200 hover:text-indigo-600 hover:bg-indigo-50 shadow-sm transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
            </button>
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Your Profile & Bio</h2>
            <p className="text-xs text-slate-500">{currentUser.email}</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
            {error}
          </div>
        )}

        {savedSuccess && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Profile successfully updated!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Display Name</label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                required
                maxLength={100}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your full name"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">Avatar Image URL</label>
              <button
                type="button"
                onClick={handleRandomAvatar}
                className="text-[11px] text-indigo-600 hover:text-indigo-700 font-semibold"
              >
                Randomize avatar
              </button>
            </div>
            <div className="relative">
              <Image className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="url"
                maxLength={500}
                value={photoURL}
                onChange={(e) => setPhotoURL(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">About / Bio</label>
            <div className="relative">
              <textarea
                rows={3}
                maxLength={500}
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                placeholder="Tell your team about your skills, focus area, and responsibilities..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none"
              />
            </div>
            <span className="block text-right text-[10px] text-slate-400 mt-0.5">
              {about.length}/500
            </span>
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
              disabled={saving}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-500/25 active:scale-95 disabled:opacity-50 transition-all"
            >
              <Save className="h-3.5 w-3.5" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
