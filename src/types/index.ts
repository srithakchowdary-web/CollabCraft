export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  about?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  leaderId: string;
  leaderEmail: string;
  memberIds: string[];
  memberEmails?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Message {
  id: string;
  projectId: string;
  senderId: string;
  senderName: string;
  senderEmail?: string;
  text: string;
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  parentTaskId?: string | null;
  assigneeId?: string | null;
  assigneeEmail?: string | null;
  assigneeName?: string | null;
  deadline?: string | null;
  status: 'todo' | 'in_progress' | 'completed';
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Invite {
  id: string;
  projectId: string;
  projectTitle: string;
  invitedEmail: string;
  invitedBy: string;
  invitedByName?: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  updatedAt?: string;
}

export type ActivityType =
  | 'task_completed'
  | 'task_created'
  | 'task_status_changed'
  | 'member_invited'
  | 'member_joined'
  | 'chat_summarized'
  | 'tasks_extracted';

export interface ProjectActivity {
  id: string;
  projectId: string;
  type: ActivityType;
  title: string;
  description?: string;
  actorId: string;
  actorName: string;
  actorEmail?: string;
  createdAt: string;
}

export interface SuggestedTask {
  title: string;
  description?: string;
  suggestedAssigneeEmail?: string | null;
  suggestedAssigneeName?: string | null;
  deadline?: string | null;
  priority?: 'high' | 'medium' | 'low';
}

export interface ChatSummaryResult {
  summary: string;
  keyPoints: string[];
  decisions: string[];
  blockers?: string[];
}

export interface TaskReminder {
  taskId: string;
  taskTitle: string;
  projectTitle: string;
  projectId: string;
  deadline: string;
  assigneeName?: string;
  assigneeEmail?: string;
  status: 'todo' | 'in_progress';
  urgency: 'overdue' | 'due_today' | 'due_soon';
  daysDiff: number;
}
