const fs = require('fs');
const file = 'src/components/WalletTab.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `            {depositStep === 1 ? (
              /* Step 1: Input Amount & Select Gateway */
              <form onSubmit={handleDepositSubmit} className="space-y-4">`;

const replacement = `            {checkingStatusOrderId ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
                <div className="w-12 h-12 border-4 border-gold-500/20 border-t-gold-500 rounded-full animate-spin"></div>
                <h3 className="text-white font-bold text-lg">Awaiting Payment...</h3>
                <p className="text-neutral-400 text-xs">Please complete the payment on the opened page.<br/>We are automatically checking the status.</p>
              </div>
            ) : depositStep === 1 ? (
              /* Step 1: Input Amount & Select Gateway */
              <form onSubmit={handleDepositSubmit} className="space-y-4">`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content);
