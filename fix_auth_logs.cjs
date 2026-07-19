const fs = require('fs');
let content = fs.readFileSync('src/components/Auth.tsx', 'utf8');
content = content.replace(/console\.error\("Google Auth failed:"\);/, 'console.error("Google Auth failed:", err);');
fs.writeFileSync('src/components/Auth.tsx', content);

let ctxContent = fs.readFileSync('src/context/GameContext.tsx', 'utf8');
ctxContent = ctxContent.replace(/console\.error\("Direct signInWithRedirect failed:"\);/, 'console.error("Direct signInWithRedirect failed:", err);');
ctxContent = ctxContent.replace(/console\.warn\("Popup authentication failed or was blocked:"\);/, 'console.warn("Popup authentication failed or was blocked:", e);');
ctxContent = ctxContent.replace(/console\.error\("Redirect sign-in fallback failed:"\);/, 'console.error("Redirect sign-in fallback failed:", redirectErr);');
fs.writeFileSync('src/context/GameContext.tsx', ctxContent);
