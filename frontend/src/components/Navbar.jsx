import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Moon, Sun, LogOut, Settings, User, ChevronDown, Search, CheckCircle2, AlertTriangle, Clock, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ isDarkMode, setIsDarkMode, tasks = [] }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredResults, setFilteredResults] = useState([]);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [readNotifIds, setReadNotifIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('donezo_read_notifs') || '[]'); } catch { return []; }
  });

  const userInitials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'JD';

  // Generate LIVE notifications from real task data
  const notifications = useMemo(() => {
    const notifs = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    tasks.forEach(task => {
      if (task.status === 'done') return;

      // Check for overdue tasks
      if (task.dueDate) {
        const dueStr = String(task.dueDate);
        const parsed = new Date(dueStr);
        if (!isNaN(parsed.getTime())) {
          parsed.setHours(0, 0, 0, 0);
          const diffDays = Math.floor((today - parsed) / (1000 * 60 * 60 * 24));
          if (diffDays > 0) {
            notifs.push({
              id: `overdue-${task.id}`,
              type: 'overdue',
              title: 'Task Overdue',
              message: `"${task.title}" was due ${diffDays === 1 ? 'yesterday' : `${diffDays} days ago`}.`,
              time: `${diffDays}d ago`,
              priority: task.priority
            });
          } else if (diffDays === 0) {
            notifs.push({
              id: `due-today-${task.id}`,
              type: 'due-today',
              title: 'Due Today',
              message: `"${task.title}" is due today!`,
              time: 'Today',
              priority: task.priority
            });
          }
        }
      }

      // High priority tasks sitting in To Do
      if (task.priority === 'high' && task.status === 'todo') {
        notifs.push({
          id: `high-priority-${task.id}`,
          type: 'high-priority',
          title: 'High Priority Pending',
          message: `"${task.title}" hasn't been started yet.`,
          time: 'Needs attention',
          priority: 'high'
        });
      }
    });

    // Sort: overdue first, then due-today, then high-priority
    const order = { overdue: 0, 'due-today': 1, 'high-priority': 2 };
    notifs.sort((a, b) => (order[a.type] ?? 9) - (order[b.type] ?? 9));

    return notifs.slice(0, 8); // Max 8 notifications
  }, [tasks]);

  const unreadCount = useMemo(() => 
    notifications.filter(n => !readNotifIds.includes(n.id)).length,
    [notifications, readNotifIds]
  );

  const markAllRead = useCallback(() => {
    const allIds = notifications.map(n => n.id);
    setReadNotifIds(allIds);
    localStorage.setItem('donezo_read_notifs', JSON.stringify(allIds));
  }, [notifications]);

  // Debounced search logic (200ms)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredResults([]);
      setIsSearchDropdownOpen(false);
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      const query = searchQuery.toLowerCase().trim();
      const results = tasks.filter(task => {
        const matchesTitle = task.title?.toLowerCase().includes(query);
        const matchesDesc = task.description?.toLowerCase().includes(query);
        const matchesTags = Array.isArray(task.tags)
          ? task.tags.some(tag => tag.toLowerCase().includes(query))
          : typeof task.tags === 'string' && task.tags.toLowerCase().includes(query);
        const matchesAssignee = task.assignee?.toLowerCase().includes(query);
        return matchesTitle || matchesDesc || matchesTags || matchesAssignee;
      });
      setFilteredResults(results.slice(0, 5));
      setIsSearchDropdownOpen(true);
    }, 200);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, tasks]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setSearchQuery('');
      setIsSearchDropdownOpen(false);
    }
  };

  const handleResultClick = (taskId) => {
    setIsSearchDropdownOpen(false);
    setSearchQuery('');
    navigate(`/tasks?highlight=${taskId}`);
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'overdue': return <AlertTriangle size={14} className="text-red-500" />;
      case 'due-today': return <Clock size={14} className="text-amber-500" />;
      case 'high-priority': return <Sparkles size={14} className="text-indigo-500" />;
      default: return <Bell size={14} className="text-blue-500" />;
    }
  };

  return (
    <header 
      className="h-20 border-b border-slate-200 dark:border-white/10 backdrop-blur-xl sticky top-0 z-20 px-6 md:px-8 flex items-center justify-between"
      style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(241, 245, 249, 0.6) 100%)',
      }}
    >
      {/* Search Bar */}
      <div className="flex-1 max-w-md hidden md:block relative">
        <motion.div
          className="relative group"
          whileFocus={{ scale: 1.02 }}
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search tasks, projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-600 focus:outline-none transition-all"
          />
        </motion.div>

        {/* Search Results Dropdown Panel */}
        <AnimatePresence>
          {isSearchDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 right-0 top-full mt-2 rounded-xl overflow-hidden glass-card shadow-2xl border border-slate-200 dark:border-white/10 z-50 p-2 space-y-1 bg-white dark:bg-zinc-950/95"
              style={{
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1), 0 20px 40px rgba(0, 0, 0, 0.05)',
              }}
            >
              {filteredResults.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 dark:text-gray-400">
                  No tasks found for "{searchQuery}"
                </div>
              ) : (
                filteredResults.map((task) => (
                  <motion.div
                    key={task.id}
                    whileHover={{ x: 4 }}
                    onClick={() => handleResultClick(task.id)}
                    className="p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer flex flex-col gap-1 border border-transparent hover:border-indigo-500/25"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-800 dark:text-white truncate">
                        {task.title}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        task.priority === 'high' ? 'text-red-600 bg-red-100/80 dark:text-red-400 dark:bg-red-950/30' :
                        task.priority === 'medium' ? 'text-yellow-600 bg-yellow-100/80 dark:text-yellow-400 dark:bg-yellow-950/30' :
                        'text-blue-600 bg-blue-100/80 dark:text-blue-400 dark:bg-blue-950/30'
                      }`}>
                        {task.priority?.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-gray-500">
                      <span className="capitalize px-1 py-0.2 bg-slate-200/50 dark:bg-white/5 rounded text-slate-600 dark:text-gray-400 font-medium">
                        {task.status?.replace('-', ' ')}
                      </span>
                      {task.dueDate && (
                        <span className="text-[9px]">{task.dueDate}</span>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4 ml-6">
        {/* Notifications */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setIsNotifOpen(prev => !prev);
              setIsProfileOpen(false);
            }}
            className="relative p-2.5 text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-all border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 group"
            aria-label="View notifications"
            style={{
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.8)',
            }}
          >
            <Bell size={20} />
            {/* Live unread badge */}
            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold px-0.5"
                  style={{ boxShadow: '0 0 10px rgba(239, 68, 68, 0.8)' }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Notifications Dropdown */}
          <AnimatePresence>
            {isNotifOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 top-full mt-3 w-80 rounded-xl overflow-hidden glass-card shadow-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-950/95"
                style={{ boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1), 0 20px 40px rgba(0, 0, 0, 0.05)' }}
              >
                <div className="p-4 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-transparent flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-800 dark:text-white text-sm">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-full">{unreadCount} new</span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-blue-500 hover:text-blue-600 transition-colors flex items-center gap-1">
                      <CheckCircle2 size={12} />
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-[320px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-2" />
                      <p className="text-sm font-medium text-slate-700 dark:text-white">All caught up!</p>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">No overdue or urgent tasks.</p>
                    </div>
                  ) : (
                    notifications.map((notif) => {
                      const isUnread = !readNotifIds.includes(notif.id);
                      return (
                        <motion.div
                          key={notif.id}
                          whileHover={{ x: 2 }}
                          onClick={() => {
                            setReadNotifIds(prev => {
                              const updated = [...new Set([...prev, notif.id])];
                              localStorage.setItem('donezo_read_notifs', JSON.stringify(updated));
                              return updated;
                            });
                            navigate('/tasks');
                            setIsNotifOpen(false);
                          }}
                          className={`p-4 border-b border-slate-100 dark:border-white/5 cursor-pointer transition-colors ${
                            isUnread ? 'bg-blue-50/50 dark:bg-blue-950/10 hover:bg-blue-50 dark:hover:bg-blue-950/20' : 'hover:bg-slate-50 dark:hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/10 mt-0.5 flex-shrink-0">
                              {getNotifIcon(notif.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs font-semibold text-slate-800 dark:text-white">{notif.title}</p>
                                {isUnread && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
                              </div>
                              <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5 line-clamp-2">{notif.message}</p>
                              <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-1.5">{notif.time}</p>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>

                <div className="p-2 border-t border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-transparent text-center">
                  <button
                    onClick={() => { navigate('/tasks'); setIsNotifOpen(false); }}
                    className="text-xs text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white transition-colors"
                  >
                    View all tasks
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Theme Toggle */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-2.5 text-slate-500 dark:text-gray-400 hover:text-orange-500 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-all border border-slate-200 dark:border-white/10 hover:border-orange-500/30"
          aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          style={{
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.8)',
          }}
        >
          <motion.div
            animate={{ rotate: isDarkMode ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </motion.div>
        </motion.button>

        {/* User Profile */}
        <div className="relative">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => { setIsProfileOpen(!isProfileOpen); setIsNotifOpen(false); }}
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-all border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 group"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-semibold text-sm group-hover:shadow-lg transition-all">
              {userInitials}
            </div>
            <motion.div
              animate={{ rotate: isProfileOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown size={16} className="text-slate-400 dark:text-gray-500" />
            </motion.div>
          </motion.button>

          {/* Profile Dropdown */}
          <AnimatePresence>
            {isProfileOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 top-full mt-3 w-56 rounded-xl overflow-hidden glass-card shadow-2xl border border-slate-200 dark:border-white/10"
                style={{
                  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1), 0 20px 40px rgba(0, 0, 0, 0.05)',
                }}
              >
                <div className="p-4 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-transparent">
                  <p className="font-semibold text-slate-800 dark:text-white text-sm">{user?.name || 'Guest User'}</p>
                  <p className="text-xs text-slate-500 dark:text-gray-500">{user?.email || ''}</p>
                </div>
                <nav className="py-2 bg-white dark:bg-transparent">
                  <motion.button
                    whileHover={{ x: 4 }}
                    onClick={() => { navigate('/settings'); setIsProfileOpen(false); }}
                    className="w-full px-4 py-2.5 text-sm text-slate-700 dark:text-gray-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-white/5 transition-all flex items-center gap-3"
                  >
                    <User size={16} className="text-blue-500 dark:text-blue-400" />
                    Profile
                  </motion.button>
                  <motion.button
                    whileHover={{ x: 4 }}
                    onClick={() => { navigate('/settings'); setIsProfileOpen(false); }}
                    className="w-full px-4 py-2.5 text-sm text-slate-700 dark:text-gray-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-white/5 transition-all flex items-center gap-3"
                  >
                    <Settings size={16} className="text-purple-500 dark:text-purple-400" />
                    Settings
                  </motion.button>
                </nav>
                <div className="border-t border-slate-200 dark:border-white/10 p-2 bg-slate-50 dark:bg-transparent">
                  <motion.button
                    whileHover={{ x: 4 }}
                    onClick={logout}
                    className="w-full px-4 py-2.5 text-sm text-red-500 dark:text-red-400 hover:text-red-600 hover:bg-red-500/10 transition-all rounded-lg flex items-center gap-3"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
