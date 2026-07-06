import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Bell, Calendar, Plus, X } from 'lucide-react';
import { useOutletContext, useNavigate } from 'react-router-dom';

// Utility helper to parse task due dates (e.g. "May 30", "Today", "Tomorrow") to YYYY-MM-DD
const parseDueDateToYYYYMMDD = (dueDate) => {
  if (!dueDate) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    return dueDate;
  }

  const normalized = dueDate.toLowerCase().trim();
  const todayObj = new Date();
  const formatDate = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  if (normalized === 'today') return formatDate(todayObj);
  if (normalized === 'tomorrow') {
    const t = new Date(todayObj); t.setDate(t.getDate() + 1); return formatDate(t);
  }
  if (normalized === 'yesterday') {
    const y = new Date(todayObj); y.setDate(y.getDate() - 1); return formatDate(y);
  }
  if (normalized === 'next week') {
    const nw = new Date(todayObj); nw.setDate(nw.getDate() + 7); return formatDate(nw);
  }

  const months = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
    june: '06', july: '07'
  };

  const parts = normalized.split(/\s+/);
  if (parts.length >= 2) {
    const monthPart = parts[0].substring(0, 3);
    const dayPart = parts[1].replace(/\D/g, '');
    const monthNumber = months[monthPart];
    if (monthNumber && dayPart) {
      const year = new Date().getFullYear();
      return `${year}-${monthNumber}-${dayPart.padStart(2, '0')}`;
    }
  }

  return null;
};

