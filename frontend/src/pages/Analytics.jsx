import { motion } from 'framer-motion';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Legend } from 'recharts';
import { TrendingUp, Clock, CheckCircle2, Flame, AlertCircle } from 'lucide-react';
import { useOutletContext, Link } from 'react-router-dom';
import { StatCard, EnhancedCard } from '../components/ui/EnhancedCard';
import { detectFriction } from '../utils/frictionDetector';
import { useMemo } from 'react';

const AnalyticsPage = () => {
  const { tasks = [] } = useOutletContext();

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'done').length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // 1. Completed this week
    const compThisWeek = tasks.filter(t => {
      if (t.status !== 'done') return false;
      if (!t.completedAt) return true; // fallback for initial mock data tasks
      return (Date.now() - t.completedAt) < 7 * 24 * 60 * 60 * 1000;
    }).length;

    // 2. Average time in progress (completedAt - createdAt) in hours
    const done = tasks.filter(t => t.status === 'done');
    let avgTime = 0;
    let doneWithTime = 0;
    let totalHrs = 0;

    done.forEach(t => {
      const completedTime = t.completedAt;
      const createdTime = t.createdAt || (completedTime ? completedTime - 4 * 60 * 60 * 1000 : null);
      if (completedTime && createdTime) {
        const diffMs = completedTime - createdTime;
        const diffHrs = diffMs / (1000 * 60 * 60);
        totalHrs += diffHrs;
        doneWithTime++;
      }
    });

    if (doneWithTime > 0) {
      avgTime = Math.round((totalHrs / doneWithTime) * 10) / 10;
    }

    // 3. Status chart data
    const todoCount = tasks.filter(t => t.status === 'todo').length;
    const inProgressCount = tasks.filter(t => t.status === 'in-progress').length;
    const reviewCount = tasks.filter(t => t.status === 'review').length;
    const doneCount = tasks.filter(t => t.status === 'done').length;

    const status = [
      { name: 'To Do', count: todoCount },
      { name: 'In Progress', count: inProgressCount },
      { name: 'In Review', count: reviewCount },
      { name: 'Done', count: doneCount }
    ];

    // 4. Priority chart data
    const lowCount = tasks.filter(t => t.priority === 'low').length;
    const mediumCount = tasks.filter(t => t.priority === 'medium').length;
    const highCount = tasks.filter(t => t.priority === 'high').length;

    const priority = [
      { name: 'Low', value: lowCount },
      { name: 'Medium', value: mediumCount },
      { name: 'High', value: highCount }
    ].filter(p => p.value > 0);

    // 5. Daily Completion Trend (Last 7 Days)
    const trend = [];
    const oneDayMs = 24 * 60 * 60 * 1000;
    const now = Date.now();

    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date(now - i * oneDayMs);
      const dateLabel = targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const targetDateStr = targetDate.toDateString();

      const count = tasks.filter(t => {
        if (t.status !== 'done') return false;
        if (!t.completedAt) {
          const idNum = parseInt(t.id, 10) || 0;
          return (idNum % 7) === i;
        }
        const compDate = new Date(t.completedAt);
        return compDate.toDateString() === targetDateStr;
      }).length;

      trend.push({
        day: dateLabel,
        completed: count
      });
    }

    return {
      totalTasks: total,
      completedCount: completed,
      completionRate: rate,
      completedThisWeek: compThisWeek,
      avgTimeInProgress: avgTime,
      statusData: status,
      priorityData: priority,
      trendData: trend
    };
  }, [tasks]);

  const {
    totalTasks,
    completedCount,
    completionRate,
    completedThisWeek,
    avgTimeInProgress,
    statusData,
    priorityData,
    trendData
  } = stats;

  const frictionAlerts = useMemo(() => detectFriction(tasks), [tasks]);
  const frictionChartData = useMemo(() => frictionAlerts.map(a => ({
    name: a.task.title.length > 15 ? a.task.title.substring(0, 15) + '...' : a.task.title,
    hours: a.hoursStuck
  })), [frictionAlerts]);
  
  const avgStuckHours = frictionAlerts.length > 0 
    ? Math.round(frictionAlerts.reduce((sum, a) => sum + a.hoursStuck, 0) / frictionAlerts.length) 
    : 0;

  const COLORS = ['#3B82F6', '#8B5CF6', '#FB923C'];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Analytics</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Track your productivity and performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={AlertCircle}
          label="Total Tasks"
          value={String(totalTasks)}
          change={5}
          color="blue"
          delay={0.05}
        />
        <StatCard
          icon={CheckCircle2}
          label="Completed This Week"
          value={String(completedThisWeek)}
          change={12}
          color="purple"
          delay={0.1}
        />
        <StatCard
          icon={TrendingUp}
          label="Completion Rate"
          value={`${completionRate}%`}
          change={8}
          color="orange"
          delay={0.15}
        />
        <StatCard
          icon={Clock}
          label="Avg Time in Progress"
          value={`${avgTimeInProgress}h`}
          change={15}
          color="cyan"
          delay={0.2}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Completion Trend Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-card rounded-xl p-6"
        >
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">7-Day Completion Trend</h3>
            <p className="text-xs text-slate-500">Tasks completed daily</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="day" stroke="#9ca3af" style={{ fontSize: '11px' }} />
              <YAxis stroke="#9ca3af" style={{ fontSize: '11px' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(5, 8, 22, 0.95)', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Area type="monotone" dataKey="completed" name="Tasks Done" stroke="#8B5CF6" fillOpacity={1} fill="url(#colorCompleted)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Task Priority Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-xl p-6"
        >
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Tasks by Priority</h3>
            <p className="text-xs text-slate-500">Breakdown of priority levels</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            {priorityData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No priority data available
              </div>
            ) : (
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(5, 8, 22, 0.95)', 
                    border: '1px solid rgba(255, 255, 255, 0.1)', 
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
              </PieChart>
            )}
          </ResponsiveContainer>
        </motion.div>

        {/* Tasks by Status Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="glass-card rounded-xl p-6 lg:col-span-2"
        >
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Tasks by Status</h3>
            <p className="text-xs text-slate-500">Distribution of Kanban board steps</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="name" stroke="#9ca3af" style={{ fontSize: '11px' }} />
              <YAxis stroke="#9ca3af" style={{ fontSize: '11px' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(5, 8, 22, 0.95)', 
                  border: '1px solid rgba(255, 255, 255, 0.1)', 
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Bar dataKey="count" name="Tasks" fill="#3B82F6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Weekly Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card rounded-xl p-6"
      >
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Live Productive Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900/30">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Uncompleted Tasks</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
              {tasks.filter(t => t.status !== 'done').length}
            </p>
          </div>
          <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-900/30">
            <p className="text-sm text-gray-600 dark:text-gray-400">Task Completion Rate</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{completionRate}%</p>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900/30">
            <p className="text-sm text-gray-600 dark:text-gray-400">Average Active Task Time</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{avgTimeInProgress} hours</p>
          </div>
        </div>
      </motion.div>

      {/* Friction Report */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="glass-card rounded-xl p-6"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Friction Report</h3>
            <p className="text-sm text-slate-500 mt-1">
              Average time tasks spend stuck: <span className="font-bold text-orange-600 dark:text-orange-400">{avgStuckHours} hours</span>
            </p>
          </div>
          <Link to="/" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 px-4 py-2 rounded-lg transition-colors">
            Resolve in Dashboard →
          </Link>
        </div>
        
        {frictionChartData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-sm text-slate-500">
            No friction detected! Your system is healthy.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={frictionChartData} layout="vertical" margin={{ left: 50, right: 20, top: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" horizontal={true} vertical={false} />
              <XAxis type="number" stroke="#9ca3af" style={{ fontSize: '11px' }} />
              <YAxis dataKey="name" type="category" stroke="#9ca3af" style={{ fontSize: '11px' }} width={100} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(5, 8, 22, 0.95)', 
                  border: '1px solid rgba(255, 255, 255, 0.1)', 
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Bar dataKey="hours" name="Hours Stuck" fill="#FB923C" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </motion.div>
    </div>
  );
};

export default AnalyticsPage;
