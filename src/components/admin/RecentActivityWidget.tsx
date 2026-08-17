import React from 'react';
import { useShop } from '../../context/ShopContext';
import { 
  Activity, 
  PlusCircle, 
  Edit3, 
  Trash2, 
  Truck, 
  Globe, 
  Layers, 
  User, 
  Clock 
} from 'lucide-react';

export const RecentActivityWidget: React.FC = () => {
  const { recentActivities } = useShop();

  const formatTimeAgo = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      
      if (seconds < 5) return 'Just now';
      if (seconds < 60) return `${seconds}s ago`;
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    } catch {
      return 'Recently';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'product_add':
        return {
          icon: <PlusCircle className="w-4 h-4" />,
          bg: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
        };
      case 'product_update':
        return {
          icon: <Edit3 className="w-4 h-4" />,
          bg: 'bg-amber-50 text-amber-600 border border-amber-100',
        };
      case 'product_delete':
        return {
          icon: <Trash2 className="w-4 h-4" />,
          bg: 'bg-rose-50 text-rose-600 border border-rose-100',
        };
      case 'order_status':
        return {
          icon: <Truck className="w-4 h-4" />,
          bg: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
        };
      case 'meta_change':
        return {
          icon: <Globe className="w-4 h-4" />,
          bg: 'bg-teal-50 text-teal-600 border border-teal-100',
        };
      case 'cms_update':
      default:
        return {
          icon: <Layers className="w-4 h-4" />,
          bg: 'bg-purple-50 text-purple-600 border border-purple-100',
        };
    }
  };

  // Only show top 5 on the widget
  const displayedActivities = recentActivities.slice(0, 5);

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-700">
            <Activity className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Recent Activity</h3>
            <p className="text-[11px] text-slate-500">Live system and content updates</p>
          </div>
        </div>
        
        {/* Pulse Live Indicator */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-50 border border-emerald-100/55">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[9px] font-black uppercase text-emerald-700 tracking-wider">Live</span>
        </div>
      </div>

      {/* Activity List */}
      <div className="space-y-3.5">
        {displayedActivities.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mx-auto">
              <Clock className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-400 font-medium">No recent activities recorded.</p>
          </div>
        ) : (
          displayedActivities.map((act) => {
            const styling = getActivityIcon(act.actionType);
            return (
              <div key={act.id} className="flex gap-3 text-xs group">
                {/* Left: Icon Badge */}
                <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center ${styling.bg}`}>
                  {styling.icon}
                </div>

                {/* Center & Right */}
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-800 truncate text-[11px] leading-snug">
                      {act.summary}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold shrink-0 flex items-center gap-0.5">
                      <Clock className="w-3 h-3" />
                      {formatTimeAgo(act.timestamp)}
                    </span>
                  </div>
                  
                  <p className="text-[11px] text-slate-500 leading-normal line-clamp-2">
                    {act.details}
                  </p>

                  <div className="flex items-center gap-1 text-[10px] text-slate-400 pt-0.5">
                    <User className="w-3 h-3 text-slate-300" />
                    <span className="truncate max-w-[140px]">{act.adminEmail}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
