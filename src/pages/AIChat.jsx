import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bot, Send, User, ArrowLeft, Search, Scale,
  Loader2, Sparkles, Copy, Check, RefreshCw,
  ShieldAlert, BookOpen, Gavel, FileSearch,
  ChevronDown, Mic, MicOff
} from 'lucide-react';

// ─────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────
const LANGUAGES = [
  { code: 'en', label: 'English',    flag: '🇬🇧' },
  { code: 'hi', label: 'हिन्दी',      flag: '🇮🇳' },
  { code: 'gu', label: 'ગુજરાતી',    flag: '🇮🇳' },
];

const UI_TEXT = {
  en: {
    title: 'CrimeGPT',
    subtitle: 'Legal AI Assistant',
    status: 'RAG Active • Offline',
    placeholder: 'Ask about BNS sections, procedures, FIR filing...',
    thinking: 'Searching legal database...',
    emptyTitle: 'How can I help, Officer?',
    emptySubtitle: 'Ask about BNS, BNSS, BSA 2023 sections, procedures, or case analysis.',
    ragBadge: 'RAG • BNS + BNSS + BSA',
    copy: 'Copy',
    copied: 'Copied',
    retry: 'Retry',
    error: 'Unable to process your request. Check that Ollama is running and try again.',
    suggestions: [
      { text: 'What sections apply for theft at night?',        icon: 'search' },
      { text: 'Arrest procedure without warrant under BNSS',    icon: 'gavel'  },
      { text: 'Bail conditions for non-bailable offence',       icon: 'shield' },
      { text: 'Evidence required for murder FIR under BNS',     icon: 'file'   },
    ],
  },
  hi: {
    title: 'CrimeGPT',
    subtitle: 'कानूनी AI सहायक',
    status: 'RAG सक्रिय • ऑफलाइन',
    placeholder: 'BNS धाराओं, प्रक्रियाओं या FIR के बारे में पूछें...',
    thinking: 'कानूनी डेटाबेस खोज रहा है...',
    emptyTitle: 'नमस्ते अधिकारी, मैं कैसे मदद करूं?',
    emptySubtitle: 'BNS, BNSS, BSA 2023 धाराओं, प्रक्रियाओं या केस विश्लेषण के बारे में पूछें।',
    ragBadge: 'RAG • BNS + BNSS + BSA',
    copy: 'कॉपी',
    copied: 'हो गया',
    retry: 'पुनः प्रयास',
    error: 'अनुरोध संसाधित नहीं हो सका। Ollama चल रहा है या नहीं जांचें।',
    suggestions: [
      { text: 'रात को चोरी के लिए कौन सी धाराएं लागू होती हैं?', icon: 'search' },
      { text: 'बिना वारंट गिरफ्तारी की BNSS प्रक्रिया',           icon: 'gavel'  },
      { text: 'गैर-जमानती अपराध में जमानत की शर्तें',             icon: 'shield' },
      { text: 'हत्या FIR के लिए BNS के तहत साक्ष्य',             icon: 'file'   },
    ],
  },
  gu: {
    title: 'CrimeGPT',
    subtitle: 'કાનૂની AI સહાયક',
    status: 'RAG સક્રિય • ઑફલાઇન',
    placeholder: 'BNS કલમો, પ્રક્રિયાઓ અથવા FIR વિશે પૂછો...',
    thinking: 'કાનૂની ડેટાબેઝ શોધી રહ્યું છે...',
    emptyTitle: 'નમસ્તે અધિકારી, હું કેવી રીતે મદદ કરી શકું?',
    emptySubtitle: 'BNS, BNSS, BSA 2023 કલમો, પ્રક્રિયાઓ અથવા કેસ વિશ્લેષણ વિશે પૂછો.',
    ragBadge: 'RAG • BNS + BNSS + BSA',
    copy: 'કૉપિ',
    copied: 'થઈ ગયું',
    retry: 'ફરી પ્રયાસ',
    error: 'વિનંતી પ્રક્રિયા ન થઈ. Ollama ચાલી રહ્યું છે કે નહીં તે તપાસો.',
    suggestions: [
      { text: 'રાત્રે ચોરી માટે કઈ કલમો લાગુ પડે?',        icon: 'search' },
      { text: 'BNSS હેઠળ વોરંટ વગર ધરપકડ પ્રક્રિયા',       icon: 'gavel'  },
      { text: 'જામીન ન મળે તેવા ગુના માટે જામીનની શરતો',   icon: 'shield' },
      { text: 'BNS હેઠળ હત્યા FIR માટે જરૂરી પુરાવા',      icon: 'file'   },
    ],
  },
};

