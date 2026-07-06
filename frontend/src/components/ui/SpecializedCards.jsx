import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, CloudRain, Sun, Wind, Target, Zap, Brain, Smile, Check, X, Sparkles } from 'lucide-react';
import { EnhancedCard, ProgressRing } from './EnhancedCard';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { completeTask, filterByEnergy, getActiveTasks, addTask, updateTask } from '../../utils/taskUtils';
import { useToast } from '../../context/ToastContext';

export const WeatherCard = ({ delay = 0 }) => {
  return (
    <EnhancedCard variant="purple" delay={delay} className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-gray-400 mb-2">Weather</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">24°C</span>
            <span className="text-sm text-slate-500 dark:text-gray-500">Sunny</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-gray-500 mt-2 font-medium">Perfect for productivity</p>
        </div>
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="text-yellow-500 dark:text-yellow-400"
        >
          <Sun size={40} />
        </motion.div>
      </div>
    </EnhancedCard>
  );
};

export const FocusTimerCard = ({ delay = 0 }) => {
  const totalDuration = 45 * 60 + 32; // 2732 seconds
  const [secondsLeft, setSecondsLeft] = useState(() => {
    const saved = localStorage.getItem('donezo_timer_seconds');
    return saved ? parseInt(saved, 10) : totalDuration;
  });
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft(prev => {
          const next = prev - 1;
          localStorage.setItem('donezo_timer_seconds', String(next));
          return next;
        });
      }, 1000);
    } else if (secondsLeft === 0) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, secondsLeft]);

  const handleToggle = () => {
    setIsActive(!isActive);
    window.dispatchEvent(new CustomEvent('donezo_timer_toggle', { detail: { active: !isActive } }));
  };

  const handleReset = () => {
    setIsActive(false);
    setSecondsLeft(totalDuration);
    localStorage.setItem('donezo_timer_seconds', String(totalDuration));
    window.dispatchEvent(new CustomEvent('donezo_timer_toggle', { detail: { active: false } }));
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Listen to external toggle events (e.g. from Quick Actions)
  useEffect(() => {
    const handleExternalToggle = (e) => {
      if (e.detail && typeof e.detail.active === 'boolean') {
        setIsActive(e.detail.active);
      }
    };
    window.addEventListener('donezo_timer_external_toggle', handleExternalToggle);
    return () => window.removeEventListener('donezo_timer_external_toggle', handleExternalToggle);
  }, []);

  const percentage = Math.round((secondsLeft / totalDuration) * 100);

  return (
    <EnhancedCard variant="blue" delay={delay} className="p-6">
      <p className="text-sm text-slate-500 dark:text-gray-400 mb-4">Focus Timer</p>
      <div className="flex items-center gap-6">
        <div className="flex-1">
          <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 font-mono mb-3">
            {formatTime(secondsLeft)}
          </div>
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleToggle}
              className="px-3 py-1 text-xs rounded-lg bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 hover:bg-blue-500/20 dark:hover:bg-blue-500/30 transition-all font-semibold"
            >
              {isActive ? 'Pause' : 'Start'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleReset}
              className="px-3 py-1 text-xs rounded-lg bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-white/20 transition-all font-semibold border border-slate-200 dark:border-transparent"
            >
              Reset
            </motion.button>
          </div>
        </div>
        <div className="transition-all duration-300">
          <ProgressRing value={percentage} color="blue" size={100} />
        </div>
      </div>
    </EnhancedCard>
  );
};

