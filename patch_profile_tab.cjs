const fs = require('fs');
const path = require('path');

const profilePath = path.join(__dirname, 'src/components/ProfileTab.tsx');
let content = fs.readFileSync(profilePath, 'utf8');

content = content.replace(
  "const { userProfile, updateProfile, currentUser, logout } = useGame();",
  "const { userProfile, updateProfile, currentUser, logout, notificationSettings } = useGame();"
);

content = content.replace(
  "{/* Push Notification Switch row - exact replication */}",
  "{notificationSettings?.notificationsEnabled !== false && (\n          <>{/* Push Notification Switch row - exact replication */}"
);

content = content.replace(
  "</div>\n\n        {/* Right Column: Navigation options (My Activity) */}",
  "</div>\n          </>\n          )}\n\n        {/* Right Column: Navigation options (My Activity) */}"
);

fs.writeFileSync(profilePath, content);
console.log("ProfileTab.tsx patched for notification switch");
