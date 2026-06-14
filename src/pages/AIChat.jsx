import { useState, useEffect, useRef } from 'react';
import { Bot, Send, User, ArrowLeft, Search, FileText, Scale, BookOpen, Loader2, Sparkles, Languages } from 'lucide-react';

export default function AIChat({ onBack }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [language, setLanguage] = useState('en');
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);
const sendMessage = async () => {
  if (!input.trim() || loading) return;
  const userMsg = input.trim();
  setInput('');
  setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
  setLoading(true);
  setThinking(true);

  try {
    const isLegalQuery = checkIfLegalQuery(userMsg);
    
    if (isLegalQuery) {
      const response = await window.crimeGPT.getLegalSuggestionRAG(userMsg);
      setThinking(false);
      setMessages(prev => [...prev, { role: 'ai', text: response }]);
    } else {
      const response = await window.crimeGPT.aiChat(userMsg);
      setThinking(false);
      setMessages(prev => [...prev, { role: 'ai', text: response }]);
    }
  } catch {
    setThinking(false);
    setMessages(prev => [...prev, { role: 'ai', text: getErrorMessage(language) }]);
  } finally {
    setLoading(false);
  }
};

const checkIfLegalQuery = (message) => {
  const legalKeywords = [
    'section', 'bns', 'bnss', 'bsa', 'law', 'legal', 'crime', 'criminal',
    'theft', 'murder', 'robbery', 'assault', 'rape', 'kidnapping', 'fraud',
    'punishment', 'arrest', 'warrant', 'bail', 'fir', 'chargesheet', 'court',
    'judgment', 'evidence', 'witness', 'procedure', 'offence', 'victim',
    'help', 'apply', 'applicable', 'punishment', 'stolen', 'killed',
    'धारा', 'कानून', 'चोरी', 'हत्या', 'बलात्कार', 'मदद',
    'કલમ', 'કાયદો', 'ચોરી', 'હત્યા', 'બળાત્કાર', 'મદદ'
  ];
  const lowerMsg = message.toLowerCase();
  return legalKeywords.some(kw => lowerMsg.includes(kw.toLowerCase()));
};

  const formatResponse = (data, lang) => {
    let text = '';
    
    if (data.summary) {
      text += `${getLabel('summary', lang)}${data.summary}\n\n`;
    }
    
    if (data.bns_sections && data.bns_sections.length > 0) {
      text += `${getLabel('bns', lang)}`;
      data.bns_sections.forEach((s, i) => {
        text += `\n${i + 1}. **BNS ${s.section}** - ${s.title}`;
        if (s.confidence) text += ` (${s.confidence}% ${getLabel('match', lang)})`;
        if (s.reasoning) text += `\n   ↳ ${s.reasoning}`;
      });
      text += '\n\n';
    }
    
    if (data.bnss_procedures && data.bnss_procedures.length > 0) {
      text += `${getLabel('bnss', lang)}`;
      data.bnss_procedures.forEach((p, i) => {
        text += `\n${i + 1}. **BNSS ${p.section}** - ${p.title}`;
        if (p.action) text += `\n   ↳ ${p.action}`;
      });
      text += '\n\n';
    }
    
    if (data.next_steps && data.next_steps.length > 0) {
      text += `${getLabel('steps', lang)}`;
      data.next_steps.forEach((step, i) => {
        text += `\n${i + 1}. ${step}`;
      });
    }
    
    return text || JSON.stringify(data, null, 2);
  };

  const getLabel = (key, lang) => {
    const labels = {
      summary: { en: '📋 **Analysis**\n', hi: '📋 **विश्लेषण**\n', gu: '📋 **વિશ્લેષણ**\n' },
      bns: { en: '⚖️ **Applicable BNS Sections:**\n', hi: '⚖️ **लागू BNS धाराएं:**\n', gu: '⚖️ **લાગુ BNS કલમો:**\n' },
      bnss: { en: '📝 **BNSS Procedures:**\n', hi: '📝 **BNSS प्रक्रियाएं:**\n', gu: '📝 **BNSS પ્રક્રિયાઓ:**\n' },
      steps: { en: '🚔 **Next Steps:**\n', hi: '🚔 **अगले कदम:**\n', gu: '🚔 **આગળના પગલાં:**\n' },
      match: { en: 'match', hi: 'मिलान', gu: 'મેળ' }
    };
    return labels[key]?.[lang] || labels[key]?.en || '';
  };

  const getErrorMessage = (lang) => {
    const errors = {
      en: 'Sorry, I encountered an error processing your request.',
      hi: 'क्षमा करें, आपके अनुरोध को संसाधित करने में त्रुटि हुई।',
      gu: 'માફ કરશો, તમારી વિનંતી પર પ્રક્રિયા કરવામાં ભૂલ આવી।'
    };
    return errors[lang] || errors.en;
  };

  const suggestions = [
    { text: 'What sections apply for theft at night?', icon: <Search size={14} />, lang: 'en' },
    { text: 'चोरी के लिए कौन सी धाराएं लागू होती हैं?', icon: <Search size={14} />, lang: 'hi' },
    { text: 'ઘરફોડ ચોરી માટે કઈ કલમો લાગુ પડે?', icon: <Search size={14} />, lang: 'gu' },
    { text: 'Explain procedure for arrest without warrant', icon: <Scale size={14} />, lang: 'en' }
  ];

  const languages = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
    { code: 'gu', label: 'ગુજરાતી', flag: '🇮🇳' }
  ];

  const placeholders = {
    en: 'Ask about BNS sections, legal procedures, or case analysis...',
    hi: 'BNS धाराओं, कानूनी प्रक्रियाओं या केस विश्लेषण के बारे में पूछें...',
    gu: 'BNS કલમો, કાનૂની પ્રક્રિયાઓ અથવા કેસ વિશ્લેષણ વિશે પૂછો...'
  };

  return (
    <main className="flex-1 flex flex-col" style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #FFF8F0 50%, #F0FFF4 100%)' }}>
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 px-8 py-4 flex items-center gap-4 sticky top-0 z-10">
        <button onClick={onBack} className="p-2 hover:bg-gray-50 rounded-xl transition text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 via-orange-500 to-green-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">CrimeGPT AI</h2>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              <p className="text-xs text-green-600">Qwen 2.5 • RAG • Offline</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
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

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 && !thinking && (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-100 via-white to-green-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-100">
                <Bot size={36} className="text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700">CrimeGPT AI Assistant</h3>
              <p className="text-sm text-gray-400 mt-2">
                {language === 'en' && 'Powered by Qwen 2.5 + Indian Legal Database • Fully Offline'}
                {language === 'hi' && 'Qwen 2.5 + भारतीय कानूनी डेटाबेस द्वारा संचालित • पूरी तरह ऑफलाइन'}
                {language === 'gu' && 'Qwen 2.5 + ભારતીય કાનૂની ડેટાબેઝ દ્વારા સંચાલિત • સંપૂર્ણ ઑફલાઇન'}
              </p>
              
              <div className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
                <Sparkles size={12} className="text-green-600" />
                <span className="text-xs text-green-700 font-medium">
                  {language === 'en' && 'RAG Active — Searching BNS, BNSS, BSA'}
                  {language === 'hi' && 'RAG सक्रिय — BNS, BNSS, BSA खोज रहा है'}
                  {language === 'gu' && 'RAG સક્રિય — BNS, BNSS, BSA શોધી રહ્યું છે'}
                </span>
              </div>
              
              <div className="flex flex-wrap justify-center gap-2 mt-8">
                {suggestions
                  .filter(s => s.lang === language)
                  .map((s) => (
                    <button
                      key={s.text}
                      onClick={() => { setInput(s.text); setTimeout(() => sendMessage(), 100); }}
                      className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-100 rounded-xl text-xs text-gray-600 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600 transition-all shadow-sm hover:shadow-md"
                    >
                      <span className="text-orange-400">{s.icon}</span>
                      {s.text}
                    </button>
                  ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex items-start gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
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
            <div className="flex justify-start">
              <div className="flex items-start gap-3 max-w-[80%]">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-green-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Bot size={14} className="text-white" />
                </div>
                <div className="px-5 py-3 rounded-2xl rounded-tl-md bg-white border border-orange-100 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-orange-400" />
                    <span className="text-sm text-gray-500">
                      {language === 'en' && 'Searching legal database & analyzing...'}
                      {language === 'hi' && 'कानूनी डेटाबेस खोज रहा है और विश्लेषण कर रहा है...'}
                      {language === 'gu' && 'કાનૂની ડેટાબેઝ શોધી રહ્યું છે અને વિશ્લેષણ કરી રહ્યું છે...'}
                    </span>
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

          <div ref={chatEndRef} />
        </div>
      </div>

      <div className="border-t border-gray-100 p-4 bg-white/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder={placeholders[language]}
            className="flex-1 bg-white border border-gray-200 rounded-2xl px-5 py-3.5 text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-300 transition-all shadow-sm"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="bg-gradient-to-r from-orange-400 via-orange-500 to-green-500 text-white px-6 rounded-2xl hover:from-orange-500 hover:via-orange-600 hover:to-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium text-sm shadow-lg shadow-orange-200 hover:shadow-orange-300 active:scale-95"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </main>
  );
}