// ─────────────────────────────────────────────
//  MARKDOWN-LIKE RENDERER
//  Renders **bold**, section headers, bullet lists,
//  and numbered lists without a full markdown library
// ─────────────────────────────────────────────
function renderMessage(text) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Skip empty lines (add small spacing)
    if (line.trim() === '') {
      elements.push(<div key={i} className="h-2" />);
      i++;
      continue;
    }

    // Section header: "1. APPLICABLE SECTIONS" or "## Header"
    if (/^#{1,3}\s/.test(line) || /^\d+\.\s+[A-Z\s]{5,}$/.test(line)) {
      const clean = line.replace(/^#{1,3}\s/, '').replace(/^\d+\.\s+/, '').trim();
      elements.push(
        <div key={i} className="flex items-center gap-2 mt-4 mb-1">
          <div className="h-px flex-1 bg-orange-100" />
          <span className="text-[11px] font-bold tracking-widest text-orange-500 uppercase px-2">
            {clean}
          </span>
          <div className="h-px flex-1 bg-orange-100" />
        </div>
      );
      i++;
      continue;
    }

    // Bullet point
    if (/^[-•*]\s/.test(line.trim())) {
      const bulletLines = [];
      while (i < lines.length && /^[-•*]\s/.test(lines[i].trim())) {
        bulletLines.push(lines[i].replace(/^[-•*]\s/, '').trim());
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="space-y-1 my-1 pl-1">
          {bulletLines.map((bl, bi) => (
            <li key={bi} className="flex items-start gap-2 text-sm">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
              <span>{inlineFormat(bl)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered list item: "1. something" (but NOT section headers)
    if (/^\d+\.\s/.test(line.trim()) && !/^[A-Z\s]{5,}$/.test(line.replace(/^\d+\.\s/, ''))) {
      const numLines = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        numLines.push(lines[i].replace(/^\d+\.\s/, '').trim());
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="space-y-1 my-1 pl-1">
          {numLines.map((nl, ni) => (
            <li key={ni} className="flex items-start gap-2 text-sm">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-50 border border-orange-200 text-orange-600 text-[10px] font-bold flex items-center justify-center mt-0.5">
                {ni + 1}
              </span>
              <span>{inlineFormat(nl)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Law section reference: "BNS Section 302" or "BNSS §33"
    if (/\b(BNS|BNSS|BSA|SPECIAL ACT)\s*(Section|§|Sec\.?)?\s*\d+/i.test(line)) {
      elements.push(
        <div key={i} className="my-1 px-3 py-2 bg-orange-50 border-l-2 border-orange-400 rounded-r-lg text-sm">
          {inlineFormat(line)}
        </div>
      );
      i++;
      continue;
    }

    // Normal paragraph
    elements.push(
      <p key={i} className="text-sm leading-relaxed">
        {inlineFormat(line)}
      </p>
    );
    i++;
  }

  return elements;
}

// Handle inline **bold** and `code` formatting
function inlineFormat(text) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-gray-800">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="px-1 py-0.5 bg-gray-100 rounded text-[12px] font-mono text-orange-600">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

// ─────────────────────────────────────────────
//  SUGGESTION ICON MAP
// ─────────────────────────────────────────────
function SuggestionIcon({ type, size = 13 }) {
  const props = { size, className: 'text-orange-400 flex-shrink-0' };
  if (type === 'gavel')  return <Gavel {...props} />;
  if (type === 'shield') return <ShieldAlert {...props} />;
  if (type === 'file')   return <FileSearch {...props} />;
  return <Search {...props} />;
}

// ─────────────────────────────────────────────
//  MESSAGE BUBBLE
// ─────────────────────────────────────────────
function MessageBubble({ msg, lang, onRetry }) {
  const [copied, setCopied] = useState(false);
  const t = UI_TEXT[lang];

  const handleCopy = async () => {
    await navigator.clipboard.writeText(msg.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (msg.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="flex items-end gap-2 max-w-[78%]">
          <div className="px-4 py-3 rounded-2xl rounded-br-sm bg-gradient-to-br from-orange-400 to-orange-500 text-white text-sm leading-relaxed shadow-md shadow-orange-200/50">
            {msg.text}
          </div>
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-orange-200/50 mb-0.5">
            <User size={13} className="text-white" />
          </div>
        </div>
      </div>
    );
  }

  // AI message
  return (
    <div className="flex justify-start">
      <div className="flex items-start gap-2 max-w-[82%]">
        {/* Avatar */}
        <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-orange-400 via-orange-500 to-green-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-orange-200/50 mt-0.5">
          <Bot size={13} className="text-white" />
        </div>

        <div className="flex-1 min-w-0">
          {/* RAG badge if this message used RAG */}
          {msg.usedRag && (
            <div className="flex items-center gap-1.5 mb-1.5">
              <Sparkles size={10} className="text-green-500" />
              <span className="text-[10px] font-medium text-green-600 tracking-wide">
                {t.ragBadge}
              </span>
            </div>
          )}

          {/* Message content */}
          <div className={`px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm border text-gray-700 ${
            msg.isError
              ? 'bg-red-50 border-red-200'
              : 'bg-white border-gray-100'
          }`}>
            {msg.isError ? (
              <p className="text-sm text-red-600">{msg.text}</p>
            ) : (
              <div className="space-y-0.5">
                {renderMessage(msg.text)}
              </div>
            )}
          </div>

          {/* Action row */}
          <div className="flex items-center gap-2 mt-1.5 ml-1">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-600 transition-colors"
            >
              {copied
                ? <><Check size={11} className="text-green-500" /><span className="text-green-500">{t.copied}</span></>
                : <><Copy size={11} /><span>{t.copy}</span></>
              }
            </button>

            {msg.isError && onRetry && (
              <button
                onClick={onRetry}
                className="flex items-center gap-1 text-[11px] text-orange-400 hover:text-orange-600 transition-colors"
              >
                <RefreshCw size={11} />
                <span>{t.retry}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  THINKING INDICATOR
// ─────────────────────────────────────────────
function ThinkingBubble({ lang }) {
  const t = UI_TEXT[lang];
  return (
    <div className="flex justify-start">
      <div className="flex items-start gap-2">
        <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-orange-400 via-orange-500 to-green-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-orange-200/50 mt-0.5">
          <Bot size={13} className="text-white" />
        </div>
        <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white border border-orange-100 shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles size={13} className="text-orange-400 animate-pulse" />
            <span className="text-sm text-gray-500">{t.thinking}</span>
            <div className="flex gap-0.5 ml-1">
              {[0, 150, 300].map(delay => (
                <span
                  key={delay}
                  className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  EMPTY STATE
// ─────────────────────────────────────────────
function EmptyState({ lang, onSuggestion }) {
  const t = UI_TEXT[lang];
  return (
    <div className="flex flex-col items-center justify-center h-full py-12 px-6">
      {/* Logo mark */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-100 to-green-100 flex items-center justify-center shadow-lg shadow-orange-100/60">
          <Bot size={34} className="text-orange-500" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-green-500 flex items-center justify-center shadow-md">
          <Sparkles size={12} className="text-white" />
        </div>
      </div>

      <h3 className="text-lg font-semibold text-gray-800 text-center">
        {t.emptyTitle}
      </h3>
      <p className="text-sm text-gray-400 text-center mt-1.5 max-w-sm leading-relaxed">
        {t.emptySubtitle}
      </p>

      {/* RAG status pill */}
      <div className="flex items-center gap-2 mt-4 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        <span className="text-xs font-medium text-green-700">{t.status}</span>
      </div>

      {/* Suggestion chips */}
      <div className="grid grid-cols-1 gap-2 mt-8 w-full max-w-md">
        {t.suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => onSuggestion(s.text)}
            className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-100 rounded-xl text-sm text-gray-600 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-700 transition-all shadow-sm hover:shadow-md text-left group"
          >
            <SuggestionIcon type={s.icon} />
            <span className="flex-1">{s.text}</span>
            <ChevronDown size={13} className="text-gray-300 -rotate-90 group-hover:text-orange-400 transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────
export default function AIChat({ onBack }) {
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [thinking, setThinking]   = useState(false);
  const [language, setLanguage]   = useState('en');
  const [lastQuery, setLastQuery] = useState('');

  const chatEndRef    = useRef(null);
  const inputRef      = useRef(null);
  const t = UI_TEXT[language];

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
const sendMessage = useCallback(async (overrideText = null) => {
  const userMsg = (overrideText ?? input).trim();
  if (!userMsg || loading) return;

  setInput('');
  setLastQuery(userMsg);
  setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
  setLoading(true);
  setThinking(true);

  try {
    // Simple greeting check — short messages with no legal intent
    // go to plain chat, everything else goes through RAG
    const isGreeting = userMsg.split(' ').length <= 3 &&
      !/(section|bns|bnss|bsa|law|crime|theft|murder|arrest|bail|fir|warrant|evidence|offence|procedure)/i.test(userMsg);

    let response;
    if (isGreeting) {
      response = await window.crimeGPT.aiChat(userMsg);
    } else {
      response = await window.crimeGPT.getLegalSuggestionRAG(userMsg);
    }

    setThinking(false);
    setMessages(prev => [...prev, {
      role: 'ai',
      text: response,
      usedRag: !isGreeting,
      isError: false,
    }]);
  } catch (err) {
    console.error('[AIChat] sendMessage error:', err);
    setThinking(false);
    setMessages(prev => [...prev, {
      role: 'ai',
      text: t.error,
      usedRag: false,
      isError: true,
    }]);
  } finally {
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }
}, [input, loading, t.error]);
  // ── Retry last failed message ───────────────
  const retryLast = useCallback(() => {
    if (!lastQuery) return;
    // Remove last AI error message
    setMessages(prev => prev.slice(0, -1));
    sendMessage(lastQuery);
  }, [lastQuery, sendMessage]);

  // ── Suggestion click ────────────────────────
  const handleSuggestion = useCallback((text) => {
    sendMessage(text);
  }, [sendMessage]);

  // ── Keyboard handler ────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ─────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────
  return (
    <main className="flex-1 flex flex-col h-full overflow-hidden bg-gradient-to-b from-white via-orange-50/20 to-green-50/20">

      {/* ── HEADER ── */}
      <header className="flex-shrink-0 bg-white/90 backdrop-blur-xl border-b border-gray-100 px-5 py-3 flex items-center gap-3 z-10">
        {/* Back button */}
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-50 rounded-xl transition-colors text-gray-400 hover:text-gray-600 flex-shrink-0"
          aria-label="Go back"
        >
          <ArrowLeft size={18} />
        </button>

        {/* Identity */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 bg-gradient-to-br from-orange-400 via-orange-500 to-green-500 rounded-xl flex items-center justify-center shadow-md shadow-orange-200/60">
              <Bot size={18} className="text-white" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-gray-800 leading-tight">{t.title}</h2>
            <p className="text-[11px] text-green-600 font-medium leading-tight">{t.status}</p>
          </div>
        </div>

        {/* Language switcher */}
        <div className="flex items-center gap-0.5 bg-gray-100 rounded-xl p-1 flex-shrink-0">
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                language === lang.code
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {lang.flag} {lang.label}
            </button>
          ))}
        </div>
      </header>

      {/* ── MESSAGES AREA ── */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 && !thinking ? (
          <EmptyState lang={language} onSuggestion={handleSuggestion} />
        ) : (
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
            {messages.map((msg, i) => (
              <MessageBubble
                key={i}
                msg={msg}
                lang={language}
                onRetry={msg.isError ? retryLast : null}
              />
            ))}
            {thinking && <ThinkingBubble lang={language} />}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* ── INPUT BAR ── */}
      <div className="flex-shrink-0 border-t border-gray-100 bg-white/90 backdrop-blur-xl px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-end gap-2">
          {/* Text input */}
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => {
                setInput(e.target.value);
                // Auto-resize
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
              onKeyDown={handleKeyDown}
              placeholder={t.placeholder}
              rows={1}
              disabled={loading}
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 pr-4 text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-300 transition-all resize-none leading-relaxed disabled:opacity-60"
              style={{ minHeight: '46px', maxHeight: '120px' }}
            />
          </div>

          {/* Send button */}
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="flex-shrink-0 w-11 h-11 bg-gradient-to-br from-orange-400 to-orange-500 text-white rounded-2xl hover:from-orange-500 hover:to-orange-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shadow-md shadow-orange-200/60 hover:shadow-orange-300/60 active:scale-95"
            aria-label="Send message"
          >
            {loading
              ? <Loader2 size={17} className="animate-spin" />
              : <Send size={17} />
            }
          </button>
        </div>

        {/* Shift+Enter hint */}
        <p className="text-center text-[10px] text-gray-300 mt-1.5">
          Enter to send • Shift+Enter for new line
        </p>
      </div>
    </main>
  );
}