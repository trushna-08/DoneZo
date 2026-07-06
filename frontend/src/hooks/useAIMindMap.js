import { useState } from 'react';

function buildFallbackMindMap(task) {
  const title = task.title.substring(0, 25);
  const dueText = task.dueDate ? `Due: ${task.dueDate}` : 'Set finish point';
  const descriptionHint = task.description
    ? task.description.substring(0, 24)
    : 'Define output';

  return {
    center: title,
    branches: [
      {
        label: 'Outcome',
        color: 'purple',
        children: [
          { label: descriptionHint },
          { label: dueText }
        ]
      },
      {
        label: 'First Steps',
        color: 'blue',
        children: [
          { label: 'Open task board' },
          { label: 'Finish smallest part' },
          { label: 'Update status' }
        ]
      },
      {
        label: 'Quality Check',
        color: 'amber',
        children: [
          { label: 'Review requirements' },
          { label: 'Fix visible gaps' }
        ]
      },
      {
        label: 'Completion',
        color: 'green',
        children: [
          { label: 'Submit work' },
          { label: 'Mark task done' }
        ]
      }
    ]
  };
}

export function useAIMindMap() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generate = async (task) => {
    setLoading(true);
    setError(null);
    setData(null);

    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY || '';


    const systemPrompt = `You are a productivity expert. When given a task, respond ONLY with a JSON object, no markdown, no explanation. The JSON must have this exact shape:
{
  "center": "Task title (max 25 chars)",
  "branches": [
    {
      "label": "Branch name (max 20 chars)",
      "color": one of: "purple" | "teal" | "coral" | "blue" | "amber" | "green",
      "children": [
        { "label": "Subtask (max 25 chars)" }
      ]
    }
  ]
}
Generate 4-5 branches. Each branch should represent a key dimension for completing the task (e.g. Research, Design, Implementation, Testing, Resources). Each branch has 2-4 children. Labels must be concise action phrases.`;

    const userMessage = `Generate a completion mind map for this task: ${task.title}. Priority: ${task.priority}.${task.description ? ` Description: ${task.description}` : ''}`;

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const response = await fetch(`${API_URL}/api/copilot/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          apiKey,
          systemPrompt: systemPrompt,
          messages: [
            { role: 'user', content: userMessage }
          ]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate mind map');
      }

      const responseData = await response.json();
      let textContent = responseData.content[0].text;

      // Clean markdown fences if they exist
      textContent = textContent.replace(/```json/gi, '').replace(/```/g, '').trim();

      try {
        const parsedJson = JSON.parse(textContent);
        setData(parsedJson);
      } catch (parseErr) {
        setData(buildFallbackMindMap(task));
      }

    } catch (err) {
      console.error('Mind map generation error:', err);
      setData(buildFallbackMindMap(task));
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, generate };
}
