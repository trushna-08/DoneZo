import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Button, Input, LoadingSpinner } from '../components/ui/UIComponents';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Email is required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Invalid email');
      return;
    }

    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    setSubmitted(true);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
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

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Success Icon */}
          <motion.div
            variants={itemVariants}
            className="flex justify-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 100 }}
            >
              <CheckCircle2 className="w-16 h-16 text-green-500" />
            </motion.div>
          </motion.div>

          {/* Success Message */}
          <motion.div variants={itemVariants} className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Check your email</h1>
            <p className="text-gray-600 dark:text-gray-400">
              We've sent password reset instructions to <span className="font-medium text-gray-900 dark:text-gray-100">{email}</span>
            </p>
          </motion.div>

          {/* Info Card */}
          <motion.div
            variants={itemVariants}
            className="glass-card rounded-2xl p-6 space-y-4"
          >
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">What's next?</h3>
            <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-3">
                <span className="text-indigo-500 mt-1">✓</span>
                <span>Check your email for a password reset link</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-indigo-500 mt-1">✓</span>
                <span>Click the link and create a new password</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-indigo-500 mt-1">✓</span>
                <span>Return and sign in with your new password</span>
              </li>
            </ul>
          </motion.div>

          {/* Buttons */}
          <motion.div variants={itemVariants} className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setSubmitted(false)}
              className="flex-1"
            >
              Try another email
            </Button>
            <Button
              onClick={() => navigate('/login')}
              className="flex-1"
            >
              Back to login
            </Button>
          </motion.div>

          {/* Didn't receive */}
          <motion.div variants={itemVariants} className="text-center text-sm text-gray-600 dark:text-gray-400">
            Didn't receive the email?{' '}
            <button onClick={() => setSubmitted(false)} className="text-indigo-500 hover:text-indigo-600 font-medium">
              Try resending
            </button>
          </motion.div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md"
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Reset password</h1>
          <p className="text-gray-600 dark:text-gray-400">Enter your email and we'll send you a link to reset it</p>
        </motion.div>

        {/* Form Card */}
        <motion.form
          variants={itemVariants}
          onSubmit={handleSubmit}
          className="glass-card rounded-2xl p-8 space-y-6"
        >
          {/* Email Input */}
          <motion.div variants={itemVariants} className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={handleChange}
                error={!!error}
                className="pl-10"
              />
            </div>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-500"
              >
                {error}
              </motion.p>
            )}
          </motion.div>

          {/* Submit Button */}
          <motion.div variants={itemVariants}>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full group relative overflow-hidden"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" />
                  Sending...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  Send reset link
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </Button>
          </motion.div>
        </motion.form>

        {/* Back to Login */}
        <motion.div variants={itemVariants} className="text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 font-medium transition-colors"
          >
            <ArrowLeft size={18} />
            Back to login
          </Link>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}