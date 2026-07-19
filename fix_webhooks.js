const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

code = code.replace(
  /status:\s*isSuccess\s*\?\s*"completed"\s*:\s*"failed"/g,
  'status: isSuccess ? "pending_verification" : "failed"'
);

code = code.replace(
  /status:\s*"completed"/g,
  'status: "pending_verification"'
);

// We need to carefully remove all userRef balance increments in server.ts
// There are multiple blocks of:
// const userRef = doc(db, "users", userId);
// ...
// await setDoc(userRef, { depositBalance: ... })

