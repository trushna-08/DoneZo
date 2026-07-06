import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutGrid,
  CheckSquare,
  Calendar,
  BarChart3,
  Sparkles,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Brain
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, setIsOpen, isDark }) => {
  const { logout } = useAuth();
  const [hoveredItem, setHoveredItem] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navItems = [
    { path: '/', icon: LayoutGrid, label: 'Dashboard', color: 'text-blue-400', glow: 'rgba(59, 130, 246, 0.6)' },
    { path: '/tasks', icon: CheckSquare, label: 'Tasks', color: 'text-purple-400', glow: 'rgba(139, 92, 246, 0.6)' },
    { path: '/calendar', icon: Calendar, label: 'Calendar', color: 'text-orange-400', glow: 'rgba(251, 146, 60, 0.6)' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics', color: 'text-blue-400', glow: 'rgba(59, 130, 246, 0.6)' },
    { path: '/visual', icon: Brain, label: 'Visual Intel', color: 'text-emerald-400', glow: 'rgba(52, 211, 153, 0.6)' },
    { path: '/assistant', icon: Sparkles, label: 'AI Assistant', color: 'text-purple-400', glow: 'rgba(139, 92, 246, 0.6)' },
    { path: '/settings', icon: Settings, label: 'Settings', color: 'text-orange-400', glow: 'rgba(251, 146, 60, 0.6)' },
  ];

  const sidebarVariants = {
    open: { x: 0, opacity: 1 },
    closed: { x: '-100%', opacity: 0 },
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 md:hidden z-50 w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl flex items-center justify-center transition-all"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </motion.button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/70 md:hidden z-30 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        variants={sidebarVariants}
        initial={false}
        animate={isMobile ? (isOpen ? 'open' : 'closed') : 'open'}
        transition={{ type: 'spring', bounce: 0, damping: 20 }}
        className="fixed md:static w-64 h-screen md:h-auto flex flex-col z-40 md:z-0 overflow-y-auto border-r border-slate-200 dark:border-white/10"
        style={{
          background: isDark 
            ? 'linear-gradient(135deg, rgba(5, 8, 22, 0.8) 0%, rgba(15, 20, 40, 0.6) 100%)' 
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(241, 245, 249, 0.8) 100%)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Logo */}
        <div className="p-6 flex items-center gap-3 border-b border-slate-200 dark:border-white/5">
          <motion.div
            whileHover={{ rotate: 360, scale: 1.1 }}
            transition={{ duration: 0.6 }}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center relative"
            style={{
              boxShadow: '0 0 20px rgba(59, 130, 246, 0.6), 0 0 40px rgba(139, 92, 246, 0.3)'
            }}
          >
            <Sparkles size={24} className="text-white" />
          </motion.div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">DoneZo</h1>
            <p className="text-xs text-slate-500 dark:text-gray-400 font-medium">Study planner</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-8 space-y-2">
          {navItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                onMouseEnter={() => setHoveredItem(idx)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {({ isActive }) => (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.08 }}
                    className={`relative px-4 py-3 rounded-xl transition-all duration-300 group`}
                    style={isActive ? {
                      background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(79, 70, 229, 0.08)',
                      boxShadow: isDark ? `0 0 20px ${item.glow}` : '0 4px 12px rgba(79, 70, 229, 0.05)',
                    } : {}}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute inset-0 rounded-xl"
                        style={{
                          background: `linear-gradient(135deg, ${item.glow}, transparent)`,
                          opacity: 0.1,
                        }}
                        initial={false}
                      />
                    )}

                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2.5 rounded-lg transition-all duration-300 ${
                            isActive
                              ? `${isDark ? item.color : 'text-indigo-600'} bg-indigo-500/10 dark:bg-white/10`
                              : `text-slate-400 dark:text-gray-500 bg-slate-100 dark:bg-white/5 group-hover:bg-slate-200 dark:group-hover:bg-white/10 group-hover:${isDark ? item.color : 'text-indigo-600'}`
                          }`}
                          style={isActive && isDark ? {
                            boxShadow: `0 0 15px ${item.glow}`,
                          } : {}}
                        >
                          <Icon size={18} />
                        </div>
                        <span className={`font-medium transition-all ${
                          isActive ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-gray-400 group-hover:text-slate-900 dark:group-hover:text-white'
                        }`}>
                          {item.label}
                        </span>
                      </div>
                      {(isActive || hoveredItem === idx) && (
                        <motion.div
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={isActive ? (isDark ? item.color : 'text-indigo-600') : 'text-slate-400 dark:text-gray-500'}
                        >
                          <ChevronRight size={18} />
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-slate-200 dark:border-white/5 p-4 space-y-2">
          <motion.button
            whileHover={{ scale: 1.02, x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={logout}
            className="w-full px-4 py-3 rounded-xl text-slate-500 dark:text-gray-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-white/5 transition-all flex items-center gap-3 group border border-transparent hover:border-slate-200 dark:hover:border-transparent"
          >
            <LogOut size={18} className="group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors" />
            <span>Sign Out</span>
          </motion.button>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;
