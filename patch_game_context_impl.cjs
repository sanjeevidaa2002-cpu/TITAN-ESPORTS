const fs = require('fs');
let code = fs.readFileSync('src/context/GameContext.tsx', 'utf8');

const defaultLoadingScreenSettings = `
const DEFAULT_LOADING_SCREEN: LoadingScreenSettings = {
  loadingLogoUrl: '',
  loadingLogoSource: 'url',
  loadingTitle: 'TITAN ESPORTS',
  loadingSubtitle: 'PREMIUM GAMING',
  loadingText: 'INITIALIZING SYSTEM',
  backgroundColor: '#08080c',
  backgroundImage: '',
  progressBarEnabled: true,
  animationEnabled: true
};
`;

code = code.replace(/const \[brandingSettings, setBrandingSettings\] = useState<BrandingSettings>\(DEFAULT_BRANDING\);/, 
  defaultLoadingScreenSettings + 
  "\n  const [brandingSettings, setBrandingSettings] = useState<BrandingSettings>(DEFAULT_BRANDING);" + 
  "\n  const [loadingScreenSettings, setLoadingScreenSettings] = useState<LoadingScreenSettings>(DEFAULT_LOADING_SCREEN);"
);

// find useEffect where brandingSettings is fetched
code = code.replace(/const brandingUnsubscribe = onSnapshot\(doc\(db, 'settings', 'branding'\), \(doc\) => \{/g,
  `const brandingUnsubscribe = onSnapshot(doc(db, 'settings', 'branding'), (doc) => {`);

const loadingScreenUnsubscribe = `
    const loadingScreenUnsubscribe = onSnapshot(doc(db, 'settings', 'loading_screen'), (docSnap) => {
      if (docSnap.exists()) {
        setLoadingScreenSettings({ ...DEFAULT_LOADING_SCREEN, ...docSnap.data() } as LoadingScreenSettings);
      }
    });
`;

code = code.replace(/return \(\) => \{[\s\S]*?usersUnsubscribe\(\);/, (match) => {
  return loadingScreenUnsubscribe + match + "\n      loadingScreenUnsubscribe();";
});

const updateLoadingScreenSettingsImpl = `
  const updateLoadingScreenSettings = async (updates: Partial<LoadingScreenSettings>) => {
    try {
      const docRef = doc(db, 'settings', 'loading_screen');
      await setDoc(docRef, { ...updates, updatedAt: Date.now() }, { merge: true });
    } catch (err: any) {
      console.error("Error updating loading screen settings:", err);
      throw err;
    }
  };
`;

code = code.replace(/const updateBrandingSettings = async \(updates: Partial<BrandingSettings>\) => \{/, updateLoadingScreenSettingsImpl + "\n  const updateBrandingSettings = async (updates: Partial<BrandingSettings>) => {");

code = code.replace(/updateBrandingSettings,/g, "updateBrandingSettings,\n      loadingScreenSettings,\n      updateLoadingScreenSettings,");

fs.writeFileSync('src/context/GameContext.tsx', code);
