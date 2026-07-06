import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Brain, ChevronDown, CheckCircle, Plus } from 'lucide-react';
import { EnhancedCard } from './EnhancedCard';
import { useAIMindMap } from '../../hooks/useAIMindMap';

const COLOR_MAP = {
  purple: '#a855f7',
  teal: '#14b8a6',
  coral: '#f43f5e',
  blue: '#3b82f6',
  amber: '#f59e0b',
  green: '#10b981'
};

export default function AIMindMapCard({ tasks, setTasks }) {
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  
  const { data, loading, error, generate } = useAIMindMap();
  const svgRef = useRef(null);

  const activeTasks = tasks.filter(t => t.status === 'todo' || t.status === 'in-progress');
  const selectedTask = activeTasks.find(t => t.id === selectedTaskId);

  // Clear toast after 3s
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleGenerate = () => {
    if (selectedTask) {
      generate(selectedTask);
      setSelectedNode(null);
    }
  };

  const handleAddSubtask = () => {
    if (!selectedNode || !selectedTask) return;

    const newTask = {
      id: Date.now().toString(),
      title: selectedNode.label,
      priority: selectedTask.priority,
      status: 'todo',
      createdAt: new Date().toISOString(),
      tags: ['ai-generated', selectedTask.title.substring(0, 20)]
    };

    setTasks(prev => [...prev, newTask]);
    setToastMessage('Subtask added to your board');
    setSelectedNode(null);
  };

  const handleDownload = async () => {
    if (!svgRef.current) return;
    
    try {
      setToastMessage('Preparing full-size image...');
      
      const svgData = new XMLSerializer().serializeToString(svgRef.current);
      const canvas = document.createElement('canvas');
      canvas.width = 1000;
      canvas.height = 800;
      const ctx = canvas.getContext('2d');
      
      // Fill background
      ctx.fillStyle = '#ffffff'; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const img = new Image();
      img.onload = async () => {
        ctx.drawImage(img, 0, 0);
        const imgData = canvas.toDataURL('image/png', 1.0);
        
        // They want downloadable full image, so let's give them a high-res PNG.
        const downloadLink = document.createElement('a');
        downloadLink.download = `DoneZo-MindMap-${selectedTask?.title || 'task'}.png`;
        downloadLink.href = imgData;
        downloadLink.click();
        
        setToastMessage('Full image downloaded successfully!');
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
      
    } catch (err) {
      console.error('Download failed:', err);
      setToastMessage('Failed to download image');
    }
  };

  // Render variables for SVG
  const cx = 500;
  const cy = 400;

  return (
    <EnhancedCard className="p-6 relative overflow-hidden" variant="blue">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 z-50 text-sm font-medium"
          >
            <CheckCircle size={16} />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row gap-4 mb-6 relative z-30">
        <div className="flex-1 relative">
          <div 
            className="w-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            {selectedTask ? (
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{selectedTask.title}</span>
                <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full font-bold ${
                  selectedTask.priority === 'high' ? 'bg-red-100 text-red-700' :
                  selectedTask.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                  'bg-emerald-100 text-emerald-700'
                }`}>
                  {selectedTask.priority}
                </span>
              </div>
            ) : (
              <span className="text-slate-500 dark:text-gray-400">Select an active task...</span>
            )}
            <ChevronDown size={18} className="text-slate-500" />
          </div>

          {/* Custom Dropdown Options */}
          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl shadow-xl max-h-60 overflow-y-auto z-50"
              >
                {activeTasks.length === 0 ? (
                  <div className="p-4 text-center text-slate-500">No active tasks available</div>
                ) : (
                  activeTasks.map(task => (
                    <div 
                      key={task.id}
                      className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-zinc-700/50 cursor-pointer flex items-center justify-between border-b border-slate-100 dark:border-zinc-700/50 last:border-0"
                      onClick={() => {
                        setSelectedTaskId(task.id);
                        setIsDropdownOpen(false);
                      }}
                    >
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate pr-2">{task.title}</span>
                      <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full font-bold shrink-0 ${
                        task.priority === 'high' ? 'bg-red-100 text-red-700' :
                        task.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button 
          onClick={handleGenerate}
          disabled={!selectedTask || loading}
          className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors shrink-0"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Brain size={18} />
          )}
          Generate Map
        </button>

        {data && (
          <button 
            onClick={handleDownload}
            className="bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-300 px-4 py-3 rounded-xl flex items-center justify-center transition-colors shrink-0"
            title="Download PNG"
          >
            <Download size={18} />
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl mb-6 text-sm">
          {error}
        </div>
      )}

      {/* SVG Mind Map Area */}
      <div className="relative w-full h-[500px] bg-slate-50 dark:bg-zinc-900/50 rounded-xl border border-slate-200 dark:border-zinc-700 overflow-auto flex items-center justify-center">
        
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-64 h-64">
              <div className="absolute inset-0 border-4 border-purple-500/20 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
              <div className="absolute inset-4 border-4 border-teal-500/30 rounded-full animate-[ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite]" />
              <div className="absolute inset-8 border-4 border-amber-500/40 rounded-full animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Brain size={48} className="text-purple-500 animate-pulse" />
              </div>
            </div>
          </div>
        )}

        {!loading && !data && !error && (
          <div className="text-slate-400 dark:text-slate-500 flex flex-col items-center gap-2">
            <Brain size={48} className="opacity-20" />
            <p>Select a task to generate an AI mind map</p>
          </div>
        )}

        {!loading && data && (
          <svg 
            ref={svgRef} 
            viewBox="0 0 1000 800" 
            style={{ minWidth: '1000px', minHeight: '800px' }}
            className="drop-shadow-sm"
            onClick={(e) => {
              // Click outside nodes to deselect
              if (e.target.tagName === 'svg') setSelectedNode(null);
            }}
          >
            <defs>
              <style>{`
                .node-text { font-family: ui-sans-serif, system-ui, sans-serif; pointer-events: none; }
              `}</style>
            </defs>

            {/* Connectors & Nodes */}
            {data.branches?.map((branch, i) => {
              const totalBranches = data.branches.length;
              const angle = (i / totalBranches) * 2 * Math.PI - Math.PI/2; // Start from top
              const bx = cx + 210 * Math.cos(angle);
              const by = cy + 180 * Math.sin(angle);
              const bColor = COLOR_MAP[branch.color] || COLOR_MAP.purple;
              
              const branchDelay = 0.2 + (i * 0.1);

              return (
                <g key={`branch-group-${i}`}>
                  {/* Line from center to branch */}
                  <motion.line 
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.5 }}
                    transition={{ duration: 0.5, delay: branchDelay }}
                    x1={cx} y1={cy} x2={bx} y2={by} 
                    stroke={bColor} 
                    strokeWidth="2" 
                  />

                  {/* Leaves */}
                  {branch.children?.map((leaf, j) => {
                    const totalLeaves = branch.children.length;
                    const leafAngleOffset = (j - (totalLeaves - 1) / 2) * 0.5;
                    const leafAngle = angle + leafAngleOffset;
                    
                    const lx = bx + 120 * Math.cos(leafAngle);
                    const ly = by + 90 * Math.sin(leafAngle);
                    const leafDelay = branchDelay + 0.3 + (j * 0.05);

                    return (
                      <g key={`leaf-group-${i}-${j}`}>
                        <motion.line 
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{ pathLength: 1, opacity: 0.4 }}
                          transition={{ duration: 0.4, delay: leafDelay }}
                          x1={bx} y1={by} x2={lx} y2={ly} 
                          stroke={bColor} 
                          strokeWidth="1" 
                          strokeDasharray="4 4"
                        />
                        
                        <motion.g
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: 'spring', bounce: 0.4, delay: leafDelay }}
                          className="cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedNode({ type: 'leaf', label: leaf.label, x: lx, y: ly, color: bColor });
                          }}
                        >
                          <rect x={lx - 55} y={ly - 16} width="110" height="32" rx="6" fill="#f1f5f9" className="dark:fill-zinc-800" stroke={bColor} strokeWidth="1" />
                          <text x={lx} y={ly + 4} textAnchor="middle" fill="#334155" className="dark:fill-slate-300 node-text" fontSize="10">
                            {leaf.label.length > 18 ? leaf.label.substring(0, 16) + '...' : leaf.label}
                          </text>
                        </motion.g>
                      </g>
                    );
                  })}

                  {/* Branch Node */}
                  <motion.g
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', bounce: 0.5, delay: branchDelay + 0.2 }}
                  >
                    <rect x={bx - 65} y={by - 19} width="130" height="38" rx="8" fill={bColor} />
                    <text x={bx} y={by + 4} textAnchor="middle" fill="#ffffff" className="node-text font-medium" fontSize="12">
                      {branch.label.length > 18 ? branch.label.substring(0, 16) + '...' : branch.label}
                    </text>
                  </motion.g>
                </g>
              );
            })}

            {/* Center Node */}
            <motion.g
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', bounce: 0.5, delay: 0.1 }}
            >
              <rect x={cx - 70} y={cy - 22} width="140" height="44" rx="10" fill="#a855f7" stroke="#7e22ce" strokeWidth="2" />
              <text x={cx} y={cy + 5} textAnchor="middle" fill="#ffffff" className="node-text font-bold" fontSize="14">
                {data.center?.length > 20 ? data.center.substring(0, 18) + '...' : data.center}
              </text>
            </motion.g>
          </svg>
        )}

        {/* Tooltip for Action */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-6 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 shadow-2xl rounded-xl p-4 z-40 max-w-sm flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-white line-clamp-2 leading-tight">
                    {selectedNode.label}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">Suggested Subtask</p>
                </div>
                <div className="w-3 h-3 rounded-full mt-1 shrink-0" style={{ backgroundColor: selectedNode.color }} />
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={handleAddSubtask}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium py-2 px-3 rounded-lg flex items-center justify-center gap-1 transition-colors"
                >
                  <Plus size={14} /> Add as Subtask
                </button>
                <button 
                  onClick={() => setSelectedNode(null)}
                  className="bg-slate-100 hover:bg-slate-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-slate-600 dark:text-slate-300 text-xs font-medium py-2 px-3 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </EnhancedCard>
  );
}
