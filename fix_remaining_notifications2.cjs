const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

code = code.replace(/ZapUPI Payment Successful! 🌟/g, "ZapUPI Payment Pending ⏳");
code = code.replace(/added automatically via Instant Gateway./g, "recorded and pending verification.");

fs.writeFileSync('server.ts', code);
