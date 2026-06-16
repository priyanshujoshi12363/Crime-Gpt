import { useState, useEffect } from 'react';
import { Clock, User, FileText, Plus, Download, Shield, AlertTriangle } from 'lucide-react';

const ACTION_ICONS = {
  CASE_CREATED: <Plus size={14} className="text-green-500" />,
  DIARY_ENTRY: <Clock size={14} className="text-blue-500" />,
  DOCUMENT_GENERATED: <FileText size={14} className="text-purple-500" />,
  EVIDENCE_ADDED: <Download size={14} className="text-orange-500" />,
  CASE_UPDATED: <Shield size={14} className="text-indigo-500" />,
};

const ACTION_COLORS = {
  CASE_CREATED: 'bg-green-50 text-green-600 border-green-200',
  DIARY_ENTRY: 'bg-blue-50 text-blue-600 border-blue-200',
  DOCUMENT_GENERATED: 'bg-purple-50 text-purple-600 border-purple-200',
  EVIDENCE_ADDED: 'bg-orange-50 text-orange-600 border-orange-200',
  CASE_UPDATED: 'bg-indigo-50 text-indigo-600 border-indigo-200',
};

export default function AuditTrail({ caseId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuditLog();
  }, [caseId]);

  const loadAuditLog = async () => {
    try {
      const result = await window.crimeGPT.getAuditLog(caseId);
      setLogs(result || []);
    } catch (err) { console.error('Audit load failed:', err); }
    setLoading(false);
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-400 text-sm">Loading audit trail...</div>;
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-8">
        <AlertTriangle size={32} className="text-gray-200 mx-auto mb-3" />
        <p className="text-gray-400 text-sm">No audit records yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {logs.map((log, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-gray-100 hover:shadow-sm transition">
          <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
            {ACTION_ICONS[log.action] || <Shield size={14} className="text-gray-400" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${ACTION_COLORS[log.action] || 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                {log.action?.replace(/_/g, ' ')}
              </span>
              <span className="text-sm text-gray-700 truncate">{log.details}</span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-gray-400">{new Date(log.created_at).toLocaleString('en-IN')}</p>
            <p className="text-[10px] text-gray-400 flex items-center justify-end gap-1"><User size={10} /> {log.officer_name}</p>
          </div>
        </div>
      ))}
    </div>
  );
}