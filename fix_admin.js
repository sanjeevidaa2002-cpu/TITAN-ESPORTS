const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// Replace state initial values
content = content.replace(/paytmMID: 'PAYTM_VA_MID',/g, "paytmMid: 'PAYTM_VA_MID',");
content = content.replace(/paytmKey: 'PAYTM_VA_KEY',/g, "paytmMerchantKey: '',");

// Replace saving payload
content = content.replace(/paytmMID: appSettings\.paytmMID,/g, "paytmMid: appSettings.paytmMid,");
content = content.replace(/paytmKey: appSettings\.paytmKey,/g, "paytmMerchantKey: appSettings.paytmMerchantKey,");

// Replace the Paytm Block UI
const oldBlock = `                    {/* A. Paytm Gateway Block */}
                    <div className="bg-[#161622] p-3.5 rounded-xl border border-white/5 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-white uppercase text-[10px] tracking-wider">Paytm Merchant Checkout</span>
                        <input 
                          type="checkbox"
                          checked={appSettings.paytmEnabled}
                          onChange={e => setAppSettings({...appSettings, paytmEnabled: e.target.checked})}
                          className="w-4 h-4 text-gold-500 bg-neutral-950 border-white/10 rounded cursor-pointer"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                        <div className="space-y-0.5">
                          <label className="text-neutral-500 uppercase font-semibold">Merchant ID (MID)</label>
                          <input 
                            type="text"
                            value={appSettings.paytmMID}
                            onChange={e => setAppSettings({...appSettings, paytmMID: e.target.value})}
                            placeholder="e.g. TitanEs94817..."
                            className="w-full bg-neutral-950 border border-white/10 rounded-lg p-2 text-white"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-neutral-500 uppercase font-semibold">Merchant Secret Key</label>
                          <input 
                            type="password"
                            value={appSettings.paytmKey}
                            onChange={e => setAppSettings({...appSettings, paytmKey: e.target.value})}
                            placeholder="••••••••••••••••"
                            className="w-full bg-neutral-950 border border-white/10 rounded-lg p-2 text-white"
                          />
                        </div>
                      </div>
                    </div>`;

const newBlock = `                    {/* A. Paytm Gateway Block */}
                    <div className="bg-[#161622] p-3.5 rounded-xl border border-white/5 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-white uppercase text-[10px] tracking-wider">Paytm Merchant Checkout</span>
                        <input 
                          type="checkbox"
                          checked={appSettings.paytmEnabled}
                          onChange={e => setAppSettings({...appSettings, paytmEnabled: e.target.checked})}
                          disabled={!appSettings.paytmMerchantKey}
                          className="w-4 h-4 text-gold-500 bg-neutral-950 border-white/10 rounded cursor-pointer disabled:opacity-50"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 gap-2 text-[10px] font-mono">
                        <div className="space-y-0.5">
                          <label className="text-neutral-500 uppercase font-semibold">Merchant ID (MID)</label>
                          <input 
                            type="text"
                            value={appSettings.paytmMid || ''}
                            onChange={e => setAppSettings({...appSettings, paytmMid: e.target.value})}
                            placeholder="e.g. TitanEs94817..."
                            className="w-full bg-neutral-950 border border-white/10 rounded-lg p-2 text-white"
                          />
                        </div>
                      </div>
                      
                      {!appSettings.paytmMerchantKey && (
                        <div className="mt-2 p-3 bg-red-950/40 border border-red-500/20 rounded-lg text-[9px] text-red-200">
                          <p className="font-bold text-red-400 mb-1">⚠️ Automatic Payment Disabled</p>
                          <p className="opacity-80">Paytm's official APIs require a Merchant Key (Checksum Key) for secure transaction processing. Because only a Merchant ID is available, automatic payments via Paytm are currently unsupported.</p>
                          <p className="opacity-80 mt-1">Please use Manual UPI or configure the Secret Key directly in the backend to enable.</p>
                        </div>
                      )}
                    </div>`;

content = content.replace(oldBlock, newBlock);
fs.writeFileSync('src/components/AdminDashboard.tsx', content);
console.log("Updated AdminDashboard.tsx");
