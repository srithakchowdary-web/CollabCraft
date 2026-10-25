import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase/config.ts';
import { handleFirestoreError, OperationType } from '../firebase/errors.ts';
import type { Task, SuggestedTask } from '../types/index.ts';
import { logProjectActivity } from './activityService.ts';

export async function createTask(
  projectId: string,
  task: {
    title: string;
    description?: string;
    parentTaskId?: string | null;
    assigneeId?: string | null;
    assigneeEmail?: string | null;
    assigneeName?: string | null;
    deadline?: string | null;
    status?: 'todo' | 'in_progress' | 'completed';
  },
  currentUser: { uid: string; displayName?: string; email?: string }
): Promise<string> {
  const cleanTitle = task.title.trim();
  if (!cleanTitle) throw new Error('Task title cannot be empty');

  const tasksRef = collection(db, 'projects', projectId, 'tasks');
  const newTaskDoc = doc(tasksRef);

  const newTaskData: Omit<Task, 'id'> = {
    projectId,
    title: cleanTitle,
    description: task.description?.trim() || '',
    parentTaskId: task.parentTaskId || null,
    assigneeId: task.assigneeId || null,
    assigneeEmail: task.assigneeEmail || null,
    assigneeName: task.assigneeName || null,
    deadline: task.deadline || null,
    status: task.status || 'todo',
    createdBy: currentUser.uid,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(newTaskDoc, newTaskData);

    // Record activity log
    await logProjectActivity(projectId, {
      type: 'task_created',
      title: `${currentUser.displayName || 'Leader'} created task "${cleanTitle}"`,
      description: task.assigneeName ? `Assigned to ${task.assigneeName}` : 'Unassigned',
      actor: currentUser,
    });

    return newTaskDoc.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `projects/${projectId}/tasks/${newTaskDoc.id}`);
  }
}

export async function updateTaskStatus(
  projectId: string,
  taskId: string,
  status: 'todo' | 'in_progress' | 'completed',
  taskTitle: string = 'Task',
  currentUser?: { uid: string; displayName?: string; email?: string }
): Promise<void> {
  const taskRef = doc(db, 'projects', projectId, 'tasks', taskId);
  try {
    await updateDoc(taskRef, {
      status,
      updatedAt: new Date().toISOString(),
    });

    // Record activity log
    if (currentUser) {
      const isCompleted = status === 'completed';
      await logProjectActivity(projectId, {
        type: isCompleted ? 'task_completed' : 'task_status_changed',
        title: isCompleted
          ? `${currentUser.displayName || 'Member'} completed task "${taskTitle}"`
          : `${currentUser.displayName || 'Member'} updated "${taskTitle}" status to ${status.replace('_', ' ')}`,
        description: `Task status marked as ${status.replace('_', ' ')}`,
        actor: currentUser,
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `projects/${projectId}/tasks/${taskId}`);
  }
}

export async function updateTaskDetails(
  projectId: string,
  taskId: string,
  updates: Partial<Omit<Task, 'id' | 'projectId' | 'createdBy' | 'createdAt'>>
): Promise<void> {
  const taskRef = doc(db, 'projects', projectId, 'tasks', taskId);
  try {
    await updateDoc(taskRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `projects/${projectId}/tasks/${taskId}`);
  }
}

export async function deleteTask(projectId: string, taskId: string, allTasks?: Task[]): Promise<void> {
  const taskRef = doc(db, 'projects', projectId, 'tasks', taskId);
  try {
    await deleteDoc(taskRef);

    // Also remove children subtasks if parent is deleted
    if (allTasks) {
      const children = allTasks.filter((t) => t.parentTaskId === taskId);
      for (const child of children) {
        await deleteDoc(doc(db, 'projects', projectId, 'tasks', child.id));
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `projects/${projectId}/tasks/${taskId}`);
  }
}

export function subscribeProjectTasks(
  projectId: string,
  onTasks: (tasks: Task[]) => void,
  onError?: (err: any) => void
) {
  const tasksRef = collection(db, 'projects', projectId, 'tasks');
  const q = query(tasksRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const tasks: Task[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Task, 'id'>),
      }));
      onTasks(tasks);
    },
    (err) => {
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.LIST, `projects/${projectId}/tasks`);
    }
  );
}

export async function batchCreateSuggestedTasks(
  projectId: string,
  tasks: SuggestedTask[],
  currentUser: { uid: string; displayName?: string; email?: string }
): Promise<number> {
  let count = 0;
  for (const item of tasks) {
    await createTask(
      projectId,
      {
        title: item.title,
        description: item.description,
        assigneeEmail: item.suggestedAssigneeEmail,
        assigneeName: item.suggestedAssigneeName,
        deadline: item.deadline,
        status: 'todo',
      },
      currentUser
    );
    count++;
  }

  // Record batch extraction activity
  await logProjectActivity(projectId, {
    type: 'tasks_extracted',
    title: `${currentUser.displayName || 'Leader'} added ${count} AI-extracted task(s)`,
    description: `Extracted from chat discussion and added to project board`,
    actor: currentUser,
  });

  return count;
}
