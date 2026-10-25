import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../firebase/config.ts';
import { handleFirestoreError, OperationType } from '../firebase/errors.ts';
import type { ProjectActivity, ActivityType } from '../types/index.ts';

export async function logProjectActivity(
  projectId: string,
  activity: {
    type: ActivityType;
    title: string;
    description?: string;
    actor: { uid: string; displayName?: string; email?: string };
  }
): Promise<void> {
  const activitiesRef = collection(db, 'projects', projectId, 'activities');
  const newActivityDoc = doc(activitiesRef);

  const data: Omit<ProjectActivity, 'id'> = {
    projectId,
    type: activity.type,
    title: activity.title,
    description: activity.description || '',
    actorId: activity.actor.uid,
    actorName: activity.actor.displayName || activity.actor.email?.split('@')[0] || 'Team Member',
    actorEmail: activity.actor.email || '',
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(newActivityDoc, data);
  } catch (err) {
    // We log but don't crash main operation if audit log fails
    console.warn('Notice while recording project activity:', err);
  }
}

export function subscribeProjectActivities(
  projectId: string,
  onActivities: (activities: ProjectActivity[]) => void,
  onError?: (err: any) => void
) {
  const activitiesRef = collection(db, 'projects', projectId, 'activities');
  const q = query(activitiesRef, orderBy('createdAt', 'desc'), limit(50));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: ProjectActivity[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ProjectActivity, 'id'>),
      }));
      onActivities(list);
    },
    (err) => {
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.LIST, `projects/${projectId}/activities`);
    }
  );
}

export function formatRelativeTime(dateString: string): string {
  const now = Date.now();
  const time = new Date(dateString).getTime();
  if (isNaN(time)) return 'Recently';

  const diffSeconds = Math.floor((now - time) / 1000);
  if (diffSeconds < 60) return 'Just now';
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(dateString).toLocaleDateString([], { month: 'short', day: 'numeric' });
}
