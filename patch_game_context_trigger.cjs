const fs = require('fs');
const path = require('path');

const contextPath = path.join(__dirname, 'src/context/GameContext.tsx');
let content = fs.readFileSync(contextPath, 'utf8');

content = content.replace(
  "    const notifyObj: AppNotification = {",
  "    if (!notificationSettings.notificationsEnabled) return;\n\n    const notifyObj: AppNotification = {"
);

fs.writeFileSync(contextPath, content);
console.log("triggerNotification updated");
