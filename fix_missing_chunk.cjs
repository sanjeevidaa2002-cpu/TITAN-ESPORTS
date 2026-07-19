const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const anchor = `              Exit Console\n            </button>\n          </div>`;
const replacement = `              Exit Console
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#08080c] text-neutral-200 z-50 flex flex-row font-sans overflow-hidden">
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#0e0e16] border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-500 to-amber-500" />
            <div className="mb-4">
              <h3 className="text-lg font-extrabold text-white uppercase tracking-wider">{confirmDialog.title}</h3>
              <p className="text-xs text-neutral-400 mt-2 leading-relaxed">{confirmDialog.message}</p>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-neutral-400 hover:text-white font-bold transition-all cursor-pointer flex items-center gap-2"
              >
                {confirmDialog.cancelText || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs text-white font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-red-600/10 flex items-center gap-2"
              >
                {confirmDialog.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
        
      {/* SIDEBAR */}
      <aside 
        className="bg-[#0d0d14] border-r border-white/5 flex flex-col shrink-0 transition-all duration-300 ease-in-out overflow-hidden"
        style={{ width: sidebarCollapsed ? '75px' : '260px' }}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-white/5 flex flex-col items-center gap-3 relative">
          <div className="absolute right-4 top-4 flex items-center gap-1.5">
            <button 
              onClick={onBack}
              className="px-2 py-1.5 flex justify-center items-center rounded bg-white/5 text-[9px] uppercase font-bold text-neutral-400 hover:text-white border border-white/5 cursor-pointer"
              title="Exit Console"
            >
              {sidebarCollapsed ? <LogOut className="w-4 h-4" /> : 'Exit Console'}
            </button>
          </div>`;

content = content.replace(anchor, replacement);

fs.writeFileSync('src/components/AdminDashboard.tsx', content);
