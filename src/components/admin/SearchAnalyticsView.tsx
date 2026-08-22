import React, { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { collection, query, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { Search, TrendingUp, Clock } from 'lucide-react';

interface SearchLog {
  id: string;
  query: string;
  timestamp: string;
  userId?: string | null;
}

export const SearchAnalyticsView: React.FC = () => {
  const [searchLogs, setSearchLogs] = useState<SearchLog[]>([]);

  useEffect(() => {
    const logsColRef = collection(db, 'search_logs');
    const q = query(logsColRef, orderBy('timestamp', 'desc'), limit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs: SearchLog[] = [];
      snapshot.forEach((doc) => {
        logs.push({ id: doc.id, ...doc.data() } as SearchLog);
      });
      setSearchLogs(logs);
    });
    return () => unsubscribe();
  }, []);

  // Aggregate trends
  const trends = searchLogs.reduce((acc, log) => {
    acc[log.query] = (acc[log.query] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedTrends = Object.entries(trends)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#b89753]" />
          Search Trends
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Trends */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-3">Top 10 Searches</h3>
          {sortedTrends.length === 0 ? (
            <p className="text-xs text-slate-400">No search trends yet.</p>
          ) : (
            <div className="space-y-2">
              {sortedTrends.map(([query, count], idx) => (
                <div key={query} className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-400 w-4">{idx + 1}.</span>
                    <span className="text-xs font-semibold text-slate-800">{query}</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#b89753] bg-amber-50 px-2 py-0.5 rounded-full">{count} searches</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Searches */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-3">Recent Searches</h3>
          <div className="space-y-2">
            {searchLogs.slice(0, 10).map((log) => (
              <div key={log.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-2">
                  <Search className="w-3 h-3 text-slate-400" />
                  <span className="text-xs text-slate-700">{log.query}</span>
                </div>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
