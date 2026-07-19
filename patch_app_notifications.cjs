const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'src/App.tsx');
let content = fs.readFileSync(appPath, 'utf8');

content = content.replace(
  "const { currentUser, userProfile, tournaments, logout, notifications, brandingSettings } = useGame();",
  "const { currentUser, userProfile, tournaments, logout, notifications, brandingSettings, notificationSettings } = useGame();"
);

content = content.replace(
  "if (notifications.length > 0) {",
  "if (notifications.length > 0 && notificationSettings?.notificationsEnabled !== false) {"
);

fs.writeFileSync(appPath, content);
console.log("App.tsx patched for notifications");
