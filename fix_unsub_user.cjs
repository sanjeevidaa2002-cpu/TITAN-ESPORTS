const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/context/GameContext.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  /unsubUserSnapshot = onSnapshot\(userDocRef, \(docSnap\) => \{\n\s*if \(docSnap\.exists\(\)\) \{\n\s*setUserProfile\(docSnap\.data\(\) as UserProfile\);\n\s*\}\n\s*\}\);/g,
  `unsubUserSnapshot = onSnapshot(userDocRef, (docSnap) => {
              if (docSnap.exists()) {
                setUserProfile(docSnap.data() as UserProfile);
              }
            }, (err) => {
              console.warn("User profile sync error:", err);
              if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) {
                setUseLocalFallback(true);
              }
            });`
);

fs.writeFileSync(filePath, content);
