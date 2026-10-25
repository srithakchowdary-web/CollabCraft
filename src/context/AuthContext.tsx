import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  type User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile as updateFirebaseProfile,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  arrayUnion,
} from 'firebase/firestore';
import { auth, db } from '../firebase/config.ts';
import { handleFirestoreError, OperationType } from '../firebase/errors.ts';
import type { UserProfile } from '../types/index.ts';
import { testConnection } from '../firebase/testConnection.ts';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  acceptedInvitesCount: number;
  clearAcceptedInvitesAlert: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [acceptedInvitesCount, setAcceptedInvitesCount] = useState(0);

  // Initial connection test
  useEffect(() => {
    testConnection();
  }, []);

  // Sync profile & process pending invitations
  const syncUserProfile = async (user: User, fallbackName?: string) => {
    const userDocRef = doc(db, 'users', user.uid);
    try {
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        setUserProfile(data);
      } else {
        const initialProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: fallbackName || user.displayName || user.email?.split('@')[0] || 'Team Member',
          photoURL: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
          about: 'New team collaborator on CollabCraft.',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, initialProfile);
        setUserProfile(initialProfile);
      }

      // Check and apply any pending invites for this email
      if (user.email) {
        await resolvePendingInvites(user.uid, user.email);
      }
    } catch (err: any) {
      if (err?.message?.includes('permission') || err?.code === 'permission-denied') {
        handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
      } else {
        console.warn('Firestore sync user notice (offline or connecting):', err?.message || err);
        const fallbackProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: fallbackName || user.displayName || user.email?.split('@')[0] || 'Team Member',
          photoURL: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
          about: 'Team collaborator on CollabCraft.',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setUserProfile((prev) => prev || fallbackProfile);
      }
    }
  };

  const resolvePendingInvites = async (uid: string, email: string) => {
    try {
      const invitesRef = collection(db, 'invites');
      const q = query(
        invitesRef,
        where('invitedEmail', '==', email.toLowerCase().trim()),
        where('status', '==', 'pending')
      );
      const snapshot = await getDocs(q);
      let count = 0;

      for (const inviteDoc of snapshot.docs) {
        const invite = inviteDoc.data();
        const projectId = invite.projectId;
        if (projectId) {
          // Add user to project memberIds and memberEmails
          const projectRef = doc(db, 'projects', projectId);
          await updateDoc(projectRef, {
            memberIds: arrayUnion(uid),
            memberEmails: arrayUnion(email.toLowerCase().trim()),
            updatedAt: new Date().toISOString(),
          });

          // Mark invite as accepted
          await updateDoc(doc(db, 'invites', inviteDoc.id), {
            status: 'accepted',
            updatedAt: new Date().toISOString(),
          });
          count++;
        }
      }

      if (count > 0) {
        setAcceptedInvitesCount(count);
      }
    } catch (error) {
      console.warn('Notice while checking pending invites:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          await syncUserProfile(user);
        } catch (err) {
          console.warn('Error syncing user profile on auth state change:', err);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), pass);
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    if (name.trim()) {
      await updateFirebaseProfile(cred.user, { displayName: name.trim() });
    }
    await syncUserProfile(cred.user, name.trim());
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    await syncUserProfile(result.user);
  };

  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!currentUser) return;
    const userDocRef = doc(db, 'users', currentUser.uid);
    const updated = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    try {
      await updateDoc(userDocRef, updated);
      setUserProfile((prev) => (prev ? { ...prev, ...updated } : null));

      if (data.displayName && data.displayName !== currentUser.displayName) {
        await updateFirebaseProfile(currentUser, { displayName: data.displayName });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  };

  const clearAcceptedInvitesAlert = () => setAcceptedInvitesCount(0);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        loginWithEmail,
        signUpWithEmail,
        loginWithGoogle,
        logout,
        updateUserProfile,
        acceptedInvitesCount,
        clearAcceptedInvitesAlert,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
