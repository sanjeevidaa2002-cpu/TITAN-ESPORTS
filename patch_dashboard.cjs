const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  /if \(\!currentUser\) \{\n\s*return <Auth \/>;\n\s*\}/,
  `if (!currentUser) {
    const isSignup = window.location.pathname === '/signup';
    return <Auth initialMode={isSignup ? 'signup' : 'login'} />;
  }`
);

fs.writeFileSync('src/App.tsx', content);
