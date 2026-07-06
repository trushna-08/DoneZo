import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, SplitSquareVertical, Unlock, CalendarClock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EnhancedCard } from './EnhancedCard';
import FlowchartDrawer from './FlowchartDrawer';
import { detectFriction, getSeverity } from '../../utils/frictionDetector';

export default function FrictionFinderWidget({ 
  tasks, 
  setTasks, 
  onSplitTask, 
  onClearBlocker, 
  onResetDeadline 
}) {
  const navigate = useNavigate();
  const [activeFlowchartTask, setActiveFlowchartTask] = useState(null); // stores task.id

  const alerts = detectFriction(tasks);

  // Default Handlers
  const handleSplitTask = (task) => {
    if (onSplitTask) return onSplitTask(task);
    navigate(`/tasks?action=slice&taskId=${task.id}`);
  };

  const handleClearBlocker = (task) => {
    if (onClearBlocker) return onClearBlocker(task);
    if (setTasks) {
      setTasks(prev => prev.map(t => {
        if (t.id === task.id) {
          const tags = t.tags || [];
          return {
            ...t,
            tags: tags.includes('unblocked') ? tags : [...tags, 'unblocked'],
            updatedAt: new Date().toISOString()
          };
        }
        return t;
      }));
    }
  };

  const handleResetDeadline = (task) => {
    if (onResetDeadline) return onResetDeadline(task);
    if (setTasks) {
      const newDate = new Date();
      newDate.setDate(newDate.getDate() + 7);
      setTasks(prev => prev.map(t => 
        t.id === task.id ? { ...t, dueDate: newDate.toISOString(), updatedAt: new Date().toISOString() } : t
      ));
    }
  };

  const getFrictionDescription = (type) => {
    if (type === 'unclear') return 'Scope not defined';
    if (type === 'overscoped') return 'Task may be too large';
    return 'Waiting on dependency';
  };

  if (alerts.length === 0) {
    return (
      <EnhancedCard className="p-6 flex flex-col items-center justify-center text-center h-48" variant="emerald">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
          <CheckCircle size={32} className="text-emerald-500 dark:text-emerald-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">System Flowing Smoothly</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">No stalled tasks or friction detected.</p>
      </EnhancedCard>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <EnhancedCard className="p-6" variant="orange">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-orange-100 dark:bg-orange-500/20 rounded-lg">
          <AlertTriangle size={20} className="text-orange-600 dark:text-orange-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Friction Detected</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {alerts.length} stalled {alerts.length === 1 ? 'task requires' : 'tasks require'} attention
          </p>
        </div>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-4"
      >
        {alerts.map(alert => {
          const { task, hoursStuck, frictionType, suggestedFlowchart } = alert;
          const severity = getSeverity(hoursStuck);
          const isDrawerOpen = activeFlowchartTask === task.id;

          const severityColors = {
            critical: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-200 dark:border-red-500/30',
            warning: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-500/30',
            notice: 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400 border-slate-200 dark:border-slate-500/30'
          };

          return (
            <motion.div key={task.id} variants={itemVariants} className="flex flex-col">
              <div className="bg-white dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                
                {/* Header Info */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                        {task.title.length > 30 ? task.title.substring(0, 30) + '...' : task.title}
                      </h4>
                      <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full font-bold shrink-0 ${
                        task.priority === 'high' ? 'bg-red-100 text-red-700' :
                        task.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2 py-1 rounded-md border font-medium ${severityColors[severity]}`}>
                        Stuck {hoursStuck}h
                      </span>
                      <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-600 inline-block" />
                        {getFrictionDescription(frictionType)}
                      </span>
                    </div>
                  </div>

                  {/* Guide Toggle Button */}
                  <button
                    onClick={() => setActiveFlowchartTask(isDrawerOpen ? null : task.id)}
                    className={`shrink-0 text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                      isDrawerOpen 
                        ? 'bg-slate-200 text-slate-800 dark:bg-zinc-700 dark:text-white' 
                        : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20'
                    }`}
                  >
                    {isDrawerOpen ? 'Close guide' : 'View recovery guide'}
                    {!isDrawerOpen && <ArrowRight size={14} />}
                  </button>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100 dark:border-zinc-700/50">
                  <button 
                    onClick={() => handleSplitTask(task)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-700 rounded-md transition-colors"
                  >
                    <SplitSquareVertical size={14} /> Split task
                  </button>
                  <button 
                    onClick={() => handleClearBlocker(task)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-700 rounded-md transition-colors"
                  >
                    <Unlock size={14} /> Clear blocker
                  </button>
                  <button 
                    onClick={() => handleResetDeadline(task)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-700 rounded-md transition-colors"
                  >
                    <CalendarClock size={14} /> Reset deadline
                  </button>
                </div>

              </div>
              
              {/* Expandable Flowchart Drawer */}
              <FlowchartDrawer 
                isOpen={isDrawerOpen}
                flowchartType={suggestedFlowchart}
                task={task}
                onClose={() => setActiveFlowchartTask(null)}
                setTasks={setTasks}
              />
            </motion.div>
          );
        })}
      </motion.div>
    </EnhancedCard>
  );
}
