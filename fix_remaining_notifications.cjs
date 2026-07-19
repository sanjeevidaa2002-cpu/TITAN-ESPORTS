const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

code = code.replace(/ZapUPI Auto Credit Success! ⚡/g, "ZapUPI Payment Pending ⏳");
code = code.replace(/has been added automatically to your account balance./g, "has been recorded and is pending Admin approval.");

fs.writeFileSync('server.ts', code);
