const fs = require('fs');
const path = require('path');

const dashPath = path.join(__dirname, 'src/components/AdminDashboard.tsx');
let content = fs.readFileSync(dashPath, 'utf8');

// Ensure we get it from useGame
content = content.replace(
  "updateNotificationSettingsAdmin\n  } = useGame();",
  "updateNotificationSettingsAdmin,\n    promoSettings,\n    updatePromoSettingsAdmin\n  } = useGame();"
);

// Replace the Gamer Promo Discount Codes header
const targetStr = `<h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1.5 border-b border-white/5 pb-2">
                  <Code className="w-4.5 h-4.5 text-gold-400" />
                  Gamer Promo Discount Codes
                </h3>`;

const replaceStr = `<div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                    <Code className="w-4.5 h-4.5 text-gold-400" />
                    Gamer Promo Discount Codes
                  </h3>
                  
                  <button
                    type="button"
                    onClick={() => {
                      if (updatePromoSettingsAdmin) {
                        updatePromoSettingsAdmin({ 
                          promoCodesEnabled: !promoSettings?.promoCodesEnabled 
                        });
                        triggerNotification("Settings Updated", \`Promo Codes have been \${!promoSettings?.promoCodesEnabled ? 'enabled' : 'disabled'}.\`, "info");
                      }
                    }}
                    className={\`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer \${
                      promoSettings?.promoCodesEnabled !== false
                        ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.3)]' 
                        : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-400'
                    }\`}
                  >
                    {promoSettings?.promoCodesEnabled !== false ? '🔔 ON' : '🔕 OFF'}
                  </button>
                </div>`;

content = content.replace(targetStr, replaceStr);

fs.writeFileSync(dashPath, content);
console.log("AdminDashboard updated for promoSettings UI");
