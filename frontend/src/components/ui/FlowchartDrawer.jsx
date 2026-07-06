import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, PartyPopper } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CHECKLISTS = {
  unblock: [
    "Write a one-sentence definition of done",
    "Break into max 3 sub-steps",
    "Set a 25-min focus timer"
  ],
  decision: [
    "Identify who/what is blocking",
    "Message or reassign",
    "Set a follow-up reminder"
  ],
  lifecycle: [
    "Use Micro-Slicer to split into sub-tasks",
    "Pick only the first sub-task",
    "Complete it in one session"
  ]
};

// Map flowchartType back to frictionType for checklist picking
const getChecklistType = (flowchartType) => {
  if (flowchartType === 'unblock') return 'unblock'; // unclear
  if (flowchartType === 'decision') return 'decision'; // dependency
  if (flowchartType === 'lifecycle') return 'lifecycle'; // overscoped
  return 'unblock';
};

export default function FlowchartDrawer({ flowchartType, task, isOpen, onClose, setTasks }) {
  const navigate = useNavigate();
  const [checkedItems, setCheckedItems] = useState([false, false, false]);
  const [showConfetti, setShowConfetti] = useState(false);

  // Reset state when task or flowchart changes
  useEffect(() => {
    setCheckedItems([false, false, false]);
    setShowConfetti(false);
  }, [task?.id, flowchartType]);

  const checklistType = getChecklistType(flowchartType);
  const checklistItems = CHECKLISTS[checklistType];

  const handleToggleCheck = (index) => {
    const newChecked = [...checkedItems];
    newChecked[index] = !newChecked[index];
    setCheckedItems(newChecked);

    if (newChecked.every(Boolean) && !checkedItems.every(Boolean)) {
      // Just became fully checked!
      setShowConfetti(true);
      if (setTasks && task) {
        setTasks(prev => prev.map(t => 
          t.id === task.id ? { ...t, status: 'in-progress', updatedAt: new Date().toISOString() } : t
        ));
      }
      setTimeout(() => setShowConfetti(false), 3000);
    }
  };

  const getFlowchartName = () => {
    if (flowchartType === 'lifecycle') return 'Task Lifecycle';
    if (flowchartType === 'decision') return 'What to work on';
    if (flowchartType === 'unblock') return 'Unblock a stalled task';
    return '';
  };

  // SVGs defined inline based on type
  const renderSVG = () => {
    if (flowchartType === 'lifecycle') {
      const isTodo = task?.status === 'todo';
      const isInProgress = task?.status === 'in-progress';
      const isReview = task?.status === 'review';
      return (
        <svg viewBox="0 0 700 120" className="w-full max-w-2xl mx-auto h-auto">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" className="dark:fill-slate-400" />
            </marker>
          </defs>
          <g transform="translate(10, 40)">
            <rect x="0" y="0" width="100" height="40" rx="8" fill="#f1f5f9" className="dark:fill-slate-800" stroke="#64748b" strokeWidth="1" />
            <text x="50" y="25" textAnchor="middle" fill="#334155" className="dark:fill-slate-200" fontSize="12">Create</text>
            <line x1="100" y1="20" x2="150" y2="20" stroke="#64748b" className="dark:stroke-slate-400" strokeWidth="2" markerEnd="url(#arrow)" />

            <rect x="150" y="0" width="100" height="40" rx="8" fill="#f1f5f9" className="dark:fill-slate-800" stroke={isTodo ? "#f59e0b" : "#64748b"} strokeWidth={isTodo ? "3" : "1"} />
            <text x="200" y="25" textAnchor="middle" fill="#334155" className="dark:fill-slate-200" fontSize="12">Todo</text>
            <line x1="250" y1="20" x2="300" y2="20" stroke="#64748b" className="dark:stroke-slate-400" strokeWidth="2" markerEnd="url(#arrow)" />

            <rect x="300" y="0" width="100" height="40" rx="8" fill="#dbeafe" className="dark:fill-blue-900/50" stroke={isInProgress ? "#f59e0b" : "#3b82f6"} strokeWidth={isInProgress ? "3" : "2"} />
            <text x="350" y="25" textAnchor="middle" fill="#1e40af" className="dark:fill-blue-200" fontSize="12">In Progress</text>
            <line x1="400" y1="20" x2="450" y2="20" stroke="#64748b" className="dark:stroke-slate-400" strokeWidth="2" markerEnd="url(#arrow)" />

            <rect x="450" y="0" width="100" height="40" rx="8" fill="#f3e8ff" className="dark:fill-purple-900/50" stroke={isReview ? "#f59e0b" : "#a855f7"} strokeWidth={isReview ? "3" : "2"} />
            <text x="500" y="25" textAnchor="middle" fill="#6b21a8" className="dark:fill-purple-200" fontSize="12">Review</text>
            <line x1="550" y1="20" x2="600" y2="20" stroke="#64748b" className="dark:stroke-slate-400" strokeWidth="2" markerEnd="url(#arrow)" />

            <rect x="600" y="0" width="100" height="40" rx="8" fill="#d1fae5" className="dark:fill-emerald-900/50" stroke="#10b981" strokeWidth="2" />
            <text x="650" y="25" textAnchor="middle" fill="#065f46" className="dark:fill-emerald-200" fontSize="12">Done</text>

            <path d="M 500 40 Q 425 90 350 40" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#arrow)" />
            <text x="425" y="80" textAnchor="middle" fill="#f59e0b" fontSize="11">changes needed</text>
          </g>
        </svg>
      );
    } else if (flowchartType === 'decision') {
      return (
        <svg viewBox="0 0 700 200" className="w-full max-w-2xl mx-auto h-auto">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" className="dark:fill-slate-400" />
            </marker>
          </defs>
          <g transform="translate(350, 20)">
            <rect x="-75" y="0" width="150" height="36" rx="18" fill="#f1f5f9" className="dark:fill-slate-800" stroke="#64748b" strokeWidth="1" />
            <text x="0" y="22" textAnchor="middle" fill="#334155" className="dark:fill-slate-200" fontSize="12" fontWeight="bold">Check energy level</text>

            <line x1="-75" y1="18" x2="-200" y2="60" stroke="#64748b" className="dark:stroke-slate-400" strokeWidth="1.5" />
            <line x1="0" y1="36" x2="0" y2="60" stroke="#64748b" className="dark:stroke-slate-400" strokeWidth="1.5" />
            <line x1="75" y1="18" x2="200" y2="60" stroke="#64748b" className="dark:stroke-slate-400" strokeWidth="1.5" />

            <text x="-140" y="45" fill="#64748b" fontSize="10">Low</text>
            <text x="15" y="50" fill="#64748b" fontSize="10">Med</text>
            <text x="140" y="45" fill="#64748b" fontSize="10">High</text>

            <rect x="-260" y="60" width="120" height="36" rx="6" fill="#d1fae5" className="dark:fill-emerald-900/40" stroke="#10b981" />
            <text x="-200" y="82" textAnchor="middle" fill="#065f46" className="dark:fill-emerald-200" fontSize="12">Quick wins</text>

            <rect x="-60" y="60" width="120" height="36" rx="6" fill="#fef3c7" className="dark:fill-amber-900/40" stroke="#f59e0b" />
            <text x="0" y="82" textAnchor="middle" fill="#92400e" className="dark:fill-amber-200" fontSize="12">Medium Priority</text>

            <rect x="140" y="60" width="120" height="36" rx="6" fill="#fee2e2" className="dark:fill-red-900/40" stroke="#ef4444" />
            <text x="200" y="82" textAnchor="middle" fill="#991b1b" className="dark:fill-red-200" fontSize="12">Deep focus</text>

            <line x1="-200" y1="96" x2="-200" y2="120" stroke="#64748b" className="dark:stroke-slate-400" />
            <line x1="0" y1="96" x2="0" y2="120" stroke="#64748b" className="dark:stroke-slate-400" />
            <line x1="200" y1="96" x2="200" y2="120" stroke="#64748b" className="dark:stroke-slate-400" />

            <line x1="-200" y1="120" x2="200" y2="120" stroke="#64748b" className="dark:stroke-slate-400" />
            <line x1="0" y1="120" x2="0" y2="140" stroke="#64748b" className="dark:stroke-slate-400" markerEnd="url(#arrow)" />

            <rect x="-90" y="140" width="180" height="36" rx="18" fill="#e0e7ff" className="dark:fill-indigo-900/40" stroke="#6366f1" />
            <text x="0" y="162" textAnchor="middle" fill="#3730a3" className="dark:fill-indigo-200" fontSize="12" fontWeight="bold">Start focus timer → Complete</text>
          </g>
        </svg>
      );
    } else if (flowchartType === 'unblock') {
      return (
        <svg viewBox="0 0 700 200" className="w-full max-w-2xl mx-auto h-auto">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" className="dark:fill-slate-400" />
            </marker>
          </defs>
          <g transform="translate(350, 20)">
            <rect x="-60" y="0" width="120" height="36" rx="6" fill="#fef2f2" className="dark:fill-red-950/40" stroke="#f87171" strokeWidth="1" />
            <text x="0" y="22" textAnchor="middle" fill="#991b1b" className="dark:fill-red-200" fontSize="12" fontWeight="bold">Task stuck 48h+</text>

            <line x1="-60" y1="18" x2="-200" y2="60" stroke="#64748b" className="dark:stroke-slate-400" strokeWidth="1.5" />
            <line x1="0" y1="36" x2="0" y2="60" stroke="#64748b" className="dark:stroke-slate-400" strokeWidth="1.5" />
            <line x1="60" y1="18" x2="200" y2="60" stroke="#64748b" className="dark:stroke-slate-400" strokeWidth="1.5" />

            <text x="-140" y="45" fill="#64748b" fontSize="10">Unclear scope</text>
            <text x="15" y="50" fill="#64748b" fontSize="10">Dependency</text>
            <text x="140" y="45" fill="#64748b" fontSize="10">Too big</text>

            <rect x="-260" y="60" width="120" height="36" rx="6" fill="#f1f5f9" className="dark:fill-slate-800" stroke="#94a3b8" />
            <text x="-200" y="82" textAnchor="middle" fill="#475569" className="dark:fill-slate-300" fontSize="12">Clarify definition</text>

            <rect x="-60" y="60" width="120" height="36" rx="6" fill="#f1f5f9" className="dark:fill-slate-800" stroke="#94a3b8" />
            <text x="0" y="82" textAnchor="middle" fill="#475569" className="dark:fill-slate-300" fontSize="12">Contact owner</text>

            {/* Clickable node */}
            <g 
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate(`/tasks?action=slice&taskId=${task?.id}`)}
            >
              <rect x="140" y="60" width="120" height="36" rx="6" fill="#e0e7ff" className="dark:fill-indigo-900/40" stroke="#6366f1" strokeWidth="2" />
              <text x="200" y="82" textAnchor="middle" fill="#4338ca" className="dark:fill-indigo-300" fontSize="12" fontWeight="bold">Use Micro-Slicer</text>
            </g>

            <line x1="-200" y1="96" x2="-200" y2="120" stroke="#64748b" className="dark:stroke-slate-400" />
            <line x1="0" y1="96" x2="0" y2="120" stroke="#64748b" className="dark:stroke-slate-400" />
            <line x1="200" y1="96" x2="200" y2="120" stroke="#64748b" className="dark:stroke-slate-400" />

            <line x1="-200" y1="120" x2="200" y2="120" stroke="#64748b" className="dark:stroke-slate-400" />
            <line x1="0" y1="120" x2="0" y2="140" stroke="#64748b" className="dark:stroke-slate-400" markerEnd="url(#arrow)" />

            <rect x="-75" y="140" width="150" height="36" rx="18" fill="#d1fae5" className="dark:fill-emerald-900/40" stroke="#10b981" />
            <text x="0" y="162" textAnchor="middle" fill="#065f46" className="dark:fill-emerald-200" fontSize="12" fontWeight="bold">Resume task</text>
          </g>
        </svg>
      );
    }
    return null;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0, marginTop: 0 }}
          animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
          exit={{ height: 0, opacity: 0, marginTop: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-700 shadow-sm overflow-hidden flex flex-col relative">
            
            {showConfetti && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm pointer-events-none"
              >
                <div className="flex flex-col items-center gap-2">
                  <PartyPopper size={48} className="text-emerald-500 animate-bounce" />
                  <p className="font-bold text-lg text-emerald-600 dark:text-emerald-400">Great job! Task unblocked.</p>
                </div>
              </motion.div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/30">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                Recovery guide: {getFlowchartName()}
              </h3>
              <button 
                onClick={onClose}
                className="p-1 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-md transition-colors text-slate-500"
              >
                <X size={18} />
              </button>
            </div>

            {/* Flowchart SVG */}
            <div className="p-6 bg-slate-50/50 dark:bg-zinc-900/50 flex justify-center border-b border-slate-100 dark:border-zinc-800">
              {renderSVG()}
            </div>

            {/* Checklist */}
            <div className="p-6">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
                Recommended Actions
              </h4>
              <div className="space-y-3">
                {checklistItems.map((item, idx) => (
                  <label key={idx} className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative mt-0.5">
                      <input 
                        type="checkbox" 
                        className="sr-only" 
                        checked={checkedItems[idx]}
                        onChange={() => handleToggleCheck(idx)}
                      />
                      <div className={`w-5 h-5 rounded border ${
                        checkedItems[idx] 
                          ? 'bg-emerald-500 border-emerald-500' 
                          : 'bg-white dark:bg-zinc-800 border-slate-300 dark:border-zinc-600 group-hover:border-emerald-400 transition-colors'
                      } flex items-center justify-center`}>
                        {checkedItems[idx] && <Check size={14} className="text-white" strokeWidth={3} />}
                      </div>
                    </div>
                    <span className={`text-sm select-none transition-colors ${
                      checkedItems[idx] ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-700 dark:text-slate-200'
                    }`}>
                      {item}
                    </span>
                  </label>
                ))}
              </div>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
