const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// Add to matchForm interface
content = content.replace(
  /    dateTime: string;/g,
  `    dateTime: string;\n    matchDate: string;\n    matchTime: string;\n    registrationStart: string;\n    registrationEnd: string;`
);

// Add to initial matchForm state
content = content.replace(
  /    dateTime: '',/g,
  `    dateTime: '',\n    matchDate: '',\n    matchTime: '',\n    registrationStart: '',\n    registrationEnd: '',`
);

// Add to saveMatchForm
content = content.replace(
  /        dateTime: matchForm.dateTime,/g,
  `        dateTime: matchForm.dateTime,\n        matchDate: matchForm.matchDate,\n        matchTime: matchForm.matchTime,\n        registrationStart: matchForm.registrationStart,\n        registrationEnd: matchForm.registrationEnd,`
);

// Add to openEditMatchForm
content = content.replace(
  /      dateTime: t.dateTime,/g,
  `      dateTime: t.dateTime,\n      matchDate: t.matchDate || '',\n      matchTime: t.matchTime || '',\n      registrationStart: t.registrationStart || '',\n      registrationEnd: t.registrationEnd || '',`
);

// Replace Date & Time Schedule UI with the separated fields
const oldDateTimeUI = `                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Date & Time Schedule</label>
                    <input 
                      type="datetime-local"
                      value={matchForm.dateTime}
                      onChange={e => setMatchForm({...matchForm, dateTime: e.target.value})}
                      className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2.5 text-xs text-white font-mono"
                    />
                  </div>`;

const newDatesUI = `                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Match Date</label>
                    <input 
                      type="date"
                      value={matchForm.matchDate}
                      onChange={e => setMatchForm({...matchForm, matchDate: e.target.value})}
                      className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2.5 text-xs text-white font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Match Time</label>
                    <input 
                      type="time"
                      value={matchForm.matchTime}
                      onChange={e => setMatchForm({...matchForm, matchTime: e.target.value})}
                      className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2.5 text-xs text-white font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Registration Start</label>
                    <input 
                      type="datetime-local"
                      value={matchForm.registrationStart}
                      onChange={e => setMatchForm({...matchForm, registrationStart: e.target.value})}
                      className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2.5 text-xs text-white font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Registration End</label>
                    <input 
                      type="datetime-local"
                      value={matchForm.registrationEnd}
                      onChange={e => setMatchForm({...matchForm, registrationEnd: e.target.value})}
                      className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2.5 text-xs text-white font-mono"
                    />
                  </div>`;

content = content.replace(oldDateTimeUI, newDatesUI);

fs.writeFileSync('src/components/AdminDashboard.tsx', content);
