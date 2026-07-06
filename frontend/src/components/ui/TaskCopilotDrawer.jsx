import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles, Loader2, ListTodo } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function TaskCopilotDrawer({ task, onClose }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY || '';
  const messagesEndRef = useRef(null);

  // Initialize welcome message when a task is selected
  useEffect(() => {
    if (task) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: `Hi! I'm your Copilot for **${task.title}**. Need help breaking this down, getting started, or finding resources? Just ask!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [task]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !task) return;

    const query = inputValue.trim();

    if (!apiKey) {
      setMessages(prev => [...prev, {
        id: Date.now(),
        role: 'assistant',
        content: '⚠️ Please set VITE_ANTHROPIC_API_KEY in the environment to use the Copilot.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true
      }]);
      return;
    }

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    const systemPrompt = `You are a highly capable productivity Copilot. You are currently helping the user complete a specific task from their Kanban board.
    
Task Details:
- Title: ${task.title}
- Priority: ${task.priority}
- Status: ${task.status}
- Description: ${task.description || 'No description provided.'}
- Due: ${task.dueDate || 'No due date'}
- Scheduled Time: ${task.time || 'Not scheduled'}

Your goal is to provide actionable advice, step-by-step guidance, and motivation to help them complete THIS task.
Do NOT output raw JSON. Respond conversationally, using markdown formatting (bolding, bullet points) to make your response easy to read. Be concise and practical.`;

    try {
      // Format chat history for Anthropic API
      const apiMessages = messages
        .filter(m => m.id !== 'welcome' && !m.isError)
        .map(m => ({
          role: m.role,
          content: m.content
        }));
      
      apiMessages.push({ role: 'user', content: query });

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const response = await fetch(`${API_URL}/api/copilot/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          apiKey: apiKey,
          systemPrompt: systemPrompt,
          messages: apiMessages
        })
      });

      if (!response.ok) {
        const errData = await response.text();
        throw new Error(errData || `API request failed with status ${response.status}`);
      }

      const responseData = await response.json();
      const textResponse = responseData.content[0].text;

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: textResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);

    } catch (error) {
      console.error('Task Copilot Error:', error);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: `⚠️ Error: ${error.message || 'Failed to connect to the AI. Please verify your API key and network connection.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {task && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
          />

          {/* Sliding Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white dark:bg-[#0f111a] border-l border-slate-200 dark:border-white/10 shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/10 bg-indigo-50/50 dark:bg-indigo-900/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Task Copilot</h2>
                  <p className="text-xs text-slate-500 dark:text-gray-400 truncate w-48">{task.title}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg text-slate-500 dark:text-gray-400 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-3 rounded-xl text-sm ${
                      message.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-sm'
                        : message.isError
                        ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-tl-sm'
                        : 'bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 rounded-tl-sm'
                    }`}
                  >
                    <div className="prose dark:prose-invert prose-sm max-w-none leading-relaxed">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                    <div className={`text-[10px] mt-2 ${message.role === 'user' ? 'text-indigo-200' : 'text-slate-400 dark:text-slate-500'}`}>
                      {message.timestamp}
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl rounded-tl-sm p-3 flex gap-1.5">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.15s]" />
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.3s]" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions for quick start */}
            {messages.length === 1 && !isKeyBannerOpen && (
              <div className="px-4 pb-4 flex flex-wrap gap-2">
                <button 
                  onClick={() => setInputValue("Break this task down into 3 smaller steps")}
                  className="text-xs bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
                >
                  <ListTodo size={12} /> Break it down
                </button>
                <button 
                  onClick={() => setInputValue("What's a good first step to get started?")}
                  className="text-xs bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
                >
                  <Sparkles size={12} /> How to start
                </button>
              </div>
            )}

            {/* Input Form */}
            <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f111a]">
              {!apiKey && !isKeyBannerOpen ? (
                 <button
                  onClick={() => setIsKeyBannerOpen(true)}
                  className="w-full py-2.5 flex items-center justify-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors border border-indigo-200 dark:border-indigo-500/30 font-medium"
                >
                  <Key size={16} /> Configure API Key to use Copilot
                </button>
              ) : (
                <div className="relative">
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Ask for help with this task..."
                    className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none max-h-32 text-slate-900 dark:text-white"
                    rows={1}
                    style={{ minHeight: '46px' }}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    className="absolute right-2 bottom-2 p-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-lg transition-colors"
                  >
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
