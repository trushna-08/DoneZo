import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import React from 'react';

export const EnhancedCard = ({ 
  children, 
  className = '', 
  variant = 'default',
  hover = true,
  delay = 0 
}) => {
  const variants = {
    default: 'glass-card',
    blue: 'glass-card-blue',
    purple: 'glass-card-purple',
    orange: 'glass-card-orange',
    cyan: 'glass-card-cyan',
    emerald: 'glass-card',
    red: 'glass-card',
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { delay, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
    },
    hover: hover ? { 
      y: -6, 
      transition: { duration: 0.3, ease: 'easeOut' }
    } : {},
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      whileHover="hover"
      variants={cardVariants}
      className={`${variants[variant]} ${className}`}
    >
      {children}
    </motion.div>
  );
};

export const StatCard = React.memo(({ 
  icon: Icon, 
  label, 
  title,
  value, 
  change = null, 
  color = 'blue',
  delay = 0
}) => {
  const colorClasses = {
    blue: { text: 'text-neon-blue', card: 'glass-card-blue', bg: 'bg-blue-500/10' },
    purple: { text: 'text-neon-purple', card: 'glass-card-purple', bg: 'bg-purple-500/10' },
    orange: { text: 'text-neon-orange', card: 'glass-card-orange', bg: 'bg-orange-500/10' },
    cyan: { text: 'text-neon-cyan', card: 'glass-card-cyan', bg: 'bg-cyan-500/10' },
    emerald: { text: 'text-emerald-600 dark:text-emerald-400', card: 'glass-card', bg: 'bg-emerald-500/10' },
    red: { text: 'text-red-600 dark:text-red-400', card: 'glass-card', bg: 'bg-red-500/10' },
  };

  const classes = colorClasses[color] || colorClasses.blue;
  const displayLabel = label || title;

  return (
    <EnhancedCard variant={color} delay={delay} className="p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.2 }}
        className="flex items-start justify-between"
      >
        <div className="flex-1">
          <div className={`w-12 h-12 rounded-xl ${classes.bg} flex items-center justify-center mb-4 icon-glow ${classes.text}`}>
            {Icon && <Icon size={24} />}
          </div>
          <p className="text-sm text-slate-500 dark:text-gray-400 mb-2">{displayLabel}</p>
          <div className="flex items-end gap-3">
            <span className="stat-value text-slate-900 dark:text-white">{value}</span>
            {change !== null && change !== undefined && (
              <motion.span 
                initial={{ y: 0 }}
                animate={{ y: -2 }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1"
              >
                Up {change}%
              </motion.span>
            )}
          </div>
        </div>
      </motion.div>
    </EnhancedCard>
  );
});

export const ProgressRing = React.memo(({ value = 70, size = 80, color = 'blue', label = '' }) => {
  const colorMap = {
    blue: { stroke: '#3B82F6', glow: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))' },
    purple: { stroke: '#8B5CF6', glow: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.6))' },
    orange: { stroke: '#FB923C', glow: 'drop-shadow(0 0 8px rgba(251, 146, 60, 0.6))' },
    cyan: { stroke: '#06B6D4', glow: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.6))' },
  };

  const colors = colorMap[color];
  const circumference = 2 * Math.PI * 30;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 80 80"
        style={{ filter: colors.glow }}
      >
        <circle cx="40" cy="40" r="30" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
        <motion.circle
          cx="40"
          cy="40"
          r="30"
          fill="none"
          stroke={colors.stroke}
          strokeWidth="4"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          strokeLinecap="round"
        />
      </motion.svg>
      {label && <p className="text-sm text-gray-400 mt-2">{label}</p>}
    </div>
  );
});

export const GlowButton = ({ 
  children, 
  variant = 'primary', 
  onClick,
  disabled = false,
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const variants = {
    primary: 'btn-glow text-white',
    secondary: 'btn-glass text-white',
    danger: 'bg-red-600/20 text-red-400 border border-red-500/30 hover:border-red-500/60 hover:bg-red-600/30',
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={`${sizeClasses[size]} ${variants[variant]} rounded-lg font-semibold transition-all duration-300 ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </motion.button>
  );
};

export const AnimatedInput = ({ 
  label, 
  icon: Icon, 
  type = 'text',
  error = '',
  ...props 
}) => {
  const [focused, setFocused] = React.useState(false);

  return (
    <div className="relative">
      {label && (
        <motion.label
          animate={{ y: focused ? -24 : 0 }}
          className="absolute left-4 text-sm text-gray-400 transition-colors"
        >
          {label}
        </motion.label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <motion.div
            animate={{ color: focused ? '#3B82F6' : '#94A3B8' }}
            className="absolute left-4"
          >
            <Icon size={20} />
          </motion.div>
        )}
        <input
          type={type}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`w-full bg-white/5 border rounded-lg py-3 ${Icon ? 'pl-12' : 'pl-4'} pr-4 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30 transition-all`}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
};

export const GlassButton = ({ 
  children, 
  onClick,
  icon: Icon,
  className = ''
}) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`btn-glass flex items-center gap-2 ${className}`}
    >
      {Icon && <Icon size={16} />}
      {children}
    </motion.button>
  );
};

export const FeatureCard = ({ 
  title, 
  description, 
  icon: Icon,
  variant = 'blue',
  delay = 0,
  onClick
}) => {
  return (
    <EnhancedCard variant={variant} delay={delay} className="p-6 cursor-pointer hover-lift" onClick={onClick}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.1 }}
        className="flex items-start gap-4"
      >
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="w-12 h-12 rounded-lg bg-gradient-to-br from-current/20 to-current/5 flex items-center justify-center icon-glow"
        >
          {Icon && <Icon size={24} />}
        </motion.div>
        <div className="flex-1">
          <h3 className="card-title mb-1">{title}</h3>
          <p className="card-subtitle">{description}</p>
        </div>
        <ChevronRight size={20} className="text-gray-500 transition-colors" />
      </motion.div>
    </EnhancedCard>
  );
};
