'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User, Minimize2, Maximize2 } from 'lucide-react';
import { useLanguage } from '@/hooks/useTranslations';
import { ChatConfig } from '@/lib/config/chat-config';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  isTyping?: boolean;
}

// interface QuickReply {
//   id: string;
//   text: string;
//   action?: () => void;
// }

interface ChatWindowProps {
  isOpen?: boolean;
  onToggle?: () => void;
  className?: string;
  config?: Partial<ChatConfig>;
}

export function ChatWindow({ isOpen = false, onToggle, className = '' }: ChatWindowProps) {
  const { language } = useLanguage();
  const [isChatOpen, setIsChatOpen] = useState(isOpen);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isChatOpen && !isMinimized && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isChatOpen, isMinimized]);

  // Initialize with welcome message
  useEffect(() => {
    if (isChatOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        content: language === 'es'
          ? '🌟 ¡Hola! Soy tu asistente personal de SoulPath Wellness\n\nEstoy aquí para ayudarte a explorar el fascinante mundo de la astrología con Jose Garfias. ¿Qué te gustaría hacer hoy?\n\n✨ **Descubre tu camino espiritual**\n🔮 **Lecturas personalizadas**\n📚 **Información sobre paquetes**\n💫 **Preguntas sobre astrología**'
          : '🌟 Hello! I\'m your SoulPath Wellness assistant\n\nI\'m here to help you explore the fascinating world of astrology with Jose Garfias. What would you like to do today?\n\n✨ **Discover your spiritual path**\n🔮 **Personalized readings**\n📚 **Package information**\n💫 **Questions about astrology**',
        sender: 'assistant',
        timestamp: new Date(),
        // Buttons removed for natural conversation
      };
      setMessages([welcomeMessage]);
    }
  }, [isChatOpen, messages.length, language]);

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
    if (onToggle) onToggle();
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const generateUniqueId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const messageId = generateUniqueId();
    const userMessage: Message = {
      id: `user_${messageId}`,
      content: inputValue.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      console.log('🤖 ChatWindow: Sending message...', { message: userMessage.content, messageId });

      const response = await fetch('/api/chat/hybrid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          userId: `web_user_${messageId}`,
          conversationHistory: messages.map(msg => ({ role: msg.sender, content: msg.content }))
        }),
      });

      console.log('🤖 ChatWindow: Response status:', response.status);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('🤖 ChatWindow: Response data:', data);

      if (data.success && data.response) {
        const assistantMessageId = generateUniqueId();
        const assistantMessage: Message = {
          id: `assistant_${assistantMessageId}`,
          content: data.response,
          sender: 'assistant',
          timestamp: new Date(),
          // Buttons removed for natural conversation
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || 'No response received');
      }
    } catch (error) {
      console.error('❌ ChatWindow: Error:', error);

      // Ultimate fallback - provide helpful static response
      const fallbackMessageId = generateUniqueId();
      const fallbackMessage: Message = {
        id: `fallback_${fallbackMessageId}`,
        content: language === 'es'
          ? '¡Hola! Soy tu asistente de astrología de SoulPath. ¿En qué puedo ayudarte hoy?\n\nPuedes preguntarme sobre:\n• 📅 Agendar una lectura\n• 📦 Información de paquetes\n• 💳 Precios y pagos\n• 📊 Estado de citas\n• ❓ Preguntas generales sobre astrología'
          : 'Hello! I\'m your SoulPath astrology assistant. How can I help you today?\n\nYou can ask me about:\n• 📅 Schedule a reading\n• 📦 Package information\n• 💳 Pricing and payments\n• 📊 Appointment status\n• ❓ General questions about astrology',
        sender: 'assistant',
        timestamp: new Date(),
        // Buttons removed for natural conversation
      };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Button handling completely removed - now using natural conversation flow

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(language === 'es' ? 'es-ES' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <motion.button
        onClick={toggleChat}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 chat-toggle-button cosmic-glow touch-manipulation"
        aria-label={language === 'es' ? 'Abrir chat' : 'Open chat'}
      >
        <MessageCircle size={24} />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={`fixed bottom-24 right-6 w-96 max-w-[calc(100vw-2rem)] rounded-xl shadow-2xl z-[9998] flex flex-col chat-window chat-window-enter ${className}`}
            style={{ height: isMinimized ? '60px' : '500px' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 rounded-t-xl chat-window-header">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-[#FFD700] rounded-full flex items-center justify-center">
                  <Bot size={16} className="text-[#0A0A23]" />
                </div>
                <div>
                  <h3 className="text-[#FFD700] font-medium text-sm">
                    {language === 'es' ? 'Asistente Astrológico' : 'Astrology Assistant'}
                  </h3>
                  <p className="text-[#C0C0C0] text-xs">
                    {isTyping
                      ? (language === 'es' ? 'Escribiendo...' : 'Typing...')
                      : (language === 'es' ? 'En línea' : 'Online')
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={toggleMinimize}
                  className="w-6 h-6 text-[#C0C0C0] hover:text-[#FFD700] transition-colors duration-200 flex items-center justify-center rounded hover:bg-[#FFD700]/10"
                  aria-label={isMinimized ? (language === 'es' ? 'Maximizar' : 'Maximize') : (language === 'es' ? 'Minimizar' : 'Minimize')}
                >
                  {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
                </button>
                <button
                  onClick={toggleChat}
                  className="w-6 h-6 text-[#C0C0C0] hover:text-[#FFD700] transition-colors duration-200 flex items-center justify-center rounded hover:bg-[#FFD700]/10"
                  aria-label={language === 'es' ? 'Cerrar chat' : 'Close chat'}
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <AnimatePresence>
              {!isMinimized && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex-1 overflow-hidden"
                >
                  <div className="h-full flex flex-col">
                    {/* Messages Container */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-80 chat-scrollbar">
                      {messages.map((message) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`flex space-x-2 max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                            {/* Avatar */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                              message.sender === 'user'
                                ? 'bg-[#FFD700] text-[#0A0A23]'
                                : 'bg-[#191970] text-[#FFD700]'
                            }`}>
                              {message.sender === 'user' ? <User size={14} /> : <Bot size={14} />}
                            </div>

                            {/* Message Bubble */}
                            <div className={`rounded-lg px-3 py-2 text-sm chat-message-enter ${
                              message.sender === 'user'
                                ? 'chat-message-user'
                                : 'chat-message-assistant'
                            }`}>
                              <div className="whitespace-pre-wrap">{message.content}</div>
                              
                              {/* Buttons removed - natural conversation flow */}
                              
                              <div className={`text-xs mt-1 ${
                                message.sender === 'user' ? 'text-[#0A0A23]/70' : 'text-[#C0C0C0]'
                              }`}>
                                {formatTime(message.timestamp)}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}

                      {/* Typing Indicator */}
                      {isTyping && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex justify-start"
                        >
                          <div className="flex space-x-2 max-w-[80%]">
                            <div className="w-8 h-8 bg-[#191970] rounded-full flex items-center justify-center">
                              <Bot size={14} className="text-[#FFD700]" />
                            </div>
                            <div className="chat-typing-indicator rounded-lg px-3 py-2 text-sm text-[#EAEAEA]">
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 chat-typing-dot rounded-full"></div>
                                <div className="w-2 h-2 chat-typing-dot rounded-full"></div>
                                <div className="w-2 h-2 chat-typing-dot rounded-full"></div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t border-[#FFD700]/20 bg-[#0A0A23]/80">
                      <div className="flex space-x-2">
                        <input
                          ref={inputRef}
                          type="text"
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder={language === 'es' ? 'Escribe tu mensaje...' : 'Type your message...'}
                          className="flex-1 chat-input rounded-lg px-3 py-2 text-[#EAEAEA] placeholder-[#C0C0C0] text-sm"
                          disabled={isTyping}
                        />
                        <motion.button
                          onClick={handleSendMessage}
                          disabled={!inputValue.trim() || isTyping}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`w-10 h-10 rounded-lg flex items-center justify-center chat-button-send touch-manipulation ${
                            inputValue.trim() && !isTyping ? '' : 'opacity-50 cursor-not-allowed'
                          }`}
                          aria-label={language === 'es' ? 'Enviar mensaje' : 'Send message'}
                        >
                          <Send size={16} />
                        </motion.button>
                      </div>
                      <div className="text-xs text-[#C0C0C0] mt-2 text-center">
                        {language === 'es'
                          ? 'Presiona Enter para enviar • Shift+Enter para nueva línea'
                          : 'Press Enter to send • Shift+Enter for new line'
                        }
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
