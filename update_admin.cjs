const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const targetOld = `                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Revealed Room ID</label>
                    <input 
                      type="text"
                      placeholder="revealed near start"
                      value={matchForm.roomID}
                      onChange={e => setMatchForm({...matchForm, roomID: e.target.value})}
                      className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2.5 text-xs text-white font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Revealed Room Password</label>
                    <input 
                      type="text"
                      placeholder="password code"
                      value={matchForm.roomPassword}
                      onChange={e => setMatchForm({...matchForm, roomPassword: e.target.value})}
                      className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2.5 text-xs text-white font-mono"
                    />
                  </div>`;

const targetNew = `                  {/* Image Selectors placeholder (will push down) */}
                </div>
                
                {/* MATCH ROOM SETTINGS */}
                <div className="space-y-4 md:col-span-2 bg-[#111116] p-4 rounded-xl border border-blue-500/20 mt-2 relative overflow-hidden">
                  <div className="absolute inset-0 bg-blue-500/5 pointer-events-none" />
                  <h4 className="text-xs font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                    <span>🎮</span> Match Room Settings
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Room ID</label>
                      <input 
                        type="text"
                        placeholder="e.g. 12345678"
                        value={matchForm.roomID || ''}
                        onChange={e => setMatchForm({...matchForm, roomID: e.target.value})}
                        className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2.5 text-xs text-white font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Room Password</label>
                      <input 
                        type="text"
                        placeholder="e.g. password123"
                        value={matchForm.roomPassword || ''}
                        onChange={e => setMatchForm({...matchForm, roomPassword: e.target.value})}
                        className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2.5 text-xs text-white font-mono"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Room Status</label>
                      <select
                        value={matchForm.matchRoomStatus || 'coming_soon'}
                        onChange={e => setMatchForm({...matchForm, matchRoomStatus: e.target.value as any})}
                        className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2.5 text-xs text-white"
                      >
                        <option value="coming_soon">Coming Soon</option>
                        <option value="room_available">Room Available</option>
                        <option value="match_live">Match Live</option>
                        <option value="match_completed">Match Completed</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">`;

content = content.replace(targetOld, targetNew);
fs.writeFileSync('src/components/AdminDashboard.tsx', content);
console.log('Replaced Admin Dashboard content');
