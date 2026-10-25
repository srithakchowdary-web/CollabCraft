import type { Message, SuggestedTask, ChatSummaryResult, TaskReminder, Task } from '../types/index.ts';

export async function requestChatSummary(
  messages: Message[],
  projectTitle: string
): Promise<ChatSummaryResult> {
  const res = await fetch('/api/ai/summarize-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: messages.map((m) => ({
        senderName: m.senderName,
        text: m.text,
        createdAt: m.createdAt,
      })),
      projectTitle,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to summarize chat');
  }

  return await res.json();
}

export async function requestExtractTasks(
  messages: Message[],
  projectMembers: Array<{ uid?: string; displayName: string; email: string }>,
  projectTitle: string
): Promise<{ suggestedTasks: SuggestedTask[] }> {
  const res = await fetch('/api/ai/extract-tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: messages.map((m) => ({
        senderName: m.senderName,
        text: m.text,
      })),
      projectMembers,
      projectTitle,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to extract tasks from chat');
  }

  return await res.json();
}

export async function checkRemindersApi(
  tasks: Task[],
  projectTitle: string,
  projectId: string
): Promise<{ reminders: TaskReminder[]; totalTasksChecked: number; checkedAt: string }> {
  const res = await fetch('/api/reminders/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tasks,
      projectTitle,
      projectId,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to check deadline reminders');
  }

  return await res.json();
}

export async function sendSimulatedNotification(
  reminder: TaskReminder,
  recipientEmail?: string
): Promise<{ success: boolean; message: string; dispatchedAt: string }> {
  const res = await fetch('/api/reminders/simulate-notification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reminder,
      recipientEmail,
    }),
  });

  if (!res.ok) {
    throw new Error('Failed to dispatch notification');
  }

  return await res.json();
}
