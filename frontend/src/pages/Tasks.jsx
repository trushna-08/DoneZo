import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Plus, Filter, Search, Clock, AlertCircle, CheckCircle2, Edit, Trash2, ClipboardList, Activity, Eye, X, Sparkles } from 'lucide-react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { addTask, updateTask, deleteTask } from '../utils/taskUtils';
import TaskCopilotDrawer from '../components/ui/TaskCopilotDrawer';
import { useToast } from '../context/ToastContext';

const TaskBoard = () => {
  const { tasks, setTasks, isDark } = useOutletContext();
  const { addToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');

  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [draggedTask, setDraggedTask] = useState(null);
  
  // Accessibility keyboard navigation states
  const [movingTaskId, setMovingTaskId] = useState(null);
  const [originalStatus, setOriginalStatus] = useState(null);
  const [announcement, setAnnouncement] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [copilotTask, setCopilotTask] = useState(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'low',
    status: 'todo',
    assignee: 'You',
    dueDate: '',
    time: ''
  });

  const statuses = ['todo', 'in-progress', 'review', 'done'];
  const statusLabels = {
    todo: 'To Do',
    'in-progress': 'In Progress',
    review: 'In Review',
    done: 'Done'
  };

  const statusColors = {
    todo: 'bg-gray-100/50 dark:bg-zinc-800/40',
    'in-progress': 'bg-blue-50/50 dark:bg-blue-950/10',
    review: 'bg-purple-50/50 dark:bg-purple-950/10',
    done: 'bg-green-50/50 dark:bg-green-950/10'
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  const moveTask = (taskId, newStatus) => {
    const task = tasks.find(t => t.id === taskId);
    const wasDone = task?.status === 'done';
    setTasks(prev => updateTask(prev, taskId, {
      status: newStatus,
      ...(newStatus === 'done' ? { completedAt: Date.now() } : {})
    }));
    setDraggedTask(null);
    if (newStatus === 'done' && !wasDone && task) {
      addToast(`"${task.title}" marked as completed.`, 'success');
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'text-red-600 bg-red-100/80 dark:text-red-400 dark:bg-red-950/30 border border-red-200/50 dark:border-transparent',
      medium: 'text-yellow-600 bg-yellow-100/80 dark:text-yellow-400 dark:bg-yellow-950/30 border border-yellow-200/50 dark:border-transparent',
      low: 'text-blue-600 bg-blue-100/80 dark:text-blue-400 dark:bg-blue-950/30 border border-blue-200/50 dark:border-transparent'
    };
    return colors[priority] || colors.low;
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'done':
        return <CheckCircle2 size={16} className="text-green-500 animate-glow-pulse" />;
      case 'review':
        return <AlertCircle size={16} className="text-purple-500 animate-glow-pulse" />;
      case 'in-progress':
        return <Clock size={16} className="text-blue-500 animate-glow-pulse" />;
      default:
        return <div className="w-4 h-4 rounded-full border border-slate-400 dark:border-zinc-600" />;
    }
  };

  const startEditTask = (task) => {
    setEditingTask(task);
    setNewTask({
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      assignee: task.assignee,
      dueDate: task.dueDate,
      time: task.time || ''
    });
    setIsModalOpen(true);
  };

  const handleDeleteTask = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (confirm('Are you sure you want to delete this task?')) {
      setTasks(prev => deleteTask(prev, taskId));
      if (task) addToast(`"${task.title}" deleted.`, 'info');
    }
  };

  const handleSaveTask = (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    if (editingTask) {
      const wasNotDone = editingTask.status !== 'done';
      const isNowDone = newTask.status === 'done';
      setTasks(prev => updateTask(prev, editingTask.id, {
        ...newTask,
        ...(isNowDone && wasNotDone ? { completedAt: Date.now() } : {})
      }));
      addToast(`"${newTask.title}" updated.`, 'info');
      if (isNowDone && wasNotDone) {
        addToast(`"${newTask.title}" marked as completed.`, 'success');
      }
    } else {
      setTasks(prev => addTask(prev, newTask));
      addToast(`New task "${newTask.title}" added.`, 'success');
    }
    
    setIsModalOpen(false);
    setEditingTask(null);
    setNewTask({
      title: '',
      description: '',
      priority: 'low',
      status: 'todo',
      assignee: 'You',
      dueDate: '',
      time: ''
    });
  };

  // Keyboard navigation for task board
  const handleCardKeyDown = (e, task) => {
    const isMoving = movingTaskId === task.id;

    if (!isMoving) {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setMovingTaskId(task.id);
        setOriginalStatus(task.status);
        setAnnouncement(`Task ${task.title} is now in move mode. Use Left and Right arrow keys to move it between columns. Press Enter or Space to confirm, or Escape to cancel.`);
      }
    } else {
      const currentIndex = statuses.indexOf(task.status);
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (currentIndex < statuses.length - 1) {
          const newStatus = statuses[currentIndex + 1];
          setTasks(prev => updateTask(prev, task.id, { status: newStatus }));
          setAnnouncement(`Moved ${task.title} to ${statusLabels[newStatus]}`);
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (currentIndex > 0) {
          const newStatus = statuses[currentIndex - 1];
          setTasks(prev => updateTask(prev, task.id, { status: newStatus }));
          setAnnouncement(`Moved ${task.title} to ${statusLabels[newStatus]}`);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setTasks(prev => updateTask(prev, task.id, { status: originalStatus }));
        setMovingTaskId(null);
        setAnnouncement(`Move cancelled. Task ${task.title} returned to ${statusLabels[originalStatus]}.`);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setMovingTaskId(null);
        setAnnouncement(`Task ${task.title} successfully placed in ${statusLabels[task.status]}.`);
      }
    }
  };

  // Focus trap inside modal dialog
  useEffect(() => {
    if (!isModalOpen) return;

    const focusableElementsSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const modalElement = document.getElementById('task-modal');
    if (!modalElement) return;

    const focusableElements = modalElement.querySelectorAll(focusableElementsSelector);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (firstElement) {
      setTimeout(() => firstElement.focus(), 50);
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      } else if (e.key === 'Escape') {
        setIsModalOpen(false);
        setEditingTask(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isModalOpen]);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Screen Reader Announcements */}
      <div aria-live="polite" className="sr-only h-0 w-0 overflow-hidden absolute">
        {announcement}
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Task Board</h1>
          <p className="text-slate-600 dark:text-gray-400 mt-1 font-medium">Manage and organize your tasks</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setEditingTask(null);
            setNewTask({
              title: '',
              description: '',
              priority: 'low',
              status: 'todo',
              assignee: 'You',
              dueDate: '',
              time: ''
            });
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-indigo-600/20 font-medium text-sm"
        >
          <Plus size={18} />
          New Task
        </motion.button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500" size={18} />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search tasks"
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-white dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 text-sm"
          />
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-zinc-800/40 rounded-lg border border-slate-200 dark:border-zinc-700 px-3 py-2 text-slate-800 dark:text-white">
          <Filter size={18} className="text-slate-400 dark:text-gray-500" />
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            aria-label="Filter tasks by priority"
            className="bg-transparent focus:outline-none cursor-pointer text-slate-800 dark:text-white dark:bg-zinc-800 text-sm"
          >
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 min-h-[600px]">
        {statuses.map(status => (
          <motion.div
            key={status}
            role="region"
            aria-label={`${statusLabels[status]} column`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => draggedTask && moveTask(draggedTask.id, status)}
            className={`${statusColors[status]} rounded-xl p-4 flex flex-col min-h-[600px] border border-slate-200 dark:border-zinc-700/60 transition-all duration-300`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900 dark:text-white">{statusLabels[status]}</h2>
              <span className="bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-gray-300 text-xs font-semibold px-2 py-1 rounded-full border border-slate-300/40 dark:border-transparent">
                {filteredTasks.filter(t => t.status === status).length}
              </span>
            </div>

            {/* Task Cards */}
            <div className="flex-1 space-y-3">
              <AnimatePresence mode="popLayout">
                {filteredTasks
                  .filter(task => task.status === status)
                  .map((task) => {
                    const isMovingThisTask = movingTaskId === task.id;
                    return (
                      <motion.div
                        key={task.id}
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        draggable
                        onDragStart={() => setDraggedTask(task)}
                        onClick={() => {
                          if (highlightId === task.id) {
                            setSearchParams({});
                          }
                        }}
                        tabIndex={0}
                        onKeyDown={(e) => handleCardKeyDown(e, task)}
                        aria-keyshortcuts="Space Enter ArrowLeft ArrowRight Escape"
                        aria-describedby={`task-keyboard-help-${task.id}`}
                        className={`glass-card p-4 cursor-move hover:shadow-md transition-all rounded-lg group relative focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          isMovingThisTask
                            ? 'border-dashed border-indigo-500 ring-4 ring-indigo-500/50 scale-102 shadow-[0_0_20px_rgba(99,102,241,0.6)] dark:border-indigo-400 dark:ring-indigo-400/50'
                            : task.id === highlightId
                            ? 'border-indigo-500 ring-2 ring-indigo-500/30 scale-102 shadow-lg shadow-indigo-500/10 dark:border-indigo-400 dark:ring-indigo-400/30'
                            : 'hover:border-indigo-400 dark:hover:border-indigo-500/40'
                        }`}
                      >
                        {/* Keyboard navigation helper description for screen readers */}
                        <span id={`task-keyboard-help-${task.id}`} className="sr-only">
                          Press Space or Enter to move this task. Current column is {statusLabels[task.status]}.
                        </span>

                        {/* Edit/Delete Actions */}
                        <div className="absolute top-4 right-4 flex gap-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditTask(task);
                            }}
                            className="p-1 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-500 dark:text-gray-400 rounded bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 transition-colors border border-slate-200 dark:border-transparent"
                            title="Edit Task"
                            aria-label={`Edit task: ${task.title}`}
                          >
                            <Edit size={13} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTask(task.id);
                            }}
                            className="p-1 hover:text-red-600 dark:hover:text-red-400 text-slate-500 dark:text-gray-400 rounded bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 transition-colors border border-slate-200 dark:border-transparent"
                            title="Delete Task"
                            aria-label={`Delete task: ${task.title}`}
                          >
                            <Trash2 size={13} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCopilotTask(task);
                            }}
                            className="p-1 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-500 dark:text-gray-400 rounded bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 transition-colors border border-slate-200 dark:border-transparent"
                            title="AI Task Copilot"
                            aria-label={`AI Copilot for: ${task.title}`}
                          >
                            <Sparkles size={13} />
                          </button>
                        </div>

                        {/* Task Badge */}
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(status)}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getPriorityColor(task.priority)}`}>
                            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                          </span>
                        </div>

                        {/* Task Title */}
                        <h3 className="font-semibold text-slate-800 dark:text-white text-sm mb-2 line-clamp-2 pr-12">
                          {task.title}
                        </h3>

                        {/* Task Description */}
                        <p className="text-xs text-slate-500 dark:text-gray-400 mb-3 line-clamp-2">
                          {task.description}
                        </p>

                        {/* Assignee & Due Date / Time */}
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-gray-400 mt-2">
                          <span className="truncate flex items-center gap-1">
                            {task.assignee}
                          </span>
                          <div className="flex flex-col items-end">
                            {task.dueDate && <span className="whitespace-nowrap font-medium">{task.dueDate}</span>}
                            {task.time && (
                              <span className="whitespace-nowrap text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1 mt-0.5">
                                <Clock size={10} /> {task.time}
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
              </AnimatePresence>

              {/* Drop zone for empty columns */}
              {filteredTasks.filter(t => t.status === status).length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300/80 dark:border-zinc-700/60 rounded-xl bg-slate-50/30 dark:bg-white/5 text-center min-h-[250px] my-auto">
                  {status === 'todo' && (
                    <>
                      <ClipboardList className="w-10 h-10 text-indigo-500 mb-3 animate-pulse" />
                      <p className="text-sm font-semibold text-slate-800 dark:text-white">No tasks yet</p>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 max-w-[180px]">Add your first one to get started!</p>
                      <button
                        onClick={() => {
                          setEditingTask(null);
                          setNewTask({
                            title: '',
                            description: '',
                            priority: 'low',
                            status: 'todo',
                            assignee: 'You',
                            dueDate: '',
                            time: ''
                          });
                          setIsModalOpen(true);
                        }}
                        className="mt-4 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-md transition-colors"
                      >
                        Add Task
                      </button>
                    </>
                  )}
                  {status === 'in-progress' && (
                    <>
                      <Activity className="w-10 h-10 text-blue-500 mb-3" />
                      <p className="text-sm font-semibold text-slate-800 dark:text-white">Idle Column</p>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 max-w-[180px]">No tasks currently in progress. Drag one here!</p>
                    </>
                  )}
                  {status === 'review' && (
                    <>
                      <Eye className="w-10 h-10 text-purple-500 mb-3" />
                      <p className="text-sm font-semibold text-slate-800 dark:text-white">No Reviews</p>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 max-w-[180px]">Nothing pending review. Keep up the clean work!</p>
                    </>
                  )}
                  {status === 'done' && (
                    <>
                      <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-3" />
                      <p className="text-sm font-semibold text-slate-800 dark:text-white">No Done Tasks</p>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 max-w-[180px]">Nothing completed yet. Keep going!</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Glassmorphic Task Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsModalOpen(false);
                setEditingTask(null);
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div
              id="task-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card w-full max-w-lg p-6 md:p-8 rounded-2xl relative z-10 border border-slate-200 dark:border-white/10 shadow-2xl"
              style={{
                background: isDark
                  ? 'linear-gradient(135deg, rgba(20, 25, 50, 0.95) 0%, rgba(10, 12, 30, 0.98) 100%)'
                  : 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(240, 245, 250, 0.99) 100%)',
              }}
            >
              {/* Close X Button */}
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingTask(null);
                }}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-gray-400 transition-colors"
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>

              <h2 id="modal-title" className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                {editingTask ? 'Edit Task' : 'Create New Task'}
              </h2>
              
              <form onSubmit={handleSaveTask} className="space-y-4">
                <div>
                  <label htmlFor="task-title" className="block text-xs font-semibold text-slate-500 dark:text-gray-400 mb-1">Title</label>
                  <input
                    id="task-title"
                    type="text"
                    required
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all"
                    placeholder="Task title..."
                  />
                </div>
                
                <div>
                  <label htmlFor="task-description" className="block text-xs font-semibold text-slate-500 dark:text-gray-400 mb-1">Description</label>
                  <textarea
                    id="task-description"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all h-20 resize-none"
                    placeholder="Describe the task..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="task-priority" className="block text-xs font-semibold text-slate-500 dark:text-gray-400 mb-1">Priority</label>
                    <select
                      id="task-priority"
                      value={newTask.priority}
                      onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                      className="w-full bg-white dark:bg-[#101428] border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all cursor-pointer"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="task-status" className="block text-xs font-semibold text-slate-500 dark:text-gray-400 mb-1">Status</label>
                    <select
                      id="task-status"
                      value={newTask.status}
                      onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
                      className="w-full bg-white dark:bg-[#101428] border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all cursor-pointer"
                    >
                      <option value="todo">To Do</option>
                      <option value="in-progress">In Progress</option>
                      <option value="review">In Review</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="task-assignee" className="block text-xs font-semibold text-slate-500 dark:text-gray-400 mb-1">Assignee</label>
                    <input
                      id="task-assignee"
                      type="text"
                      value={newTask.assignee}
                      onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
                      className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2.5 text-slate-950 dark:text-white focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all"
                      placeholder="Assignee..."
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="task-due-date" className="block text-xs font-semibold text-slate-500 dark:text-gray-400 mb-1">Due Date</label>
                    <input
                      id="task-due-date"
                      type="text"
                      value={newTask.dueDate}
                      onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                      className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2.5 text-slate-950 dark:text-white focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all"
                      placeholder="e.g. May 30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1">
                  <div>
                    <label htmlFor="task-time" className="block text-xs font-semibold text-slate-500 dark:text-gray-400 mb-1">Time (Optional)</label>
                    <input
                      id="task-time"
                      type="text"
                      value={newTask.time}
                      onChange={(e) => setNewTask({ ...newTask, time: e.target.value })}
                      className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2.5 text-slate-950 dark:text-white focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all"
                      placeholder="e.g. 10:00 AM - 11:30 AM"
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingTask(null);
                    }}
                    className="px-4 py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-gray-300 font-semibold rounded-lg text-sm transition-colors border border-slate-200 dark:border-transparent"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-sm transition-colors shadow-lg"
                  >
                    {editingTask ? 'Save Changes' : 'Create Task'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <TaskCopilotDrawer 
        task={copilotTask} 
        onClose={() => setCopilotTask(null)} 
      />
    </div>
  );
};

export default TaskBoard;
