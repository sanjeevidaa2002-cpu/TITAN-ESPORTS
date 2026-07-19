const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'src/components/AdminDashboard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Add states if not present
if (!content.includes('localPromoCodesEnabled')) {
  content = content.replace(
    /const \[isSavingNotifications, setIsSavingNotifications\] = useState\(false\);/,
    `const [isSavingNotifications, setIsSavingNotifications] = useState(false);\n  const [localPromoCodesEnabled, setLocalPromoCodesEnabled] = useState<boolean | null>(null);\n  const [isSavingPromoCodes, setIsSavingPromoCodes] = useState(false);`
  );
}

// Update the Promo Codes Manager section
const promoRegex = /\{\/\* Promo Codes Manager \*\/\}([\s\S]*?)<div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">/;
const replacement = `{/* Promo Codes Manager */}
              <div className="bg-[#101017] border border-white/5 rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                    <Code className="w-4.5 h-4.5 text-gold-400" />
                    Gamer Promo Discount Codes
                  </h3>
                  
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const currentState = localPromoCodesEnabled !== null ? localPromoCodesEnabled : (promoSettings?.promoCodesEnabled !== false);
                        setLocalPromoCodesEnabled(!currentState);
                      }}
                      className={\`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer \${
                        (localPromoCodesEnabled !== null ? localPromoCodesEnabled : (promoSettings?.promoCodesEnabled !== false))
                          ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.3)]' 
                          : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-400'
                      }\`}
                    >
                      {(localPromoCodesEnabled !== null ? localPromoCodesEnabled : (promoSettings?.promoCodesEnabled !== false)) ? '🔔 ON' : '🔕 OFF'}
                    </button>
                    
                    <button
                      type="button"
                      disabled={isSavingPromoCodes || localPromoCodesEnabled === null || localPromoCodesEnabled === (promoSettings?.promoCodesEnabled !== false)}
                      onClick={async () => {
                        if (localPromoCodesEnabled === null || updatePromoSettingsAdmin == null) return;
                        setIsSavingPromoCodes(true);
                        try {
                          await updatePromoSettingsAdmin({ promoCodesEnabled: localPromoCodesEnabled });
                          triggerNotification("Settings Saved", \`Promo Codes have been \${localPromoCodesEnabled ? 'enabled' : 'disabled'}.\`, "success");
                        } catch (err) {
                          console.error(err);
                        } finally {
                          setIsSavingPromoCodes(false);
                          setLocalPromoCodesEnabled(null);
                        }
                      }}
                      className={\`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer \${
                        localPromoCodesEnabled !== null && localPromoCodesEnabled !== (promoSettings?.promoCodesEnabled !== false) && !isSavingPromoCodes
                          ? 'bg-gold-500 hover:bg-gold-400 text-neutral-900 shadow-[0_0_10px_rgba(250,204,21,0.2)]'
                          : 'bg-white/5 text-neutral-500 opacity-50 cursor-not-allowed'
                      }\`}
                    >
                      {isSavingPromoCodes ? 'Saving...' : 'Save Settings'}
                    </button>
                  </div>
                </div>

                {/* Create Promo Code form */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">`;

content = content.replace(promoRegex, replacement);

fs.writeFileSync(filePath, content);
console.log("Promo codes save button injected.");
