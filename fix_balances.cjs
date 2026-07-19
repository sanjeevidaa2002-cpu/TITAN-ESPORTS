const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

// Replace all user balance increment blocks in server.ts
// Just use a regex to comment out "await setDoc(userRef, { depositBalance:" or transaction.update(userRef, { depositBalance:
code = code.replace(/await setDoc\(userRef,\s*\{\s*depositBalance:[^\}]+\},\s*\{\s*merge:\s*true\s*\}\);/g, '// auto-credit disabled for manual verification');
code = code.replace(/transaction\.update\(userRef,\s*\{\s*depositBalance:[^\}]+\}\);/g, '// auto-credit disabled for manual verification');
code = code.replace(/verifyResult\.status === "completed"/g, 'verifyResult.status === "completed" || verifyResult.status === "pending_verification"');
fs.writeFileSync('server.ts', code);
