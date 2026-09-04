import React, { useState, useEffect } from 'react';
import { History, RotateCcw, Download, Upload, Trash2, X, Check, Clock, User, Sparkles } from 'lucide-react';
import { SiteContent } from '../../../types';
import { getCmsSnapshots, deleteCmsSnapshot, clearAllCmsSnapshots, CmsSnapshot } from '../../../utils/cmsSnapshots';

interface CMSVersionHistoryModalProps {
  onClose: () => void;
  onRollback: (snapshotData: SiteContent) => void;
  currentData?: SiteContent;
}

export const CMSVersionHistoryModal: React.FC<CMSVersionHistoryModalProps> = ({
  onClose,
  onRollback,
  currentData
}) => {
  const [snapshots, setSnapshots] = useState<CmsSnapshot[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<CmsSnapshot | null>(null);

  useEffect(() => {
    setSnapshots(getCmsSnapshots());
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this historical revision?')) {
      const updated = deleteCmsSnapshot(id);
      setSnapshots(updated);
      if (selectedSnapshot?.id === id) {
        setSelectedSnapshot(null);
      }
    }
  };

  const handleExportJson = () => {
    const dataToExport = selectedSnapshot?.data || currentData || {};
    const jsonStr = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yalla_cms_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (confirm('Apply this imported JSON backup to current CMS draft?')) {
            onRollback(parsed);
            onClose();
          }
        } catch (err) {
          alert('Invalid JSON file format.');
        }
      };
      reader.readAsText(e.target.files[0]);
    }
  };

  const formatTimestamp = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-white/15 rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>CMS Version History & Rollback</span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-bold border border-white/10">
                  {snapshots.length} Snapshots
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Automatically saved snapshots from every publish event. Restore any revision in one click.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Bar (Export / Import Backup) */}
        <div className="p-3.5 bg-slate-950/40 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportJson}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-white/10"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Export CMS JSON</span>
            </button>

            <label className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-white/10">
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>Import JSON Backup</span>
              <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
            </label>
          </div>

          {snapshots.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (confirm('Clear all snapshot history records?')) {
                  clearAllCmsSnapshots();
                  setSnapshots([]);
                }
              }}
              className="text-slate-500 hover:text-rose-400 text-xs flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear History</span>
            </button>
          )}
        </div>

        {/* Snapshots List */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1 custom-scrollbar">
          {snapshots.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <Clock className="w-10 h-10 text-slate-600 mx-auto" />
              <h4 className="text-sm font-bold text-white">No Published Snapshots Yet</h4>
              <p className="text-xs text-slate-400">
                Snapshots will be automatically created each time you click "Publish Live Storefront".
              </p>
            </div>
          ) : (
            snapshots.map((snap) => (
              <div
                key={snap.id}
                onClick={() => setSelectedSnapshot(snap)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  selectedSnapshot?.id === snap.id
                    ? 'bg-amber-500/15 border-amber-400/50 shadow-md'
                    : 'bg-slate-950/60 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">
                      {formatTimestamp(snap.timestamp)}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-bold text-amber-300 border border-white/5">
                      {snap.changesCount} {snap.changesCount === 1 ? 'change' : 'changes'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400">
                    {snap.note || 'Storefront live update'}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {snap.author}
                    </span>
                    <span>•</span>
                    <span className="font-mono text-[10px] text-slate-500">
                      ID: {snap.id.substring(0, 12)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Restore snapshot from ${formatTimestamp(snap.timestamp)}?`)) {
                        onRollback(snap.data);
                        onClose();
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Rollback to this Version</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleDelete(snap.id, e)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                    title="Delete snapshot"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-white/10 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Reverting to a snapshot will load all its values into your draft editor.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
