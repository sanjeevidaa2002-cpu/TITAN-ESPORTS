const fs = require('fs');
let content = fs.readFileSync('src/components/MatchesTab.tsx', 'utf8');

const targetOld = `                      if (adminStatus === 'match_live') {
                        return (
                          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-3.5 space-y-2 text-[10px] font-sans">
                            <p className="font-bold text-red-400 uppercase tracking-wider flex items-center justify-center gap-1 animate-pulse mb-2">
                              🔴 Match Live
                            </p>
                            <div className="grid grid-cols-2 gap-2 text-center pt-1 font-mono opacity-80">
                              <div className="bg-[#111116] p-2 rounded-lg border border-red-500/10 relative">
                                <span className="text-neutral-500 block text-[8px] font-sans">ROOM ID</span>
                                <span className="text-white font-extrabold">{t?.roomID || '-'}</span>
                              </div>
                              <div className="bg-[#111116] p-2 rounded-lg border border-red-500/10 relative">
                                <span className="text-neutral-500 block text-[8px] font-sans">PASSWORD</span>
                                <span className="text-gold-400 font-extrabold">{t?.roomPassword || '-'}</span>
                              </div>
                            </div>
                          </div>
                        );
                      }`;

const targetNew = `                      if (adminStatus === 'match_live') {
                        return (
                          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 space-y-3 text-xs font-sans">
                            <p className="font-bold text-red-400 uppercase tracking-wider text-center animate-pulse">
                              🔴 Match Live
                            </p>
                            <div className="flex flex-col gap-2 opacity-90">
                              <div className="flex justify-between items-center bg-[#111116] p-3 rounded-xl border border-red-500/10 group">
                                <span className="text-white font-extrabold font-mono tracking-widest">🎮 Room ID : {t?.roomID || '-'}</span>
                                <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(t?.roomID || ''); alert('Copied Successfully'); }} className="text-[10px] bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider hover:bg-red-500/30 transition-all active:scale-95 border border-red-500/30 shadow-md">Copy Room ID</button>
                              </div>
                              <div className="flex justify-between items-center bg-[#111116] p-3 rounded-xl border border-red-500/10 group">
                                <span className="text-gold-400 font-extrabold font-mono tracking-widest">🔑 Room Password : {t?.roomPassword || '-'}</span>
                                <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(t?.roomPassword || ''); alert('Copied Successfully'); }} className="text-[10px] bg-gold-500/20 text-gold-400 px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider hover:bg-gold-500/30 transition-all active:scale-95 border border-gold-500/30 shadow-md">Copy Password</button>
                              </div>
                            </div>
                          </div>
                        );
                      }`;

content = content.replace(targetOld, targetNew);
fs.writeFileSync('src/components/MatchesTab.tsx', content);
console.log('MatchesTab live updated');
