const fs = require('fs');
let code = fs.readFileSync('src/components/WalletTab.tsx', 'utf-8');

// 1. Add refs for window and timer
code = code.replace(
  /const \[checkingStatusOrderId, setCheckingStatusOrderId\] = useState<string \| null>\(null\);/,
  `const [checkingStatusOrderId, setCheckingStatusOrderId] = useState<string | null>(null);
  const paymentWindowRef = React.useRef<Window | null>(null);
  const pollingStartTimeRef = React.useRef<number>(0);`
);

// 2. Rewrite the polling useEffect
const oldEffectRegex = /React\.useEffect\(\(\) => \{\s*let intervalId: NodeJS\.Timeout;[\s\S]*?\}, \[checkingStatusOrderId, refreshTransactions\]\);/;
const newEffect = `React.useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (checkingStatusOrderId) {
      pollingStartTimeRef.current = Date.now();
      
      intervalId = setInterval(async () => {
        try {
          // Check 60-second timeout
          if (Date.now() - pollingStartTimeRef.current > 60000) {
            clearInterval(intervalId);
            setCheckingStatusOrderId(null);
            setShowDepositModal(false);
            
            // Mark as failed in backend
            fetch(\`/api/payments/status/\${checkingStatusOrderId}/cancel\`, { method: 'POST' });
            
            alert('Payment timeout. No amount has been added to your wallet.');
            refreshTransactions();
            return;
          }
          
          // Check if window is closed by user
          if (paymentWindowRef.current && paymentWindowRef.current.closed) {
            clearInterval(intervalId);
            setCheckingStatusOrderId(null);
            setShowDepositModal(false);
            
            // Mark as failed in backend
            fetch(\`/api/payments/status/\${checkingStatusOrderId}/cancel\`, { method: 'POST' });
            
            alert('Payment was cancelled. No amount has been added to your wallet.');
            refreshTransactions();
            return;
          }

          const res = await fetch(\`/api/payments/status/\${checkingStatusOrderId}\`);
          const data = await res.json();
          if (data.success && data.status !== 'pending') {
            clearInterval(intervalId);
            setCheckingStatusOrderId(null);
            setShowDepositModal(false);
            if (data.status === 'completed' || data.status === 'pending_verification') {
              alert('Payment is ' + (data.status === 'pending_verification' ? 'Pending Approval' : 'Successful') + '! It will be reflected in your wallet once verified.');
            } else {
              alert('Payment Failed or Cancelled.');
            }
            refreshTransactions();
          }
        } catch (e) {
          console.warn("Polling error:", e);
        }
      }, 3000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [checkingStatusOrderId, refreshTransactions]);`;

code = code.replace(oldEffectRegex, newEffect);

// 3. Update the handleDepositSubmit to use paymentWindowRef
code = code.replace(
  /window\.open\(data\.redirectUrl, '_blank'\);/g,
  `paymentWindowRef.current = window.open(data.redirectUrl, '_blank');`
);

fs.writeFileSync('src/components/WalletTab.tsx', code);
