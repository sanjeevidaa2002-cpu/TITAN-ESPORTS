const fs = require('fs');
const path = require('path');

const dashPath = path.join(__dirname, 'src/components/AdminDashboard.tsx');
let content = fs.readFileSync(dashPath, 'utf8');

const targetStr = `            {/* Global Notification Setting */}
            <div className="bg-[#101017] border border-white/5 rounded-2xl p-5 space-y-4 mb-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-purple-400" />
                    Global Notification Settings
                  </h3>
                  <p className="text-[10px] text-neutral-400">Enable or disable all notifications system-wide. When disabled, users will not receive push notifications or in-app alerts.</p>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      if (updateNotificationSettingsAdmin) {
                        updateNotificationSettingsAdmin({ 
                          notificationsEnabled: !notificationSettings?.notificationsEnabled 
                        });
                        triggerNotification("Settings Updated", \`Notifications have been \${!notificationSettings?.notificationsEnabled ? 'enabled' : 'disabled'}.\`, "info");
                      }
                    }}
                    className={\`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 \${
                      notificationSettings?.notificationsEnabled 
                        ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]' 
                        : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-400'
                    }\`}
                  >
                    {notificationSettings?.notificationsEnabled ? '🔔 Notifications ON' : '🔕 Notifications OFF'}
                  </button>
                </div>
              </div>
            </div>`;

const replaceStr = `            {/* Global Notification Setting */}
            <div className="bg-[#101017] border border-white/5 rounded-2xl p-5 space-y-4 mb-6">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-0.5 flex-1">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-purple-400" />
                    Global Notification Settings
                  </h3>
                  <p className="text-[10px] text-neutral-400">Enable or disable all notifications system-wide. When disabled, users will not receive push notifications or in-app alerts.</p>
                </div>
                <div className="flex flex-col gap-3 min-w-[160px]">
                  <button
                    type="button"
                    disabled={isSavingNotifications}
                    onClick={() => {
                      const currentState = localNotificationsEnabled !== null ? localNotificationsEnabled : !!notificationSettings?.notificationsEnabled;
                      setLocalNotificationsEnabled(!currentState);
                    }}
                    className={\`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 \${
                      (localNotificationsEnabled !== null ? localNotificationsEnabled : notificationSettings?.notificationsEnabled) 
                        ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]' 
                        : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-400'
                    }\`}
                  >
                    {(localNotificationsEnabled !== null ? localNotificationsEnabled : notificationSettings?.notificationsEnabled) ? '🔔 Notifications ON' : '🔕 Notifications OFF'}
                  </button>
                  
                  <button
                    type="button"
                    disabled={isSavingNotifications || localNotificationsEnabled === null || localNotificationsEnabled === notificationSettings?.notificationsEnabled}
                    onClick={async () => {
                      if (localNotificationsEnabled === null || updateNotificationSettingsAdmin == null) return;
                      setIsSavingNotifications(true);
                      try {
                        await updateNotificationSettingsAdmin({ notificationsEnabled: localNotificationsEnabled });
                        triggerNotification("Success", "Notification settings saved successfully.", "success");
                        setLocalNotificationsEnabled(null);
                      } catch (err) {
                        triggerNotification("Error", "Failed to save notification settings. Please try again.", "error");
                        setLocalNotificationsEnabled(null);
                      } finally {
                        setIsSavingNotifications(false);
                      }
                    }}
                    className={\`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 \${
                      localNotificationsEnabled !== null && localNotificationsEnabled !== notificationSettings?.notificationsEnabled && !isSavingNotifications
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)] cursor-pointer'
                        : 'bg-neutral-800 text-neutral-500 cursor-not-allowed opacity-50'
                    }\`}
                  >
                    {isSavingNotifications ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" /> Saving...
                      </>
                    ) : (
                      <>
                        <Check className="w-3 h-3" /> Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>`;

content = content.replace(targetStr, replaceStr);

fs.writeFileSync(dashPath, content);
console.log("UI patched");
