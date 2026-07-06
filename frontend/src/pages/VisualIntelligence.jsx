import React, { useState, useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { 
  BarChart3, 
  PieChart as PieChartIcon, 
  Share2, 
  GitMerge, 
  ListTodo, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Sparkles,
  ArrowRight,
  CalendarDays,
  Flag,
  Target
} from 'lucide-react';

import { StatCard, EnhancedCard } from '../components/ui/EnhancedCard';
import AIMindMapCard from '../components/ui/AIMindMapCard';
import { 
  computeStats, 
  groupByDay, 
  getStalledTasks, 
  computeInsights 
} from '../utils/taskAnalytics';

const COLORS = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#10b981',
  todo: '#64748b',
  inProgress: '#3b82f6',
  review: '#a855f7',
  done: '#10b981'
};

const TABS = [
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'infographic', label: 'Infographic', icon: PieChartIcon },
  { id: 'mindmap', label: 'Mind Map', icon: Share2 },
  { id: 'flowcharts', label: 'Flowcharts', icon: GitMerge },
];

const STATUS_LABELS = {
  todo: 'To Do',
  'in-progress': 'In Progress',
  review: 'Review',
  done: 'Done'
};

const FLOW_STEPS = [
  { id: 'todo', label: 'Clarify', helper: 'Write the exact outcome' },
  { id: 'in-progress', label: 'Work', helper: 'Finish the smallest part' },
  { id: 'review', label: 'Check', helper: 'Review and fix gaps' },
  { id: 'done', label: 'Complete', helper: 'Submit or mark done' }
];

const priorityScore = { high: 3, medium: 2, low: 1 };

function getDueTime(task) {
  if (!task?.dueDate) return Number.MAX_SAFE_INTEGER;
  const due = new Date(task.dueDate).getTime();
  return Number.isNaN(due) ? Number.MAX_SAFE_INTEGER : due;
}

function isTaskOverdue(task) {
  const due = getDueTime(task);
  return due !== Number.MAX_SAFE_INTEGER && task.status !== 'done' && due < Date.now();
}

function sortActionableTasks(tasks) {
  return [...tasks]
    .filter(task => task.status !== 'done')
    .sort((a, b) => {
      if (isTaskOverdue(a) !== isTaskOverdue(b)) return isTaskOverdue(a) ? -1 : 1;
      const priorityDiff = (priorityScore[b.priority] || 0) - (priorityScore[a.priority] || 0);
      if (priorityDiff !== 0) return priorityDiff;
      return getDueTime(a) - getDueTime(b);
    });
}

function getNextAction(task) {
  if (!task) return 'Create a task to see your next action.';
  if (task.status === 'review') return 'Review the final output, fix small gaps, then mark it complete.';
  if (task.status === 'in-progress') return 'Finish one small working part before switching tasks.';
  if (isTaskOverdue(task)) return 'Handle this first because the due date has passed.';
  if (task.priority === 'high') return 'Start a 25-minute focus session and complete the first visible step.';
  return 'Clarify the outcome, then finish the smallest useful step.';
}

function getStepState(task, stepId) {
  const order = FLOW_STEPS.map(step => step.id);
  const currentIndex = order.indexOf(task.status);
  const stepIndex = order.indexOf(stepId);
  if (task.status === 'done' || stepIndex < currentIndex) return 'done';
  if (stepIndex === currentIndex) return 'current';
  return 'next';
}

