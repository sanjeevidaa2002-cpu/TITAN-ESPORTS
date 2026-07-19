const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/context/GameContext.tsx');
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

// The duplicated block starts with '// Realtime branding settings listener'
// Wait, since I already inserted the correct code, there are TWO '// Realtime branding settings listener'.
// I'll just find the first '// Realtime branding settings listener'
// and the final '}, [useLocalFallback]);' for that useEffect block.
// Then replace the ENTIRE thing.

const startLine = lines.findIndex(l => l.includes('// Realtime branding settings listener'));
const endLine = lines.findIndex((l, i) => i > startLine && l.includes('  }, [useLocalFallback]);'));

if (startLine !== -1 && endLine !== -1) {
  const replacement = `
      // Realtime branding settings listener
      const unsubBranding = onSnapshot(doc(db, 'settings', 'branding'), (docSnap) => {
        if (docSnap.exists()) {
          setBrandingSettings(docSnap.data() as BrandingSettings);
        } else {
          setDoc(doc(db, 'settings', 'branding'), DEFAULT_BRANDING).catch(console.error);
          setBrandingSettings(DEFAULT_BRANDING);
        }
      }, (err) => handleSnapshotError(err, "Branding"));

      // Realtime loading screen settings listener
      const unsubLoadingScreen = onSnapshot(doc(db, "loading_settings", "config"), (docSnap) => {
        if (docSnap.exists()) {
          setLoadingScreenSettings(docSnap.data() as LoadingScreenSettings);
        } else {
          setLoadingScreenSettings(DEFAULT_LOADING_SCREEN);
        }
      }, (err) => handleSnapshotError(err, "LoadingScreen"));

      // Realtime support settings listener
      const unsubSupport = onSnapshot(doc(db, 'support_settings', 'config'), (docSnap) => {
        if (docSnap.exists()) {
          setSupportSettings(docSnap.data() as SupportSettings);
        } else {
          setSupportSettings(DEFAULT_SUPPORT_SETTINGS);
        }
      }, (err) => handleSnapshotError(err, "Support"));

      // Realtime contact widget settings listener
      const unsubContactWidget = onSnapshot(doc(db, 'contact_widget_settings', 'config'), (docSnap) => {
        if (docSnap.exists()) {
          setContactWidgetSettings(docSnap.data() as ContactWidgetSettings);
        } else {
          setContactWidgetSettings(DEFAULT_CONTACT_WIDGET_SETTINGS);
        }
      }, (err) => handleSnapshotError(err, "ContactWidget"));

      // Realtime categories listener
      const unsubCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
        const list: GameCategory[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as GameCategory);
        });
        setCategories(list.length > 0 ? list : DEFAULT_CATEGORIES);
      }, (err) => handleSnapshotError(err, "Categories"));

      // Realtime weekly players listener
      const unsubWeeklyPlayers = onSnapshot(collection(db, 'weekly_players'), (snapshot) => {
        const list: WeeklyPlayer[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as WeeklyPlayer);
        });
        setWeeklyPlayers(list);
      }, (err) => handleSnapshotError(err, "WeeklyPlayers"));

      // Realtime winners listener
      const unsubWinners = onSnapshot(collection(db, 'winners'), (snapshot) => {
        const list: TournamentWinner[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as TournamentWinner);
        });
        setWinners(list.length > 0 ? list : SEED_WINNERS);
      }, (err) => handleSnapshotError(err, "Winners"));

      // Realtime weekly leaderboard config listener
      const unsubWeeklyLeaderboardConfig = onSnapshot(doc(db, 'settings', 'weekly_leaderboard'), (docSnap) => {
        if (docSnap.exists()) {
          setWeeklyLeaderboardConfig(docSnap.data() as WeeklyLeaderboardConfig);
        } else {
          setWeeklyLeaderboardConfig(DEFAULT_WEEKLY_LEADERBOARD_CONFIG);
        }
      }, (err) => handleSnapshotError(err, "WeeklyLeaderboardConfig"));

      // Realtime homepage banners listener
      const unsubBanners = onSnapshot(collection(db, 'homepage_banners'), (snapshot) => {
        const list: HomepageBanner[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as HomepageBanner);
        });
        setHomepageBanners(list);
      }, (err) => handleSnapshotError(err, "Banners"));

      // Realtime storage files listener
      const unsubStorageFiles = onSnapshot(collection(db, 'storage_files'), (snapshot) => {
        const list: StorageFile[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as StorageFile);
        });
        setStorageFiles(list);
      }, (err) => handleSnapshotError(err, "StorageFiles"));

      // Realtime promo settings listener
      const unsubPromoSettings = onSnapshot(doc(db, 'settings', 'promo'), (docSnap) => {
        if (docSnap.exists()) {
          setPromoSettings(docSnap.data() as PromoSettings);
        } else {
          setPromoSettings(DEFAULT_PROMO_SETTINGS);
        }
      }, (err) => handleSnapshotError(err, "PromoSettings"));
      
      // Realtime notification settings listener
      const unsubNotificationSettings = onSnapshot(doc(db, 'settings', 'notifications'), (docSnap) => {
        if (docSnap.exists()) {
          setNotificationSettings(docSnap.data() as NotificationSettings);
        } else {
          setNotificationSettings(DEFAULT_NOTIFICATION_SETTINGS);
        }
      }, (err) => handleSnapshotError(err, "NotificationSettings"));

      // Realtime storage settings listener
      const unsubStorageSettings = onSnapshot(doc(db, 'settings', 'storage'), (docSnap) => {
        if (docSnap.exists()) {
          setStorageSettings(docSnap.data() as StorageSettings);
        } else {
          setStorageSettings({ provider: 'firebase' });
        }
      }, (err) => handleSnapshotError(err, "StorageSettings"));

      setLoading(false);

      return () => {
        unsubNotificationSettings();
        unsubPromoSettings();
        unsubTournaments();
        unsubBonusSettings();
        unsubLeaderboard();
        unsubNotifications();
        unsubBranding();
        unsubLoadingScreen();
        unsubSupport();
        unsubContactWidget();
        unsubCategories();
        unsubWeeklyPlayers();
        unsubWinners();
        unsubWeeklyLeaderboardConfig();
        unsubBanners();
        unsubStorageFiles();
        unsubStorageSettings();
      };
    });
`;

  lines.splice(startLine, endLine - startLine, replacement);
  fs.writeFileSync(filePath, lines.join('\n'));
  console.log("Successfully replaced the block!");
} else {
  console.error("Could not find start or end lines");
}
