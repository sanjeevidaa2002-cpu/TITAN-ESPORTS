const fs = require('fs');
const path = require('path');

const dashPath = path.join(__dirname, 'src/components/AdminDashboard.tsx');
let content = fs.readFileSync(dashPath, 'utf8');

const oldHandle = `  const handleTriggerPush = async () => {
    if (!pushTitle || !pushMessage) {
      alert("Please fill in notification title and description message!");
      return;
    }
    try {
      await triggerNotification(pushTitle, pushMessage, pushType);
      addAuditLog(\`Sent push notification: "\${pushTitle}" to all users\`);
      setPushTitle('');
      setPushMessage('');
      alert("Push notification broadcasted successfully to all online game devices!");
    } catch (err: any) {
      alert("Error broadcasting: " + err.message);
    }
  };`;

const newHandle = `  const handleTriggerPush = async () => {
    if (!pushTitle || !pushMessage) {
      alert("Please fill in notification title and description message!");
      return;
    }
    if (notificationSettings?.notificationsEnabled === false) {
      alert("Push notifications are currently disabled! Please turn them ON using the button in the header first.");
      return;
    }
    try {
      await triggerNotification(pushTitle, pushMessage, pushType);
      addAuditLog(\`Sent push notification: "\${pushTitle}" to all users\`);
      setPushTitle('');
      setPushMessage('');
      alert("Push notification broadcasted successfully to all online game devices!");
    } catch (err: any) {
      alert("Error broadcasting: " + err.message);
    }
  };`;

content = content.replace(oldHandle, newHandle);
fs.writeFileSync(dashPath, content);
console.log("Patched handleTriggerPush in AdminDashboard.tsx");
