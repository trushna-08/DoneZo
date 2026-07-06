import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun, Bell, Lock, User, LogOut, Check, AlertCircle } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SettingsPage = () => {
  const { isDark, setIsDark } = useOutletContext();
  const { user, logout, updateProfile, updatePassword } = useAuth();
  
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('donezo_settings_notifications');
    return saved ? JSON.parse(saved) : {
      email: true,
      push: true,
      sms: false,
      reminders: true
    };
  });
  
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Password state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });

  const handleNotificationChange = (key) => {
    setNotifications(prev => {
      const newNotifs = { ...prev, [key]: !prev[key] };
      localStorage.setItem('donezo_settings_notifications', JSON.stringify(newNotifs));
      return newNotifs;
    });
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setError('');
    try {
      await updateProfile(profile);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      setError('New passwords do not match');
      return;
    }
    if (!/^(?=.*[A-Z])(?=.*[0-9])(?=.*[@$!%*?&#]).{8,}$/.test(passwords.new)) {
      setError('Use 8+ characters with uppercase, number, and special character');
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      await updatePassword({ currentPassword: passwords.current, newPassword: passwords.new });
      setIsChangingPassword(false);
      setPasswords({ current: '', new: '', confirm: '' });
      alert('Password changed successfully');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your account and preferences</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Theme Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-xl p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isDark ? (
              <Moon size={24} className="text-indigo-500" />
            ) : (
              <Sun size={24} className="text-yellow-500" />
            )}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Theme</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isDark ? 'Dark mode enabled' : 'Light mode enabled'}
              </p>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsDark(!isDark)}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              isDark ? 'bg-indigo-600' : 'bg-gray-300'
            }`}
          >
            <motion.div
              layout
              className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-sm"
              animate={{
                x: isDark ? 28 : 0
              }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </motion.button>
        </div>
      </motion.div>

      {/* Profile Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-xl p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <User size={24} className="text-indigo-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Profile Settings</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              className="w-full bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone Number (Optional)</label>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              className="w-full bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              placeholder="+1 (555) 000-0000"
            />
          </div>
          
          <div className="pt-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
            >
              {saved ? (
                <>
                  <Check size={18} />
                  Saved
                </>
              ) : isSaving ? (
                'Saving...'
              ) : (
                'Save Profile'
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Security Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-xl p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <Lock size={24} className="text-indigo-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Security</h3>
        </div>

        {!isChangingPassword ? (
          <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-transparent">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Change Password</p>
              <p className="text-sm text-gray-500 mt-0.5">Update your account password</p>
            </div>
            <button
              onClick={() => setIsChangingPassword(true)}
              className="px-4 py-2 text-indigo-600 dark:text-indigo-400 font-medium hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-colors"
            >
              Update
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700/50 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Current Password</label>
              <input
                type="password"
                value={passwords.current}
                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">New Password</label>
              <input
                type="password"
                value={passwords.new}
                onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Confirm New Password</label>
              <input
                type="password"
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSavePassword}
                disabled={isSaving || !passwords.current || !passwords.new}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg transition-colors text-sm"
              >
                {isSaving ? 'Saving...' : 'Save Password'}
              </button>
              <button
                onClick={() => {
                  setIsChangingPassword(false);
                  setPasswords({ current: '', new: '', confirm: '' });
                  setError('');
                }}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-slate-800 dark:text-white font-medium rounded-lg transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Notification Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card rounded-xl p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <Bell size={24} className="text-indigo-500" />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Choose how you want to be notified</p>
          </div>
        </div>

        <div className="space-y-4">
          {Object.entries(notifications).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-zinc-800/50 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
              <label className="flex-1 cursor-pointer">
                <p className="font-medium text-gray-900 dark:text-white capitalize">
                  {key === 'sms' ? 'SMS Alerts' : `${key.charAt(0).toUpperCase() + key.slice(1)} Notifications`}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  {key === 'email' && 'Get notifications via email'}
                  {key === 'push' && 'Get browser push notifications'}
                  {key === 'sms' && 'Get text message alerts'}
                  {key === 'reminders' && 'Get daily productivity reminders'}
                </p>
              </label>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => handleNotificationChange(key)}
                className={`relative w-12 h-7 rounded-full transition-colors ${
                  value ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-zinc-600'
                }`}
              >
                <motion.div
                  layout
                  className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-sm"
                  animate={{
                    x: value ? 20 : 0
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </motion.button>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Account Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-3"
      >
         <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={logout}
          className="w-full py-3 bg-red-100 dark:bg-red-950/30 hover:bg-red-200 dark:hover:bg-red-950/50 text-red-600 dark:text-red-400 font-semibold rounded-lg transition-all flex items-center justify-center gap-2 border border-red-200 dark:border-transparent"
        >
          <LogOut size={20} />
          Sign Out
        </motion.button>
      </motion.div>
    </div>
  );
};

export default SettingsPage;
