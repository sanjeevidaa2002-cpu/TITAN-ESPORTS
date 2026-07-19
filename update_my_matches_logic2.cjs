const fs = require('fs');
let content = fs.readFileSync('src/components/MatchesTab.tsx', 'utf8');

// I will just replace the whole body content again.

const startIndex = content.indexOf(`                  {/* Body Content */}`);
const endIndex = content.indexOf(`                </div>
              );
            })`, startIndex);

const oldBody = content.substring(startIndex, endIndex);

const newBody = `                  {/* Body Content */}
                  <div className="p-5 space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <span className="px-2 py-1 rounded-lg bg-purple-950/40 border border-purple-500/20 text-purple-400 text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 w-fit">
                          {t ? t.gameCategory || 'Free Fire' : 'Free Fire'}
                        </span>
                        <h3 className="text-base font-extrabold text-white tracking-wide">{reg.tournamentName}</h3>
                      </div>
                      
                      <div className="text-right shrink-0">
                        <p className="text-[9px] text-neutral-500 uppercase tracking-widest font-semibold">Prize Pool</p>
                        <p className="text-sm font-black text-gold-400 font-mono">₹{reg.prizePool}</p>
                      </div>
                    </div>

                    {/* Metadata specs */}
                    <div className="grid grid-cols-3 gap-2 bg-[#0d0c15] p-3 rounded-2xl border border-white/5 text-[10px] text-neutral-400 font-mono text-center items-center">
                      <div>
                        <span className="text-neutral-500 block text-[8px] uppercase font-bold tracking-wider mb-1">Mode</span>
                        <span className="text-purple-400 font-bold">{reg.matchType}</span>
                      </div>
                      <div className="border-x border-white/5 px-1">
                        <span className="text-neutral-500 block text-[8px] uppercase font-bold tracking-wider mb-1">Date & Time</span>
                        <span className="text-white font-bold leading-tight">
                          {new Date(reg.dateTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}<br/>
                          {new Date(reg.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-500 block text-[8px] uppercase font-bold tracking-wider mb-1">Entry Fee</span>
                        <span className="text-green-400 font-bold">{t ? (t.isFreeMatch ? 'FREE' : \`₹\${t.entryFee}\`) : 'FREE'}</span>
                      </div>
                    </div>

                    {/* Match Room Status Logic */}
                    {(() => {
                      const isPast = new Date(reg.dateTime).getTime() - Date.now() <= 0;
                      const adminStatus = t?.matchRoomStatus;
                      
                      if (adminStatus === 'match_completed') {
                        return (
                          <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 text-center">
                            <span className="text-green-400 font-black tracking-widest uppercase text-sm">
                              ✅ Match Completed
                            </span>
                          </div>
                        );
                      }
                      
                      if (adminStatus === 'match_live') {
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
                      }
                      
                      if (adminStatus === 'room_available') {
                        return (
                          <div className="bg-[#121a2a]/40 border border-blue-500/20 rounded-2xl p-3.5 space-y-2 text-[10px] font-sans">
                            <p className="font-bold text-white uppercase tracking-wider flex justify-between items-center">
                              <span className="flex items-center gap-1">🟢 Room Available</span>
                            </p>
                            <div className="grid grid-cols-2 gap-2 text-center pt-1 font-mono">
                              <div className="bg-[#111116] p-2 rounded-lg border border-white/5 relative group">
                                <span className="text-neutral-500 block text-[8px] font-sans">ROOM ID</span>
                                <span className="text-white font-extrabold">{t?.roomID || '-'}</span>
                                <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(t?.roomID || ''); alert('Copied Successfully'); }} className="absolute top-1 right-1 text-neutral-500 hover:text-white" title="Copy Room ID">📋</button>
                              </div>
                              <div className="bg-[#111116] p-2 rounded-lg border border-white/5 relative group">
                                <span className="text-neutral-500 block text-[8px] font-sans">PASSWORD</span>
                                <span className="text-gold-400 font-extrabold">{t?.roomPassword || '-'}</span>
                                <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(t?.roomPassword || ''); alert('Copied Successfully'); }} className="absolute top-1 right-1 text-neutral-500 hover:text-white" title="Copy Password">📋</button>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      
                      // If admin hasn't explicitly set it yet, but time has passed:
                      if (isPast) {
                        return (
                          <div className="bg-[#121a2a]/40 border border-blue-500/20 rounded-2xl p-3.5 space-y-2 text-[10px] font-sans animate-pulse">
                             <p className="font-bold text-white uppercase tracking-wider flex justify-between items-center text-center w-full">
                              <span className="flex items-center gap-1 mx-auto text-blue-400">🟢 Room Available / 🔴 Match Live</span>
                            </p>
                            <p className="text-center text-[9px] text-neutral-400">Waiting for Admin to reveal Room ID & Password...</p>
                          </div>
                        );
                      }
                      
                      // Otherwise, time has NOT passed and admin hasn't set it to available/live
                      return (
                        <>
                          <div className="flex justify-center mb-1">
                            <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-[0_0_10px_rgba(234,179,8,0.2)]">
                              🟡 Coming Soon
                            </span>
                          </div>
                          <CountdownTimer targetDate={reg.dateTime} status="coming_soon" />
                        </>
                      );
                    })()}
                  </div>
`;

content = content.replace(oldBody, newBody);
fs.writeFileSync('src/components/MatchesTab.tsx', content);
console.log('MatchesTab logic replaced completely');
