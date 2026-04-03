'use client';
import { useState, useEffect } from 'react';
import api from '../../lib/api';
import Link from 'next/link';
import { Bot, Plus, Trash2, Edit2, Code, Copy, Check, X } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';

export default function BotsPage() {
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [selectedBotId, setSelectedBotId] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetchBots = async () => {
    try {
      const res = await api.get('/bots');
      setBots(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBots();
  }, []);

  const deleteBot = async (id) => {
    if (!window.confirm('Are you sure you want to delete this bot?')) return;
    try {
      await api.delete(`/bots/${id}`);
      fetchBots();
    } catch (err) {
      console.error(err);
    }
  };

  const getEmbedCode = (id) => {
    return `<script>\n  (function(){\n    var s=document.createElement("script");\n    s.src="http://localhost:5000/widget.js";\n    s.setAttribute("data-bot-id","${id}");\n    document.head.appendChild(s);\n  })();\n</script>`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getEmbedCode(selectedBotId));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Your Chatbots</h1>
          <Link 
            href="/bots/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            New Bot
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : bots.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-100 dark:border-gray-700">
            <Bot className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No chatbots</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by creating a new chatbot.</p>
            <div className="mt-6">
              <Link
                href="/bots/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                New Bot
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {bots.map((bot) => (
              <div key={bot.id} className="bg-white dark:bg-gray-800 shadow rounded-lg flex flex-col border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                <div className="flex-1 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: bot.color_theme }}>
                        <Bot size={20} />
                      </div>
                      <h3 className="ml-3 text-lg font-medium text-gray-900 dark:text-white">{bot.name}</h3>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                    {bot.welcome_message}
                  </p>
                  <div className="mt-4 flex items-center justify-between text-sm">
                     <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-medium ${bot.use_ai ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {bot.use_ai ? 'AI Enabled' : 'Manual Only'}
                     </span>
                     <span className="text-gray-500">{bot.faqs?.length || 0} FAQs</span>
                  </div>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-3 flex justify-between bg-gray-50 dark:bg-gray-800/50 rounded-b-lg">
                  <button 
                    onClick={() => {
                      setSelectedBotId(bot.id);
                      setShowEmbedModal(true);
                    }} 
                    className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-900 dark:hover:text-indigo-400"
                  >
                    <Code className="mr-1 h-4 w-4" /> Embed
                  </button>
                  <div className="flex space-x-4">
                    <Link href={`/bots/${bot.id}/edit`} className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                      <Edit2 className="h-4 w-4" />
                    </Link>
                    <button onClick={() => deleteBot(bot.id)} className="text-gray-400 hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Embed Modal */}
        {showEmbedModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-gray-800 animate-in fade-in zoom-in duration-200">
              <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Install Chatbot</h3>
                <button onClick={() => setShowEmbedModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Copy and paste this script tag into your website's <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-indigo-600 font-mono">{'<head>'}</code> or before the closing <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-indigo-600 font-mono">{'</body>'}</code> tag.
                </p>
                <div className="relative group">
                  <pre className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl text-xs font-mono text-gray-800 dark:text-gray-200 overflow-x-auto border border-gray-200 dark:border-gray-700">
                    {getEmbedCode(selectedBotId)}
                  </pre>
                  <button 
                    onClick={copyToClipboard}
                    className="absolute top-2 right-2 p-2 bg-white dark:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-all flex items-center space-x-2 text-xs font-medium"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-green-600">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 text-gray-500" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                <button 
                  onClick={() => setShowEmbedModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

