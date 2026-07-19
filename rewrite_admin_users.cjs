const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const tableHeaderOld = `                    <thead className="bg-neutral-900/50 border-b border-white/5 text-neutral-400 uppercase text-[9px] tracking-widest">
                      <tr>
                        <th className="p-3.5 pl-4">Player Details</th>
                        <th className="p-3.5">Free Fire UID</th>
                        <th className="p-3.5">Wallets (D / W / B)</th>
                        <th className="p-3.5">Matches / Wins</th>
                        <th className="p-3.5">Role</th>
                        <th className="p-3.5 pr-4 text-right">Actions</th>
                      </tr>
                    </thead>`;

const tableHeaderNew = `                    <thead className="bg-neutral-900/50 border-b border-white/5 text-neutral-400 uppercase text-[9px] tracking-widest">
                      <tr>
                        <th className="p-3.5 pl-4">Player Details</th>
                        <th className="p-3.5">Account Info</th>
                        <th className="p-3.5">Wallets (D / W / B)</th>
                        <th className="p-3.5">Status & Role</th>
                        <th className="p-3.5 pr-4 text-right">Actions</th>
                      </tr>
                    </thead>`;

content = content.replace(tableHeaderOld, tableHeaderNew);

const tableBodyOld = `                      {filteredUsers.map((user) => {
                        const isBanned = (user as any).isBanned || false;
                        return (
                          <tr key={user.uid} className={\`hover:bg-white/2 \${isBanned ? 'bg-red-500/5 opacity-80' : ''}\`}>
                            <td className="p-3.5 pl-4">
                              <div>
                                <p className="font-extrabold text-white uppercase tracking-wide">{user.nickname}</p>
                                <p className="text-[10px] text-neutral-400 font-mono mt-0.5">{user.email}</p>
                              </div>
                            </td>
                            <td className="p-3.5">
                              <span className="font-mono text-neutral-300 font-bold">{user.freefireUid || 'Not Linked'}</span>
                            </td>
                            <td className="p-3.5 font-mono">
                              <div>
                                <p className="text-white">D: ₹{user.depositBalance.toFixed(1)}</p>
                                <p className="text-gold-400">W: ₹{user.winningBalance.toFixed(1)}</p>
                                <p className="text-cyan-400 text-[10px]">B: ₹{user.bonusBalance.toFixed(1)}</p>
                              </div>
                            </td>
                            <td className="p-3.5">
                              <p className="text-neutral-300">{user.totalMatches} matches</p>
                              <p className="text-emerald-500 text-[10px]">{user.totalWins} wins / {user.totalKills} kills</p>
                            </td>
                            <td className="p-3.5">
                              <span className={\`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase \${
                                user.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-neutral-800 text-neutral-400'
                              }\`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="p-3.5 pr-4 text-right">`;

const tableBodyNew = `                      {filteredUsers.map((user) => {
                        const isBanned = (user as any).accountStatus === 'disabled' || (user as any).isBanned || false;
                        return (
                          <tr key={user.uid} className={\`hover:bg-white/2 \${isBanned ? 'bg-red-500/5 opacity-80' : ''}\`}>
                            <td className="p-3.5 pl-4">
                              <div>
                                <p className="font-extrabold text-white uppercase tracking-wide">{user.nickname}</p>
                                <p className="text-[10px] text-neutral-400 font-mono mt-0.5">Mob: {user.mobileNumber || 'N/A'}</p>
                              </div>
                            </td>
                            <td className="p-3.5">
                              <div className="space-y-0.5">
                                <p className="text-[10px] font-mono text-neutral-300"><span className="text-neutral-500">Ref:</span> {user.referralCode}</p>
                                <p className="text-[10px] font-mono text-neutral-300"><span className="text-neutral-500">Joined:</span> {new Date(user.joinedAt).toLocaleDateString()}</p>
                              </div>
                            </td>
                            <td className="p-3.5 font-mono">
                              <div>
                                <p className="text-white">D: ₹{user.depositBalance.toFixed(1)}</p>
                                <p className="text-gold-400">W: ₹{user.winningBalance.toFixed(1)}</p>
                                <p className="text-cyan-400 text-[10px]">B: ₹{user.bonusBalance.toFixed(1)}</p>
                              </div>
                            </td>
                            <td className="p-3.5">
                              <div className="space-y-1.5">
                                <span className={\`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase \${
                                  isBanned ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                }\`}>
                                  {isBanned ? 'Disabled' : 'Active'}
                                </span>
                                <span className={\`px-2 py-0.5 ml-1 rounded-full text-[9px] font-bold uppercase \${
                                  user.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-neutral-800 text-neutral-400'
                                }\`}>
                                  {user.role}
                                </span>
                              </div>
                            </td>
                            <td className="p-3.5 pr-4 text-right">`;

content = content.replace(tableBodyOld, tableBodyNew);

const banActionOld = `                                <button 
                                  onClick={() => toggleBanUser(user)}
                                  className={\`p-1 px-2 rounded text-[10px] font-bold cursor-pointer \${
                                    isBanned 
                                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20' 
                                      : 'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20'
                                  }\`}
                                >
                                  {isBanned ? 'Unban' : 'Ban'}
                                </button>`;

const banActionNew = `                                <button 
                                  onClick={() => toggleBanUser(user)}
                                  className={\`p-1 px-2 rounded text-[10px] font-bold cursor-pointer \${
                                    isBanned 
                                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20' 
                                      : 'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20'
                                  }\`}
                                >
                                  {isBanned ? 'Enable' : 'Disable'}
                                </button>`;

content = content.replace(banActionOld, banActionNew);

fs.writeFileSync('src/components/AdminDashboard.tsx', content);
console.log('Admin users list updated');
