import React from 'react';
import { SessionRecord } from '../types';
import { Clock, BarChart2 } from 'lucide-react';
import { formatDate } from '../utils';

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({ isOpen, onClose }) => {
  const history: SessionRecord[] = JSON.parse(localStorage.getItem('interview_history') || '[]');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-white shadow-2xl transform transition-transform duration-300 z-50 overflow-y-auto border-l border-slate-100">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center">
        <h3 className="font-bold text-lg text-slate-800">Recent Sessions</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">&times;</button>
      </div>
      <div className="p-4 space-y-3">
        {history.length === 0 ? (
          <p className="text-center text-slate-400 text-sm py-10">No history yet.</p>
        ) : (
          history.map((session) => (
            <div key={session.id} className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition">
              <div className="flex justify-between items-start mb-1">
                <span className="font-semibold text-sm text-slate-800">{session.role}</span>
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${session.score >= 70 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {session.score}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Clock size={12} /> {formatDate(new Date(session.date))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HistorySidebar;