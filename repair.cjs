const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/context/GameContext.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Branding
content = content.replace(
  /const unsubBranding = onSnapshot\(doc\(db, 'settings', 'branding'\), \(err\) => handleSnapshotError\(err, "Branding"\) else \{/,
  `const unsubBranding = onSnapshot(doc(db, 'settings', 'branding'),\n        (docSnap) => {\n          if (docSnap.exists()) {\n            setBrandingSettings(docSnap.data() as BrandingSettings);\n          } else {`
);

// 2. LoadingScreen
content = content.replace(
  /const unsubLoadingScreen = onSnapshot\(doc\(db, "loading_settings", "config"\), \(err\) => handleSnapshotError\(err, "LoadingScreen"\) else \{/,
  `const unsubLoadingScreen = onSnapshot(doc(db, "loading_settings", "config"),\n        (docSnap) => {\n          if (docSnap.exists()) {\n            const data = docSnap.data();\n            if (data.loadingTitle) {\n              setLoadingScreenSettings(data as LoadingScreenSettings);\n            } else {`
);

// 3. Support
content = content.replace(
  /const unsubSupport = onSnapshot\(doc\(db, 'support_settings', 'config'\), \(err\) => handleSnapshotError\(err, "Support"\) else \{/,
  `const unsubSupport = onSnapshot(doc(db, 'support_settings', 'config'),\n        (docSnap) => {\n          if (docSnap.exists()) {\n            setSupportSettings(docSnap.data() as SupportSettings);\n          } else {`
);

// 4. ContactWidget
content = content.replace(
  /const unsubContactWidget = onSnapshot\(doc\(db, 'contact_widget_settings', 'config'\), \(err\) => handleSnapshotError\(err, "ContactWidget"\) else \{/,
  `const unsubContactWidget = onSnapshot(doc(db, 'contact_widget_settings', 'config'),\n        (docSnap) => {\n          if (docSnap.exists()) {\n            setContactWidgetSettings(docSnap.data() as ContactWidgetSettings);\n          } else {`
);

// 5. Categories
content = content.replace(
  /const unsubCategories = onSnapshot\(collection\(db, 'categories'\), \(err\) => handleSnapshotError\(err, "Categories"\) as GameCategory;/,
  `const unsubCategories = onSnapshot(collection(db, 'categories'),\n        (snapshot) => {\n          const list: GameCategory[] = [];\n          snapshot.forEach((doc) => {\n            const data = { id: doc.id, ...doc.data() } as GameCategory;`
);

// 6. WeeklyPlayers
content = content.replace(
  /const unsubWeeklyPlayers = onSnapshot\(collection\(db, 'weekly_players'\), \(err\) => handleSnapshotError\(err, "WeeklyPlayers"\) as WeeklyPlayer\);/,
  `const unsubWeeklyPlayers = onSnapshot(collection(db, 'weekly_players'),\n        (snapshot) => {\n          const list: WeeklyPlayer[] = [];\n          snapshot.forEach((doc) => {\n            list.push({ id: doc.id, ...doc.data() } as WeeklyPlayer);`
);

// 7. Winners
content = content.replace(
  /const unsubWinners = onSnapshot\(collection\(db, 'winners'\), \(err\) => handleSnapshotError\(err, "Winners"\) as TournamentWinner\);/,
  `const unsubWinners = onSnapshot(collection(db, 'winners'),\n        (snapshot) => {\n          const list: TournamentWinner[] = [];\n          snapshot.forEach((doc) => {\n            list.push({ id: doc.id, ...doc.data() } as TournamentWinner);`
);

// 8. WeeklyLeaderboardConfig
content = content.replace(
  /const unsubWeeklyLeaderboardConfig = onSnapshot\(doc\(db, 'settings', 'weekly_leaderboard'\), \(err\) => handleSnapshotError\(err, "WeeklyLeaderboardConfig"\) else \{/,
  `const unsubWeeklyLeaderboardConfig = onSnapshot(doc(db, 'settings', 'weekly_leaderboard'),\n        (docSnap) => {\n          if (docSnap.exists()) {\n            setWeeklyLeaderboardConfig(docSnap.data() as WeeklyLeaderboardConfig);\n          } else {`
);

// 9. Banners
content = content.replace(
  /const unsubBanners = onSnapshot\(collection\(db, 'homepage_banners'\), \(err\) => handleSnapshotError\(err, "Banners"\) as HomepageBanner\);/,
  `const unsubBanners = onSnapshot(collection(db, 'homepage_banners'),\n        (snapshot) => {\n          const list: HomepageBanner[] = [];\n          snapshot.forEach((doc) => {\n            list.push({ id: doc.id, ...doc.data() } as HomepageBanner);`
);

// 10. StorageFiles
content = content.replace(
  /const unsubStorageFiles = onSnapshot\(collection\(db, 'storage_files'\), \(err\) => handleSnapshotError\(err, "StorageFiles"\) as StorageFile\);/,
  `const unsubStorageFiles = onSnapshot(collection(db, 'storage_files'),\n        (snapshot) => {\n          const list: StorageFile[] = [];\n          snapshot.forEach((doc) => {\n            list.push({ id: doc.id, ...doc.data() } as StorageFile);`
);

// 11. PromoSettings
content = content.replace(
  /const unsubPromoSettings = onSnapshot\(doc\(db, 'settings', 'promo'\), \(err\) => handleSnapshotError\(err, "PromoSettings"\) as PromoSettings\);/,
  `const unsubPromoSettings = onSnapshot(doc(db, 'settings', 'promo'),\n        (docSnap) => {\n          if (docSnap.exists()) {\n            setPromoSettings(docSnap.data() as PromoSettings);\n          } else {\n            setPromoSettings(DEFAULT_PROMO_SETTINGS);\n          }\n        }, (err) => handleSnapshotError(err, "PromoSettings"));`
);
// Wait, PromoSettings was `else {` or `as PromoSettings);` ? Let me check via grep!

fs.writeFileSync(filePath, content);
