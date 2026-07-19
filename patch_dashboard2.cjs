const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  /if \(\!currentUser\) \{/,
  `if (currentUser) {
    const path = window.location.pathname;
    if (path === '/login' || path === '/signup' || path === '/admin/login') {
      window.history.replaceState(null, '', '/');
    }
  }

  // If no logged in user, show auth form
  if (!currentUser) {`
);

fs.writeFileSync('src/App.tsx', content);
