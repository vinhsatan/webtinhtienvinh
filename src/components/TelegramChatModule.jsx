import { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, X, Settings, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { sendMessage, getBotInfo, getUpdates } from '@/utils/telegram';

export default function TelegramChatModule() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [botInfo, setBotInfo] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [lastUpdateId, setLastUpdateId] = useState(0);
  const messagesEndRef = useRef(null);

  // Load messages from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('telegram_messages');
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.warn('localStorage corrupted, clearing and resetting:', e.message);
        localStorage.removeItem('telegram_messages');
      }
    }
  }, []);

  // Save messages to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('telegram_messages', JSON.stringify(messages));
    }
  }, [messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check bot connection on mount
  useEffect(() => {
    checkBotConnection();
  }, []);

  // Poll for new messages (long polling)
  useEffect(() => {
    if (!isConnected) return;

    const pollInterval = setInterval(async () => {
      const updates = await getUpdates(lastUpdateId + 1, 10);
      if (updates.ok && updates.result && updates.result.length > 0) {
        updates.result.forEach((update) => {
          if (update.message) {
            const newMessage = {
              id: Date.now() + Math.random(),
              text: update.message.text,
              from: 'telegram',
              sender: update.message.from.first_name || 'User',
              timestamp: new Date(update.message.date * 1000).toLocaleString('vi-VN'),
            };
            setMessages((prev) => [...prev, newMessage]);
          }
          // Update offset
          if (update.update_id >= lastUpdateId) {
            setLastUpdateId(update.update_id);
          }
        });
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }, [isConnected, lastUpdateId]);

  const checkBotConnection = async () => {
    const info = await getBotInfo();
    if (info.ok) {
      setBotInfo(info.result);
      setIsConnected(true);
      console.log('[Telegram] Kết nối thành công với bot:', info.result.username);
    } else {
      setIsConnected(false);
      console.warn('[Telegram] Không thể kết nối:', info.error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const newMessage = {
      id: Date.now(),
      text: inputMessage,
      from: 'user',
      sender: 'Bạn',
      timestamp: new Date().toLocaleString('vi-VN'),
    };

    setMessages([...messages, newMessage]);
    setInputMessage('');
    setIsSending(true);

    try {
      const result = await sendMessage(inputMessage);
      if (!result.ok) {
        // Show error message
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            text: `❌ Lỗi gửi tin nhắn: ${result.error || 'Unknown error'}`,
            from: 'system',
            sender: 'System',
            timestamp: new Date().toLocaleString('vi-VN'),
          },
        ]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearMessages = () => {
    if (window.confirm('Xóa toàn bộ lịch sử chat?')) {
      setMessages([]);
      localStorage.removeItem('telegram_messages');
    }
  };

  const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
  const CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID;
  const isConfigured = BOT_TOKEN && BOT_TOKEN !== 'YOUR_BOT_TOKEN_HERE';

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-deepSlate-800 to-white dark:from-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-deepSlate-800 to-deepSlate-700 dark:from-gray-800 dark:to-gray-700 border-b border-deepSlate-700 dark:border-deepSlate-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-600 p-2 rounded-lg">
              <MessageCircle size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-deepSlate-50 dark:text-deepSlate-100">
                Telegram Chat
              </h1>
              <div className="flex items-center space-x-2">
                {isConnected ? (
                  <>
                    <CheckCircle size={14} className="text-emerald-500" />
                    <span className="text-xs text-emerald-500 dark:text-emerald-400">
                      Kết nối với {botInfo?.first_name || 'Bot'}
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle size={14} className="text-error-500" />
                    <span className="text-xs text-error-600 dark:text-error-400">
                      Chưa kết nối
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={checkBotConnection}
              className="p-2 text-emerald-500 dark:text-emerald-400 hover:bg-deepSlate-700 dark:hover:bg-emerald-700 rounded-lg"
              title="Kiểm tra kết nối"
            >
              <RefreshCw size={18} />
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-emerald-500 dark:text-emerald-400 hover:bg-deepSlate-700 dark:hover:bg-emerald-700 rounded-lg"
              title="Cài đặt"
            >
              <Settings size={18} />
            </button>
            <button
              onClick={clearMessages}
              className="p-2 text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 rounded-lg"
              title="Xóa lịch sử"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mt-4 p-4 bg-deepSlate-800 dark:bg-deepSlate-800/50 rounded-lg border border-deepSlate-700 dark:border-deepSlate-700">
            <h3 className="font-semibold text-deepSlate-50 dark:text-deepSlate-100 mb-3">
              Cấu hình Telegram Bot
            </h3>
            
            {!isConfigured ? (
              <div className="space-y-3">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                  <p className="text-sm text-yellow-800 dark:text-yellow-400">
                    ⚠️ Bot chưa được cấu hình. Làm theo các bước sau:
                  </p>
                </div>
                
                <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <p className="font-semibold">Bước 1: Tạo Bot Telegram</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Mở Telegram, tìm <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">@BotFather</code></li>
                    <li>Gửi lệnh <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">/newbot</code></li>
                    <li>Làm theo hướng dẫn để đặt tên và username cho bot</li>
                    <li>Lưu lại <strong>Bot Token</strong></li>
                  </ol>

                  <p className="font-semibold mt-3">Bước 2: Lấy Chat ID</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Gửi tin nhắn <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">/start</code> cho bot của bạn</li>
                    <li>Tìm <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">@userinfobot</code> trên Telegram</li>
                    <li>Gửi <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">/start</code>, bot sẽ trả về Chat ID của bạn</li>
                  </ol>

                  <p className="font-semibold mt-3">Bước 3: Cấu hình</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Mở file <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">.env</code></li>
                    <li>Thêm:
                      <pre className="bg-gray-200 dark:bg-gray-600 p-2 rounded mt-1 text-xs overflow-x-auto">
{`VITE_TELEGRAM_BOT_TOKEN=your_bot_token_here
VITE_TELEGRAM_CHAT_ID=your_chat_id_here`}
                      </pre>
                    </li>
                    <li>Khởi động lại ứng dụng</li>
                  </ol>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <p className="text-sm text-green-800 dark:text-green-400">
                    ✅ Bot đã được cấu hình
                  </p>
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  <p><strong>Bot:</strong> @{botInfo?.username || 'Unknown'}</p>
                  <p><strong>Chat ID:</strong> {CHAT_ID}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-gray-400 dark:text-gray-500">
              <MessageCircle size={48} className="mx-auto mb-2 opacity-50" />
              <p>Chưa có tin nhắn</p>
              <p className="text-sm mt-1">Gửi tin nhắn đầu tiên để bắt đầu chat</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  msg.from === 'user'
                    ? 'bg-blue-600 text-white'
                    : msg.from === 'system'
                    ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400 border border-red-300 dark:border-red-800'
                    : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600'
                }`}
              >
                {msg.from !== 'user' && (
                  <p className="text-xs font-semibold mb-1 opacity-70">
                    {msg.sender}
                  </p>
                )}
                <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                <p className={`text-xs mt-1 ${msg.from === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                  {msg.timestamp}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        {!isConfigured ? (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-center">
            <p className="text-sm text-yellow-800 dark:text-yellow-400">
              ⚠️ Vui lòng cấu hình Bot Token trong file .env để sử dụng chat
            </p>
            <button
              onClick={() => setShowSettings(true)}
              className="mt-2 text-xs text-yellow-800 dark:text-yellow-400 underline"
            >
              Xem hướng dẫn
            </button>
          </div>
        ) : (
          <div className="flex space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nhập tin nhắn..."
              disabled={isSending || !isConnected}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              onClick={handleSendMessage}
              disabled={isSending || !inputMessage.trim() || !isConnected}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Send size={18} />
              <span>Gửi</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
