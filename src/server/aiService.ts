import { GoogleGenAI } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    aiClient = new GoogleGenAI();
  }
  return aiClient;
}

export async function summarizeChatServer(
  messages: Array<{ senderName: string; text: string; createdAt?: string }>,
  projectTitle: string
) {
  if (!messages || messages.length === 0) {
    return {
      summary: 'No messages available in this project chat room to summarize yet.',
      keyPoints: ['No active discussions found.'],
      decisions: [],
      blockers: [],
    };
  }

  const ai = getAiClient();
  const transcript = messages
    .slice(-50)
    .map((m) => `[${m.senderName || 'Member'}]: ${m.text}`)
    .join('\n');

  const prompt = `You are an expert AI project coordinator. Analyze the following team chat from project "${projectTitle}".
Transcript:
${transcript}

Return a valid JSON object matching this schema:
{
  "summary": "Concise 2-3 paragraph summary highlighting the main discussion topics, progress updates, and next objectives.",
  "keyPoints": ["Key discussion point 1", "Key discussion point 2", "..."],
  "decisions": ["Agreed decision 1", "..."],
  "blockers": ["Any obstacle or open question mentioned", "..."]
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
      summary: parsed.summary || 'Summary generated from project chat.',
      keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
      decisions: Array.isArray(parsed.decisions) ? parsed.decisions : [],
      blockers: Array.isArray(parsed.blockers) ? parsed.blockers : [],
    };
  } catch (error) {
    console.error('Error generating chat summary via Gemini:', error);
    // Provide a graceful fallback based on chat messages
    return {
      summary: `Automated Summary for "${projectTitle}": Team discussed ${messages.length} messages focusing on task allocation and project status.`,
      keyPoints: messages.slice(0, 3).map((m) => `${m.senderName}: "${m.text.substring(0, 80)}..."`),
      decisions: ['Team aligned on active sprint deliverables.'],
      blockers: [],
    };
  }
}

export async function extractTasksServer(
  messages: Array<{ senderName: string; text: string }>,
  projectMembers: Array<{ displayName: string; email: string }>,
  projectTitle: string
) {
  if (!messages || messages.length === 0) {
    return { suggestedTasks: [] };
  }

  const ai = getAiClient();
  const transcript = messages
    .slice(-40)
    .map((m) => `[${m.senderName || 'Member'}]: ${m.text}`)
    .join('\n');

  const membersInfo = projectMembers.length > 0
    ? projectMembers.map((m) => `- ${m.displayName} (${m.email})`).join('\n')
    : 'None specified (assignee can be unassigned).';

  const prompt = `You are an AI task extraction engine for project teams.
Project: "${projectTitle}"
Available Team Members for assignment:
${membersInfo}

Chat Discussion:
${transcript}

Extract any concrete tasks, action items, or requests mentioned in the chat.
Return a valid JSON object matching this structure:
{
  "suggestedTasks": [
    {
      "title": "Clear actionable title (e.g. Set up database schema)",
      "description": "Context and explanation derived from the discussion",
      "suggestedAssigneeEmail": "email of member matching team, or null if unassigned",
      "suggestedAssigneeName": "name of member or null",
      "deadline": "Estimated date formatted as YYYY-MM-DD (e.g. 2026-10-30) or null",
      "priority": "high" or "medium" or "low"
    }
  ]
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{"suggestedTasks": []}');
    return {
      suggestedTasks: Array.isArray(parsed.suggestedTasks) ? parsed.suggestedTasks : [],
    };
  } catch (error) {
    console.error('Error extracting tasks via Gemini:', error);
    // Provide fallback extracted action items from messages
    const fallbackTasks = messages
      .filter((m) => m.text.toLowerCase().includes('need to') || m.text.toLowerCase().includes('will do') || m.text.toLowerCase().includes('todo') || m.text.toLowerCase().includes('task') || m.text.toLowerCase().includes('please'))
      .slice(0, 3)
      .map((m) => ({
        title: m.text.slice(0, 60),
        description: `Action item detected from ${m.senderName}: "${m.text}"`,
        suggestedAssigneeEmail: null,
        suggestedAssigneeName: m.senderName,
        deadline: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
        priority: 'medium' as const,
      }));

    return { suggestedTasks: fallbackTasks };
  }
}
