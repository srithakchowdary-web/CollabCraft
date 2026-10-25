import type { IncomingMessage, ServerResponse } from 'http';
import { summarizeChatServer, extractTasksServer } from './aiService.ts';

export async function handleApiRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = req.url || '';
  if (!url.startsWith('/api/')) {
    return false;
  }

  // Helper to parse JSON body
  const readBody = (): Promise<any> => {
    return new Promise((resolve) => {
      let data = '';
      req.on('data', (chunk) => {
        data += chunk;
      });
      req.on('end', () => {
        try {
          resolve(data ? JSON.parse(data) : {});
        } catch {
          resolve({});
        }
      });
    });
  };

  const sendJson = (status: number, data: any) => {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
  };

  try {
    if (url === '/api/ai/summarize-chat' && req.method === 'POST') {
      const body = await readBody();
      const { messages, projectTitle } = body;
      const result = await summarizeChatServer(messages, projectTitle || 'Project');
      sendJson(200, result);
      return true;
    }

    if (url === '/api/ai/extract-tasks' && req.method === 'POST') {
      const body = await readBody();
      const { messages, projectMembers, projectTitle } = body;
      const result = await extractTasksServer(messages, projectMembers || [], projectTitle || 'Project');
      sendJson(200, result);
      return true;
    }

    if (url === '/api/reminders/check' && req.method === 'POST') {
      const body = await readBody();
      const { tasks, projectTitle, projectId } = body;
      
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const reminders: any[] = [];

      if (Array.isArray(tasks)) {
        for (const task of tasks) {
          if (task.status === 'completed' || !task.deadline) continue;

          const deadlineDate = new Date(task.deadline);
          deadlineDate.setHours(0, 0, 0, 0);
          const diffTime = deadlineDate.getTime() - now.getTime();
          const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays < 0) {
            reminders.push({
              taskId: task.id,
              taskTitle: task.title,
              projectTitle: projectTitle || 'Project',
              projectId: projectId || task.projectId,
              deadline: task.deadline,
              assigneeName: task.assigneeName,
              assigneeEmail: task.assigneeEmail,
              status: task.status,
              urgency: 'overdue',
              daysDiff: Math.abs(diffDays),
            });
          } else if (diffDays === 0) {
            reminders.push({
              taskId: task.id,
              taskTitle: task.title,
              projectTitle: projectTitle || 'Project',
              projectId: projectId || task.projectId,
              deadline: task.deadline,
              assigneeName: task.assigneeName,
              assigneeEmail: task.assigneeEmail,
              status: task.status,
              urgency: 'due_today',
              daysDiff: 0,
            });
          } else if (diffDays <= 2) {
            reminders.push({
              taskId: task.id,
              taskTitle: task.title,
              projectTitle: projectTitle || 'Project',
              projectId: projectId || task.projectId,
              deadline: task.deadline,
              assigneeName: task.assigneeName,
              assigneeEmail: task.assigneeEmail,
              status: task.status,
              urgency: 'due_soon',
              daysDiff: diffDays,
            });
          }
        }
      }

      sendJson(200, {
        checkedAt: new Date().toISOString(),
        totalTasksChecked: tasks?.length || 0,
        reminders,
      });
      return true;
    }

    if (url === '/api/reminders/simulate-notification' && req.method === 'POST') {
      const body = await readBody();
      const { reminder, recipientEmail } = body;
      // Simulated cloud dispatch
      sendJson(200, {
        success: true,
        dispatchedAt: new Date().toISOString(),
        recipient: recipientEmail || reminder?.assigneeEmail || 'team@example.com',
        message: `Reminder sent for "${reminder?.taskTitle || 'Task'}" (${reminder?.urgency})`,
      });
      return true;
    }

    sendJson(404, { error: 'API route not found' });
    return true;
  } catch (error: any) {
    console.error('API Error:', error);
    sendJson(500, { error: error?.message || 'Internal server error' });
    return true;
  }
}
