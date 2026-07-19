const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

// Replace "completed" with "pending_verification" for success status in server.ts
code = code.replace(/isSuccess \? "completed" : "failed"/g, 'isSuccess ? "pending_verification" : "failed"');
code = code.replace(/status: "completed"/g, 'status: "pending_verification"');
code = code.replace(/isSuccess \? 'completed' : 'failed'/g, "isSuccess ? 'pending_verification' : 'failed'");
code = code.replace(/status: 'completed'/g, "status: 'pending_verification'");
code = code.replace(/isSuccess === "completed"/g, 'isSuccess === "pending_verification"'); // wait, verifyResult.status === "completed" 

fs.writeFileSync('server.ts', code);
