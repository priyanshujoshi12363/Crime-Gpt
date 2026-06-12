import { useState, useEffect, useRef } from 'react';
import { Bot, Send, User, ArrowLeft, Search, FileText, Scale, BookOpen, Loader2 } from 'lucide-react';

export default function AIChat({ onBack }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [thinking, setThinking] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText, thinking]);

  const typeResponse = (fullText) => {
    let index = 0;
    setStreamingText('');
    setThinking(false);
    
    const interval = setInterval(() => {
      if (index < fullText.length) {
        setStreamingText(fullText.substring(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
        setMessages(prev => [...prev, { role: 'ai', text: fullText }]);
        setStreamingText('');
        setLoading(false);
      }
    }, 15);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);
    setThinking(true);
    setStreamingText('');

    try {
      const response = await window.crimeGPT.aiChat(userMsg);
      // Small artificial delay to show "thinking" state (optional)
      setTimeout(() => typeResponse(response), 600);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: 'Sorry, I encountered an error.' }]);
      setThinking(false);
      setLoading(false);
    }
  };

  const suggestions = [
    { text: 'What sections apply for theft?', icon: <Search size={14} /> },
    { text: 'Draft an FIR for cyber fraud', icon: <FileText size={14} /> },
    { text: 'Explain BNS Section 302', icon: <Scale size={14} /> },
    { text: 'Landmark judgments on robbery', icon: <BookOpen size={14} /> }
  ];

  return (
    <main className="flex-1 flex flex-col" style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #FFF8F0 50%, #F0FFF4 100%)' }}>
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 px-8 py-4 flex items-center gap-4 sticky top-0 z-10">
        <button onClick={onBack} className="p-2 hover:bg-gray-50 rounded-xl transition text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 via-orange-500 to-green-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">AI Legal Assistant</h2>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              <p className="text-xs text-green-600">Qwen 2.5 — Responding in real-time</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 && !streamingText && !thinking && (
            <div className="text-center py-20 animate-fade-in">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-100 via-white to-green-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-100">
                <Bot size={36} className="text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700">CrimeGPT AI Assistant</h3>
              <p className="text-sm text-gray-400 mt-2">Powered by Qwen 2.5 — Offline — Instant responses</p>
              <div className="flex flex-wrap justify-center gap-2 mt-8">
                {suggestions.map((s) => (
                  <button
                    key={s.text}
                    onClick={() => { setInput(s.text); setTimeout(() => sendMessage(), 100); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-100 rounded-xl text-xs text-gray-600 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600 transition-all shadow-sm hover:shadow-md active:scale-95"
                  >
                    <span className="text-orange-400">{s.icon}</span>
                    {s.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-message-in`}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className={`flex items-start gap-3 max-w-[75%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg ${
                  msg.role === 'user' ? 'bg-gradient-to-br from-orange-400 to-orange-500' : 'bg-gradient-to-br from-orange-400 to-green-500'
                }`}>
                  {msg.role === 'user' ? <User size={14} className="text-white" /> : <Bot size={14} className="text-white" />}
                </div>
                <div className={`px-5 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-tr-md' 
                    : 'bg-white border border-gray-100 text-gray-700 rounded-tl-md'
                }`}>
                  {msg.text}
                </div>
              </div>
            </div>
          ))}

          {thinking && (
            <div className="flex justify-start animate-fade-in">
              <div className="flex items-start gap-3 max-w-[75%]">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-green-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Bot size={14} className="text-white" />
                </div>
                <div className="px-5 py-3 rounded-2xl rounded-tl-md bg-white border border-orange-100 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <Loader2 size={14} className="text-orange-400 animate-spin" />
                    <span className="text-sm text-gray-500">AI is thinking</span>
                    <span className="flex gap-0.5 ml-1">
                      <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {streamingText && (
            <div className="flex justify-start animate-fade-in">
              <div className="flex items-start gap-3 max-w-[75%]">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-green-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Bot size={14} className="text-white" />
                </div>
                <div className="px-5 py-3 rounded-2xl rounded-tl-md text-sm leading-relaxed bg-white border border-orange-100 text-gray-700 shadow-sm">
                  {streamingText}
                  <span className="inline-block w-1.5 h-4 bg-orange-400 ml-0.5 animate-pulse rounded-sm" />
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      </div>

      <div className="border-t border-gray-100 p-4 bg-white/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask about BNS sections, legal procedures, or case analysis..."
            className="flex-1 bg-white border border-gray-200 rounded-2xl px-5 py-3.5 text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-300 transition-all shadow-sm"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="bg-gradient-to-r from-orange-400 via-orange-500 to-green-500 text-white px-6 rounded-2xl hover:from-orange-500 hover:via-orange-600 hover:to-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium text-sm shadow-lg shadow-orange-200 hover:shadow-orange-300 active:scale-95"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
      </div>

      {/* Add custom animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes messageIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-message-in {
          animation: messageIn 0.2s ease-out;
        }
      `}</style>
    </main>
  );
}