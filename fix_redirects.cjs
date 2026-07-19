const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const closeHtml = `res.send(\\\`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Processing Complete</title>
          <style>body { background: #111; color: #fff; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; text-align: center; }</style>
        </head>
        <body>
          <div>
            <h2>\${isSuccess ? 'Payment Processed' : 'Payment Failed'}</h2>
            <p style="color: #888;">You can safely close this window now.</p>
            <button onclick="window.close()" style="margin-top: 20px; padding: 10px 20px; background: #ea580c; color: #fff; border: none; border-radius: 8px; cursor: pointer;">Close Window</button>
          </div>
          <script>
            setTimeout(() => window.close(), 3000);
          </script>
        </body>
        </html>
      \\\`);`;

code = code.replace(/return res\.redirect\(`\/\?status=\$\{isSuccess \? 'success' : 'failed'\}(?:&amount=\$\{[\w\s\|]+\})?`\);/g, closeHtml);
code = code.replace(/return res\.redirect\(`\/\?status=failed`\);/g, 'return res.status(400).send("Payment failed. Please close this window.");');

fs.writeFileSync('server.ts', code);
