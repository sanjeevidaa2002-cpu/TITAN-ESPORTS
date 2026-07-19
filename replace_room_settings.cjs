const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const targetOld = `                {/* MATCH ROOM SETTINGS */}
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
                </div>`;

const targetNew = `                {/* ROOM ID & PASSWORD MANAGEMENT */}
                <div className="space-y-4 md:col-span-2 bg-[#111116] p-5 rounded-2xl border border-blue-500/30 mt-4 relative overflow-hidden shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                  <div className="absolute inset-0 bg-blue-500/5 pointer-events-none" />
                  <div className="relative">
                    <h4 className="text-sm font-black text-blue-400 uppercase tracking-widest flex items-center gap-2 mb-1">
                      <span>🎮</span> Room ID & Password Management
                    </h4>
                    <p className="text-[10px] text-neutral-400">Instantly synchronize room credentials and match status to the User Panel.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Room ID</label>
                      <input 
                        type="text"
                        placeholder="e.g. 12345678"
                        value={matchForm.roomID || ''}
                        onChange={e => setMatchForm({...matchForm, roomID: e.target.value})}
                        className="w-full bg-neutral-950 border border-blue-500/20 focus:border-blue-500/50 rounded-xl p-3 text-sm text-white font-mono placeholder-neutral-600 outline-none transition-colors"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest flex justify-between">
                        <span>Room Password</span>
                        <button 
                          type="button" 
                          onClick={() => setShowRoomPassword(!showRoomPassword)}
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          {showRoomPassword ? 'Hide' : 'Show'}
                        </button>
                      </label>
                      <input 
                        type={showRoomPassword ? "text" : "password"}
                        placeholder="e.g. vault_key"
                        value={matchForm.roomPassword || ''}
                        onChange={e => setMatchForm({...matchForm, roomPassword: e.target.value})}
                        className="w-full bg-neutral-950 border border-blue-500/20 focus:border-blue-500/50 rounded-xl p-3 text-sm text-white font-mono placeholder-neutral-600 outline-none transition-colors"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Room Status</label>
                      <select
                        value={matchForm.matchRoomStatus || 'coming_soon'}
                        onChange={e => setMatchForm({...matchForm, matchRoomStatus: e.target.value as any})}
                        className="w-full bg-neutral-950 border border-blue-500/20 focus:border-blue-500/50 rounded-xl p-3 text-sm text-white outline-none transition-colors font-bold"
                      >
                        <option value="coming_soon">🟡 Coming Soon</option>
                        <option value="room_available">🟢 Room Available</option>
                        <option value="match_live">🔴 Match Live</option>
                        <option value="match_completed">✅ Match Completed</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-blue-500/10 relative">
                    <button 
                      type="button"
                      onClick={() => {
                        setMatchForm({
                          ...matchForm,
                          roomID: '',
                          roomPassword: '',
                          matchRoomStatus: 'coming_soon'
                        });
                      }}
                      className="px-5 py-2 rounded-xl bg-neutral-900 border border-white/5 text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-white transition-colors"
                    >
                      Reset
                    </button>
                    <button 
                      type="button"
                      onClick={saveRoomDetails}
                      className="px-6 py-2 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 hover:text-white text-xs font-black uppercase tracking-widest shadow-lg transition-all active:scale-95"
                    >
                      Update
                    </button>
                    <button 
                      type="button"
                      onClick={saveRoomDetails}
                      className="px-6 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-black uppercase tracking-widest shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:brightness-110 transition-all active:scale-95"
                    >
                      Save
                    </button>
                  </div>
                </div>`;

content = content.replace(targetOld, targetNew);
fs.writeFileSync('src/components/AdminDashboard.tsx', content);
console.log('Room settings replaced');
