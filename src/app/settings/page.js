'use client';
import { useState, useEffect } from 'react';
import api from '../../lib/api';
import DashboardLayout from '../../components/DashboardLayout';
import { User, Shield, Bell, AppWindow, Save, CheckCircle } from 'lucide-react';

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get('/auth/me');
        setUser(res.data);
      } catch (err) {
        console.error('Failed to fetch user:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    // Placeholder for actual save logic if needed
    setTimeout(() => {
      setSaving(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }, 1000);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
          >
            {success ? (
              <CheckCircle className="-ml-1 mr-2 h-5 w-5" />
            ) : (
              <Save className="-ml-1 mr-2 h-5 w-5" />
            )}
            {saving ? 'Saving...' : success ? 'Saved!' : 'Save Changes'}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Sidebar Nav */}
          <div className="space-y-1">
            <button className="flex items-center w-full px-4 py-3 text-sm font-medium text-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg">
              <User className="h-5 w-5 mr-3" />
              Profile details
            </button>
            <button className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <Shield className="h-5 w-5 mr-3" />
              Security
            </button>
            <button className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <Bell className="h-5 w-5 mr-3" />
              Notifications
            </button>
            <button className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <AppWindow className="h-5 w-5 mr-3" />
              Integrations
            </button>
          </div>

          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 shadow rounded-xl border border-gray-100 dark:border-gray-700 p-8">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Profile Information</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Display Name</label>
                  <input
                    type="text"
                    defaultValue={user?.name}
                    className="block w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={user?.email}
                    disabled
                    className="block w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-500 dark:text-gray-500 cursor-not-allowed outline-none"
                  />
                  <p className="mt-2 text-xs text-gray-500">Email addresses cannot be changed at this time.</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow rounded-xl border border-gray-100 dark:border-gray-700 p-8">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Password</h3>
              <div className="space-y-6">
                <p className="text-sm text-gray-500">
                  Update your password to keep your account secure.
                </p>
                <button className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                  Change password
                </button>
              </div>
            </div>

            <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl p-8">
              <h3 className="text-lg font-medium text-red-900 dark:text-red-400 mb-2">Danger Zone</h3>
              <p className="text-sm text-red-700 dark:text-red-400/80 mb-6">
                Permanently delete your account and all associated chatbot data. This action cannot be undone.
              </p>
              <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
                Delete account
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
