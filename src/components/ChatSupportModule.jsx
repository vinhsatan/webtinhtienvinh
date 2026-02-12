import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, Minimize2, Maximize2, Bot, User } from 'lucide-react';

export default function ChatSupportModule() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);

  // n8n webhook URL - Cấu hình trong .env hoặc hardcode cho dev
  const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || 'https://n8n.n8nvinhsatan.site/webhook-test/chat-support';
  
  // Debug: Log webhook URL
  useEffect(() => {
    console.log('N8N_WEBHOOK_URL loaded:', N8N_WEBHOOK_URL);
    if (!N8N_WEBHOOK_URL) {
      console.warn('⚠️ N8N_WEBHOOK_URL not configured - using Mock Mode');
    } else {
      console.log('✅ N8N_WEBHOOK_URL configured - will use real webhook');
    }
  }, []);

  // Load messages from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('chat_support_messages');
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.warn('localStorage corrupted, clearing and resetting:', e.message);
        localStorage.removeItem('chat_support_messages');
        // Reset to welcome message
        setMessages([
          {
            id: Date.now(),
            text: 'Xin chào! Tôi là trợ lý ảo. Bạn cần hỗ trợ gì?',
            from: 'bot',
            timestamp: new Date().toLocaleString('vi-VN'),
          },
        ]);
      }
    } else {
      // Welcome message
      setMessages([
        {
          id: Date.now(),
          text: 'Xin chào! Tôi là trợ lý ảo. Bạn cần hỗ trợ gì?',
          from: 'bot',
          timestamp: new Date().toLocaleString('vi-VN'),
        },
      ]);
    }
  }, []);

  // Save messages to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chat_support_messages', JSON.stringify(messages));
    }
  }, [messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendToN8N = async (userMessage) => {
    // DEBUG: Log webhook URL state
    console.log('[DEBUG] N8N_WEBHOOK_URL:', N8N_WEBHOOK_URL);
    console.log('[DEBUG] Has webhook config:', !!N8N_WEBHOOK_URL && N8N_WEBHOOK_URL.length > 0);

    // Nếu webhook chưa cấu hình, yêu cầu cấu hình
    if (!N8N_WEBHOOK_URL || N8N_WEBHOOK_URL.trim() === '') {
      console.error('[N8N] ❌ Webhook not configured! Please set VITE_N8N_WEBHOOK_URL in .env');
      return {
        success: false,
        message: '⚠️ Trợ lý ảo chưa được cấu hình. Vui lòng liên hệ quản trị viên.',
        source: 'error',
        error: 'N8N_WEBHOOK_URL not configured',
      };
    }

    try {
      console.log('[N8N] Calling webhook:', N8N_WEBHOOK_URL);
      
      // Create timeout handler
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.warn('[N8N] Request timeout (5s)');
        controller.abort();
      }, 5000);

      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          timestamp: new Date().toISOString(),
          userId: 'user_' + Date.now(),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('[N8N] Response status:', response.status);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('[N8N] ✅ Success - Response data:', data);
      
      let botResponse = '';
      
      // N8N workflow trả về { success: true, answer: "..." }
      if (data.answer) {
        botResponse = data.answer;
      } else if (typeof data === 'string') {
        botResponse = data;
      } else if (data.response) {
        botResponse = data.response;
      } else if (data.message) {
        botResponse = data.message;
      } else if (data.reply) {
        botResponse = data.reply;
      } else if (data.text) {
        botResponse = data.text;
      } else {
        // Fallback nếu response không có field answer
        console.warn('[N8N] Response không có field answer, dùng JSON:', JSON.stringify(data));
        botResponse = JSON.stringify(data);
      }

      return {
        success: data.success !== false,
        message: botResponse,
        source: 'n8n',
      };
    } catch (error) {
      console.error('[N8N] ❌ Webhook error:', error.message);
      
      // Fallback sang Mock Mode khi N8N không khả dụng
      console.log('[N8N] Falling back to Mock Mode...');
      const mockResponses = [
        '🤖 Tôi là trợ lý ảo trong chế độ Mock. Để kích hoạt N8N thực sự, vui lòng cấu hình webhook N8N.',
        'Xin lỗi, hiện tại tôi đang chạy ở chế độ demo. Bạn có thể liên hệ với quản trị viên để kích hoạt hỗ trợ trực tuyến.',
        '📝 Câu hỏi của bạn: "' + userMessage + '"\n\nTrợ lý ảo Mock Mode đã ghi nhận. Vui lòng chờ phản hồi từ quản trị viên.',
      ];
      
      return {
        success: true,
        message: mockResponses[Math.floor(Math.random() * mockResponses.length)],
        source: 'mock',
      };
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      from: 'user',
      timestamp: new Date().toLocaleString('vi-VN'),
    };

    setMessages([...messages, userMessage]);
    setInputMessage('');
    setIsSending(true);

    // Gửi đến n8n và nhận phản hồi
    const result = await sendToN8N(inputMessage);

    // Thêm phản hồi từ bot
    const botMessage = {
      id: Date.now() + 1,
      text: result.message,
      from: 'bot',
      timestamp: new Date().toLocaleString('vi-VN'),
      error: !result.success,
      source: result.source, // Thêm source vào message
    };

    setMessages((prev) => [...prev, botMessage]);
    setIsSending(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    if (window.confirm('Xóa toàn bộ lịch sử chat?')) {
      setMessages([
        {
          id: Date.now(),
          text: 'Xin chào! Tôi là trợ lý ảo. Bạn cần hỗ trợ gì?',
          from: 'bot',
          timestamp: new Date().toLocaleString('vi-VN'),
        },
      ]);
      localStorage.removeItem('chat_support_messages');
    }
  };

  const isConfigured = N8N_WEBHOOK_URL && N8N_WEBHOOK_URL !== '';

  if (!isOpen) {
    // Chat bubble button
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
        title="Chat hỗ trợ"
      >
        <MessageCircle size={24} />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
      </button>
    );
  }

  return (
    <div
      className={`fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col transition-all ${
        isMinimized
          ? 'bottom-6 right-6 w-80 h-14'
          : 'bottom-6 right-6 w-96 h-[600px]'
      }`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-4 rounded-t-lg flex items-center justify-between cursor-pointer">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Bot size={20} />
          </div>
          <div>
            <h3 className="font-semibold">Trợ Lý Ảo</h3>
            <p className="text-xs text-blue-100">
              {isConfigured ? '✨ Powered by N8N + Google Sheets' : '🔄 Mock Mode'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            title={isMinimized ? 'Mở rộng' : 'Thu gọn'}
          >
            {isMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            title="Đóng"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900/50">
            {!isConfigured && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm">
                <p className="text-blue-800 dark:text-blue-400 font-semibold mb-2">
                  ℹ️ Chế độ Mock - N8N chưa kết nối
                </p>
                <p className="text-blue-700 dark:text-blue-500 text-xs space-y-1">
                  <span className="block">Trợ lý đang sử dụng câu trả lời mặc định (Mock Mode).</span>
                  <span className="block">Để kích hoạt N8N + Google Sheets:</span>
                  <span className="block">1. Tạo workflow N8N với webhook tại: <code className="bg-blue-100 dark:bg-blue-900/40 px-2 py-1 rounded">https://n8n.n8nvinhsatan.site/webhook/chat-support</code></span>
                  <span className="block">2. Workflow phải trả về: <code className="bg-blue-100 dark:bg-blue-900/40 px-2 py-1 rounded">{'{success: true, answer: "..."}'}</code></span>
                  <span className="block">3. VITE_N8N_WEBHOOK_URL đã được cấu hình ✓</span>
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2.5 ${
                    msg.from === 'user'
                      ? 'bg-blue-600 text-white'
                      : msg.error
                      ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400 border border-red-300 dark:border-red-800'
                      : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600'
                  }`}
                >
                  {msg.from === 'bot' && (
                    <div className="flex items-center space-x-2 mb-1">
                      <Bot size={14} className="opacity-70" />
                      <span className="text-xs font-semibold opacity-70">Bot</span>
                      {msg.source && (
                        <span className={`text-xs px-2 py-0.5 rounded font-mono ${
                          msg.source === 'n8n' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                          msg.source === 'mock' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                          'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}>
                          {msg.source === 'n8n' ? '✨ N8N' : msg.source === 'mock' ? '🔄 Mock' : 'FB'}
                        </span>
                      )}
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                  <p
                    className={`text-xs mt-1.5 ${
                      msg.from === 'user'
                        ? 'text-blue-100'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {msg.timestamp}
                  </p>
                </div>
              </div>
            ))}

            {isSending && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2.5">
                  <div className="flex items-center space-x-2">
                    <Bot size={14} className="opacity-70" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 rounded-b-lg">
            <div className="flex items-center space-x-2 mb-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Nhập câu hỏi của bạn..."
                disabled={isSending}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              />
              <button
                onClick={handleSendMessage}
                disabled={isSending || !inputMessage.trim()}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Gửi"
              >
                <Send size={18} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Nhấn Enter để gửi
              </p>
              <button
                onClick={clearChat}
                className="text-xs text-red-600 dark:text-red-400 hover:underline"
              >
                Xóa lịch sử
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
