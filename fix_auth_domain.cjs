const fs = require('fs');
let content = fs.readFileSync('src/components/Auth.tsx', 'utf8');

content = content.replace(
  /friendlyMessage = "This domain is not authorized for Google Sign-In\. Please add this domain to the Firebase Console Authorized Domains list\.";/,
  `friendlyMessage = "This domain is not authorized for Google Sign-In. Please add " + window.location.hostname + " to the Firebase Console Authorized Domains list.";`
);

fs.writeFileSync('src/components/Auth.tsx', content);
