const fs = require('fs');
let content = fs.readFileSync('src/components/Auth.tsx', 'utf8');

const oldFallback = `      } else if (errorMessage) {
        setLocalErr(errorMessage);
        setLoading(false);
        return;
      }

      // Fallback: Simulate login anyway using simulated credentials for seamless experience
      setLocalErr(err.message || "Failed to authenticate. Triggered Demo Login Session instead.");
      try {
        // Just register with local fallback
        await registerWithEmail(email || 'demo@titanesp.com', 'demo123', nickname || 'Lkehw', freefireUid || '55827391', refCode);
      } catch (inner) {
        // Fallback already handled
      }
    } finally {
      setLoading(false);
    }`;

const newFallback = `      } else if (errorMessage) {
        setLocalErr(errorMessage);
      } else {
        setLocalErr("An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }`;

content = content.replace(oldFallback, newFallback);
fs.writeFileSync('src/components/Auth.tsx', content);
console.log('Cleaned fallback');
