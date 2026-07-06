import { motion } from 'framer-motion';

export const Button = ({ children, variant = 'primary', size = 'md', isLoading, ...props }) => {
  const variants = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    secondary: 'bg-gray-200 dark:bg-zinc-800 hover:bg-gray-300 dark:hover:bg-zinc-700 text-gray-900 dark:text-white',
    ghost: 'hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-900 dark:text-white'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${variants[variant]} ${sizes[size]}`}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? <LoadingSpinner /> : children}
    </motion.button>
  );
};

export const Input = ({ label, error, ...props }) => (
  <div className="space-y-2">
    {label && <label className="block text-sm font-medium text-gray-900 dark:text-white">{label}</label>}
    <motion.input
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`w-full px-4 py-2.5 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
        error
          ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
          : 'border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800'
      }`}
      {...props}
    />
    {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
  </div>
);

export const Card = ({ children, className = '', ...props }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`glass-card rounded-xl p-6 ${className}`}
    {...props}
  >
    {children}
  </motion.div>
);

export const Badge = ({ children, color = 'indigo', ...props }) => {
  const colors = {
    indigo: 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400',
    green: 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400',
    red: 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400',
    yellow: 'bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400'
  };

  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${colors[color]}`} {...props}>
      {children}
    </span>
  );
};

export const LoadingSpinner = () => (
  <div className="flex gap-1">
    <motion.div
      animate={{ scale: [1, 1.2, 1] }}
      transition={{ repeat: Infinity, duration: 1 }}
      className="w-2 h-2 bg-current rounded-full"
    />
    <motion.div
      animate={{ scale: [1, 1.2, 1] }}
      transition={{ repeat: Infinity, duration: 1, delay: 0.1 }}
      className="w-2 h-2 bg-current rounded-full"
    />
    <motion.div
      animate={{ scale: [1, 1.2, 1] }}
      transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
      className="w-2 h-2 bg-current rounded-full"
    />
  </div>
);
