import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ListTodo, PlusCircle, Split, CheckCircle2, Calendar, ArrowLeft, Loader2 } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useToast } from '../context/ToastContext';

const AIAssistantPage = () => {
  const { tasks, setTasks } = useOutletContext();
  const { addToast } = useToast();
  const [messages, setMessages] = useState(() => [
    {
      id: 1,
      role: 'assistant',
      content: "Hi! I'm your guided productivity assistant. What would you like to do today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY || '';
  
  const [currentFlow, setCurrentFlow] = useState('MAIN_MENU');
  const [tempData, setTempData] = useState({});
  const [customTaskName, setCustomTaskName] = useState('');
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, currentFlow]);

  const addMessage = (role, content) => {
    setMessages(prev => [...prev, {
      id: Date.now() + Math.random(),
      role,
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
  };

  const handleOptionClick = async (option) => {

    addMessage('user', option.label);

    if (option.action === 'GO_BACK') {
      setCurrentFlow('MAIN_MENU');
      setTempData({});
      setTimeout(() => addMessage('assistant', "What else can I help you with?"), 300);
      return;
    }

    // Process based on current flow
    switch (currentFlow) {
      case 'MAIN_MENU':
        if (option.id === 'SHOW_TASKS') {
          const pending = tasks.filter(t => t.status !== 'done');
          const taskList = pending.length > 0 
            ? pending.map(t => `- **${t.title}** (${t.priority} priority)`).join('\n')
            : "You have no pending tasks right now.";
          setTimeout(() => {
            addMessage('assistant', `Here are your current tasks:\n\n${taskList}`);
          }, 300);
        } else if (option.id === 'ADD_TASK') {
          setCurrentFlow('ADD_TASK_NAME');
          setTimeout(() => addMessage('assistant', "What kind of task would you like to add? Please select from the templates below:"), 300);
        } else if (option.id === 'BREAK_TASK') {
          setCurrentFlow('SELECT_TASK_BREAK');
          setTimeout(() => addMessage('assistant', "Which task would you like me to break down into smaller steps?"), 300);
        } else if (option.id === 'SCHEDULE_MEETING') {
          setCurrentFlow('SCHEDULE_MEETING_SELECT_TASK');
          setTimeout(() => addMessage('assistant', "Which meeting or task would you like to schedule?"), 300);
        } else if (option.id === 'MARK_COMPLETED') {
          setCurrentFlow('SELECT_TASK_COMPLETE');
          setTimeout(() => addMessage('assistant', "Great! Which task did you complete?"), 300);
        }
        break;

      case 'ADD_TASK_NAME':
        if (option.id === 'TPL_CUSTOM') {
          setCurrentFlow('ADD_TASK_CUSTOM_NAME');
          setTimeout(() => addMessage('assistant', "Please type the name of your new task below:"), 300);
        } else {
          setTempData({ ...tempData, title: option.label });
          setCurrentFlow('ADD_TASK_PRIORITY');
          setTimeout(() => addMessage('assistant', `Got it! "${option.label}". What priority should I set for this?`), 300);
        }
        break;

      case 'ADD_TASK_PRIORITY':
        const newTask = {
          id: String(Date.now()),
          title: tempData.title,
          description: 'Added via Task Copilot',
          status: 'todo',
          priority: option.value,
          assignee: 'You',
          dueDate: 'Today',
          createdAt: Date.now()
        };
        setTasks(prev => [newTask, ...prev]);
        setTempData({});
        setCurrentFlow('MAIN_MENU');
        addToast(`"${tempData.title}" added as ${option.value} priority.`, 'success');
        setTimeout(() => addMessage('assistant', `I have added **"${tempData.title}"** as a ${option.value} priority task. What's next?`), 300);
        break;

      case 'SELECT_TASK_COMPLETE':
        setTasks(prev => prev.map(t => t.id === option.value ? { ...t, status: 'done', completedAt: Date.now() } : t));
        setCurrentFlow('MAIN_MENU');
        addToast(`"${option.label}" marked as completed.`, 'success');
        setTimeout(() => addMessage('assistant', `Awesome! I've marked **"${option.label}"** as completed. Anything else?`), 300);
        break;

      case 'SCHEDULE_MEETING_SELECT_TASK':
        setTempData({ ...tempData, taskId: option.value, taskTitle: option.label });
        setCurrentFlow('SCHEDULE_MEETING_SELECT_DATE');
        setTimeout(() => addMessage('assistant', `When would you like to schedule **"${option.label}"**?`), 300);
        break;

      case 'SCHEDULE_MEETING_SELECT_DATE':
        setTasks(prev => prev.map(t => t.id === tempData.taskId ? { ...t, dueDate: option.value } : t));
        const tTitle = tempData.taskTitle;
        setTempData({});
        setCurrentFlow('MAIN_MENU');
        setTimeout(() => addMessage('assistant', `Done! I've scheduled **"${tTitle}"** for ${option.label}. What's next?`), 300);
        break;

      case 'SELECT_TASK_BREAK':
        setCurrentFlow('MAIN_MENU'); // Reset UI to main menu while processing
        await handleAIBreakdown(option);
        break;

      default:
        setCurrentFlow('MAIN_MENU');
        break;
    }
  };

  const handleCustomTaskSubmit = () => {
    if (customTaskName.trim()) {
      addMessage('user', customTaskName.trim());
      setTempData({ ...tempData, title: customTaskName.trim() });
      setCustomTaskName('');
      setCurrentFlow('ADD_TASK_PRIORITY');
      setTimeout(() => addMessage('assistant', `Got it! "${customTaskName.trim()}". What priority should I set for this?`), 300);
    }
  };

  const handleAIBreakdown = async (option) => {
    const targetTask = tasks.find(t => t.id === option.value);
    if (!targetTask) return;

    setIsLoading(true);
    addMessage('assistant', `Give me a moment to analyze **"${targetTask.title}"** and break it down...`);

    if (!apiKey) {
      setTimeout(() => {
        addMessage(
          'assistant',
          `Here is a simple breakdown for **"${targetTask.title}"**:` +
          `\n\n- Clarify the expected outcome.` +
          `\n- Gather any notes, links, or materials you need.` +
          `\n- Work on the smallest first step for 15-25 minutes.` +
          `\n- Review your progress and update the task status.` +
          `\n- Mark it complete when the main outcome is finished.` +
          `\n\nFor AI-generated breakdowns, set VITE_ANTHROPIC_API_KEY in the environment.`
        );
        setIsLoading(false);
      }, 400);
      return;
    }

    const systemPrompt = `You are the DoneZo AI Productivity Assistant. Your job is to break down a specific task into 3-5 smaller, actionable sub-tasks.
Task to break down:
Title: ${targetTask.title}
Description: ${targetTask.description || 'No description provided'}

Provide the response as a bulleted markdown list of steps. Do NOT wrap it in JSON. Make it concise and actionable.`;

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const response = await fetch(`${API_URL}/api/copilot/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          apiKey: apiKey,
          systemPrompt: systemPrompt,
          messages: [{ role: 'user', content: `Break down the task: ${targetTask.title}` }]
        })
      });

      if (!response.ok) {
        const errData = await response.text();
        throw new Error(errData || `API request failed with status ${response.status}`);
      }

      const responseData = await response.json();
      const textResponse = responseData.content[0].text;

      addMessage('assistant', `Here are the steps to complete **"${targetTask.title}"**:\n\n${textResponse}\n\nWhat would you like to do next?`);

    } catch (error) {
      console.error('AI Breakdown Error:', error);
      addMessage('assistant', `Error breaking down task: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Render options based on current state
  const renderOptions = () => {


    let options = [];

    switch (currentFlow) {
      case 'MAIN_MENU':
        options = [
          { id: 'SHOW_TASKS', label: 'Show Tasks', icon: ListTodo },
          { id: 'ADD_TASK', label: 'Add New Task', icon: PlusCircle },
          { id: 'BREAK_TASK', label: 'Break Task into Steps', icon: Split },
          { id: 'SCHEDULE_MEETING', label: 'Schedule Meeting', icon: Calendar },
          { id: 'MARK_COMPLETED', label: 'Mark Task as Completed', icon: CheckCircle2 }
        ];
        break;

      case 'ADD_TASK_NAME':
        options = [
          { id: 'TPL_REVIEW', label: 'Review Code/PR' },
          { id: 'TPL_DSA', label: 'Study Data Structures & Algorithms' },
          { id: 'TPL_FOLLOWUP', label: 'Follow up with Client' },
          { id: 'TPL_DOCS', label: 'Write Documentation' },
          { id: 'TPL_PLANNING', label: 'Weekly Planning' },
          { id: 'TPL_BUG', label: 'Fix Critical Bug' },
          { id: 'TPL_CUSTOM', label: 'Custom Task' },
          { action: 'GO_BACK', label: 'Go Back' }
        ];
        break;

      case 'ADD_TASK_PRIORITY':
        options = [
          { id: 'PRI_HIGH', label: 'High Priority', value: 'high' },
          { id: 'PRI_MED', label: 'Medium Priority', value: 'medium' },
          { id: 'PRI_LOW', label: 'Low Priority', value: 'low' },
          { action: 'GO_BACK', label: 'Cancel' }
        ];
        break;

      case 'SELECT_TASK_COMPLETE':
      case 'SELECT_TASK_BREAK':
      case 'SCHEDULE_MEETING_SELECT_TASK':
        const pendingTasks = tasks.filter(t => t.status !== 'done');
        options = pendingTasks.map(t => ({ id: `TASK_${t.id}`, label: t.title, value: t.id }));
        if (options.length === 0) {
          options = [{ id: 'NO_TASKS', label: 'No pending tasks found', disabled: true }];
        }
        options.push({ action: 'GO_BACK', label: 'Go Back' });
        break;

      case 'SCHEDULE_MEETING_SELECT_DATE':
        options = [
          { id: 'DATE_TODAY', label: 'Today', value: 'Today' },
          { id: 'DATE_TOMORROW', label: 'Tomorrow', value: 'Tomorrow' },
          { id: 'DATE_NEXT_WEEK', label: 'Next Week', value: 'Next Week' },
          { action: 'GO_BACK', label: 'Cancel' }
        ];
        break;

      default:
        options = [{ action: 'GO_BACK', label: 'Go Back' }];
        break;
    }

    if (currentFlow === 'ADD_TASK_CUSTOM_NAME') {
      return (
        <div className="flex flex-col gap-3 pt-2">
          <div className="flex gap-2 w-full">
            <input
              type="text"
              placeholder="e.g. Call the bank, Buy groceries..."
              value={customTaskName}
              onChange={(e) => setCustomTaskName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCustomTaskSubmit()}
              autoFocus
              className="flex-1 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handleCustomTaskSubmit}
              disabled={!customTaskName.trim()}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
            >
              Submit
            </button>
          </div>
          <div>
            <button
              onClick={() => handleOptionClick({ action: 'GO_BACK', label: 'Cancel' })}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/10 dark:hover:bg-white/20 dark:text-slate-200 rounded-lg text-sm font-medium transition-all shadow-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-wrap gap-2 pt-2">
        {options.map((opt, idx) => {
          const Icon = opt.icon;
          return (
            <motion.button
              key={opt.id || opt.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              disabled={opt.disabled || isLoading}
              onClick={() => handleOptionClick(opt)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm 
                ${opt.disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-white/5 dark:text-slate-500' : 
                  opt.action === 'GO_BACK' ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/10 dark:hover:bg-white/20 dark:text-slate-200' : 
                  'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/50 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/20'}`}
            >
              {Icon && <Icon size={16} />}
              {opt.label}
            </motion.button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto h-[calc(100vh-5rem)] flex flex-col">
      {/* Header */}
      <div className="mb-6 flex-shrink-0 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles size={32} className="text-indigo-500" />
            Guided Assistant
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Navigate your productivity using options</p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-h-0">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 glass-card rounded-xl p-6 flex flex-col overflow-hidden border border-gray-200 dark:border-zinc-700"
        >
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            <AnimatePresence mode="popLayout">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md xl:max-w-xl px-4 py-3 rounded-xl ${
                      message.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-none'
                        : message.isError
                        ? 'glass-card border-red-500/20 bg-red-500/5 text-red-500 rounded-bl-none'
                        : 'glass-card text-gray-900 dark:text-white rounded-bl-none border-white/5'
                    }`}
                  >
                    <div className="prose dark:prose-invert prose-sm max-w-none">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                    <p className={`text-[10px] mt-2 ${
                      message.role === 'user'
                        ? 'text-indigo-200'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {message.timestamp}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="glass-card text-gray-900 dark:text-white rounded-xl rounded-bl-none border-white/5 px-4 py-3 flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin text-indigo-500" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} className="h-4" />
          </div>

          {/* Dynamic Options Area (Replaces Text Input) */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10 flex-shrink-0">
            {renderOptions()}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AIAssistantPage;
