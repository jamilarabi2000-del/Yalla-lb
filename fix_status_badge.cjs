const fs = require('fs');
const path = './src/components/OrderHistory.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace the old getStatusBadge which uses gold/sky/emerald dark themes with new light theme ones
const oldGetStatusBadgeStr = `  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Delivered</span>
          </span>
        );
      case 'in_transit':
      case 'courier_assigned':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/30">
            <Truck className="w-3.5 h-3.5 animate-pulse" />
            <span>In Transit</span>
          </span>
        );
      case 'crafting':
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider rounded-lg bg-[#c5a059]/20 text-[#f1d592] border border-[#c5a059]/30">
            <Clock className="w-3.5 h-3.5" />
            <span>{status === 'crafting' ? 'Crafting' : 'Processing'}</span>
          </span>
        );
    }
  };`;

const newGetStatusBadgeStr = `  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Delivered</span>
          </span>
        );
      case 'in_transit':
      case 'courier_assigned':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-sky-50 text-sky-700 border border-sky-200">
            <Truck className="w-3.5 h-3.5 animate-pulse" />
            <span>In Transit</span>
          </span>
        );
      case 'crafting':
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            <span>{status === 'crafting' ? 'Crafting' : 'Processing'}</span>
          </span>
        );
    }
  };`;

if (content.includes("getStatusBadge = (status: Order['status']) => {")) {
    content = content.replace(oldGetStatusBadgeStr, newGetStatusBadgeStr);
    fs.writeFileSync(path, content);
    console.log("Successfully rewrote getStatusBadge");
} else {
    console.log("Could not find getStatusBadge");
}
