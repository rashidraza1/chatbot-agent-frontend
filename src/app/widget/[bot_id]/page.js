'use client';
import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import { io } from 'socket.io-client';
import { Bot, Send, X, AlertCircle, Smile, Mic, MicOff, Maximize2, Minimize2, Minus, History, MessageSquare, Plus, Menu, Search, Trash2 } from 'lucide-react';
import { marked } from 'marked';
import api from '@/utils/api';

const API_BASE = import.meta.env.NEXT_PUBLIC_API_URL || 'https://kalamiq.com';

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
  const [accumulatedContent, setAccumulatedContent] = useState("");

  const sanitizeMarkdown = (text) => {
    if (!text) return text;

    let sanitized = text;

    // ✅ 1. Convert **bold** → <strong>bold</strong>
    sanitized = sanitized.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');


    // ✅ 2. Convert "* " (list) → ". "
    sanitized = sanitized.replace(/(^|\n)\* /g, '$1. ')
      .replace(/(\s)\* /g, '$1. ');

    // ✅ 3. Remove remaining single asterisks
    sanitized = sanitized.replace(/\*/g, '');

    console.log("sanitized", sanitized);
    return sanitized;
  };

  const [isLeadCaptured, setIsLeadCaptured] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('lead_captured') === 'true';
    }
    return false;
  });
  const [leadForm, setLeadForm] = useState({ name: '', email: '', mobile_number: '' });
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [leadError, setLeadError] = useState('');

  // Lead capture restriction (Bot ID 4 for now, can be set to 'all' later)
  const collectLeadsFor = ['4'];
  const shouldShowLeadForm = !isLeadCaptured && (collectLeadsFor.includes('all') || collectLeadsFor.includes(String(bot_id)));

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const streamingRef = useRef("");
  const rafRef = useRef(null);

  // ✅ Smooth scroll helper
  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const emojis = ['😊', '😂', '😍', '👍', '🙏', '🔥', '👋', '🤔', '🙌', '🎉', '💡', '✨'];

  // Guest ID and token management is now handled by the api utility
  useEffect(() => {
    // No-op: api.js automatically handles guest token creation
  }, []);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await api.fetchWithAuth(`/api/bots/${bot_id}/widget`);
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
    try {
      const res = await api.fetchWithAuth(`/api/chat/conversations?bot_id=${bot_id}`);
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
  }, [isOpen, bot_id]);

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
        const sanitizedContent = sanitizeMarkdown(msg.content);
        setMessages(prev => [...prev, { ...msg, content: marked.parse(sanitizedContent) }]);
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
    scrollToBottom();
  }, [messages, isTyping]);

  // Removed addCursor helper

  const loadConversation = async (convId) => {
    try {
      const res = await api.fetchWithAuth(`/api/chat/conversations/${convId}`);
      if (res.ok) {
        const data = await res.json();
        setConversation(data.conversation);
        // Ensure all historical messages are parsed as markdown if they aren't already
        const parsedMessages = data.messages.map(msg => ({
          ...msg,
          content: marked.parse(sanitizeMarkdown(msg.content))
        }));
        setMessages(parsedMessages);
        if (socket) {
          socket.emit('join_conversation', { conversationId: convId });
        }
        if (typeof window !== 'undefined' && window.innerWidth < 768) {
          setIsMaximized(false);
        }
      }
    } catch (err) {
      console.error('Failed to load conversation:', err);
    }
  };

  const startNewChat = () => {
    setConversation(null);
    setMessages([]);
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsMaximized(false);
    }
  };

  const handleDeleteConversation = async (e, convId) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this chat?')) return;
    try {
      const res = await api.fetchWithAuth(`/api/chat/conversations/${convId}`, { method: 'DELETE' });
      if (res.ok) {
        setHistory(prev => prev.filter(c => c.id !== convId));
        if (conversation?.id === convId) startNewChat();
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const handleLeadSubmit = async (e) => {
    e.preventDefault();
    if (!leadForm.name || (!leadForm.email && !leadForm.mobile_number)) {
      setLeadError('Please provide your name and at least an email or mobile number.');
      return;
    }

    setIsSubmittingLead(true);
    setLeadError('');

    try {
      const res = await api.fetchWithAuth('/api/auth/guest/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadForm)
      });

      if (res.ok) {
        localStorage.setItem('lead_captured', 'true');
        setIsLeadCaptured(true);
      } else {
        const data = await res.json();
        setLeadError(data.message || 'Failed to capture details. Please try again.');
      }
    } catch (err) {
      setLeadError('Network error. Please try again.');
    } finally {
      setIsSubmittingLead(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !bot_id) return;

    const content = newMessage;
    setNewMessage('');
    setShowEmojiPicker(false);

    const sanitizedUserContent = sanitizeMarkdown(content);

    const tempUserMsg = {
      id: Date.now(),
      content: marked.parse(sanitizedUserContent),
      sender_type: 'visitor',
      createdAt: new Date()
    };

    setMessages(prev => [...prev, tempUserMsg]);
    setIsTyping(true);

    try {
      const res = await api.fetchWithAuth(`/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bot_id,
          conversation_id: conversation?.id,
          content,
          stream: true
        })
      });

      if (!res.ok) throw new Error('Failed to send');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      let residual = "";
      let uiQueue = [];

      // 🔥 IMPORTANT: prevent multiple loops
      if (!window.__isProcessingQueue) {
        window.__isProcessingQueue = false;
      }

      // ✅ Smooth DOM renderer (FAST)
      const renderStream = () => {
        if (rafRef.current) return;

        rafRef.current = requestAnimationFrame(() => {
          const el = document.getElementById("streaming-message");

          if (el) {
            // Clean up trailing markdown symbols that would flicker
            const currentText = streamingRef.current;
            const cleanContent = currentText.replace(/(\*\*|__|\*|_)+$/, "");
            el.innerHTML = marked.parse(sanitizeMarkdown(cleanContent));
          }

          scrollToBottom('auto');
          rafRef.current = null;
        });
      };

      // ✅ Queue processor (GPT feel)
      const processQueue = async () => {
        if (window.__isProcessingQueue) return;
        window.__isProcessingQueue = true;

        while (uiQueue.length > 0) {
          const chunk = uiQueue.shift();
          if (!chunk) continue;

          // Process each character for maximum smoothness
          for (let i = 0; i < chunk.length; i++) {
            const char = chunk[i];
            streamingRef.current += char;
            renderStream();

            // Dynamic delay based on punctuation
            let delay = 10;
            if (char === '.' || char === '!' || char === '?') {
              delay = 200; // Longer pause for end of sentence
            } else if (char === ',' || char === ';' || char === ':') {
              delay = 100; // Medium pause for transition
            } else if (char === '\n') {
              delay = 150; // Pause for new lines
            }

            // Stagger typing speed slightly for realism
            const jitter = Math.random() * 5;
            await new Promise(r => setTimeout(r, delay + jitter));
          }
        }

        window.__isProcessingQueue = false;
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const text = residual + chunk;
        const lines = text.split('\n');

        residual = lines.pop() || "";

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;

          const jsonStr = trimmedLine.replace('data: ', '').trim();
          if (!jsonStr) continue;

          try {
            const data = JSON.parse(jsonStr);

            // =========================
            // 🔥 DELTA
            // =========================
            if (data.type === 'delta') {
              setIsTyping(false);

              // create streaming message once
              setMessages(prev => {
                const exists = prev.find(m => m.id === 'streaming-bot');
                if (exists) return prev;

                return [
                  ...prev,
                  {
                    id: 'streaming-bot',
                    content: '',
                    sender_type: 'bot',
                    createdAt: new Date()
                  }
                ];
              });

              // push chunk
              uiQueue.push(data.content);

              processQueue();
            }

            // =========================
            // 🔥 DONE
            // =========================
            else if (data.type === 'done') {

              // wait until queue empty
              while (uiQueue.length > 0) {
                await new Promise(r => setTimeout(r, 10));
              }

              const finalHTML = marked.parse(sanitizeMarkdown(streamingRef.current));

              setMessages(prev => {
                const filtered = prev.filter(
                  m => m.id !== tempUserMsg.id && m.id !== 'streaming-bot'
                );

                return [
                  ...filtered,
                  {
                    ...data.userMessage,
                    content: marked.parse(sanitizeMarkdown(data.userMessage.content))
                  },
                  {
                    ...data.botMessage,
                    content: finalHTML
                  }
                ];
              });

              streamingRef.current = "";
              setIsTyping(false);

              if (!conversation) {
                setConversation({
                  id: data.conversation_id,
                  title: data.title
                });
                fetchHistory();
              }
            }

          } catch (e) {
            console.error("SSE parse error:", e);
          }
        }
      }

    } catch (err) {
      console.error('Failed to send message:', err);
      setIsTyping(false);
    }
  };


  const handleEmojiClick = (emoji) => {
    setNewMessage(prev => prev + emoji);
    // Keep the picker open for multiple emojis
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


    <div className="fixed inset-0 pointer-events-none flex flex-col justify-end items-center sm:items-end font-sans" style={{ padding: '0px' }}>
      {isOpen ? (
        <div className={`pointer-events-auto bg-white dark:bg-gray-900 rounded-none sm:rounded-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800 transition-all duration-500 transform scale-100 origin-bottom sm:origin-bottom-right ${isMaximized ? 'w-[95vw] h-[90vh] max-w-[1200px]' : 'h-[100svh] sm:h-[600px] w-full sm:w-[380px]'}`}>

          {/* Main Layout Container */}
          <div className="flex flex-1 overflow-hidden relative">

            {/* Sidebar (History) - Only visible in maximized mode or if explicitly toggled */}
            <div className={`bg-gray-50 dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-all duration-300 rounded-l-2xl ${isMaximized && isSidebarOpen ? 'w-72' : 'w-0 overflow-hidden'}`}>
              <div className="p-2 flex flex-col h-full uppercase">
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

            {/* Chat Pane & Pre-Chat Form Container */}
            <div className="flex-1 flex flex-col relative bg-white dark:bg-gray-900 rounded-r-2xl">

              {/* Header */}
              <div
                className="p-2 flex items-center justify-between shadow-sm text-white relative h-16 shrink-0 rounded-t-2xl md:rounded-tl-none"
                style={{ backgroundColor: botConfig.color_theme || '#4f46e5' }}
              >
                <div className="flex items-center space-x-3">
                  {isMaximized && (
                    <button
                      onClick={() => setIsMaximized(false)}
                      className="p-1.5 hover:bg-white/20 rounded-lg transition-colors mr-1"
                    >
                      <Menu size={20} />
                    </button>
                  )}
                  <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-inner overflow-hidden shrink-0">
                    {botConfig.avatar_url ? (
                      <img src={botConfig.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <img src="/rsi-logo.svg" alt="RSI Logo" className="w-full h-full object-contain p-1" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200" style={{ color: 'white' }}>{botConfig.name}</h4>
                    <p className="text-xs text-white text-opacity-80 flex items-center">
                      <span className="w-2 h-2 rounded-full bg-green-400 mr-1 animate-pulse"></span> Online
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-1 shrink-0">
                  <button
                    onClick={() => {
                      if (!isMaximized) {
                        setIsMaximized(true);
                        setIsSidebarOpen(true);
                      } else {
                        setIsSidebarOpen(!isSidebarOpen);
                      }
                    }}
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                    title="Chat History"
                  >
                    <History size={18} />
                  </button>
                  <button
                    onClick={() => {
                      const nextMax = !isMaximized;
                      setIsMaximized(nextMax);
                      if (nextMax) setIsSidebarOpen(true);
                    }}
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                    title={isMaximized ? "Restore" : "Maximize"}
                  >
                    {isMaximized ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
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
              <div className="flex-1 overflow-y-auto p-3 bg-[#f8f9fc] dark:bg-gray-900 space-y-6">
                {messages.length === 0 && !isTyping && (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-60">
                    <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center shadow-sm">
                      {/* <img src="/rsi-logo.svg" alt="RSI Logo" className="w-12 h-12 object-contain" />
                     */}
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bot" aria-hidden="true"><path d="M12 8V4H8"></path><rect width="16" height="12" x="4" y="8" rx="2"></rect><path d="M2 14h2"></path><path d="M20 14h2"></path><path d="M15 13v2"></path><path d="M9 13v2"></path></svg>
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
                        ? 'text-white rounded-tr-none shadow-indigo-200 dark:shadow-none'
                        : 'bg-white text-gray-800 dark:bg-gray-800 dark:text-gray-100 rounded-tl-none border border-gray-100 dark:border-gray-700 shadow-sm'
                        }`} style={{ backgroundColor: isVisitor ? (botConfig.color_theme || '#4f46e5') : undefined }}>
                        <div
                          id={msg.id === 'streaming-bot' ? 'streaming-message' : undefined}
                          className="markdown-content leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: msg.content }} />
                        {msg.id !== 'streaming-bot' && (
                          <span className={`text-[10px] mt-1 block opacity-50 ${isVisitor ? 'text-right' : 'text-left'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
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
              <div className="p-2 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 relative rounded-b-2xl">
                {/* Emoji Picker Popup */}
                {showEmojiPicker && (
                  <div className="absolute bottom-full left-4 mb-3 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl z-50 flex flex-wrap gap-1 w-[280px] animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="grid grid-cols-6 gap-1 w-full">
                      {emojis.map((emoji, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleEmojiClick(emoji)}
                          className="flex items-center justify-center p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all hover:scale-110 active:scale-95 text-xl"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-center space-x-3 w-full">
                  <div className="flex-1 flex items-center bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl px-2 focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all min-w-0">
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className={`p-1 rounded-full transition-colors shrink-0 ${showEmojiPicker ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      <Smile size={20} />
                    </button>

                    <input
                      type="text"
                      placeholder={isListening ? 'Listening...' : "Type a message..."}
                      value={newMessage}
                      onChange={(e) => {
                        const val = e.target.value;
                        // Replace asterisks in the input field as well to avoid "any time" visibility
                        setNewMessage(val.replace(/\*/g, (match, offset, string) => {
                          // Check if it's potentially a list marker
                          if (offset === 0 || string[offset - 1] === '\n' || string[offset - 1] === ' ') {
                            return '-';
                          }
                          // Otherwise use a bullet or dash
                          return '-';
                        }));
                      }}
                      className="flex-1 bg-transparent text-gray-900 dark:text-gray-100 py-3 px-2 focus:outline-none text-sm min-w-0"
                    />

                    <button
                      type="button"
                      onClick={toggleVoice}
                      className={`p-1 rounded-full transition-all shrink-0 ${isListening ? 'text-white bg-red-500 shadow-lg animate-pulse' : 'text-gray-400 hover:text-gray-600'}`}
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
                  <span className="tracking-wide" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '13px', color: '#666', marginTop: '2px', display: 'inline-block' }}>
                    Powered by <a href="https://rsiconcepts.com" target="_blank" className="hover:text-indigo-500 transition-colors" style={{ color: botConfig.color_theme || '#4f46e5', fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '14px', marginTop: '2px', letterSpacing: '0px', display: 'inline-block' }}>RSI Concepts</a>
                  </span>
                </div>
              </div>

              {shouldShowLeadForm && (
                <div className="absolute inset-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-6 animate-in fade-in duration-300 rounded-r-2xl">
                  <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg mb-6 shadow-indigo-500/30">
                    <MessageSquare size={32} className="text-white" />
                  </div>
                  <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 mb-2">Welcome! 👋</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-center mb-8 max-w-xs text-sm">Please introduce yourself to start chatting with us.</p>

                  <form onSubmit={handleLeadSubmit} className="w-full max-w-sm space-y-4">
                    <div className="space-y-1">
                      <input
                        type="text"
                        required
                        placeholder="Your Full Name"
                        value={leadForm.name}
                        onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <input
                        type="email"
                        placeholder="Email Address"
                        value={leadForm.email}
                        onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <input
                        type="tel"
                        placeholder="Mobile Number (Optional if Email provided)"
                        value={leadForm.mobile_number}
                        onChange={(e) => setLeadForm({ ...leadForm, mobile_number: e.target.value })}
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm outline-none"
                      />
                    </div>

                    {leadError && (
                      <div className="text-red-500 text-xs text-center font-medium bg-red-50 dark:bg-red-500/10 py-2 rounded-lg border border-red-100 dark:border-red-500/20 flex items-center justify-center space-x-1.5">
                        <AlertCircle size={14} />
                        <span>{leadError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmittingLead || !leadForm.name || (!leadForm.email && !leadForm.mobile_number)}
                      className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-lg shadow-indigo-500/30 flex items-center justify-center font-medium disabled:opacity-50 disabled:shadow-none hover:scale-[1.02] active:scale-[0.98]"
                      style={{ backgroundColor: botConfig.color_theme || '#4f46e5' }}
                    >
                      {isSubmittingLead ? 'Starting Chat...' : 'Start Chat'}
                    </button>
                  </form>
                </div>
              )}

            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="pointer-events-auto rounded-full w-14 h-14 flex items-center justify-center hover:scale-110 transition-all duration-200 text-white overflow-hidden"
          style={{ backgroundColor: botConfig.color_theme || '#4f46e5', margin: 'auto' }}
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