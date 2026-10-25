import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  getDocs,
  arrayUnion,
  getDoc,
} from 'firebase/firestore';
import { db } from '../firebase/config.ts';
import { handleFirestoreError, OperationType } from '../firebase/errors.ts';
import type { Project, UserProfile, Invite } from '../types/index.ts';
import { logProjectActivity } from './activityService.ts';

export async function createProject(
  title: string,
  description: string,
  currentUser: { uid: string; email: string; displayName?: string }
): Promise<string> {
  const cleanTitle = title.trim();
  const cleanDesc = description.trim();
  const projectsRef = collection(db, 'projects');
  const newProjectDoc = doc(projectsRef);

  const newProject: Omit<Project, 'id'> = {
    title: cleanTitle,
    description: cleanDesc || 'No description provided.',
    leaderId: currentUser.uid,
    leaderEmail: currentUser.email.toLowerCase(),
    memberIds: [currentUser.uid],
    memberEmails: [currentUser.email.toLowerCase()],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(newProjectDoc, newProject);

    await logProjectActivity(newProjectDoc.id, {
      type: 'task_created', // initial project genesis log
      title: `${currentUser.displayName || 'Leader'} initialized project workspace`,
      description: `Project "${cleanTitle}" created with leader ${currentUser.email}`,
      actor: currentUser,
    });

    return newProjectDoc.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `projects/${newProjectDoc.id}`);
  }
}

export function subscribeUserProjects(
  userId: string,
  onProjects: (projects: Project[]) => void,
  onError?: (err: any) => void
) {
  const projectsRef = collection(db, 'projects');
  const q = query(projectsRef, where('memberIds', 'array-contains', userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const projects: Project[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Project, 'id'>),
      }));
      onProjects(projects);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, 'projects');
    }
  );
}

export async function inviteMemberByEmail(
  projectId: string,
  projectTitle: string,
  targetEmail: string,
  leader: { uid: string; displayName?: string; email?: string }
): Promise<{ status: 'added' | 'invited'; message: string; user?: UserProfile }> {
  const email = targetEmail.trim().toLowerCase();
  if (!email) throw new Error('Please enter a valid email address');

  try {
    // 1. Look up email in users collection
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const userSnap = await getDocs(q);

    if (!userSnap.empty) {
      // User found! Add directly to project
      const matchedUserDoc = userSnap.docs[0];
      const matchedUser = matchedUserDoc.data() as UserProfile;

      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        memberIds: arrayUnion(matchedUser.uid),
        memberEmails: arrayUnion(email),
        updatedAt: new Date().toISOString(),
      });

      await logProjectActivity(projectId, {
        type: 'member_joined',
        title: `${matchedUser.displayName || email} joined the project`,
        description: `Added directly by ${leader.displayName || 'Leader'}`,
        actor: leader,
      });

      return {
        status: 'added',
        message: `${matchedUser.displayName || email} has been added directly to the project!`,
        user: matchedUser,
      };
    } else {
      // User not found in users yet. Store pending invite
      const invitesRef = collection(db, 'invites');
      const newInviteRef = doc(invitesRef);
      const inviteData: Omit<Invite, 'id'> = {
        projectId,
        projectTitle,
        invitedEmail: email,
        invitedBy: leader.uid,
        invitedByName: leader.displayName || 'Project Leader',
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(newInviteRef, inviteData);

      await logProjectActivity(projectId, {
        type: 'member_invited',
        title: `${leader.displayName || 'Leader'} sent invite to ${email}`,
        description: `Pending invite stored. User will join automatically on signup.`,
        actor: leader,
      });

      return {
        status: 'invited',
        message: `Invitation saved! When ${email} signs up, they will automatically be joined to this project.`,
      };
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `projects/${projectId}/invites`);
  }
}

export function subscribeProjectInvites(
  projectId: string,
  onInvites: (invites: Invite[]) => void,
  onError?: (err: any) => void
) {
  const invitesRef = collection(db, 'invites');
  const q = query(invitesRef, where('projectId', '==', projectId));

  return onSnapshot(
    q,
    (snapshot) => {
      const invites: Invite[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Invite, 'id'>),
      }));
      onInvites(invites);
    },
    (err) => {
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.LIST, `invites`);
    }
  );
}

export async function fetchProjectMemberProfiles(memberIds: string[]): Promise<UserProfile[]> {
  const profiles: UserProfile[] = [];
  try {
    for (const id of memberIds) {
      const snap = await getDoc(doc(db, 'users', id));
      if (snap.exists()) {
        profiles.push(snap.data() as UserProfile);
      } else {
        profiles.push({
          uid: id,
          email: 'member@collabcraft.local',
          displayName: 'Team Member',
          about: '',
        });
      }
    }
  } catch (error) {
    console.warn('Error fetching member profiles:', error);
  }
  return profiles;
}

export async function deleteProject(projectId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'projects', projectId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `projects/${projectId}`);
  }
}
