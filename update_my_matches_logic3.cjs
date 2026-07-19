const fs = require('fs');
let content = fs.readFileSync('src/components/MatchesTab.tsx', 'utf8');

const targetOld = `                      // If admin hasn't explicitly set it yet, but time has passed:
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
                      );`;

const targetNew = `                      // Otherwise, time has NOT passed and admin hasn't set it to available/live
                      return (
                        <>
                          <div className="flex justify-center mb-1">
                            <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-[0_0_10px_rgba(234,179,8,0.2)]">
                              🟡 Coming Soon
                            </span>
                          </div>
                          <CountdownTimer targetDate={reg.dateTime} status="coming_soon" />
                        </>
                      );`;

content = content.replace(targetOld, targetNew);
fs.writeFileSync('src/components/MatchesTab.tsx', content);
console.log('MatchesTab logic replaced again');
