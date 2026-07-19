const fs = require('fs');
const path = require('path');

const contextPath = path.join(__dirname, 'src/context/GameContext.tsx');
let content = fs.readFileSync(contextPath, 'utf8');

content = content.replace(
  "import {",
  "import { NotificationSettings } from '../types';\nimport {"
);

content = content.replace(
  "DEFAULT_CONTACT_WIDGET_SETTINGS,",
  "DEFAULT_CONTACT_WIDGET_SETTINGS,\n  DEFAULT_NOTIFICATION_SETTINGS,"
);

content = content.replace(
  "updateStorageSettingsAdmin: (settings: Partial<StorageSettings>) => Promise<void>;",
  "updateStorageSettingsAdmin: (settings: Partial<StorageSettings>) => Promise<void>;\n  notificationSettings: NotificationSettings;\n  updateNotificationSettingsAdmin: (settings: Partial<NotificationSettings>) => Promise<void>;"
);

content = content.replace(
  "const [contactWidgetSettings, setContactWidgetSettings] = useState<ContactWidgetSettings>(DEFAULT_CONTACT_WIDGET_SETTINGS);",
  "const [contactWidgetSettings, setContactWidgetSettings] = useState<ContactWidgetSettings>(DEFAULT_CONTACT_WIDGET_SETTINGS);\n  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);"
);

content = content.replace(
  "// Realtime storage settings listener",
  `// Realtime notification settings listener
      const unsubNotificationSettings = onSnapshot(doc(db, 'settings', 'notifications'),
        (docSnap) => {
          if (docSnap.exists()) {
            setNotificationSettings({ ...DEFAULT_NOTIFICATION_SETTINGS, ...docSnap.data() } as NotificationSettings);
          } else {
            setDoc(doc(db, 'settings', 'notifications'), DEFAULT_NOTIFICATION_SETTINGS).catch(console.error);
            setNotificationSettings(DEFAULT_NOTIFICATION_SETTINGS);
          }
        },
        (err) => {
          console.warn("Notification settings sync error:", err);
        }
      );
      
      // Realtime storage settings listener`
);

content = content.replace(
  "return () => {",
  "return () => {\n        unsubNotificationSettings();"
);

content = content.replace(
  "const updateStorageSettingsAdmin = async (settings: Partial<StorageSettings>) => {",
  `const updateNotificationSettingsAdmin = async (settings: Partial<NotificationSettings>) => {
    setNotificationSettings(prev => ({ ...prev, ...settings }));
    if (!useLocalFallback) {
      await setDoc(doc(db, 'settings', 'notifications'), settings, { merge: true });
    }
  };

  const updateStorageSettingsAdmin = async (settings: Partial<StorageSettings>) => {`
);

content = content.replace(
  "updateStorageSettingsAdmin,",
  "updateStorageSettingsAdmin,\n      notificationSettings,\n      updateNotificationSettingsAdmin,"
);

// We need to modify triggerNotification to check the settings.
// Also modify the Notification permission logic if applicable.
// But first, let's just make the changes above.

fs.writeFileSync(contextPath, content);
console.log("GameContext updated with notificationSettings");
