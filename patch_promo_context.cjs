const fs = require('fs');
const path = require('path');

const contextPath = path.join(__dirname, 'src/context/GameContext.tsx');
let content = fs.readFileSync(contextPath, 'utf8');

// Add to imports
content = content.replace(
  "NotificationSettings }",
  "NotificationSettings, PromoSettings }"
);

// Add to Context Type
content = content.replace(
  "updateNotificationSettingsAdmin: (settings: Partial<NotificationSettings>) => Promise<void>;",
  "updateNotificationSettingsAdmin: (settings: Partial<NotificationSettings>) => Promise<void>;\n  promoSettings: PromoSettings;\n  updatePromoSettingsAdmin: (settings: Partial<PromoSettings>) => Promise<void>;"
);

// Add DEFAULT
content = content.replace(
  "export const DEFAULT_NOTIFICATION_SETTINGS = {",
  "export const DEFAULT_PROMO_SETTINGS = { promoCodesEnabled: true };\nexport const DEFAULT_NOTIFICATION_SETTINGS = {"
);

// Add useState
content = content.replace(
  "const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);",
  "const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);\n  const [promoSettings, setPromoSettings] = useState<PromoSettings>(DEFAULT_PROMO_SETTINGS);"
);

// Add realtime listener
content = content.replace(
  "// Realtime notification settings listener",
  `// Realtime promo settings listener
      const unsubPromoSettings = onSnapshot(doc(db, 'settings', 'promo'),
        (docSnap) => {
          if (docSnap.exists()) {
            setPromoSettings({ ...DEFAULT_PROMO_SETTINGS, ...docSnap.data() } as PromoSettings);
          } else {
            setDoc(doc(db, 'settings', 'promo'), DEFAULT_PROMO_SETTINGS).catch(console.error);
            setPromoSettings(DEFAULT_PROMO_SETTINGS);
          }
        },
        (err) => {
          console.warn("Promo settings sync error:", err);
        }
      );
      
      // Realtime notification settings listener`
);

// Add to cleanup
content = content.replace(
  "unsubNotificationSettings();",
  "unsubNotificationSettings();\n        unsubPromoSettings();"
);

// Add update function
content = content.replace(
  "const updateNotificationSettingsAdmin = async",
  `const updatePromoSettingsAdmin = async (settings: Partial<PromoSettings>) => {
    setPromoSettings(prev => ({ ...prev, ...settings }));
    if (!useLocalFallback) {
      await setDoc(doc(db, 'settings', 'promo'), settings, { merge: true });
    }
  };

  const updateNotificationSettingsAdmin = async`
);

// Add to return value
content = content.replace(
  "updateNotificationSettingsAdmin\n    }}",
  "updateNotificationSettingsAdmin,\n      promoSettings,\n      updatePromoSettingsAdmin\n    }}"
);

fs.writeFileSync(contextPath, content);
console.log("GameContext updated for promoSettings");
