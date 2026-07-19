const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

code = code.replace(/Automatic Cash Deposit Success!/g, "Payment Pending Approval ⏳");
code = code.replace(/has been added automatically to your wallet via/g, "has been recorded and is pending Admin approval via");

code = code.replace(/ZapUPI Auto Cash-In Success!/g, "ZapUPI Payment Pending ⏳");
code = code.replace(/credited via ZapUPI API./g, "recorded and pending verification.");

code = code.replace(/Paytm Auto Added Cash!/g, "Paytm Payment Pending ⏳");
code = code.replace(/credited via Paytm Merchant Integration./g, "recorded and pending verification.");

code = code.replace(/PhonePe Cash Deposit!/g, "PhonePe Payment Pending ⏳");
code = code.replace(/credited via PhonePe Merchant Gateway./g, "recorded and pending verification.");

code = code.replace(/Razorpay Auto Cash-In!/g, "Razorpay Payment Pending ⏳");
code = code.replace(/has been processed via Razorpay API checkout./g, "is pending Admin approval.");

fs.writeFileSync('server.ts', code);
