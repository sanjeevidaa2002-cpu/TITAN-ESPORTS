const fs = require('fs');
const path = require('path');

const dashboardPath = path.join(__dirname, 'src/components/AdminDashboard.tsx');
let content = fs.readFileSync(dashboardPath, 'utf8');

content = content.replace(
  "    categories\n  } = useGame();",
  "    categories,\n    notificationSettings,\n    updateNotificationSettingsAdmin\n  } = useGame();"
);

// Insert notification settings toggle inside settings_security tab
const insertStr = `
            {/* Global Notification Setting */}
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
            </div>
`;

content = content.replace(
  "{/* Global Gateway Routing Controller */}",
  insertStr + "\n            {/* Global Gateway Routing Controller */}"
);

// We need to import Bell from lucide-react if not already imported
if (!content.includes("Bell,")) {
  content = content.replace(
    "import { \n  Users, \n  Gamepad2, \n",
    "import { \n  Users, \n  Gamepad2, \n  Bell,\n"
  );
  
  if (!content.includes("Bell,")) { // Fallback just in case
      content = content.replace(
        "import {",
        "import {\n  Bell,"
      );
  }
}


fs.writeFileSync(dashboardPath, content);
console.log("AdminDashboard.tsx patched for notifications");
