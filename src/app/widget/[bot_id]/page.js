'use client';
import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import { io } from 'socket.io-client';
import { Bot, Send, X, AlertCircle, Smile, Mic, MicOff, Maximize2, Minimize2, Minus, History, MessageSquare, Plus, Menu, Search, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function WidgetPage() {
  const params = useParams();
  const bot_id = params?.bot_id;
  const searchParams = useSearchParams();
  const currentUrl = searchParams.get('url') || '';

  const [botConfig, setBotConfig] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [history, setHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [guestId, setGuestId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const emojis = ['😊', '😂', '😍', '👍', '🙏', '🔥', '👋', '🤔', '🙌', '🎉', '💡', '✨'];

  // Initialize Guest ID and load history
  useEffect(() => {
    let gid = localStorage.getItem('chatdesk_guest_id');
    if (!gid) {
      gid = crypto.randomUUID();
      localStorage.setItem('chatdesk_guest_id', gid);
    }
    setGuestId(gid);
  }, []);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/bots/${bot_id}/widget`);
        if (res.ok) {
          const data = await res.json();
          setBotConfig(data);
        }
      } catch (err) {
        console.error('Failed to load bot config:', err);
      }
    };
    if (bot_id) fetchConfig();
  }, [bot_id]);

  // Fetch History
  const fetchHistory = async () => {
    if (!bot_id || !guestId) return;
    try {
      // For now, we use guestId as user_id for simplicity in guest mode
      const res = await fetch(`${API_BASE}/api/chat/conversations?bot_id=${bot_id}&user_id=${guestId}`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  useEffect(() => {
    if (isOpen) fetchHistory();
  }, [isOpen, bot_id, guestId]);

  useEffect(() => {
    // Notify parent window to resize iframe
    if (isOpen) {
      window.parent.postMessage(isMaximized ? 'chatdesk-maximize' : 'chatdesk-expand', '*');
    } else {
      window.parent.postMessage('chatdesk-minimize', '*');
    }
  }, [isOpen, isMaximized]);

  // Handle Socket for Real-time (Optional for history, but kept for live updates)
  useEffect(() => {
    if (!isOpen) return;

    const newSocket = io(API_BASE);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
    });

    newSocket.on('new_message', (msg) => {
      if (conversation && msg.conversation_id === conversation.id) {
        setMessages(prev => [...prev, msg]);
      }
    });

    newSocket.on('bot_typing', (typing) => {
      setIsTyping(typing);
    });

    return () => {
      newSocket.close();
      setSocket(null);
    };
  }, [isOpen, conversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const loadConversation = async (convId) => {
    try {
      const res = await fetch(`${API_BASE}/api/chat/conversations/${convId}`);
      if (res.ok) {
        const data = await res.json();
        setConversation(data.conversation);
        setMessages(data.messages);
        if (socket) {
          socket.emit('join_conversation', { conversationId: convId });
        }
      }
    } catch (err) {
      console.error('Failed to load conversation:', err);
    }
  };

  const startNewChat = () => {
    setConversation(null);
    setMessages([]);
  };

  const handleDeleteConversation = async (e, convId) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this chat?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/chat/conversations/${convId}`, { method: 'DELETE' });
      if (res.ok) {
        setHistory(prev => prev.filter(c => c.id !== convId));
        if (conversation?.id === convId) startNewChat();
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !bot_id) return;

    const content = newMessage;
    setNewMessage('');
    setShowEmojiPicker(false);

    // Optimistically add user message
    const tempUserMsg = { id: Date.now(), content, sender_type: 'visitor', createdAt: new Date() };
    setMessages(prev => [...prev, tempUserMsg]);
    setIsTyping(true);

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bot_id,
          conversation_id: conversation?.id,
          user_id: guestId,
          content,
          stream: true
        })
      });

      if (!res.ok) throw new Error('Failed to send');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let residual = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const text = residual + chunk;
        const lines = text.split('\n');
        
        // The last element might be an incomplete line
        residual = lines.pop() || "";

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;
          
          const jsonStr = trimmedLine.replace('data: ', '').trim();
          if (!jsonStr) continue;

          try {
            const data = JSON.parse(jsonStr);
            
            if (data.type === 'start') {
              // Keep typing active until done
            } else if (data.type === 'delta') {
              // Just accumulate on backend/server-side or locally if needed
              // For now we just wait for 'done' which has the full content
            } else if (data.type === 'done') {
              // Update conversation if it's new
              if (!conversation) {
                setConversation({ id: data.conversation_id, title: data.title });
                fetchHistory(); // Refresh sidebar
              }
              
              // Now that we're done, hide typing and show the full messages
              setIsTyping(false);
              setMessages(prev => {
                const filtered = prev.filter(m => m.id !== tempUserMsg.id);
                return [...filtered, data.userMessage, data.botMessage];
              });
            }
          } catch (e) {
            console.error("Error parsing SSE line:", jsonStr, e);
          }
        }
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setIsTyping(false);
    }
  };

  const toggleVoice = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      setNewMessage(prev => prev + finalTranscript);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  if (!botConfig) return null;

  const filteredHistory = history.filter(h =>
    h.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 pointer-events-none flex flex-col justify-end items-end-1 pb-5 pr-5 font-sans">
      {isOpen ? (
        <div className={`pointer-events-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800 transition-all duration-500 transform scale-100 origin-bottom-right ${isMaximized ? 'w-[95vw] h-[90vh] max-w-[1200px]' : 'h-[600px] w-[380px]'}`}>

          {/* Main Layout Container */}
          <div className="flex flex-1 overflow-hidden relative">

            {/* Sidebar (History) - Only visible in maximized mode or if explicitly toggled */}
            <div className={`bg-gray-50 dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-all duration-300 rounded-l-2xl ${isMaximized && isSidebarOpen ? 'w-72' : 'w-0 overflow-hidden'}`}>
              <div className="p-4 flex flex-col h-full uppercase">
                <button
                  onClick={startNewChat}
                  className="flex items-center justify-center space-x-2 w-full py-2.5 px-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-all mb-4"
                >
                  <Plus size={16} />
                  <span>New Chat</span>
                </button>

                <div className="relative mb-4">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search chats..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white dark:bg-gray-800 border-none rounded-lg py-2 pl-9 pr-3 text-xs focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                  {filteredHistory.map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => loadConversation(chat.id)}
                      className={`group w-full flex items-center space-x-3 px-3 py-3 rounded-xl text-left transition-all ${conversation?.id === chat.id ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
                    >
                      <MessageSquare size={16} className="shrink-0" />
                      <span className="truncate text-sm flex-1">{chat.title || 'Untitled Chat'}</span>
                      <button
                        onClick={(e) => handleDeleteConversation(e, chat.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 rounded transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </button>
                  ))}
                  {filteredHistory.length === 0 && (
                    <div className="text-center py-10 text-gray-400 text-xs uppercase">No history found</div>
                  )}
                </div>
              </div>
            </div>

            {/* Chat Pane */}
            <div className="flex-1 flex flex-col relative bg-white dark:bg-gray-900 rounded-r-2xl">

              {/* Header */}
              <div
                className="p-4 flex items-center justify-between shadow-sm text-white relative h-16 shrink-0 rounded-t-2xl md:rounded-tl-none"
                style={{ backgroundColor: botConfig.color_theme || '#4f46e5' }}
              >
                <div className="flex items-center space-x-3">
                  {isMaximized && (
                    <button
                      onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                      className="p-1.5 hover:bg-white/20 rounded-lg transition-colors mr-1"
                    >
                      <Menu size={20} />
                    </button>
                  )}
                  <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-inner overflow-hidden shrink-0">
                    {botConfig.avatar_url ? (
                      <img src={botConfig.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <Bot size={24} style={{ color: botConfig.color_theme || '#4f46e5' }} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-lg leading-tight truncate">{botConfig.name}</h3>
                    <p className="text-xs text-white text-opacity-80 flex items-center">
                      <span className="w-2 h-2 rounded-full bg-green-400 mr-1 animate-pulse"></span> Online
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-1 shrink-0">
                  <button
                    onClick={() => setIsMaximized(!isMaximized)}
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                    title={isMaximized ? "Restore" : "Chat History"}
                  >
                    {isMaximized ? <Minimize2 size={18} /> : <History size={18} />}
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <Minus size={18} />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 bg-[#f8f9fc] dark:bg-gray-900 space-y-6">
                {messages.length === 0 && !isTyping && (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-60">
                    <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center shadow-sm">
                      <Bot size={32} style={{ color: botConfig.color_theme || '#4f46e5' }} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 dark:text-gray-200">How can I help you today?</h4>
                      <p className="text-sm text-gray-500">Ask me anything about our services.</p>
                    </div>
                  </div>
                )}

                {messages.map((msg, idx) => {
                  const isVisitor = msg.sender_type === 'visitor';
                  return (
                    <div key={idx} className={`flex ${isVisitor ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                      <div className={`max-w-[85%] rounded-[20px] px-5 py-3.5 shadow-sm text-sm ${isVisitor
                        ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-tr-none shadow-indigo-200 dark:shadow-none'
                        : 'bg-white text-gray-800 dark:bg-gray-800 dark:text-gray-100 rounded-tl-none border border-gray-100 dark:border-gray-700 shadow-sm'
                        }`}>
                        <div className="markdown-content leading-relaxed">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                        <span className={`text-[10px] mt-1 block opacity-50 ${isVisitor ? 'text-right' : 'text-left'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 relative rounded-b-2xl">
                <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-center space-x-3 w-full">
                  <div className="flex-1 flex items-center bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl px-2 focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all min-w-0">
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className={`p-2 rounded-full transition-colors shrink-0 ${showEmojiPicker ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      <Smile size={20} />
                    </button>

                    <input
                      type="text"
                      placeholder={isListening ? 'Listening...' : "Type a message..."}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1 bg-transparent text-gray-900 dark:text-gray-100 py-3 px-2 focus:outline-none text-sm min-w-0"
                    />

                    <button
                      type="button"
                      onClick={toggleVoice}
                      className={`p-2 rounded-full transition-all shrink-0 ${isListening ? 'text-white bg-red-500 shadow-lg animate-pulse' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={!newMessage.trim() || isTyping}
                    className="p-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl transition-all shadow-lg shadow-indigo-500/30 active:scale-95 disabled:opacity-50 disabled:shadow-none flex items-center justify-center shrink-0"
                    style={{ backgroundColor: botConfig.color_theme || '#4f46e5' }}
                  >
                    <Send size={20} />
                  </button>
                </form>
                <div className="flex items-center justify-center mt-3">
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium tracking-wide">
                    POWERED BY <a href="https://rsiconcepts.com" target="_blank" className="hover:text-indigo-500 transition-colors">RSI CONCEPTS</a>
                  </span>
                </div>
              </div>

            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="pointer-events-auto rounded-full w-14 h-14 shadow-2xl flex items-center justify-center hover:scale-110 transition-all duration-200 text-white overflow-hidden"
          style={{ backgroundColor: botConfig.color_theme || '#4f46e5' }}
        >
          {botConfig.avatar_url ? (
            <img src={botConfig.avatar_url} alt="Open Chat" className="w-full h-full object-cover" />
          ) : (
            <Bot size={28} />
          )}
        </button>
      )}
    </div>
  );
}
