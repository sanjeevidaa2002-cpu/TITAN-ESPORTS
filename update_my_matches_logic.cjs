const fs = require('fs');
let content = fs.readFileSync('src/components/MatchesTab.tsx', 'utf8');

const targetOld = `                    {/* Live Countdown Timer */}
                    <CountdownTimer targetDate={reg.dateTime} status={status} />

                    {/* Show Room Credentials if available */}
                    {status !== 'completed' && t && (
                      <div className="bg-[#121a2a]/40 border border-blue-500/20 rounded-2xl p-3.5 space-y-2 text-[10px] font-sans">
                        <p className="font-bold text-white uppercase tracking-wider flex items-center gap-1">
                          🔒 <span>Room Credentials</span>
                        </p>
                        {new Date(reg.dateTime).getTime() - Date.now() <= 15 * 60 * 1000 || status === 'live' ? (
                          <div className="grid grid-cols-2 gap-2 text-center pt-1 font-mono">
                            <div className="bg-[#111116] p-2 rounded-lg border border-white/5">
                              <span className="text-neutral-500 block text-[8px] font-sans">ROOM ID</span>
                              <span className="text-white font-extrabold select-all">{t.roomID || 'FF-8846392'}</span>
                            </div>
                            <div className="bg-[#111116] p-2 rounded-lg border border-white/5">
                              <span className="text-neutral-500 block text-[8px] font-sans">PASSWORD</span>
                              <span className="text-gold-400 font-extrabold select-all">{t.roomPassword || 'vault_gold_99'}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-[#111116] p-2 rounded-lg border border-white/5 text-center">
                            <p className="text-neutral-400">Unlocks exactly 15 minutes before the match start time.</p>
                          </div>
                        )}
                      </div>
                    )}`;

const targetNew = `                    {/* Match Room Status Logic */}
                    {(!t || !t.matchRoomStatus || t.matchRoomStatus === 'coming_soon') && (
                      <>
                        <div className="flex justify-center mb-1">
                          <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-[0_0_10px_rgba(234,179,8,0.2)]">
                            🟡 Coming Soon
                          </span>
                        </div>
                        <CountdownTimer targetDate={reg.dateTime} status={status} />
                      </>
                    )}

                    {t && t.matchRoomStatus === 'room_available' && (
                      <div className="bg-[#121a2a]/40 border border-blue-500/20 rounded-2xl p-3.5 space-y-2 text-[10px] font-sans">
                        <p className="font-bold text-white uppercase tracking-wider flex justify-between items-center">
                          <span className="flex items-center gap-1">🟢 Room Available</span>
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-center pt-1 font-mono">
                          <div className="bg-[#111116] p-2 rounded-lg border border-white/5 relative group">
                            <span className="text-neutral-500 block text-[8px] font-sans">ROOM ID</span>
                            <span className="text-white font-extrabold">{t.roomID || '-'}</span>
                            <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(t.roomID || ''); alert('Copied Successfully'); }} className="absolute top-1 right-1 text-neutral-500 hover:text-white" title="Copy Room ID">📋</button>
                          </div>
                          <div className="bg-[#111116] p-2 rounded-lg border border-white/5 relative group">
                            <span className="text-neutral-500 block text-[8px] font-sans">PASSWORD</span>
                            <span className="text-gold-400 font-extrabold">{t.roomPassword || '-'}</span>
                            <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(t.roomPassword || ''); alert('Copied Successfully'); }} className="absolute top-1 right-1 text-neutral-500 hover:text-white" title="Copy Password">📋</button>
                          </div>
                        </div>
                      </div>
                    )}

                    {t && t.matchRoomStatus === 'match_live' && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-3.5 space-y-2 text-[10px] font-sans">
                        <p className="font-bold text-red-400 uppercase tracking-wider flex items-center justify-center gap-1 animate-pulse mb-2">
                          🔴 Match Live
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-center pt-1 font-mono opacity-80">
                          <div className="bg-[#111116] p-2 rounded-lg border border-red-500/10">
                            <span className="text-neutral-500 block text-[8px] font-sans">ROOM ID</span>
                            <span className="text-white font-extrabold">{t.roomID || '-'}</span>
                          </div>
                          <div className="bg-[#111116] p-2 rounded-lg border border-red-500/10">
                            <span className="text-neutral-500 block text-[8px] font-sans">PASSWORD</span>
                            <span className="text-gold-400 font-extrabold">{t.roomPassword || '-'}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {t && t.matchRoomStatus === 'match_completed' && (
                      <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 text-center">
                        <span className="text-green-400 font-black tracking-widest uppercase text-sm">
                          ✅ Match Completed
                        </span>
                      </div>
                    )}`;

content = content.replace(targetOld, targetNew);
fs.writeFileSync('src/components/MatchesTab.tsx', content);
console.log('MatchesTab logic updated!');
