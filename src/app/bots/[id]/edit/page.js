'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '../../../../lib/api';
import DashboardLayout from '../../../../components/DashboardLayout';
import { Bot, Save, ArrowLeft, PlusCircle, Trash2, FileText } from 'lucide-react';
import Link from 'next/link';

export default function EditBotPage() {
  const router = useRouter();
  const params = useParams();
  const botId = params?.id;
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    welcome_message: '',
    color_theme: '#4f46e5',
    use_ai: true,
    faqs: [],
    prompt: '',
    workflow_id: '',
    vector_id: '',
    openai_key: ''
  });

  // PDF Management State
  const [pdfs, setPdfs] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  const fetchPdfs = async () => {
    try {
      const res = await api.get(`/pdfs/bot/${botId}`);
      setPdfs(res.data);
    } catch (err) {
      console.error('Failed to load PDFs:', err);
    }
  };

  useEffect(() => {
    if (!botId) return;
    
    const fetchBot = async () => {
      try {
        const res = await api.get(`/bots/${botId}`);
        const bot = res.data;
        let parsedFaqs = [];
        try {
           parsedFaqs = typeof bot.faqs === 'string' ? JSON.parse(bot.faqs) : (bot.faqs || []);
        } catch (e) {
           parsedFaqs = [];
        }

        setFormData({
          name: bot.name || '',
          welcome_message: bot.welcome_message || '',
          color_theme: bot.color_theme || '#4f46e5',
          use_ai: bot.use_ai !== undefined ? bot.use_ai : true,
          faqs: parsedFaqs,
          prompt: bot.prompt || '',
          workflow_id: bot.workflow_id || '',
          vector_id: bot.vector_id || '',
          openai_key: bot.openai_key || ''
        });
      } catch (err) {
        console.error('Failed to load bot:', err);
        alert('Could not load bot data');
        router.push('/bots');
      } finally {
        setInitialLoading(false);
      }
    };
    
    fetchBot();
    fetchPdfs(); // Fetch PDFs alongside bot details
  }, [botId, router]);

  const handlePdfUpload = async () => {
    if (!selectedFile) return;
    setUploadingPdf(true);

    const data = new FormData();
    data.append('pdf', selectedFile);
    data.append('botId', botId);

    try {
      await api.post('/pdfs/upload', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setSelectedFile(null);
      // Reset file input
      document.querySelector('input[type="file"]').value = '';
      await fetchPdfs(); // Refresh list to show 'pending' status
      alert('PDF uploaded successfully! Processing started.');
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Failed to upload PDF: ' + (err.response?.data?.error || err.message));
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleDeletePdf = async (pdfId) => {
    if (!confirm('Are you sure you want to delete this PDF and its learned knowledge?')) return;
    try {
      await api.delete(`/pdfs/${pdfId}`);
      await fetchPdfs();
    } catch (err) {
      console.error('Failed to delete PDF:', err);
      alert('Failed to delete PDF');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const addFaq = () => {
    setFormData(prev => ({
      ...prev,
      faqs: [...(prev.faqs || []), { question: '', answer: '' }]
    }));
  };

  const updateFaq = (index, field, value) => {
    const newFaqs = [...(formData.faqs || [])];
    newFaqs[index][field] = value;
    setFormData(prev => ({ ...prev, faqs: newFaqs }));
  };

  const removeFaq = (index) => {
    const newFaqs = (formData.faqs || []).filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, faqs: newFaqs }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/bots/${botId}`, formData);
      router.push('/bots');
    } catch (err) {
      console.error(err);
      alert('Failed to update bot');
    } finally {
       setLoading(false);
    }
  };

  if (initialLoading) {
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
          <div className="flex items-center space-x-4">
            <Link href="/bots" className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Chatbot</h1>
          </div>
          <button 
            type="button"
            onClick={handleSubmit} 
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <Save className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Update Bot
          </button>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
           <div className="p-8 space-y-8">
             {/* General Info */}
             <div>
               <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white flex items-center">
                 <Bot className="mr-2 h-5 w-5 text-indigo-500" /> General Appearance
               </h3>
               <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                 <div className="sm:col-span-3">
                   <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bot Name</label>
                   <div className="mt-1">
                     <input
                       type="text"
                       name="name"
                       id="name"
                       value={formData.name || ''}
                       onChange={handleChange}
                       className="shadow-sm focus:ring-indigo-500 py-3 px-3 border border-gray-300 dark:border-gray-600 bg-transparent dark:text-white focus:border-indigo-500 block w-full sm:text-sm rounded-md"
                     />
                   </div>
                 </div>

                 <div className="sm:col-span-3">
                   <label htmlFor="color_theme" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Theme Color</label>
                   <div className="mt-1 flex items-center space-x-3">
                     <input
                       type="color"
                       name="color_theme"
                       id="color_theme"
                       value={formData.color_theme || '#4f46e5'}
                       onChange={handleChange}
                       className="h-10 w-10 p-0 border-0 rounded-md cursor-pointer"
                     />
                     <span className="text-sm text-gray-500">{formData.color_theme}</span>
                   </div>
                 </div>

                 <div className="sm:col-span-6">
                   <label htmlFor="welcome_message" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Welcome Message</label>
                   <div className="mt-1">
                     <textarea
                       id="welcome_message"
                       name="welcome_message"
                       rows={3}
                       value={formData.welcome_message || ''}
                       onChange={handleChange}
                       className="shadow-sm focus:ring-indigo-500 bg-transparent dark:text-white border p-3 border-gray-300 dark:border-gray-600 focus:border-indigo-500 block w-full sm:text-sm rounded-md"
                     />
                   </div>
                 </div>
                 <div className="sm:col-span-6">
                    <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Agent Prompt (Instructions)
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      Define how the AI should behave (e.g. "You are a helpful support agent for RSI Concepts. Answer politely.")
                    </p>
                    <div className="mt-1">
                      <textarea
                        id="prompt"
                        name="prompt"
                        rows={4}
                        placeholder="You are a helpful customer support assistant. Answer clearly and politely."
                        value={formData.prompt || ''}
                        onChange={handleChange}
                        className="shadow-sm focus:ring-indigo-500 bg-transparent dark:text-white border p-3 border-gray-300 dark:border-gray-600 focus:border-indigo-500 block w-full sm:text-sm rounded-md"
                      />
                    </div>
                 </div>
              </div>
             </div>

             <div className="pt-8 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                   <div>
                     <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">AI Capabilities</h3>
                     <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Enable OpenAI to automatically answer complex questions using your FAQs as context.</p>
                   </div>
                   <div className="flex items-center">
                     <input
                       id="use_ai"
                       name="use_ai"
                       type="checkbox"
                       checked={formData.use_ai}
                       onChange={handleChange}
                       className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                     />
                     <label htmlFor="use_ai" className="ml-2 block text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
                       Enable AI Automation
                     </label>
                   </div>
                </div>
                {formData.use_ai && (
                  <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6 border-t border-gray-100 dark:border-gray-700 pt-6">
                    <div className="sm:col-span-3">
                      <label htmlFor="workflow_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Workflow ID</label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="workflow_id"
                          id="workflow_id"
                          value={formData.workflow_id || ''}
                          onChange={handleChange}
                          className="shadow-sm focus:ring-indigo-500 py-3 px-3 border border-gray-300 dark:border-gray-600 bg-transparent dark:text-white focus:border-indigo-500 block w-full sm:text-sm rounded-md"
                        />
                      </div>
                    </div>
                    <div className="sm:col-span-3">
                      <label htmlFor="vector_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Vector ID</label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="vector_id"
                          id="vector_id"
                          value={formData.vector_id || ''}
                          onChange={handleChange}
                          className="shadow-sm focus:ring-indigo-500 py-3 px-3 border border-gray-300 dark:border-gray-600 bg-transparent dark:text-white focus:border-indigo-500 block w-full sm:text-sm rounded-md"
                        />
                      </div>
                    </div>
                    <div className="sm:col-span-6">
                      <label htmlFor="openai_key" className="block text-sm font-medium text-gray-700 dark:text-gray-300">OpenAI API Key</label>
                      <div className="mt-1">
                        <input
                          type="password"
                          name="openai_key"
                          id="openai_key"
                          value={formData.openai_key || ''}
                          onChange={handleChange}
                          placeholder="sk-..."
                          className="shadow-sm focus:ring-indigo-500 py-3 px-3 border border-gray-300 dark:border-gray-600 bg-transparent dark:text-white focus:border-indigo-500 block w-full sm:text-sm rounded-md"
                        />
                      </div>
                    </div>
                  </div>
                )}
             </div>

             <div className="pt-8 border-t border-gray-200 dark:border-gray-700">
               <div className="flex items-center justify-between mb-4">
                 <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white flex items-center">
                   <FileText className="mr-2 h-5 w-5 text-indigo-500" /> Knowledge Base (PDF Docs)
                 </h3>
               </div>
               <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                 Upload PDF documents containing your company's knowledge. The AI will read these to answer user questions.
               </p>

               {/* PDF Upload Area */}
               <div className="flex items-center space-x-4 mb-6">
                 <input
                   type="file"
                   accept=".pdf"
                   onChange={(e) => setSelectedFile(e.target.files[0])}
                   className="block w-full text-sm text-gray-500 dark:text-gray-400
                     file:mr-4 file:py-2 file:px-4
                     file:rounded-md file:border-0
                     file:text-sm file:font-semibold
                     file:bg-indigo-50 file:text-indigo-700
                     hover:file:bg-indigo-100 dark:file:bg-indigo-900 dark:file:text-indigo-300"
                 />
                 <button
                   type="button"
                   onClick={handlePdfUpload}
                   disabled={uploadingPdf || !selectedFile}
                   className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                 >
                   {uploadingPdf ? 'Uploading...' : 'Upload PDF'}
                 </button>
               </div>

               {/* PDF List */}
               <div className="space-y-3">
                 {pdfs.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">No PDFs uploaded yet. Try uploading your manual or pricing sheet.</p>
                 ) : (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-md">
                      {pdfs.map((pdf) => (
                        <li key={pdf.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          <div className="flex items-center space-x-3">
                            <FileText className="h-5 w-5 text-red-400" />
                            <div>
                               <p className="text-sm font-medium text-gray-900 dark:text-white">{pdf.file_name}</p>
                               <p className="text-xs text-gray-500 dark:text-gray-400">
                                  Status: <span className={pdf.status === 'completed' ? 'text-green-500' : 'text-yellow-500'}>{pdf.status}</span>
                               </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeletePdf(pdf.id)}
                            className="text-gray-400 hover:text-red-500 p-2 transition-colors"
                            title="Delete PDF"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                 )}
               </div>
             </div>

             <div className="pt-8 border-t border-gray-200 dark:border-gray-700">
               <div className="flex items-center justify-between mb-4">
                 <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Knowledge Base (FAQs)</h3>
                 <button
                   type="button"
                   onClick={addFaq}
                   className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                 >
                   <PlusCircle className="mr-1 h-4 w-4" /> Add FAQ
                 </button>
               </div>
               
               <div className="space-y-4">
                 {!formData.faqs || formData.faqs.length === 0 ? (
                   <p className="text-sm text-gray-500 text-center py-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">No FAQs added yet. Add simple questions and answers directly.</p>
                 ) : (
                   formData.faqs.map((faq, index) => (
                     <div key={index} className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 relative group">
                        <div className="flex-1 space-y-4">
                          <input
                            type="text"
                            placeholder="Question (e.g. What are your hours?)"
                            value={faq.question || ''}
                            onChange={(e) => updateFaq(index, 'question', e.target.value)}
                            className="block px-3 py-2 w-full sm:text-sm border-gray-300 dark:border-gray-600 border dark:bg-gray-700 dark:text-white rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          />
                          <textarea
                            placeholder="Answer (e.g. We are open from 9am to 5pm, Monday to Friday.)"
                            value={faq.answer || ''}
                            rows={2}
                            onChange={(e) => updateFaq(index, 'answer', e.target.value)}
                            className="block px-3 py-2 w-full sm:text-sm border-gray-300 dark:border-gray-600 border dark:bg-gray-700 dark:text-white rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFaq(index)}
                          className="text-gray-400 hover:text-red-500 self-start p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                     </div>
                   ))
                 )}
               </div>
             </div>

           </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