export const SystemStatusCard = ({ delay = 0 }) => {
  const [memory, setMemory] = useState(68);
  const [cpu, setCpu] = useState(34);
  const [network, setNetwork] = useState(82);

  useEffect(() => {
    const interval = setInterval(() => {
      setMemory(prev => {
        const delta = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
        return Math.min(100, Math.max(60, prev + delta)); // keep memory around 60-75%
      });
      setCpu(prev => {
        const delta = Math.floor(Math.random() * 11) - 5; // -5 to 5
        return Math.min(100, Math.max(10, prev + delta)); // keep CPU around 10-50%
      });
      setNetwork(prev => {
        const delta = Math.floor(Math.random() * 9) - 4; // -4 to 4
        return Math.min(100, Math.max(50, prev + delta)); // keep Network around 50-95%
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const statuses = [
    { name: 'Memory', value: memory, color: 'blue' },
    { name: 'CPU', value: cpu, color: 'purple' },
    { name: 'Network', value: network, color: 'orange' },
  ];

  return (
    <EnhancedCard variant="orange" delay={delay} className="p-6">
      <p className="text-sm text-slate-500 dark:text-gray-400 mb-4">System Status</p>
      <div className="space-y-3">
        {statuses.map((status) => (
          <div key={status.name}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-slate-500 dark:text-gray-400">{status.name}</span>
              <span className="text-xs font-bold text-slate-800 dark:text-white">{status.value}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${status.value}%` }}
                transition={{ duration: 0.5 }}
                className={`h-full rounded-full ${
                  status.color === 'blue' ? 'bg-blue-500' :
                  status.color === 'purple' ? 'bg-purple-500' :
                  'bg-orange-500'
                }`}
                style={{
                  boxShadow: `0 0 10px ${
                    status.color === 'blue' ? 'rgba(59, 130, 246, 0.6)' :
                    status.color === 'purple' ? 'rgba(139, 92, 246, 0.6)' :
                    'rgba(251, 146, 60, 0.6)'
                  }`
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </EnhancedCard>
  );
};

export const QuickActionCard = ({ delay = 0 }) => {
  const [timerRunning, setTimerRunning] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleToggle = (e) => {
      setTimerRunning(e.detail.active);
    };
    window.addEventListener('donezo_timer_toggle', handleToggle);
    return () => window.removeEventListener('donezo_timer_toggle', handleToggle);
  }, []);

  const handleAction = (label) => {
    if (label === 'New Task') {
      navigate('/tasks');
    } else if (label === 'Start Focus' || label === 'Pause Focus') {
      window.dispatchEvent(new CustomEvent('donezo_timer_external_toggle', { detail: { active: !timerRunning } }));
      setTimerRunning(!timerRunning);
    } else if (label === 'Schedule') {
      navigate('/calendar');
    }
  };

  const actions = [
    { label: 'New Task', icon: '✨', color: 'blue' },
    { label: timerRunning ? 'Pause Focus' : 'Start Focus', icon: '🎯', color: 'purple' },
    { label: 'Schedule', icon: '📅', color: 'orange' },
  ];

  return (
    <EnhancedCard variant="default" delay={delay} className="p-6">
      <p className="text-sm text-slate-500 dark:text-gray-400 mb-4">Quick Actions</p>
      <div className="grid grid-cols-3 gap-2">
        {actions.map((action) => (
          <motion.button
            key={action.label}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleAction(action.label)}
            className="p-3 rounded-lg bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all text-center group"
          >
            <div className="text-lg mb-1 group-hover:scale-110 transition-transform">{action.icon}</div>
            <p className="text-xs text-slate-600 dark:text-gray-300 group-hover:text-slate-900 dark:group-hover:text-white font-medium transition-colors">{action.label}</p>
          </motion.button>
        ))}
      </div>
    </EnhancedCard>
  );
};

export const TaskPreviewCard = ({ delay = 0 }) => {
  const { tasks, setTasks } = useOutletContext();

  const priorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'text-red-600 dark:text-red-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'low': return 'text-green-600 dark:text-green-400';
      default: return 'text-slate-600 dark:text-gray-400';
    }
  };

  const handleToggleCheck = (task) => {
    const nextStatus = task.status === 'done' ? 'todo' : 'done';
    setTasks(prev => updateTask(prev, task.id, { status: nextStatus }));
  };

  const sampleSuggestions = [
    { title: 'Review DoneZo dashboard', priority: 'high', description: 'Explore the dashboard and tasks' },
    { title: 'Write task utilities notes', priority: 'medium', description: 'Document pure task actions' },
    { title: 'Review daily goals', priority: 'low', description: 'Daily reflection time' }
  ];

  const handleAddSuggestion = (suggestion) => {
    setTasks(prev => addTask(prev, {
      title: suggestion.title,
      priority: suggestion.priority,
      description: suggestion.description,
      dueDate: 'Today',
      status: 'todo'
    }));
  };

  if (tasks.length === 0) {
    return (
      <EnhancedCard variant="blue" delay={delay} className="p-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Sparkles size={18} />
          </div>
          <p className="text-sm font-bold text-slate-800 dark:text-white">Get Started with DoneZo</p>
        </div>
        <p className="text-xs text-slate-500 dark:text-gray-400 mb-4 leading-relaxed">
          Your task list is empty. Click any suggestion below to add it instantly to your board:
        </p>
        <div className="space-y-2">
          {sampleSuggestions.map((suggestion, idx) => (
            <motion.button
              key={idx}
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleAddSuggestion(suggestion)}
              className="w-full text-left p-3 rounded-lg bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 hover:border-blue-500/30 transition-all flex justify-between items-center group"
            >
              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-gray-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                  {suggestion.title}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-0.5">{suggestion.description}</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                suggestion.priority === 'high' ? 'text-red-600 bg-red-100/80 dark:text-red-400 dark:bg-red-950/30' :
                suggestion.priority === 'medium' ? 'text-yellow-600 bg-yellow-100/80 dark:text-yellow-400 dark:bg-yellow-950/30' :
                'text-blue-600 bg-blue-100/80 dark:text-blue-400 dark:bg-blue-950/30'
              }`}>
                {suggestion.priority}
              </span>
            </motion.button>
          ))}
        </div>
      </EnhancedCard>
    );
  }

  const activePreviewTasks = tasks.filter(t => t.status !== 'done').slice(0, 3);

  return (
    <EnhancedCard variant="blue" delay={delay} className="p-6">
      <p className="text-sm text-slate-500 dark:text-gray-400 mb-4">Today's Tasks</p>
      <div className="space-y-3">
        {activePreviewTasks.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500 dark:text-gray-400">
            All active tasks are completed. Good job.
          </div>
        ) : (
          activePreviewTasks.map((task) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-3 rounded-lg bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200/50 dark:border-transparent transition-all cursor-pointer group"
              onClick={() => handleToggleCheck(task)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <input 
                    type="checkbox" 
                    checked={task.status === 'done'} 
                    onChange={() => {}} // handled by click
                    className="rounded w-4 h-4 accent-indigo-600 cursor-pointer" 
                  />
                  <span className={`text-sm transition-all font-medium ${
                    task.status === 'done' 
                      ? 'text-slate-400 line-through dark:text-gray-500' 
                      : 'text-slate-700 dark:text-gray-300 group-hover:text-slate-900 group-hover:dark:text-white'
                  }`}>
                    {task.title}
                  </span>
                </div>
                <span className={`text-xs font-bold ${priorityColor(task.priority)}`}>
                  {task.priority?.toUpperCase()}
                </span>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </EnhancedCard>
  );
};

export const SolveMyDayCard = ({ delay = 0 }) => {
  const { tasks, setTasks, isDark } = useOutletContext();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState('intro'); // intro, energy, time, focus
  const [energy, setEnergy] = useState(''); // low, medium, high
  const [duration, setDuration] = useState(0); // in seconds
  const [totalDuration, setTotalDuration] = useState(0); // initial timer value
  const [selectedTask, setSelectedTask] = useState(null);
  const [timerActive, setTimerActive] = useState(false);

  // Focus Countdown logic
  useEffect(() => {
    let interval = null;
    if (timerActive && duration > 0) {
      interval = setInterval(() => {
        setDuration(prev => prev - 1);
      }, 1000);
    } else if (duration === 0 && timerActive) {
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, duration]);

  const handleStartFocus = () => {
    setTimerActive(prev => !prev);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const selectEnergy = (val) => {
    setEnergy(val);
    setStep('time');
  };

  const selectTime = (mins) => {
    const secs = mins * 60;
    setDuration(secs);
    setTotalDuration(secs);

    // Check if there are active tasks
    const activeTasks = getActiveTasks(tasks);
    if (activeTasks.length === 0) {
      setSelectedTask(null);
      setStep('focus');
      return;
    }

    // Filter tasks using utils
    const matches = filterByEnergy(tasks, energy);

    let task = null;
    if (matches.length > 0) {
      task = matches[Math.floor(Math.random() * matches.length)];
    } else {
      const uncompleted = tasks.filter(t => t.status !== 'done');
      if (uncompleted.length > 0) {
        task = uncompleted[0];
      }
    }

    setSelectedTask(task);
    setStep('focus');
  };

  const handleCompleteTask = () => {
    if (selectedTask) {
      setTasks(prev => completeTask(prev, selectedTask.id));
      addToast(`"${selectedTask.title}" completed. Well done!`, 'success');
    }
    resetWidget();
  };

  const resetWidget = () => {
    setStep('intro');
    setEnergy('');
    setDuration(0);
    setTotalDuration(0);
    setSelectedTask(null);
    setTimerActive(false);
  };

  const percentage = totalDuration > 0 ? Math.round((duration / totalDuration) * 100) : 0;

  const priorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'text-red-600 bg-red-100/80 dark:text-red-400 dark:bg-red-950/30';
      case 'medium': return 'text-yellow-600 bg-yellow-100/80 dark:text-yellow-400 dark:bg-yellow-950/30';
      case 'low': return 'text-blue-600 bg-blue-100/80 dark:text-blue-400 dark:bg-blue-950/30';
      default: return 'text-slate-600 bg-slate-100 dark:text-gray-400 dark:bg-white/5';
    }
  };

  return (
    <EnhancedCard variant="purple" delay={delay} className="p-6 flex flex-col justify-between min-h-[220px]">
      <AnimatePresence mode="wait">
        {step === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4 flex-1 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 animate-glow-pulse">
                  <Target size={18} />
                </div>
                <h3 className="card-title">Solve My Day</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed">
                Overwhelmed by choices? Let us select exactly one task based on your energy and time.
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setStep('energy')}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/10 text-center"
            >
              Find Focus 🎯
            </motion.button>
          </motion.div>
        )}

        {step === 'energy' && (
          <motion.div
            key="energy"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3 flex-1 flex flex-col justify-between"
          >
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Step 1 of 2</p>
              <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-3">What is your energy level?</h4>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => selectEnergy('low')}
                className="p-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 text-center flex flex-col items-center gap-1 group"
              >
                <span className="text-xl">🥱</span>
                <span className="text-[10px] font-bold text-slate-600 dark:text-gray-300 group-hover:text-slate-900 dark:group-hover:text-white">Low</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => selectEnergy('medium')}
                className="p-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 text-center flex flex-col items-center gap-1 group"
              >
                <span className="text-xl">⚡</span>
                <span className="text-[10px] font-bold text-slate-600 dark:text-gray-300 group-hover:text-slate-900 dark:group-hover:text-white">Medium</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => selectEnergy('high')}
                className="p-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 text-center flex flex-col items-center gap-1 group"
              >
                <span className="text-xl">🧠</span>
                <span className="text-[10px] font-bold text-slate-600 dark:text-gray-300 group-hover:text-slate-900 dark:group-hover:text-white">High</span>
              </motion.button>
            </div>
            <button onClick={resetWidget} className="text-[10px] text-slate-400 hover:text-slate-500 font-semibold text-center mt-1">
              Cancel
            </button>
          </motion.div>
        )}

        {step === 'time' && (
          <motion.div
            key="time"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3 flex-1 flex flex-col justify-between"
          >
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Step 2 of 2</p>
              <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-3">How much time do you have?</h4>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => selectTime(15)}
                className="p-2.5 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 text-center flex flex-col items-center gap-1 group"
              >
                <span className="text-lg">⏱️</span>
                <span className="text-[9px] font-bold text-slate-600 dark:text-gray-300 group-hover:text-slate-900 dark:group-hover:text-white">15m</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => selectTime(60)}
                className="p-2.5 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 text-center flex flex-col items-center gap-1 group"
              >
                <span className="text-lg">⏳</span>
                <span className="text-[9px] font-bold text-slate-600 dark:text-gray-300 group-hover:text-slate-900 dark:group-hover:text-white">1h</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => selectTime(180)}
                className="p-2.5 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 text-center flex flex-col items-center gap-1 group"
              >
                <Target className="w-5 h-5 text-indigo-500" />
                <span className="text-[9px] font-bold text-slate-600 dark:text-gray-300 group-hover:text-slate-900 dark:group-hover:text-white">3h+</span>
              </motion.button>
            </div>
            <button onClick={() => setStep('energy')} className="text-[10px] text-slate-400 hover:text-slate-500 font-semibold text-center mt-1">
              Back
            </button>
          </motion.div>
        )}

        {step === 'focus' && (
          <motion.div
            key="focus"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex-1 flex flex-col justify-between space-y-3"
          >
            {!selectedTask ? (
              <div className="text-center py-3 flex-1 flex flex-col justify-between items-center">
                <div>
                  <Target className="w-8 h-8 mb-1 text-purple-500 mx-auto" />
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white">No Active Tasks</h4>
                  <p className="text-[9px] text-slate-500 dark:text-gray-400 mt-1 leading-normal max-w-[180px] mx-auto">
                    You have no active tasks right now. Add some tasks first!
                  </p>
                </div>
                <button
                  onClick={() => { navigate('/tasks'); }}
                  className="w-full mt-2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold transition-all shadow-md shadow-indigo-600/10 text-center"
                >
                  Add Tasks
                </button>
              </div>
            ) : (
              <>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wide">🎯 Selected Focus</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${priorityColor(selectedTask.priority)}`}>
                      {selectedTask.priority.toUpperCase()}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white line-clamp-1 mb-1">
                    {selectedTask.title}
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-gray-400 line-clamp-2 leading-normal italic">
                    {selectedTask.description}
                  </p>
                </div>

                <div className="flex items-center gap-4 bg-slate-100/50 dark:bg-white/5 p-2 rounded-lg border border-slate-200/50 dark:border-white/5">
                  <div className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400 flex-1">
                    {formatTime(duration)}
                  </div>
                  <ProgressRing value={percentage} color="blue" size={40} />
                </div>

                <div className="flex gap-1.5">
                  <button
                    onClick={handleStartFocus}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all text-white ${
                      timerActive 
                        ? 'bg-amber-600 hover:bg-amber-700' 
                        : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                  >
                    {timerActive ? 'Pause' : 'Start'}
                  </button>
                  <button
                    onClick={handleCompleteTask}
                    className="px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition-all flex items-center justify-center"
                    title="Mark Task Complete"
                  >
                    <Check size={12} />
                  </button>
                  <button
                    onClick={resetWidget}
                    className="px-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold transition-all flex items-center justify-center"
                    title="Give Up"
                  >
                    <X size={12} />
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </EnhancedCard>
  );
};