export default function VisualIntelligence() {
  const { tasks, setTasks, isDark } = useOutletContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('analytics');

  // Compute metrics
  const stats = useMemo(() => computeStats(tasks), [tasks]);
  const insights = useMemo(() => computeInsights(tasks), [tasks]);
  const stalledTasks = useMemo(() => getStalledTasks(tasks).slice(0, 4), [tasks]);
  
  const completionTrend = useMemo(() => groupByDay(tasks, 'completedAt', 7), [tasks]);
  
  const statusData = useMemo(() => {
    return [
      { name: 'To Do', count: tasks.filter(t => t.status === 'todo').length, fill: COLORS.todo },
      { name: 'In Progress', count: tasks.filter(t => t.status === 'in-progress').length, fill: COLORS.inProgress },
      { name: 'Review', count: tasks.filter(t => t.status === 'review').length, fill: COLORS.review },
      { name: 'Done', count: tasks.filter(t => t.status === 'done').length, fill: COLORS.done }
    ];
  }, [tasks]);

  const priorityData = useMemo(() => {
    return [
      { name: 'High', count: tasks.filter(t => t.priority === 'high').length, fill: COLORS.high },
      { name: 'Medium', count: tasks.filter(t => t.priority === 'medium').length, fill: COLORS.medium },
      { name: 'Low', count: tasks.filter(t => t.priority === 'low').length, fill: COLORS.low }
    ];
  }, [tasks]);

  const weeklyHeatmap = useMemo(() => groupByDay(tasks, 'completedAt', 7), [tasks]);
  const flowchartTasks = useMemo(() => sortActionableTasks(tasks).slice(0, 5), [tasks]);
  const recommendedTask = flowchartTasks[0];
  const hasTasks = stats.totalTasks > 0;
  const pieData = hasTasks ? [
    { name: 'Completed', value: stats.completedTasks, fill: COLORS.done },
    { name: 'Pending', value: stats.totalTasks - stats.completedTasks, fill: COLORS.todo }
  ] : [
    { name: 'No tasks yet', value: 1, fill: COLORS.todo }
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-teal-600 dark:from-emerald-400 dark:to-teal-500">
            Visual Intelligence
          </h1>
          <p className="text-slate-500 dark:text-gray-400 mt-1">Deep insights and visual mapping of your tasks.</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-slate-200/50 dark:bg-zinc-900/50 p-1 rounded-xl">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive 
                    ? 'text-emerald-700 dark:text-emerald-400' 
                    : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-200'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute inset-0 bg-white dark:bg-zinc-800 rounded-lg shadow-sm"
                    initial={false}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <Icon size={16} />
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                  title="Total Tasks" 
                  value={stats.totalTasks} 
                  icon={ListTodo}
                  color="blue"
                  isDark={isDark}
                />
                <StatCard 
                  title="Completion Rate" 
                  value={`${stats.completionRate}%`} 
                  icon={CheckCircle2}
                  color="emerald"
                  isDark={isDark}
                />
                <StatCard 
                  title="Avg. Time (hrs)" 
                  value={stats.avgCompletionTime} 
                  icon={Clock}
                  color="purple"
                  isDark={isDark}
                />
                <StatCard 
                  title="Overdue" 
                  value={stats.overdueTasks} 
                  icon={AlertTriangle}
                  color="red"
                  isDark={isDark}
                />
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <EnhancedCard className="p-6 col-span-1 lg:col-span-2 h-96" variant="blue">
                  <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-white">7-Day Completion Trend</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={completionTrend}>
                      <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
                      <XAxis dataKey="date" stroke={isDark ? '#94a3b8' : '#64748b'} />
                      <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: isDark ? '#334155' : '#e2e8f0', color: isDark ? '#fff' : '#000' }}
                      />
                      <Area type="monotone" dataKey="count" stroke="#10b981" fillOpacity={1} fill="url(#colorCount)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </EnhancedCard>

                <EnhancedCard className="p-6 h-80" variant="purple">
                  <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-white">Tasks by Status</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statusData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
                      <XAxis dataKey="name" stroke={isDark ? '#94a3b8' : '#64748b'} />
                      <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} />
                      <RechartsTooltip 
                         contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: isDark ? '#334155' : '#e2e8f0', color: isDark ? '#fff' : '#000' }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </EnhancedCard>

                <EnhancedCard className="p-6 h-80" variant="orange">
                  <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-white">Tasks by Priority</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={priorityData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
                      <XAxis dataKey="name" stroke={isDark ? '#94a3b8' : '#64748b'} />
                      <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} />
                      <RechartsTooltip 
                         contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: isDark ? '#334155' : '#e2e8f0', color: isDark ? '#fff' : '#000' }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {priorityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </EnhancedCard>
              </div>
            </div>
          )}

          {activeTab === 'infographic' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 1. Priority Breakdown */}
                <EnhancedCard className="p-6" variant="red">
                  <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-white">Priority Breakdown</h3>
                  <div className="space-y-4">
                    {priorityData.map(p => (
                      <div key={p.name} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400">{p.name}</span>
                          <span className="font-medium text-slate-800 dark:text-slate-200">{p.count}</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-zinc-800 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full" 
                            style={{ width: `${stats.totalTasks ? (p.count / stats.totalTasks) * 100 : 0}%`, backgroundColor: p.fill }} 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </EnhancedCard>

                {/* 2. Completion Ring */}
                <EnhancedCard className="p-6" variant="emerald">
                  <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-white">Completion Status</h3>
                  <div className="h-48 relative flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <RechartsTooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff' }} />
                        <Legend verticalAlign="middle" align="right" layout="vertical" />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-y-0 left-0 right-24 flex items-center justify-center pointer-events-none">
                      <span className="text-2xl font-bold text-slate-800 dark:text-white">{stats.completionRate}%</span>
                    </div>
                  </div>
                </EnhancedCard>

                {/* 3. Top 4 Stalled Tasks */}
                <EnhancedCard className="p-6" variant="purple">
                  <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-white">Top Stalled Tasks</h3>
                  <div className="space-y-3">
                    {stalledTasks.length === 0 ? (
                      <p className="text-slate-500 dark:text-slate-400 text-sm">No stalled tasks found.</p>
                    ) : (
                      stalledTasks.map(task => (
                        <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-700/50">
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate pr-4">{task.title}</span>
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                            task.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' :
                            task.priority === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                            'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                          }`}>
                            {task.priority}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </EnhancedCard>

                {/* 4. Weekly Heatmap */}
                <EnhancedCard className="p-6" variant="blue">
                  <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-white">Weekly Heatmap</h3>
                  <div className="flex justify-between items-end h-32 mt-8">
                    {weeklyHeatmap.map(day => (
                      <div key={day.date} className="flex flex-col items-center gap-2 group">
                        <div 
                          className="w-8 rounded-t-sm bg-emerald-500/80 dark:bg-emerald-400 transition-all duration-300 group-hover:bg-emerald-600 dark:group-hover:bg-emerald-300"
                          style={{ height: `${day.count === 0 ? 4 : (day.count / Math.max(1, ...weeklyHeatmap.map(d => d.count))) * 100}px` }}
                        >
                          <div className="opacity-0 group-hover:opacity-100 absolute -translate-y-8 bg-slate-800 text-white text-xs px-2 py-1 rounded transition-opacity">
                            {day.count}
                          </div>
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400 rotate-45 origin-left mt-2">{day.date}</span>
                      </div>
                    ))}
                  </div>
                </EnhancedCard>
              </div>

              {/* Auto Insights Box */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg">
                    <Sparkles size={20} className="text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-100">Auto Insights</h3>
                </div>
                <ul className="space-y-3 text-indigo-800/80 dark:text-indigo-200/80">
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-500 mt-1">-</span>
                    <span><strong>Peak productivity day:</strong> {insights.peakDay} (most tasks completed this week)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-500 mt-1">-</span>
                    <span><strong>Most blocked priority:</strong> {insights.mostBlockedPriority} (priority with most stuck tasks)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-500 mt-1">-</span>
                    <span><strong>Estimated backlog clearance:</strong> {insights.daysToComplete} days (at current 7-day velocity)</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'mindmap' && (
            <AIMindMapCard tasks={tasks} setTasks={setTasks} />
          )}

          {activeTab === 'flowcharts' && (
            <div className="space-y-6">
              {flowchartTasks.length === 0 ? (
                <EnhancedCard className="p-8 text-center" variant="blue">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                    <CheckCircle2 size={28} />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white">No active tasks to map</h3>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    Add a task or move one out of Done to see a task-specific flowchart.
                  </p>
                  <button
                    onClick={() => navigate('/tasks')}
                    className="mt-5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    Open Tasks
                  </button>
                </EnhancedCard>
              ) : (
                <>
                  <EnhancedCard className="p-6" variant="emerald">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                          Recommended next task
                        </p>
                        <h3 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                          {recommendedTask.title}
                        </h3>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                          {getNextAction(recommendedTask)}
                        </p>
                      </div>
                      <button
                        onClick={() => navigate('/tasks')}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                      >
                        Open task board <ArrowRight size={16} />
                      </button>
                    </div>
                  </EnhancedCard>

                  <div className="grid grid-cols-1 gap-5">
                    {flowchartTasks.map(task => (
                      <EnhancedCard key={task.id} className="p-5" variant={task.priority === 'high' ? 'orange' : 'blue'}>
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="truncate text-lg font-semibold text-slate-900 dark:text-white">
                                {task.title}
                              </h3>
                              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                task.priority === 'high'
                                  ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300'
                                  : task.priority === 'medium'
                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                              }`}>
                                <Flag size={12} /> {task.priority || 'medium'}
                              </span>
                              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-zinc-800 dark:text-slate-300">
                                <Target size={12} /> {STATUS_LABELS[task.status] || task.status}
                              </span>
                              {task.dueDate && (
                                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                  isTaskOverdue(task)
                                    ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300'
                                    : 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-slate-300'
                                }`}>
                                  <CalendarDays size={12} /> {isTaskOverdue(task) ? 'Overdue' : task.dueDate}
                                </span>
                              )}
                            </div>
                            {task.description && (
                              <p className="mt-2 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
                                {task.description}
                              </p>
                            )}
                          </div>
                          <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:bg-zinc-900/60 dark:text-slate-300 lg:max-w-sm">
                            <span className="font-semibold text-slate-900 dark:text-white">Next action: </span>
                            {getNextAction(task)}
                          </div>
                        </div>

                        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">
                          {FLOW_STEPS.map((step, index) => {
                            const state = getStepState(task, step.id);
                            return (
                              <div key={step.id} className="relative">
                                <div className={`min-h-[104px] rounded-xl border p-4 ${
                                  state === 'done'
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-200'
                                    : state === 'current'
                                      ? 'border-blue-300 bg-blue-50 text-blue-800 shadow-sm dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-200'
                                      : 'border-slate-200 bg-white text-slate-600 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-slate-400'
                                }`}>
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold">{index + 1}. {step.label}</span>
                                    <span className="text-xs font-semibold capitalize">{state}</span>
                                  </div>
                                  <p className="mt-3 text-xs leading-5">{step.helper}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </EnhancedCard>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
