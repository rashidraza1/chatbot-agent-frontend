'use client';
import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Bot, MessageSquare, Users, Activity, Inbox } from 'lucide-react';
import Link from 'next/link';
import DashboardLayout from '../../components/DashboardLayout';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalBots: 0,
    activeConversations: 0,
    totalMessages: 0,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const bots = await api.get('/bots');
        const conversations = await api.get('/conversations');
        setStats({
           totalBots: bots.data.length || 0,
           activeConversations: conversations.data.filter(c => c.status === 'active').length || 0,
           totalMessages: conversations.data.length * 5 
        });
      } catch (err) {
        console.error(err);
      }
    };
    fetchDashboardData();
  }, []);

  const statCards = [
    { name: 'Total Chatbots', value: stats.totalBots, icon: Bot, color: 'text-blue-600', bg: 'bg-blue-100' },
    { name: 'Active Conversations', value: stats.activeConversations, icon: Activity, color: 'text-green-600', bg: 'bg-green-100' },
    { name: 'Total Messages', value: stats.totalMessages, icon: MessageSquare, color: 'text-purple-600', bg: 'bg-purple-100' },
    { name: 'Unique Visitors', value: '1,423', icon: Users, color: 'text-orange-600', bg: 'bg-orange-100' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Overview</h1>
          <Link 
            href="/bots/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Bot className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Create Chatbot
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((item) => (
            <div key={item.name} className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`rounded-md p-3 ${item.bg}`}>
                      <item.icon className={`h-6 w-6 ${item.color}`} aria-hidden="true" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{item.name}</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900 dark:text-white">{item.value}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 border border-gray-100 dark:border-gray-700">
             <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Recent Conversations</h3>
             <div className="text-center py-12 text-gray-500">
                <Inbox className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <p>No recent conversations mapped yet.</p>
             </div>
          </div>
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 border border-gray-100 dark:border-gray-700">
             <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Top Performing Bots</h3>
             <div className="text-center py-12 text-gray-500">
                <Activity className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <p>Not enough data to display.</p>
             </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
