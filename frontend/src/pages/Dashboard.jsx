import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, TrendingUp, Flame, ArrowUpRight } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { EnhancedCard, StatCard } from '../components/ui/EnhancedCard';
import { WeatherCard, FocusTimerCard, SystemStatusCard, QuickActionCard, TaskPreviewCard, SolveMyDayCard } from '../components/ui/SpecializedCards';
import FrictionFinderWidget from '../components/ui/FrictionFinderWidget';
import { useOutletContext } from 'react-router-dom';
import ErrorBoundary from '../components/ErrorBoundary';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { tasks, setTasks, calendarEvents } = useOutletContext();
  const { user } = useAuth();

  // --- Real Data Computations ---
  const completedCount = tasks.filter(t => t.status === 'done').length;
  const completionRate = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  // Weekly activity from real task creation/completion timestamps
  const weeklyActivity = useMemo(() => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const addedCounts = [0, 0, 0, 0, 0, 0, 0];
    const doneCounts = [0, 0, 0, 0, 0, 0, 0];
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    tasks.forEach(t => {
      if (t.createdAt && t.createdAt > cutoff) addedCounts[new Date(t.createdAt).getDay()]++;
      if (t.completedAt && t.completedAt > cutoff) doneCounts[new Date(t.completedAt).getDay()]++;
    });
    return dayNames.map((day, i) => ({ day, tasks: addedCounts[i], focus: doneCounts[i] }));
  }, [tasks]);

  // Productivity by hour from completedAt times
  const peakHours = useMemo(() => {
    const buckets = { '9AM': 0, '11AM': 0, '1PM': 0, '3PM': 0, '5PM': 0 };
    const hourMap = { 9: '9AM', 10: '9AM', 11: '11AM', 12: '11AM', 13: '1PM', 14: '1PM', 15: '3PM', 16: '3PM', 17: '5PM', 18: '5PM' };
    tasks.forEach(t => {
      if (t.completedAt) {
        const hr = new Date(t.completedAt).getHours();
        const bucket = hourMap[hr];
        if (bucket) buckets[bucket]++;
      }
    });
    const maxVal = Math.max(...Object.values(buckets), 1);
    return Object.entries(buckets).map(([hour, count]) => ({ hour, productivity: Math.round((count / maxVal) * 100) }));
  }, [tasks]);

  // Current streak: consecutive days with at least one completed task
  const streak = useMemo(() => {
    const completedDates = new Set(
      tasks.filter(t => t.completedAt).map(t => new Date(t.completedAt).toISOString().split('T')[0])
    );
    let count = 0;
    const d = new Date();
    while (completedDates.has(d.toISOString().split('T')[0])) {
      count++;
      d.setDate(d.getDate() - 1);
    }
    return count;
  }, [tasks]);

  // Upcoming real calendar events (today or future, sorted by date)
  const upcomingEvents = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return [...calendarEvents]
      .filter(e => e.date && e.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 4);
  }, [calendarEvents]);

  // Focus time from timer (seconds elapsed since last reset)
  const focusStr = useMemo(() => {
    const totalSecs = 45 * 60 + 32; // matches FocusTimerCard's total
    const secsLeft = parseInt(localStorage.getItem('donezo_timer_seconds') || String(totalSecs), 10);
    const elapsed = Math.max(0, totalSecs - secsLeft);
    const h = Math.floor(elapsed / 3600);
    const m = Math.floor((elapsed % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m` : '0m';
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  };

  // Custom Recharts styling
  const chartConfig = {
    responsive: true,
    margin: { top: 10, right: 30, left: 0, bottom: 0 },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto pb-20"
    >
      {/* Welcome Header */}
      <motion.div variants={itemVariants}>
        <div className="relative overflow-hidden rounded-2xl backdrop-blur-xl border border-slate-200/80 dark:border-white/10 p-8 md:p-10 group bg-slate-100/50 dark:bg-transparent">
          {/* Animated background gradient */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse" />
          </div>

          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                Welcome back, {user?.name ? user.name.split(' ')[0] : 'User'}
              </h1>
              <p className="text-slate-600 dark:text-gray-400 text-lg">
                {streak > 0
                  ? <>You're on a <span className="text-orange-600 dark:text-orange-400 font-semibold">{streak}-day streak</span>! Keep crushing your goals.</>
                  : <>Complete a task today to start your streak.</>}
              </p>
            </motion.div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-3 gap-4 mt-8">
              <div className="glass-card p-4 rounded-xl">
                <p className="text-xs text-slate-500 dark:text-gray-400 mb-1">Today's Progress</p>
                <div className="flex items-end gap-3">
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{completionRate}%</span>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <ArrowUpRight size={12} /> +12%
                  </span>
                </div>
              </div>
              <div className="glass-card p-4 rounded-xl">
                <p className="text-xs text-slate-500 dark:text-gray-400 mb-1">Focus Time</p>
                <div className="flex items-end gap-3">
                  <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">4h 32m</span>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <ArrowUpRight size={12} /> +8%
                  </span>
                </div>
              </div>
              <div className="glass-card p-4 rounded-xl">
                <p className="text-xs text-slate-500 dark:text-gray-400 mb-1">Tasks Done</p>
                <div className="flex items-end gap-3">
                  <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">{completedCount}</span>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <ArrowUpRight size={12} /> +5%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={CheckCircle2}
          label="Tasks Completed"
          value={String(completedCount)}
          change={12}
          color="blue"
          delay={0.1}
        />
        <StatCard
          icon={Clock}
          label="Focus Hours"
          value={focusStr}
          change={8}
          color="purple"
          delay={0.15}
        />
        <StatCard
          icon={TrendingUp}
          label="Completion Rate"
          value={`${completionRate}%`}
          change={5}
          color="orange"
          delay={0.2}
        />
        <StatCard
          icon={Flame}
          label="Current Streak"
          value={streak > 0 ? `${streak} day${streak !== 1 ? 's' : ''}` : 'No streak yet'}
          change={streak > 0 ? 2 : 0}
          color="blue"
          delay={0.25}
        />
      </motion.div>

      {/* Charts & Widgets Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Activity Chart - Larger */}
        <div className="lg:col-span-2">
          <EnhancedCard variant="blue" className="p-6 h-full">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white mb-1">Weekly Activity</h3>
              <p className="text-sm text-gray-500">Tasks and focus hours trend</p>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyActivity} {...chartConfig}>
                  <defs>
                    <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorFocus" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="day" stroke="#94A3B8" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#94A3B8" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(5, 8, 22, 0.9)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                    }}
                  />
                  <Area type="monotone" dataKey="tasks" stroke="#3B82F6" fillOpacity={1} fill="url(#colorTasks)" />
                  <Area type="monotone" dataKey="focus" stroke="#8B5CF6" fillOpacity={1} fill="url(#colorFocus)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </EnhancedCard>
        </div>

        {/* Weather Widget */}
        <div>
          <WeatherCard delay={0.3} />
        </div>
      </motion.div>

      {/* Bottom Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Focus Timer */}
        <ErrorBoundary>
          <FocusTimerCard delay={0.35} />
        </ErrorBoundary>

        {/* Peak Hours Chart */}
        <EnhancedCard variant="purple" className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white mb-1">Peak Productivity Hours</h3>
            <p className="text-sm text-gray-500">Most productive times</p>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peakHours} {...chartConfig}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="hour" stroke="#94A3B8" style={{ fontSize: '11px' }} />
                <YAxis stroke="#94A3B8" style={{ fontSize: '11px' }} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(5, 8, 22, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="productivity" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </EnhancedCard>

        {/* System Status */}
        <ErrorBoundary>
          <SystemStatusCard delay={0.4} />
        </ErrorBoundary>
      </motion.div>

      {/* Quick Actions, Solve My Day & Task Preview */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <QuickActionCard delay={0.45} />
        <ErrorBoundary>
          <SolveMyDayCard delay={0.48} />
        </ErrorBoundary>
        <TaskPreviewCard delay={0.5} />
      </motion.div>

      {/* Upcoming Events */}
      <motion.div variants={itemVariants}>
        <EnhancedCard variant="orange" className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">📅 Upcoming Events</h3>
            <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">Your next scheduled meetings</p>
          </div>

          {upcomingEvents.length === 0 ? (
            <div className="text-center py-8 text-slate-400 dark:text-gray-500">
              <p className="text-lg mb-1">📭</p>
              <p className="text-sm">No upcoming events. Add one in the Calendar!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map((event, idx) => (
                <motion.div
                  key={event.id || idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + idx * 0.1 }}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 hover:border-orange-500/30 dark:hover:border-orange-500/30 transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-300 transition-colors">
                        {event.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">{event.date} • {event.time}</p>
                    </div>
                    {event.duration && (
                      <div className="text-right">
                        <div className="inline-block px-3 py-1 rounded-lg bg-orange-500/20 text-orange-600 dark:text-orange-300 text-xs font-semibold">
                          {event.duration}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </EnhancedCard>
      </motion.div>

      {/* Friction Finder */}
      <motion.div variants={itemVariants}>
        <ErrorBoundary>
          <FrictionFinderWidget tasks={tasks} setTasks={setTasks} />
        </ErrorBoundary>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
