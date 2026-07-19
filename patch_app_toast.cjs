const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'src/App.tsx');
let content = fs.readFileSync(appPath, 'utf8');

content = content.replace(
  "{activeToast ? (",
  "{activeToast && notificationSettings?.notificationsEnabled !== false ? ("
);

fs.writeFileSync(appPath, content);
console.log("App.tsx patched for toast visibility");
