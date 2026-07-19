const fs = require('fs');
const path = require('path');

const contextPath = path.join(__dirname, 'src/context/GameContext.tsx');
let content = fs.readFileSync(contextPath, 'utf8');

content = content.replace(
  "updateStorageSettingsAdmin\n    }}",
  "updateStorageSettingsAdmin,\n      notificationSettings,\n      updateNotificationSettingsAdmin\n    }}"
);

fs.writeFileSync(contextPath, content);
console.log("GameContext updated with notificationSettings in value block");
