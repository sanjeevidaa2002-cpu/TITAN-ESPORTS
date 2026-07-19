const fs = require('fs');
const path = require('path');

const dashPath = path.join(__dirname, 'src/components/AdminDashboard.tsx');
let content = fs.readFileSync(dashPath, 'utf8');

const targetStr = `              {/* Push Alerts Trigger */}
              <div className="bg-[#101017] border border-white/5 rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                    <BellRing className="w-4.5 h-4.5 text-blue-400" />
                    Broadcaster Push Notifications
                  </h3>
                  
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
                    className={\`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer \${
                      notificationSettings?.notificationsEnabled 
                        ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.3)]' 
                        : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-400'
                    }\`}
                  >
                    {notificationSettings?.notificationsEnabled ? '🔔 ON' : '🔕 OFF'}
                  </button>
                </div>`;

const replaceStr = `              {/* Push Alerts Trigger */}
              <div className="bg-[#101017] border border-white/5 rounded-2xl p-4 space-y-4">
                <div className="flex items-start justify-between border-b border-white/5 pb-2">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1.5 mt-1">
                    <BellRing className="w-4.5 h-4.5 text-blue-400" />
                    Broadcaster Push Notifications
                  </h3>
                  
                  <div className="flex flex-col gap-2 items-end">
                    <button
                      type="button"
                      disabled={isSavingNotifications}
                      onClick={() => {
                        const currentState = localNotificationsEnabled !== null ? localNotificationsEnabled : !!notificationSettings?.notificationsEnabled;
                        setLocalNotificationsEnabled(!currentState);
                      }}
                      className={\`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer \${
                        (localNotificationsEnabled !== null ? localNotificationsEnabled : notificationSettings?.notificationsEnabled)
                          ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.3)]' 
                          : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-400'
                      }\`}
                    >
                      {(localNotificationsEnabled !== null ? localNotificationsEnabled : notificationSettings?.notificationsEnabled) ? '🔔 ON' : '🔕 OFF'}
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
                      className={\`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 \${
                        localNotificationsEnabled !== null && localNotificationsEnabled !== notificationSettings?.notificationsEnabled && !isSavingNotifications
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_10px_rgba(16,185,129,0.3)] cursor-pointer'
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
                </div>`;

content = content.replace(targetStr, replaceStr);

fs.writeFileSync(dashPath, content);
console.log("Broadcaster Push Notifications UI patched");
