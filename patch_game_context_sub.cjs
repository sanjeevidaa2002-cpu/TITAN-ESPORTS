const fs = require('fs');
let code = fs.readFileSync('src/context/GameContext.tsx', 'utf8');

code = code.replace(/const unsubBranding = onSnapshot\(doc\(db, 'settings', 'branding'\), \(doc\) => \{/, 
  "const unsubLoadingScreen = onSnapshot(doc(db, 'settings', 'loading_screen'), (docSnap) => {\n        if (docSnap.exists()) {\n          setLoadingScreenSettings({ ...DEFAULT_LOADING_SCREEN, ...docSnap.data() } as LoadingScreenSettings);\n        }\n      });\n\n      const unsubBranding = onSnapshot(doc(db, 'settings', 'branding'), (doc) => {");

code = code.replace(/unsubBranding\(\);/, "unsubBranding();\n        unsubLoadingScreen();");

fs.writeFileSync('src/context/GameContext.tsx', code);
