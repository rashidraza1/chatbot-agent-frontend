'use client';
import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import { io } from 'socket.io-client';
import { Bot, Send, X, AlertCircle, Smile, Mic, MicOff, Maximize2, Minimize2, Minus } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function WidgetPage() {
  const params = useParams();
  const bot_id = params?.bot_id;
  const searchParams = useSearchParams();
  const currentUrl = searchParams.get('url') || '';
  
  const [botConfig, setBotConfig] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const emojis = ['😊', '😂', '😍', '👍', '🙏', '🔥', '👋', '🤔', '🙌', '🎉', '💡', '✨'];

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
    fetchConfig();
  }, [bot_id]);

  useEffect(() => {
    // Notify parent window to resize iframe
    if (isOpen) {
      window.parent.postMessage(isMaximized ? 'chatdesk-maximize' : 'chatdesk-expand', '*');
    } else {
      window.parent.postMessage('chatdesk-minimize', '*');
    }
  }, [isOpen, isMaximized]);

  useEffect(() => {
    if (!isOpen) return;
    
    const newSocket = io(API_BASE);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      const savedConvId = localStorage.getItem(`chatdesk_conv_${bot_id}`);
      newSocket.emit('join_conversation', {
         conversationId: savedConvId,
         botId: bot_id,
         visitorData: { url: currentUrl }
      });
    });

    newSocket.on('conversation_joined', (data) => {
       setConversation(data.conversation);
       localStorage.setItem(`chatdesk_conv_${bot_id}`, data.conversation.id);
    });

    newSocket.on('new_message', (msg) => {
       setMessages(prev => [...prev, msg]);
    });

    newSocket.on('bot_typing', (typing) => {
       setIsTyping(typing);
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
    });

    return () => {
      newSocket.close();
      setSocket(null);
    };
  }, [isOpen, bot_id, currentUrl]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversation || !socket) return;
    
    socket.emit('send_message', {
       conversationId: conversation.id,
       content: newMessage,
       senderType: 'visitor',
     });
    setNewMessage('');
    setShowEmojiPicker(false);
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
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setNewMessage(prev => prev + finalTranscript);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleCancel = () => {
    window.parent.postMessage('chatdesk-cancel', '*');
  };

  if (!botConfig) return null;

  return (
    <div className="fixed inset-0 pointer-events-none flex flex-col justify-end items-end pb-5 pr-5 font-sans">
       {isOpen ? (
          <div className={`pointer-events-auto bg-white dark:bg-gray-900 w-full h-full rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800 transition-all duration-300 transform scale-100 origin-bottom-right ${isMaximized ? 'max-w-none max-h-none' : 'max-h-[600px] max-w-[380px]'}`}>
            {/* Header */}
            <div 
              className="p-4 flex items-center justify-between shadow-sm text-white relative h-16"
              style={{ backgroundColor: botConfig.color_theme || '#4f46e5' }}
            >
              <div className="flex items-center space-x-3">
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
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  aria-label="Minimize"
                  title="Minimize"
                >
                  <Minus size={18} />
                </button>
                <button 
                  onClick={() => setIsMaximized(!isMaximized)}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  aria-label={isMaximized ? "Restore" : "Maximize"}
                  title={isMaximized ? "Restore" : "Maximize"}
                >
                  {isMaximized ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors ml-1"
                  aria-label="Close chat"
                  title="Close"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-[#f8f9fc] dark:bg-gray-900 space-y-4">
              {messages.map((msg, idx) => {
                 const isVisitor = msg.sender_type === 'visitor';
                 return (
                   <div key={idx} className={`flex ${isVisitor ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                     <div className={`max-w-[85%] rounded-[20px] px-4 py-3 shadow-sm text-sm ${
                        isVisitor 
                          ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-tr-none shadow-indigo-200 dark:shadow-none' 
                          : 'bg-white text-gray-800 dark:bg-gray-800 dark:text-gray-100 rounded-tl-none border border-gray-100 dark:border-gray-700 shadow-sm'
                     }`}>
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
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
            <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-50 dark:border-gray-800 relative">
               {/* Emoji Picker Popover */}
               {showEmojiPicker && (
                 <div className="absolute bottom-full left-3 right-3 mb-2 p-3 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border border-gray-100 dark:border-gray-700 rounded-2xl shadow-xl z-10 animate-in slide-in-from-bottom-4 fade-in duration-300">
                   <div className="grid grid-cols-6 gap-1">
                     {emojis.map(emoji => (
                       <button
                         key={emoji}
                         type="button"
                         onClick={() => {
                           setNewMessage(prev => prev + emoji);
                           setShowEmojiPicker(false);
                         }}
                         className="text-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/30 p-2 rounded-xl transition-all hover:scale-110 active:scale-95"
                       >
                         {emoji}
                       </button>
                     ))}
                   </div>
                 </div>
               )}

               <form onSubmit={handleSendMessage} className="flex items-center space-x-2 w-full">
                 <div className="flex-1 flex items-center bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl px-1 focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all min-w-0">
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className={`p-2 rounded-full transition-colors shrink-0 ${showEmojiPicker ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'text-gray-400 hover:text-gray-600'}`}
                      aria-label="Add emoji"
                    >
                      <Smile size={18} />
                    </button>
                    
                    <input
                      type="text"
                      placeholder={isListening ? 'Listening...' : "Type a message..."}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1 bg-transparent text-gray-900 dark:text-gray-100 py-2.5 px-2 focus:outline-none text-sm min-w-0"
                    />

                    <button
                      type="button"
                      onClick={toggleVoice}
                      className={`p-2 rounded-full transition-all shrink-0 ${
                        isListening 
                          ? 'text-white bg-red-500 shadow-lg shadow-red-500/30 animate-pulse' 
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                      aria-label="Voice input"
                    >
                      {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                    </button>
                 </div>

                 <button
                   type="submit"
                   disabled={!newMessage.trim()}
                   className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl transition-all shadow-lg shadow-indigo-500/30 active:scale-95 disabled:opacity-50 disabled:shadow-none flex items-center justify-center shrink-0 w-[46px] h-[46px]"
                 >
                   <Send size={18} className={newMessage.trim() ? "animate-in zoom-in-50" : ""} />
                 </button>
               </form>
               <div className="flex items-center justify-center mt-2 px-1">
                 <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium tracking-wide uppercase">Powered by <span className="text-indigo-500 dark:text-indigo-400">RSIConcept</span></span>
               </div>
            </div>
          </div>
       ) : (
          <button 
              onClick={() => setIsOpen(true)}
              className="pointer-events-auto rounded-full w-14 h-14 shadow-2xl flex items-center justify-center hover:scale-110 transition-all duration-200 text-white relative z-0 overflow-hidden"
              style={{ backgroundColor: botConfig.color_theme || '#4f46e5' }}
              aria-label="Open chat"
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