const CalendarPage = () => {
  const { calendarEvents, setCalendarEvents, isDark, taskEvents = [] } = useOutletContext();
  const navigate = useNavigate();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTaskDetail, setSelectedTaskDetail] = useState(null);

  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    time: '10:00 AM',
    date: todayStr
  });

  const daysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  
  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  // Merge calendar events (type: manual) and derived task events (type: task)
  const allMergedEvents = useMemo(() => [
    ...calendarEvents.map(event => ({ ...event, isTask: false })),
    ...taskEvents.map(task => ({
      ...task,
      isTask: true,
      date: parseDueDateToYYYYMMDD(task.date) || task.date,
      originalDate: task.date,
      time: 'All Day',
      description: `Task status: ${task.status?.replace('_', ' ').toUpperCase()} | Priority: ${task.priority?.toUpperCase()}`
    }))
  ], [calendarEvents, taskEvents]);

  // Pre-index events by date string for O(1) day-cell lookup
  const eventsByDate = useMemo(() => {
    const map = {};
    allMergedEvents.forEach(event => {
      if (event.date) {
        if (!map[event.date]) {
          map[event.date] = [];
        }
        map[event.date].push(event);
      }
    });
    return map;
  }, [allMergedEvents]);

  const getDayEvents = (day) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return eventsByDate[dateStr] || [];
  };

  const formattedSelectedDate = selectedDate 
    ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
    : null;

  const displayedEvents = useMemo(() => {
    return formattedSelectedDate
      ? allMergedEvents.filter(event => event.date === formattedSelectedDate)
      : allMergedEvents;
  }, [allMergedEvents, formattedSelectedDate]);

  const openAddEventModal = () => {
    const d = new Date();
    const todayFormatted = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setNewEvent({
      title: '',
      description: '',
      time: '10:00 AM',
      date: formattedSelectedDate || todayFormatted
    });
    setIsModalOpen(true);
  };

  const handleAddEvent = (e) => {
    e.preventDefault();
    if (!newEvent.title.trim()) return;

    const eventWithId = {
      ...newEvent,
      id: String(Date.now()),
      createdAt: Date.now()
    };
    setCalendarEvents([...calendarEvents, eventWithId]);
    setIsModalOpen(false);
    const d = new Date();
    const todayFormatted = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setNewEvent({
      title: '',
      description: '',
      time: '10:00 AM',
      date: formattedSelectedDate || todayFormatted
    });
  };

  const renderCalendarDays = () => {
    const days = [];
    const totalDays = daysInMonth(currentDate);
    const firstDay = firstDayOfMonth(currentDate);

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-gray-50/10 dark:bg-zinc-900/20 rounded-lg"></div>);
    }

    // Days of month
    for (let day = 1; day <= totalDays; day++) {
      const events = getDayEvents(day);
      const isSelected = selectedDate && 
        selectedDate.getDate() === day && 
        selectedDate.getMonth() === currentDate.getMonth() && 
        selectedDate.getFullYear() === currentDate.getFullYear();

      days.push(
        <motion.div
          key={day}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: day * 0.01 }}
          onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
          className={`h-24 p-2 rounded-lg glass-card hover:shadow-md transition-all cursor-pointer group relative ${
            isSelected 
              ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/15' 
              : 'border-slate-200 dark:border-white/10 hover:border-indigo-400/40'
          }`}
        >
          <div className={`text-sm font-semibold mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors ${
            isSelected ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-800 dark:text-white'
          }`}>
            {day}
          </div>
          <div className="space-y-1 overflow-hidden">
            {events.slice(0, 2).map((event, idx) => (
              <div
                key={idx}
                onClick={(e) => {
                  if (event.isTask) {
                    e.stopPropagation(); // prevent selecting the date cell
                    setSelectedTaskDetail(event);
                  }
                }}
                className={`text-[10px] px-1.5 py-0.5 rounded truncate border ${
                  event.isTask
                    ? 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-500/20 hover:bg-purple-200 dark:hover:bg-purple-900/40 cursor-pointer'
                    : 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-500/10'
                }`}
              >
                {event.isTask && <span className="mr-0.5">Task:</span>}
                {event.title}
              </div>
            ))}
            {events.length > 2 && (
              <div className="text-[9px] px-1.5 py-0.5 text-slate-500 dark:text-gray-400 font-medium">
                +{events.length - 2} more
              </div>
            )}
          </div>
        </motion.div>
      );
    }

    return days;
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Calendar</h1>
          <p className="text-slate-600 dark:text-gray-400 mt-1 font-medium">Plan your tasks and events</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={openAddEventModal}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-indigo-600/20 font-medium text-sm"
        >
          <Plus size={18} />
          Schedule Event
        </motion.button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-xl p-6"
          >
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{monthName}</h2>
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={previousMonth}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-white"
                >
                  <ChevronLeft size={20} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={nextMonth}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-white"
                >
                  <ChevronRight size={20} />
                </motion.button>
              </div>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-semibold text-slate-500 dark:text-gray-400 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-2">
              {renderCalendarDays()}
            </div>
          </motion.div>
        </div>

        {/* Upcoming Events Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar size={20} className="text-indigo-500" />
              {formattedSelectedDate ? `Events on ${selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'Upcoming Events'}
            </h3>
            {formattedSelectedDate && (
              <button 
                onClick={() => setSelectedDate(null)}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold"
              >
                Clear Filter
              </button>
            )}
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {displayedEvents.length === 0 ? (
              <div className="glass-card p-6 rounded-lg text-center text-slate-400 dark:text-gray-500 border border-slate-200 dark:border-transparent">
                No events scheduled for this day
              </div>
            ) : (
              displayedEvents.map((event, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => {
                    if (event.isTask) {
                      setSelectedTaskDetail(event);
                    }
                  }}
                  className={`glass-card p-4 rounded-lg hover:shadow-md transition-all border ${
                    event.isTask 
                      ? 'border-purple-200 dark:border-purple-950/30 hover:border-purple-500/30 cursor-pointer' 
                      : 'border-slate-200 dark:border-transparent hover:border-indigo-500/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 animate-glow-pulse ${
                      event.isTask 
                        ? 'bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-500/20' 
                        : 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                    }`}>
                      {event.isTask ? (
                        <Calendar size={16} />
                      ) : (
                        <Bell size={16} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-semibold text-slate-800 dark:text-white text-sm truncate">
                          {event.title}
                        </h4>
                        {event.isTask && (
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${
                            event.priority === 'high' ? 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-950/30' :
                            event.priority === 'medium' ? 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-950/30' :
                            'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-950/30'
                          }`}>
                            TASK
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5 font-semibold">
                        {event.originalDate || event.date} | {event.time}
                      </p>
                      {event.description && (
                        <p className="text-xs text-slate-500 dark:text-gray-500 mt-1 line-clamp-2">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Add Event Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card w-full max-w-md p-6 rounded-2xl relative z-10 border border-slate-200 dark:border-white/10 shadow-2xl"
              style={{
                background: isDark
                  ? 'linear-gradient(135deg, rgba(20, 25, 50, 0.95) 0%, rgba(10, 12, 30, 0.98) 100%)'
                  : 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(240, 245, 250, 0.99) 100%)',
              }}
            >
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
                <Calendar size={22} className="text-indigo-500" />
                Schedule New Event
              </h2>
              
              <form onSubmit={handleAddEvent} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-gray-400 mb-1">Event Title</label>
                  <input
                    type="text"
                    required
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all"
                    placeholder="e.g. Project Demo"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-gray-400 mb-1">Description</label>
                  <textarea
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all h-20 resize-none"
                    placeholder="Meeting details..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-gray-400 mb-1">Date</label>
                    <input
                      type="date"
                      required
                      value={newEvent.date}
                      onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                      className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-gray-400 mb-1">Time</label>
                    <input
                      type="text"
                      required
                      value={newEvent.time}
                      onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                      className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all"
                      placeholder="e.g. 2:00 PM"
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-gray-300 font-semibold rounded-lg text-sm transition-colors border border-slate-200 dark:border-transparent"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-sm transition-colors shadow-lg"
                  >
                    Add Event
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Read-Only Task Detail Popover */}
      <AnimatePresence>
        {selectedTaskDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTaskDetail(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card w-full max-w-md p-6 rounded-2xl relative z-10 border border-slate-200 dark:border-white/10 shadow-2xl"
              style={{
                background: isDark
                  ? 'linear-gradient(135deg, rgba(20, 25, 50, 0.95) 0%, rgba(10, 12, 30, 0.98) 100%)'
                  : 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(240, 245, 250, 0.99) 100%)',
              }}
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedTaskDetail(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-105 dark:hover:bg-white/10 text-slate-500 dark:text-gray-400 transition-colors"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wide flex items-center gap-1">
                  Task Details
                </span>
              </div>

              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                {selectedTaskDetail.title}
              </h3>

              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-white/5">
                  <span className="text-xs font-semibold text-slate-500 dark:text-gray-400">Priority</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    selectedTaskDetail.priority === 'high' ? 'text-red-600 bg-red-100/80 dark:text-red-400 dark:bg-red-950/30' :
                    selectedTaskDetail.priority === 'medium' ? 'text-yellow-600 bg-yellow-100/80 dark:text-yellow-400 dark:bg-yellow-950/30' :
                    'text-blue-600 bg-blue-100/80 dark:text-blue-400 dark:bg-blue-950/30'
                  }`}>
                    {selectedTaskDetail.priority?.toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-white/5">
                  <span className="text-xs font-semibold text-slate-500 dark:text-gray-400">Status</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-gray-300`}>
                    {selectedTaskDetail.status?.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-white/5">
                  <span className="text-xs font-semibold text-slate-500 dark:text-gray-400">Due Date</span>
                  <span className="text-xs font-medium text-slate-800 dark:text-gray-200">
                    {selectedTaskDetail.originalDate || selectedTaskDetail.date}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setSelectedTaskDetail(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-gray-300 font-semibold rounded-lg text-sm transition-colors border border-slate-200 dark:border-transparent"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setSelectedTaskDetail(null);
                    navigate('/tasks');
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-sm transition-colors shadow-lg flex items-center gap-1"
                >
                  Go to Task Board
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CalendarPage;
