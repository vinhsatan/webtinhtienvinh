import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, Minimize2, Maximize2, Bot, User, Lightbulb, Settings, RotateCcw } from 'lucide-react';

/**
 * 🤖 AI Assistant Module
 * Trợ Lý Ảo Thông Minh với Hỗ Trợ n8n + Local AI Fallback
 * 
 * Features:
 * - Chat history với localStorage
 * - Kết nối n8n webhook cho AI trả lời
 * - Fallback local AI khi webhook không available
 * - Typing indicator
 * - Quick suggestion buttons
 * - Theme-aware UI
 */

export default function AIAssistantModule() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedModel, setSelectedModel] = useState('n8n'); // 'n8n', 'local-simple', 'local-smart'
  const messagesEndRef = useRef(null);

  const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || '';

  // ✨ Ngoại ngữ mẫu trả lời (Local AI Fallback)
  const aiResponses = {
    greeting: [
      '👋 Xin chào! Tôi là trợ lý ảo của bạn. Hôm nay tôi có thể giúp gì cho bạn?',
      'Hellooo! 😊 Hỏi tôi về bất kỳ điều gì - tài chính, bán hàng, quản lý kho...',
    ],
    product: [
      '📦 Về sản phẩm: Bạn có thể xem danh sách sản phẩm trong mục "Kho Hàng". Bấm "Thêm sản phẩm" để thêm mới.',
      'Để quản lý sản phẩm hiệu quả, hãy cập nhật: Tên, Giá vốn, Giá bán, Số lượng.',
    ],
    sales: [
      '💰 Về bán hàng: Mục "Bán Hàng" hiển thị tất cả các đơn hàng. Bạn có thể ghi nhận doanh số tại đây.',
      '📊 Để tính toán chính xác lợi nhuận, hãy nhập Giá vốn và Giá bán cho mỗi sản phẩm.',
    ],
    finance: [
      '💳 Về tài chính: "Tổng quan Quỹ" hiển thị: Tiền mặt, Ngân hàng, Tiền hàng, Lợi nhuận.',
      '📈 "Sổ Thu Chi" ghi lại tất cả giao dịch. Bấm "So khớp" để điều chỉnh số tiền thực tế.',
    ],
    goal: [
      '🎯 Về mục tiêu: Đặt mục tiêu tài chính hàng ngày. Hệ thống sẽ tính: Tỷ lệ hoàn thành, Ngày dự kiến đạt mục tiêu.',
      'Mục tiêu giúp bạn kiểm soát tốc độ kiếm tiền. Hãy đặt mục tiêu phù hợp với khả năng!',
    ],
    help: [
      '❓ Hãy hỏi về: Sản phẩm, Bán hàng, Tài chính, Mục tiêu, Báo cáo, Cấu hình, ...',
      '💡 Gợi ý: Bạn có thể nói "Giúp tôi về..." hoặc hỏi trực tiếp câu hỏi của bạn.',
    ],
  };

  // Load messages from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ai_assistant_messages');
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.warn('localStorage corrupted, clearing and resetting:', e.message);
        localStorage.removeItem('ai_assistant_messages');
        initializeChat();
      }
    } else {
      initializeChat();
    }

    // Load settings
    const savedModel = localStorage.getItem('ai_assistant_model');
    if (savedModel) setSelectedModel(savedModel);
  }, []);

  // Save messages to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('ai_assistant_messages', JSON.stringify(messages));
    }
  }, [messages]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initializeChat = () => {
    setMessages([
      {
        id: Date.now(),
        text: '👋 Xin chào! Tôi là trợ lý ảo của bạn. Hôm nay tôi có thể giúp gì cho bạn?',
        from: 'bot',
        timestamp: new Date().toLocaleString('vi-VN'),
        isWelcome: true,
      },
    ]);
  };

  // 🧠 Local Smart AI (Keyword-based)
  const getLocalSmartResponse = (message) => {
    const msg = message.toLowerCase().trim();

    // Keyword matching
    if (msg.includes('sản phẩm') || msg.includes('hàng hóa') || msg.includes('kho')) {
      return aiResponses.product[Math.floor(Math.random() * aiResponses.product.length)];
    }
    if (msg.includes('bán') || msg.includes('doanh') || msg.includes('đơn hàng')) {
      return aiResponses.sales[Math.floor(Math.random() * aiResponses.sales.length)];
    }
    if (msg.includes('tiền') || msg.includes('tài chính') || msg.includes('quỹ') || msg.includes('ngân hàng')) {
      return aiResponses.finance[Math.floor(Math.random() * aiResponses.finance.length)];
    }
    if (msg.includes('mục tiêu') || msg.includes('dự kiến') || msg.includes('lợi nhuận')) {
      return aiResponses.goal[Math.floor(Math.random() * aiResponses.goal.length)];
    }
    if (msg.includes('giúp') || msg.includes('hỗ trợ') || msg.includes('làm sao')) {
      return aiResponses.help[Math.floor(Math.random() * aiResponses.help.length)];
    }

    // Default
    return `📝 Cảm ơn câu hỏi của bạn! Tôi chưa hiểu rõ. Hãy hỏi về: Sản phẩm, Bán hàng, Tài chính, Mục tiêu, hoặc Cấu hình.`;
  };

  // 🤖 Send to n8n
  const sendToN8N = async (userMessage) => {
    if (!N8N_WEBHOOK_URL) {
      return {
        success: false,
        message: getLocalSmartResponse(userMessage),
        isLocal: true,
      };
    }

    try {
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          timestamp: new Date().toISOString(),
          userId: 'user_' + Date.now(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      let botResponse = '';

      if (typeof data === 'string') {
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
        botResponse = '✅ Đã nhận được câu hỏi của bạn!';
      }

      return {
        success: true,
        message: botResponse,
        isLocal: false,
      };
    } catch (error) {
      console.error('[AI Assistant] Error:', error);
      // Fallback to local
      return {
        success: true,
        message: getLocalSmartResponse(userMessage),
        isLocal: true,
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

    // Get response based on selected model
    let result;
    if (selectedModel === 'n8n') {
      result = await sendToN8N(inputMessage);
    } else {
      result = {
        success: true,
        message: getLocalSmartResponse(inputMessage),
        isLocal: true,
      };
    }

    const botMessage = {
      id: Date.now() + 1,
      text: result.message,
      from: 'bot',
      timestamp: new Date().toLocaleString('vi-VN'),
      isLocal: result.isLocal,
    };

    setMessages((prev) => [...prev, botMessage]);
    setIsSending(false);
  };

  const handleQuickSuggestion = (suggestion) => {
    setInputMessage(suggestion);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    if (window.confirm('Xóa toàn bộ lịch sử chat?')) {
      initializeChat();
      localStorage.removeItem('ai_assistant_messages');
    }
  };

  const saveModel = (model) => {
    setSelectedModel(model);
    localStorage.setItem('ai_assistant_model', model);
    setShowSettings(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-gradient-to-br from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-110 group"
        title="Mở trợ lý ảo"
      >
        <Bot size={24} />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></span>
        <span className="absolute -bottom-8 right-0 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          Trợ Lý Ảo
        </span>
      </button>
    );
  }

  return (
    <div
      className={`fixed z-40 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col transition-all overflow-hidden ${
        isMinimized
          ? 'bottom-6 right-6 w-80 h-14'
          : 'bottom-6 right-6 w-96 h-[650px]'
      }`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-purple-700 text-white p-4 rounded-t-xl flex items-center justify-between cursor-pointer">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Bot size={20} />
          </div>
          <div>
            <h3 className="font-semibold flex items-center gap-1">
              Trợ Lý Ảo
              {selectedModel === 'n8n' && <span className="text-xs bg-white/20 px-2 py-0.5 rounded">n8n</span>}
            </h3>
            <p className="text-xs text-violet-100">
              {selectedModel === 'n8n' ? '🌐 Kết nối n8n AI' : '⚡ Local Smart'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            title="Cấu hình"
          >
            <Settings size={18} />
          </button>
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
          {/* Settings Panel */}
          {showSettings && (
            <div className="p-4 bg-violet-50 dark:bg-violet-900/20 border-b border-violet-200 dark:border-violet-800">
              <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">Chế Độ AI</h4>
              <div className="space-y-2">
                <label className="flex items-center gap-2 p-2 rounded hover:bg-white dark:hover:bg-gray-700/50 cursor-pointer">
                  <input
                    type="radio"
                    checked={selectedModel === 'n8n'}
                    onChange={() => saveModel('n8n')}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    🌐 n8n AI (Cần webhook)
                  </span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded hover:bg-white dark:hover:bg-gray-700/50 cursor-pointer">
                  <input
                    type="radio"
                    checked={selectedModel === 'local-smart'}
                    onChange={() => saveModel('local-smart')}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    ⚡ Smart Local (Không cần webhook)
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-2.5 ${
                    msg.from === 'user'
                      ? 'bg-violet-600 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600'
                  }`}
                >
                  {msg.from === 'bot' && (
                    <div className="flex items-center space-x-1.5 mb-1">
                      <Bot size={14} className="opacity-70" />
                      <span className="text-xs font-semibold opacity-70">
                        {msg.isLocal ? '⚡ Smart' : '🌐 n8n'}
                      </span>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                  <p
                    className={`text-xs mt-1.5 ${
                      msg.from === 'user'
                        ? 'text-violet-100'
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

          {/* Quick suggestions */}
          {messages.length <= 1 && (
            <div className="px-4 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-semibold">💡 Gợi ý:</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  'Giúp về sản phẩm',
                  'Hỏi về tài chính',
                  'Mục tiêu bán hàng',
                  'Cách quản lý kho',
                ].map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickSuggestion(suggestion)}
                    className="text-xs px-2 py-1.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors text-left"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 rounded-b-xl">
            <div className="flex items-center space-x-2 mb-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Hỏi tôi bất cứ điều gì..."
                disabled={isSending}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent disabled:opacity-50"
              />
              <button
                onClick={handleSendMessage}
                disabled={isSending || !inputMessage.trim()}
                className="px-3 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Gửi"
              >
                <Send size={18} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 dark:text-gray-400">Nhấn Enter để gửi</p>
              <button
                onClick={clearChat}
                className="text-xs text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
              >
                <RotateCcw size={12} />
                Làm mới
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
