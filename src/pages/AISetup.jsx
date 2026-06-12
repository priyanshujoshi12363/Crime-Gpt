import { useState, useEffect } from 'react';
import { Download, Loader2, Check, ArrowRight, HardDrive, Shield, Zap, Brain, Search, XCircle } from 'lucide-react';

export default function AISetup({ onComplete }) {
  const [step, setStep] = useState('checking');
  const [progress, setProgress] = useState(0);
  const [modelName, setModelName] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    checkSystem();

    const handler = (data) => {
      if (data.step === 'ollama') {
        setProgress(data.percent);
      } else if (data.step === 'model') {
        setProgress(data.percent);
        if (data.modelName) setModelName(data.modelName);
      }
    };

    window.crimeGPT.onAIProgress(handler);
  }, []);

  const checkSystem = async () => {
    try {
      const result = await window.crimeGPT.checkAISetup();
      setStatus(result);

      if (result.ready) {
        setStep('complete');
      } else if (!result.installed) {
        setStep('need_ollama');
      } else if (!result.running) {
        setStep('need_start');
      } else {
        setStep('need_model');
      }
    } catch (err) {
      setError('Failed to check system');
    }
  };

  const cancelDownload = () => {
    setDownloading(false);
    setProgress(0);
    setModelName('');
    setError('Download cancelled');
    setTimeout(() => setError(''), 3000);
    checkSystem();
  };

  const installOllama = async () => {
    setDownloading(true);
    setModelName('Ollama Runtime');
    setProgress(0);
    setError('');

    try {
      const result = await window.crimeGPT.installOllama();
      setDownloading(false);

      if (result.success) {
        await checkSystem();
      } else {
        setError('Failed to install Ollama');
      }
    } catch (err) {
      setDownloading(false);
      setError(err.message);
    }
  };

  const startOllama = async () => {
    setDownloading(true);
    setModelName('Starting Ollama');
    setError('');

    try {
      const result = await window.crimeGPT.startOllama();
      setDownloading(false);

      if (result) {
        await checkSystem();
      } else {
        setError('Failed to start Ollama');
      }
    } catch (err) {
      setDownloading(false);
      setError(err.message);
    }
  };

  const downloadQwen = async () => {
    setDownloading(true);
    setProgress(0);
    setModelName(status?.qwenModel?.display || 'Qwen AI Model');
    setError('');

    try {
      const result = await window.crimeGPT.downloadModel();
      setDownloading(false);

      if (result.success) {
        await checkSystem();
      } else {
        setError(result.error || 'Failed to download Qwen');
      }
    } catch (err) {
      setDownloading(false);
      setError(err.message);
    }
  };

  const downloadEmbed = async () => {
    setDownloading(true);
    setProgress(0);
    setModelName('Nomic Embed Text');
    setError('');

    try {
      const result = await window.crimeGPT.downloadEmbedModel();
      setDownloading(false);

      if (result.success) {
        await checkSystem();
      } else {
        setError(result.error || 'Failed to download Embedding Model');
      }
    } catch (err) {
      setDownloading(false);
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-5xl flex flex-col md:flex-row min-h-[600px]">
        
        <div className="w-full md:w-2/5 p-8 md:p-10 flex flex-col justify-between relative overflow-hidden bg-[#0a1628]">
          <div className="absolute inset-0 opacity-10">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="d" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <line x1="0" y1="0" x2="0" y2="40" stroke="#fff" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#d)" />
            </svg>
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-6">
              <Shield size={24} className="text-orange-500" />
              <span className="text-xl font-bold text-white">CrimeGPT</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
              AI-Powered<br />
              <span className="text-orange-400">Legal Intelligence</span><br />
              <span className="text-green-400">for Police Stations</span>
            </h2>
            <p className="text-blue-200/80 text-sm md:text-base leading-relaxed">
              Download two AI models for complete offline functionality.
            </p>
          </div>

          <div className="relative z-10 mt-8 space-y-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <p className="text-white text-xs font-semibold flex items-center gap-2">
                <Brain size={14} className="text-orange-400" />
                {status?.qwenModel?.display || 'Qwen'} — Legal Reasoning
              </p>
              <p className="text-blue-200/60 text-xs mt-1">Analyzes FIR, suggests BNS/BNSS/BSA sections.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <p className="text-white text-xs font-semibold flex items-center gap-2">
                <Search size={14} className="text-green-400" />
                Nomic Embed — Case Search
              </p>
              <p className="text-blue-200/60 text-xs mt-1">Finds similar past cases using semantic search.</p>
            </div>
          </div>
        </div>

        <div className="w-full md:w-3/5 p-8 md:p-10 bg-white">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-800">
              {step === 'complete' ? 'Setup Complete' : step === 'checking' ? 'Checking System' : 'AI Model Setup'}
            </h3>
            <p className="text-gray-500 text-sm mt-1">
              {step === 'complete' ? 'Both AI models are ready.' : step === 'checking' ? 'Analyzing your system...' : 'Download the required AI models.'}
            </p>
          </div>

          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
            )}

            {downloading && (
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-gray-700">Downloading {modelName || '...'}</p>
                  <button onClick={cancelDownload} className="flex items-center gap-1 text-red-500 hover:text-red-700 text-xs font-medium transition">
                    <XCircle size={14} />
                    Cancel
                  </button>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-gradient-to-r from-orange-500 to-green-500 h-3 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs font-medium text-gray-700 text-right mt-2">{progress}%</p>
              </div>
            )}

            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <StepItem label="Ollama Runtime" description="Local AI engine" size="~400MB" done={status?.installed} current={downloading && modelName === 'Ollama Runtime'} />
              <StepItem label={status?.qwenModel?.display || 'Qwen AI Model'} description="Legal reasoning & FIR analysis" size={status?.qwenModel?.size || '~2.5GB'} done={status?.qwenReady} current={downloading && !status?.qwenReady && modelName !== 'Nomic Embed Text' && modelName !== 'Ollama Runtime' && modelName !== 'Starting Ollama'} />
              <StepItem label="Nomic Embed Text" description="Semantic search & case matching" size="~274MB" done={status?.embedReady} current={downloading && modelName === 'Nomic Embed Text'} />
            </div>

            {status?.diskSpace && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-3">
                <HardDrive size={16} className="text-green-600" />
                <div>
                  <p className="text-xs font-medium text-green-800">{status.diskSpace.freeGB}GB free on {status.diskSpace.drive}</p>
                  <p className="text-xs text-green-600">{status.diskSpace.modelsPath}</p>
                </div>
              </div>
            )}

            {!downloading && step === 'need_ollama' && (
              <button onClick={installOllama} className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition flex items-center justify-center gap-2">
                <Download size={18} /> Install Ollama Runtime
              </button>
            )}

            {!downloading && step === 'need_start' && (
              <button onClick={startOllama} className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition flex items-center justify-center gap-2">
                <Zap size={18} /> Start Ollama Service
              </button>
            )}

            {!downloading && step === 'need_model' && !status?.qwenReady && (
              <button onClick={downloadQwen} className="w-full bg-gradient-to-r from-orange-500 to-green-500 text-white py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-green-600 transition flex items-center justify-center gap-2">
                <Download size={18} /> Download {status?.qwenModel?.display || 'Qwen'}
              </button>
            )}

            {!downloading && step === 'need_model' && status?.qwenReady && !status?.embedReady && (
              <button onClick={downloadEmbed} className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white py-3 rounded-xl font-semibold hover:from-green-600 hover:to-teal-600 transition flex items-center justify-center gap-2">
                <Download size={18} /> Download Nomic Embed Text
              </button>
            )}

            {step === 'complete' && (
              <button onClick={onComplete} className="w-full bg-gradient-to-r from-orange-500 via-orange-400 to-green-500 text-white py-3 rounded-xl font-semibold hover:from-orange-600 hover:via-orange-500 hover:to-green-600 transition flex items-center justify-center gap-2">
                <Check size={18} /> Continue to App
                <ArrowRight size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StepItem({ label, description, size, done, current }) {
  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg transition-all ${done ? 'bg-green-50 border border-green-200' : current ? 'bg-orange-50 border border-orange-200' : 'bg-white border border-gray-100'}`}>
      <div className="mt-0.5">
        {done ? <Check size={18} className="text-green-500" /> : 
         current ? <Loader2 size={18} className="text-orange-500 animate-spin" /> :
         <div className="w-[18px] h-[18px] rounded-full border-2 border-gray-300" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${done ? 'text-green-800' : current ? 'text-orange-800' : 'text-gray-700'}`}>{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description} • {size}</p>
      </div>
    </div>
  );
}